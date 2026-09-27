import { auth } from "@clerk/nextjs/server"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"

export default async function Page(props: PageProps<"/workflows/[id]">) {
  await auth.protect()

  const { id } = await props.params

  return <WorkflowShell workflowId={id} />
}
