"use client"

import { format } from "date-fns"
import prettyMilliseconds from "pretty-ms"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import {
  useWorkflowRuns,
  type WorkflowRun,
} from "@/features/workflows/components/workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

// Identifies one step in one run - node ids repeat across runs.
export type StepSelection = { runId: string; nodeId: string }

type LogsPanelProps = {
  selected: StepSelection | null
  onSelect: (step: StepSelection) => void
}

// One step row: node icon, title, and duration. Spins while running, red when
// failed, dimmed when it never ran.
function StepRow({
  step,
  isLive,
  isSelected,
  onClick,
}: {
  step: RunStep
  isLive: boolean
  isSelected: boolean
  onClick: () => void
}) {
  // A run that ended (cancelled, crashed) can leave a step "running" - only
  // spin while the run is still in flight.
  const isRunning = step.status === "running" && isLive
  const isFailed = step.status === "failed"
  const neverRan = step.status === "pending"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-accent/50",
        isSelected && "bg-accent text-accent-foreground hover:bg-accent",
        isFailed && "text-destructive",
        neverRan && "opacity-50"
      )}
    >
      <NodeIcon
        type={step.type}
        running={isRunning}
        className={cn(
          "size-5 [&_svg]:size-3",
          isFailed && "ring-2 ring-destructive"
        )}
      />
      <span className="truncate font-medium">{step.title}</span>
      {step.durationMs !== undefined && (
        <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
          {prettyMilliseconds(step.durationMs)}
        </span>
      )}
    </button>
  )
}

// A run's header (when it started, its status) with its steps listed below.
function RunGroup({
  run,
  selected,
  onSelect,
}: {
  run: WorkflowRun
  selected: StepSelection | null
  onSelect: (step: StepSelection) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2 px-2 py-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {format(run.createdAt, "dd MMM yyyy, h:mm:ss aaa")}
        </span>
        <span className="flex items-center gap-1.5 lowercase">
          {run.isLive && <Spinner className="size-3" />}
          {run.status}
        </span>
      </div>
      {run.steps.map((step) => (
        <StepRow
          key={step.nodeId}
          step={step}
          isLive={run.isLive}
          isSelected={
            selected?.runId === run.id && selected.nodeId === step.nodeId
          }
          onClick={() => onSelect({ runId: run.id, nodeId: step.nodeId })}
        />
      ))}
    </div>
  )
}

// Every run of this workflow (newest first), each followed by its steps.
export function LogsPanel({ selected, onSelect }: LogsPanelProps) {
  const runs = useWorkflowRuns()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border bg-card px-3 py-1.5 text-sm font-semibold">
        Logs
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {runs.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No runs yet</p>
        ) : (
          <div className="flex flex-col gap-3 p-2">
            {runs.map((run) => (
              <RunGroup
                key={run.id}
                run={run}
                selected={selected}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
