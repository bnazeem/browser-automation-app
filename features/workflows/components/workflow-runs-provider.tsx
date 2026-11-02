"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type {
  RunStep,
  runWorkflowTask,
} from "@/features/workflows/tasks/run-workflow"

// One run of this workflow, flattened for the canvas and console.
export type WorkflowRun = {
  id: string
  status: string // trigger.dev run status, e.g. "EXECUTING", "COMPLETED"
  createdAt: Date
  isLive: boolean
  steps: RunStep[]
}

type WorkflowRunsValue = {
  runs: WorkflowRun[] // newest first
}

type LatestRunSteps = {
  steps: RunStep[]
  isLive: boolean
}

const WorkflowRunsContext = createContext<WorkflowRunsValue | null>(null)

// One shared realtime subscription to this workflow's runs (tagged
// `workflow:<id>` when triggered), so any canvas component can read runs and
// their steps without opening its own connection. The token must be scoped to
// read that tag. trigger.dev only replays runs from the last 24 hours.
export function WorkflowRunsProvider({
  workflowId,
  accessToken,
  children,
}: {
  workflowId: string
  accessToken: string
  children: ReactNode
}) {
  const { runs } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    `workflow:${workflowId}`,
    { accessToken, skipColumns: ["payload"] }
  )

  const value = useMemo<WorkflowRunsValue>(() => {
    const mapped = runs.map<WorkflowRun>((run) => {
      // Output is the guaranteed final state of a finished run; metadata is the
      // live stream while it's running (and the only record if it threw).
      const metadataSteps = run.metadata?.steps as RunStep[] | undefined
      const steps = run.output?.steps ?? metadataSteps ?? []

      // "Live" = still queued or executing (DEQUEUED is the hop between the two).
      const isLive =
        run.status === "QUEUED" ||
        run.status === "DEQUEUED" ||
        run.status === "EXECUTING"

      return {
        id: run.id,
        status: run.status,
        createdAt: run.createdAt,
        isLive,
        steps,
      }
    })
    mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return { runs: mapped }
  }, [runs])

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

function useWorkflowRunsContext(hook: string): WorkflowRunsValue {
  const value = useContext(WorkflowRunsContext)
  if (!value) {
    throw new Error(`${hook} must be used inside WorkflowRunsProvider`)
  }
  return value
}

// Every run of this workflow (newest first), each with its steps.
export function useWorkflowRuns(): WorkflowRun[] {
  return useWorkflowRunsContext("useWorkflowRuns").runs
}

// The most recent run's steps, and whether that run is still in flight.
export function useLatestRunSteps(): LatestRunSteps {
  const latest = useWorkflowRunsContext("useLatestRunSteps").runs[0]
  return useMemo(
    () => ({ steps: latest?.steps ?? [], isLive: latest?.isLive ?? false }),
    [latest]
  )
}
