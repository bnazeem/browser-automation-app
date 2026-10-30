import type { Stagehand } from "@browserbasehq/stagehand"

// Finds the actionable elements on the current page that match the
// instruction, without acting on them. Each match keeps just its selector (an
// `xpath=` string) and description.
export async function observe({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const { data } = await stagehand.observe(instruction)

  return {
    matches: data.map(({ selector, description }) => ({
      selector,
      description,
    })),
  }
}
