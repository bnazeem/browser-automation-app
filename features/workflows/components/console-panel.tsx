"use client"

import { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { InspectorPanel } from "@/features/workflows/components/inspector-panel"
import {
  LogsPanel,
  type StepSelection,
} from "@/features/workflows/components/logs-panel"
import { useWorkflowRuns } from "@/features/workflows/components/workflow-runs-provider"

// The console under the canvas: the runs list, plus an inspector beside it for
// the selected step. Owns the selection so both read the same step.
export function ConsolePanel() {
  const runs = useWorkflowRuns()
  const [selected, setSelected] = useState<StepSelection | null>(null)

  // Clicking the selected step again deselects it.
  const toggle = (step: StepSelection) =>
    setSelected((current) =>
      current?.runId === step.runId && current.nodeId === step.nodeId
        ? null
        : step
    )

  // Look the step up in live run data so the inspector updates as it runs.
  const selectedRun = selected && runs.find((r) => r.id === selected.runId)
  const selectedStep = selectedRun?.steps.find(
    (s) => s.nodeId === selected?.nodeId
  )

  return (
    <ResizablePanelGroup orientation="horizontal" className="bg-background">
      <ResizablePanel id="logs" minSize="12rem" className="flex flex-col">
        <LogsPanel selected={selected} onSelect={toggle} />
      </ResizablePanel>
      {selectedRun && selectedStep && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="inspector"
            defaultSize="50"
            minSize="12rem"
            className="flex flex-col"
          >
            <InspectorPanel
              step={selectedStep}
              isLive={selectedRun.isLive}
              onClose={() => setSelected(null)}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
