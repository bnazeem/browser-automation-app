"use client"

import prettyMilliseconds from "pretty-ms"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

// The body of the inspector: the step's error if it failed, its output as
// JSON if it produced one, otherwise a short note about why there's nothing.
function StepResult({ step, isLive }: { step: RunStep; isLive: boolean }) {
  if (step.status === "failed") {
    return (
      <pre className="p-3 font-mono text-xs break-words whitespace-pre-wrap text-destructive">
        {step.error ?? "Step failed without an error message."}
      </pre>
    )
  }

  if (step.output !== undefined) {
    return (
      <pre className="p-3 font-mono text-xs break-words whitespace-pre-wrap">
        {JSON.stringify(step.output, null, 2)}
      </pre>
    )
  }

  const note =
    step.status === "running" && isLive
      ? "Running…"
      : step.status === "done"
        ? "This step produced no output."
        : "This step didn’t run."

  return <p className="p-3 text-sm text-muted-foreground">{note}</p>
}

// What the selected run step produced: its output, or its error if it failed.
export function InspectorPanel({
  step,
  isLive,
  onClose,
}: {
  step: RunStep
  isLive: boolean // whether the step's run is still in flight
  onClose: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-1 text-sm font-semibold">
        <NodeIcon type={step.type} className="size-5 [&_svg]:size-3" />
        <span className="truncate">{step.title}</span>
        {step.durationMs !== undefined && (
          <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
            {prettyMilliseconds(step.durationMs)}
          </span>
        )}
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Close"
          onClick={onClose}
          className="ml-auto"
        >
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <StepResult step={step} isLive={isLive} />
      </div>
    </div>
  )
}
