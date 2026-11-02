import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"
import { browserbase, Stagehand } from "@browserbasehq/stagehand"
import {
  interpolate,
  type NodeOutputs,
} from "@/features/workflows/lib/interpolate"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"
import type { NodeType } from "@/features/workflows/nodes/node-registry"

import { getWorkflow } from "@/features/workflows/data"

// Plain JSON - what run metadata can hold.
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json }

// Executors return unknown; round-trip through JSON so the step stores exactly
// what metadata would (Dates become strings, undefined/functions drop out).
const toJson = (value: unknown): Json | undefined =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value))

export type RunStepStatus = "pending" | "running" | "done" | "failed"

// One node's record in a run, streamed to the canvas and console via run
// metadata. type and title are snapshotted at run time so the console can still
// show the step after the node is renamed or deleted from the canvas.
export type RunStep = {
  nodeId: string
  type: NodeType // keys into nodeRegistry for the icon
  title: string
  status: RunStepStatus
  startedAt?: number // epoch ms, set when it starts running
  durationMs?: number // set once it's done or failed
  output?: Json // the executor's result
  error?: string // the thrown message, if it failed
}

// The trigger.dev task the Run button fires. It loads the saved grapg, works out
// what order the nodes should run in, and walks them. For now each node just
// announces itself - real execution (per-node executors, live progress, browser
// sessions) gets layered on from here.
export const runWorkflowTask = task({
  id: "run-workflow",
  run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
    const workflow = await getWorkflow(orgId, workflowId)
    if (!workflow?.graph) throw new Error(`Workflow ${workflowId} has no graph`)

    const { nodes, edges } = workflow.graph
    const byId = new Map(nodes.map((n) => [n.id, n]))

    // Run only connected nodes - anything touching an edge. Orphans dropped on
    // the canvas are skipped. toposort orders them and throws on a cycle
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))

    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      )
      .filter((id) => connected.has(id))

    logger.log(`Running workflow ${workflow.name}`, { steps: order.length })

    // Lazily start one Browserbase session for the whole run, so workflows with
    // no browser steps never pay for one.
    let stagehand: Stagehand | undefined
    const getStagehand = async () => {
      if (stagehand) return stagehand
      const browser = await browserbase.launch({
        apiKey: process.env.BROWSERBASE_API_KEY!,
      })
      stagehand = await Stagehand.create({
        browser,
        model: {
          modelName: "openai/gpt-5.4-mini",
          apiKey: process.env.OPENAI_API_KEY,
        },
      })
      return stagehand
    }

    // Each node's result, keyed by id. Toposort guarantees upstream nodes have
    // written here before any node that references them via {{ id.path }}.
    const outputs: NodeOutputs = {}

    // Live per-node records, published under metadata "steps". Replaced with a
    // fresh array on every change so each publish is a snapshot.
    let steps: RunStep[] = order.map((nodeId) => {
      const { type, title } = byId.get(nodeId)!.data
      return { nodeId, type, title, status: "pending" }
    })
    const updateStep = (nodeId: string, patch: Partial<RunStep>) => {
      steps = steps.map((s) => (s.nodeId === nodeId ? { ...s, ...patch } : s))
      metadata.set("steps", steps)
    }
    metadata.set("steps", steps)

    try {
      for (const id of order) {
        const node = byId.get(id)!
        logger.log(`Running node ${node.data.title} `)
        const executor = nodeExecutors[node.data.type]
        const startedAt = Date.now()
        if (executor) {
          // Flush now, or "done" overwrites "running" before it's ever pushed.
          updateStep(id, { status: "running", startedAt })
          await metadata.flush()

          try {
            const values = Object.fromEntries(
              Object.entries(node.data.values).map(([key, text]) => [
                key,
                interpolate({ text, outputs }),
              ])
            )
            const result = await executor({ values, getStagehand })
            outputs[id] = result
            updateStep(id, {
              status: "done",
              durationMs: Date.now() - startedAt,
              output: toJson(result),
            })
            logger.log(`Finished node ${node.data.title}`, { result })
          } catch (err) {
            // A thrown run returns no output, so the flushed metadata is the
            // only way the failed state reaches the canvas.
            updateStep(id, {
              status: "failed",
              durationMs: Date.now() - startedAt,
              error: err instanceof Error ? err.message : String(err),
            })
            await metadata.flush()
            throw err
          }
        } else {
          // Nothing to execute (e.g. the Start trigger) - don't leave it pending.
          updateStep(id, { status: "done", startedAt, durationMs: 0 })
          logger.log(`No executor for node type ${node.data.type}`)
        }
      }
    } finally {
      // Always end the Browserbase session, even if a step throws.
      if (stagehand) {
        await stagehand.close()
        await stagehand.browser.close()
      }
    }

    // Final snapshot as output, so a successful run's end state is guaranteed
    // even if the last background metadata flush hasn't landed.
    return { steps }
  },
})
