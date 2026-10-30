import type { Stagehand } from "@browserbasehq/stagehand"

// Pulls whatever the instruction describes off the current page. Uses the
// schema-less extract, which returns the data as a single string - the user's
// instruction is free-form, so there's no fixed shape to validate against.
export async function extract({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const { data } = await stagehand.extract(instruction)

  return { result: data.extraction }
}
