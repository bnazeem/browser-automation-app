import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"
import { browserbase, Stagehand } from "@browserbasehq/stagehand"
import {
  interpolate,
  type NodeOutputs,
} from "@/features/workflows/lib/interpolate"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"

import { getWorkflow } from "@/features/workflows/data"

export type RunStepStatus = "pending" | "running" | "done" | "failed"

// One node's live status in a run, streamed to the canvas via run metadata.
export type RunStep = {
  nodeId: string
  status: RunStepStatus
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

    // Live per-node status for the canvas, published under metadata "steps".
    // Replaced with a fresh array on every change so each publish is a snapshot.
    let steps: RunStep[] = order.map((nodeId) => ({
      nodeId,
      status: "pending",
    }))
    const setStatus = (nodeId: string, status: RunStepStatus) => {
      steps = steps.map((s) => (s.nodeId === nodeId ? { ...s, status } : s))
      metadata.set("steps", steps)
    }
    metadata.set("steps", steps)

    try {
      for (const id of order) {
        const node = byId.get(id)!
        logger.log(`Running node ${node.data.title} `)
        const executor = nodeExecutors[node.data.type]
        if (executor) {
          // Flush now, or "done" overwrites "running" before it's ever pushed.
          setStatus(id, "running")
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
            setStatus(id, "done")
            logger.log(`Finished node ${node.data.title}`, { result })
          } catch (err) {
            // A thrown run returns no output, so the flushed metadata is the
            // only way the failed state reaches the canvas.
            setStatus(id, "failed")
            await metadata.flush()
            throw err
          }
        } else {
          // Nothing to execute (e.g. the Start trigger) - don't leave it pending.
          setStatus(id, "done")
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
