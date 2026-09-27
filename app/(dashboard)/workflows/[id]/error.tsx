"use client"

import { useEffect } from "react"
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>
          This workflow could not be loaded. Try again, or pick a different
          workflow from the sidebar.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={() => retry()}>
          <RefreshCwIcon />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}
