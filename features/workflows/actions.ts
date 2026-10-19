"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { tasks } from "@trigger.dev/sdk"
import { createWorkflow, deleteWorkflow } from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"
import type { helloWorldTask } from "@/trigger/example"

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const workflow = await createWorkflow(orgId, name)

  revalidatePath("/workflows", "layout")

  redirect(`/workflows/${workflow.id}`)
}

export async function deleteWorkflowAction(id: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const workflow = await deleteWorkflow(orgId, id)
  if (!workflow) {
    throw new Error("Workflow not found")
  }

  // The room is keyed by the workflow id; drop it so its canvas doesn't linger.
  await liveblocks.deleteRoom(id).catch(() => {})

  revalidatePath("/workflows", "layout")

  redirect("/")
}

export async function runWorkflowAction() {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const handle = await tasks.trigger<typeof helloWorldTask>("hello-world", {
    message: "Hello from right-sidebar",
  })

  return handle
}
