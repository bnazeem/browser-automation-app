import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { WorkflowRunsProvider } from "@/features/workflows/components/workflow-runs-provider"
import { Room } from "@/features/workflows/components/room"
import { notFound } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"
import { getWorkflow } from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await auth.protect()

  const { id } = await params
  const { orgId } = await auth()
  if (!orgId) notFound()

  const workflow = await getWorkflow(orgId, id)
  if (!workflow) notFound()

  // Private room; only members of the owning org (see the auth endpoint's
  // groupIds) can join.
  await liveblocks.getOrCreateRoom(id, {
    organizationId: orgId,
    defaultAccesses: [],
    groupsAccesses: { [orgId]: ["room:write"] },
    metadata: {
      title: workflow.name,
    },
  })

  // Read-only realtime token, limited to this workflow's runs (tagged in
  // runWorkflowAction). Scoped by tag so it can't read other workflows' runs.
  const runsToken = await triggerAuth.createPublicToken({
    scopes: { read: { tags: [`workflow:${id}`] } },
    expirationTime: "1h",
  })

  // One React Flow store shared by the canvas and the sidebar's palette.
  return (
    <Room roomId={id}>
      <ReactFlowProvider>
        <WorkflowRunsProvider workflowId={id} accessToken={runsToken}>
          <WorkflowShell workflowId={id} />
        </WorkflowRunsProvider>
      </ReactFlowProvider>
    </Room>
  )
}
