import { auth } from "@clerk/nextjs/server"

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
      </div>
    </div>
  )
}
