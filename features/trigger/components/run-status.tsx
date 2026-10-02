"use client"

import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { Badge } from "@/components/ui/badge"

interface RunStatusProps {
  runId: string
  publicAccessToken: string
}

const FAILED_STATUSES = [
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
  "EXPIRED",
]

function statusVariant(status: string) {
  if (status === "COMPLETED") return "secondary" as const
  if (status === "CANCELED") return "outline" as const
  if (FAILED_STATUSES.includes(status)) return "destructive" as const
  return "default" as const
}

export function RunStatus({ runId, publicAccessToken }: RunStatusProps) {
  // Only `payload` is skipped: status, metadata and output are all rendered.
  const { run, error } = useRealtimeRun(runId, {
    accessToken: publicAccessToken,
    skipColumns: ["payload"],
  })

  if (error) {
    return <p className="text-xs text-destructive">{error.message}</p>
  }

  const status = run?.status ?? "QUEUED"
  const step = run?.metadata?.step as string | undefined
  const progress = run?.metadata?.progress as number | undefined

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant(status)}>{status}</Badge>
        {step ? (
          <span className="text-xs text-muted-foreground">{step}</span>
        ) : null}
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(progress ?? 0) * 100}%` }}
        />
      </div>

      <p className="truncate font-mono text-xs text-muted-foreground">
        {runId}
      </p>

      {run?.output ? (
        <pre className="overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs">
          {JSON.stringify(run.output, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}
