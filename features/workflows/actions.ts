"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { tasks, runs } from "@trigger.dev/sdk"
import {
  createWorkflow,
  deleteWorkflow,
  saveWorkflowGraph,
} from "@/features/workflows/data"
import { WorkflowGraph } from "@/lib/db/schema"
import { liveblocks } from "@/lib/liveblocks"
import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow"

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

export async function runWorkflowAction({
  id,
  graph,
}: {
  id: string
  graph: WorkflowGraph
}) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  await saveWorkflowGraph({ orgId, id, graph })

  const handle = await tasks.trigger<typeof runWorkflowTask>(
    "run-workflow",
    { workflowId: id, orgId },
    { tags: [`workflow:${id}`] }
  )

  return handle
}

export async function cancelWorkflowRunAction(runId: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }
  await runs.cancel(runId)
}
