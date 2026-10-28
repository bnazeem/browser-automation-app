"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type {
  RunStep,
  runWorkflowTask,
} from "@/features/workflows/tasks/run-workflow"

type LatestRunSteps = {
  steps: RunStep[]
  isLive: boolean
}

const WorkflowRunsContext = createContext<LatestRunSteps | null>(null)

// One shared realtime subscription to this workflow's runs (tagged
// `workflow:<id>` when triggered), so any canvas component can read the latest
// run's steps without opening its own connection. The token must be scoped to
// read that tag.
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

  const value = useMemo<LatestRunSteps>(() => {
    const latest = runs.reduce<(typeof runs)[number] | undefined>(
      (newest, run) =>
        !newest || run.createdAt > newest.createdAt ? run : newest,
      undefined
    )
    if (!latest) return { steps: [], isLive: false }

    // "Live" = still queued or executing (DEQUEUED is the hop between the two).
    const isLive =
      latest.status === "QUEUED" ||
      latest.status === "DEQUEUED" ||
      latest.status === "EXECUTING"

    // Output is the guaranteed final state of a finished run; metadata is the
    // live stream while it's running (and the only record if it threw).
    const metadataSteps = latest.metadata?.steps as RunStep[] | undefined
    const steps = latest.output?.steps ?? metadataSteps ?? []

    return { steps, isLive }
  }, [runs])

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

// The most recent run's steps, and whether that run is still in flight.
export function useLatestRunSteps(): LatestRunSteps {
  const value = useContext(WorkflowRunsContext)
  if (!value) {
    throw new Error("useLatestRunSteps must be used inside WorkflowRunsProvider")
  }
  return value
}
