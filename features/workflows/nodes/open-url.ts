import type { Stagehand } from "@browserbasehq/stagehand"

export async function openUrl({
  stagehand,
  url,
}: {
  stagehand: Stagehand
  url: string
}) {
  const { context } = stagehand.browser
  const page = (await context.activePage()) ?? (await context.newPage())
  await page.goto(url, { waitUntil: "load", timeout: 30_000 })

  return { url: await page.url(), title: await page.title() }
}
