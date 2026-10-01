import { auth } from "@clerk/nextjs/server"
import { TriggerHelloWorldButton } from "@/features/trigger/components/trigger-hello-world-button"

export default async function TestPage() {
  const { userId } = await auth.protect()

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-2 text-sm leading-loose">
        <h1 className="font-medium">Protected test page</h1>
        <p>If you can see this, you are signed in.</p>
        <p className="font-mono text-xs text-muted-foreground">
          userId: {userId}
        </p>
        <div className="mt-4 border-t pt-4">
          <h2 className="font-medium">Trigger.dev smoke test</h2>
          <p className="mb-3 text-muted-foreground">
            Triggers the hello-world task from a server action.
          </p>
          <TriggerHelloWorldButton />
        </div>
      </div>
    </div>
  )
}
