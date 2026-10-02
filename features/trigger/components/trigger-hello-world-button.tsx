"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { triggerHelloWorldAction } from "@/features/trigger/actions"
import { RunStatus } from "@/features/trigger/components/run-status"

type RunHandle = Awaited<ReturnType<typeof triggerHelloWorldAction>>

export function TriggerHelloWorldButton() {
  const [isPending, startTransition] = useTransition()
  const [handle, setHandle] = useState<RunHandle | null>(null)

  function handleClick() {
    startTransition(async () => {
      try {
        setHandle(await triggerHelloWorldAction("Hello from my app!"))
      } catch (cause) {
        toast.error(
          cause instanceof Error ? cause.message : "Failed to trigger task"
        )
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Triggering..." : "Trigger hello-world"}
      </Button>

      {handle ? (
        <RunStatus
          runId={handle.runId}
          publicAccessToken={handle.publicAccessToken}
        />
      ) : null}
    </div>
  )
}
