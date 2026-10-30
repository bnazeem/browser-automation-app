import type { Stagehand } from "@browserbasehq/stagehand"

// Performs one atomic action on the current page (click, type, scroll) from a
// natural-language instruction. A failed action is reported via `success`
// rather than thrown, so downstream nodes can read it.
export async function act({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const { data } = await stagehand.act(instruction)
  const page = await stagehand.browser.context.activePage()

  return {
    success: data.success,
    message: data.message,
    url: page ? await page.url() : "",
  }
}
