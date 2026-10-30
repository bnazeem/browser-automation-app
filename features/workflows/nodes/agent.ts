import type { Stagehand } from "@browserbasehq/stagehand"
import { z } from "zod/v4"

// Hard cap on steps, so a goal the model can't reach doesn't loop forever.
// Each step costs two model calls (decide + act).
const MAX_STEPS = 10

const Decision = z.object({
  done: z.boolean().describe("Whether the goal is already achieved"),
  nextAction: z
    .string()
    .describe("The single next atomic action, or empty if done"),
  summary: z.string().describe("What has been achieved so far"),
})

// Stagehand v4 has no agent API, so this composes one: read the page with
// extract to decide the next atomic step (or that the goal is met), run it with
// act, repeat. Errors are reported via `success: false` instead of thrown - a
// throw would retry the whole workflow and repeat clicks/submits already done.
export async function agent({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const history: string[] = []
  let summary = ""

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const { data: decision } = await stagehand.extract(
        [
          `Goal: ${instruction}`,
          `Steps taken so far: ${history.join("; ") || "none"}`,
          "Looking at the current page: is the goal complete? If not, give " +
            "the single next atomic action (one click, one typing action, or " +
            "one scroll).",
        ].join("\n"),
        Decision
      )
      summary = decision.summary

      if (decision.done) {
        return { success: true, completed: true, message: summary }
      }

      const { data: result } = await stagehand.act(decision.nextAction)
      history.push(
        `${decision.nextAction} -> ${result.success ? "ok" : `failed (${result.message})`}`
      )
    }

    return {
      success: false,
      completed: false,
      message: `Stopped after ${MAX_STEPS} steps. ${summary}`.trim(),
    }
  } catch (err) {
    return {
      success: false,
      completed: false,
      message: err instanceof Error ? err.message : String(err),
    }
  }
}
