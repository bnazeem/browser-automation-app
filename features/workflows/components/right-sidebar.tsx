"use client"

import { useState, useTransition } from "react"
import { Loader2Icon, PlayIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { RunStatus } from "@/features/trigger/components/run-status"
import { runWorkflowAction } from "@/features/workflows/actions"

// interface RightSidebarProps {
//   workflowId: string
// }

type RunHandle = Awaited<ReturnType<typeof runWorkflowAction>>

export function RightSidebar() {
  const [isPending, startTransition] = useTransition()
  const [handle, setHandle] = useState<RunHandle | null>(null)

  const handleRun = () => {
    startTransition(async () => {
      try {
        setHandle(await runWorkflowAction())
        toast.success(`Run started`)
      } catch {
        toast.error("Failed to start run")
      }
    })
  }

  return (
    <div className="flex size-full flex-col items-center gap-4 p-4 text-sm text-muted-foreground">
      <Button onClick={handleRun} disabled={isPending}>
        {isPending ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : (
          <PlayIcon data-icon="inline-start" />
        )}
        Run
      </Button>

      {handle ? (
        <RunStatus
          runId={handle.id}
          publicAccessToken={handle.publicAccessToken}
        />
      ) : null}
    </div>
  )
}
