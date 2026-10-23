import toposort from "toposort"
import { logger, task } from "@trigger.dev/sdk"
import { browserbase, Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"

import { getWorkflow } from "@/features/workflows/data"

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

    try {
      for (const id of order) {
        const node = byId.get(id)!
        logger.log(`Running node ${node.data.title} `)
        // TODO: actually execute the node instaed of just logging it, and report
        // its progress so the UI can watch the run live.
        const executor = nodeExecutors[node.data.type]
        if (executor) {
          const result = await executor({ values: node.data.values, getStagehand })
          logger.log(`Finished node ${node.data.title}`, { result })
        } else {
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

    return { steps: order.length }
  },
})
