"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { triggerHelloWorldAction } from "@/features/trigger/actions"

export function TriggerHelloWorldButton() {
  const [isPending, startTransition] = useTransition()
  const [runId, setRunId] = useState<string | null>(null)

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await triggerHelloWorldAction("Hello from my app!")
        setRunId(result.runId)
        toast.success("Task triggered", { description: result.runId })
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to trigger task"
        )
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Triggering..." : "Trigger hello-world"}
      </Button>
      {runId ? (
        <p className="font-mono text-xs text-muted-foreground">
          runId: {runId}
        </p>
      ) : null}
    </div>
  )
}
