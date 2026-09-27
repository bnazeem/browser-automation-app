import Link from "next/link"
import { SearchXIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>Workflow not found</EmptyTitle>
        <EmptyDescription>
          The workflow you&apos;re looking for does not exist, or you no longer
          have access to it, or may have been deleted.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link href="/">Back to workflows</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
