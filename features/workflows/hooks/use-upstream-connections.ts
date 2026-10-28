import { useStore, type ReactFlowState } from "@xyflow/react"

import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

export type UpstreamConnection = {
  token: string // ready to insert, e.g. "{{ abc123.title }}"
  label: string // e.g. "Open URL 1 · Title"
  type: NodeType // source node's type, for its icon
}

// Every output produced by any node upstream of `nodeId`, nearest ancestors
// first. Walks edges backwards through the whole graph (not just direct
// parents) and recomputes as edges connect/disconnect or titles change.
export function useUpstreamConnections(
  nodeId: string | undefined
): UpstreamConnection[] {
  return useStore((s) => collectUpstream(s, nodeId), sameConnections)
}

function collectUpstream(
  { edges, nodeLookup }: ReactFlowState,
  nodeId: string | undefined
): UpstreamConnection[] {
  if (!nodeId) return []

  const sourcesOf = new Map<string, string[]>()
  for (const e of edges) {
    sourcesOf.set(e.target, [...(sourcesOf.get(e.target) ?? []), e.source])
  }

  // BFS up the graph; `seen` guards against cycles and diamond joins.
  const seen = new Set([nodeId])
  const queue = [nodeId]
  const connections: UpstreamConnection[] = []

  while (queue.length) {
    for (const sourceId of sourcesOf.get(queue.shift()!) ?? []) {
      if (seen.has(sourceId)) continue
      seen.add(sourceId)
      queue.push(sourceId)

      const node = nodeLookup.get(sourceId) as StepNodeType | undefined
      if (!node) continue
      const { type, title } = node.data
      for (const output of nodeRegistry[type].outputs) {
        connections.push({
          token: `{{ ${sourceId}.${output.path} }}`,
          label: `${title} · ${output.label}`,
          type,
        })
      }
    }
  }

  return connections
}

// The selector builds a fresh array every store update (e.g. each drag frame),
// so compare by content to only re-render when the list actually changes.
function sameConnections(a: UpstreamConnection[], b: UpstreamConnection[]) {
  return (
    a.length === b.length &&
    a.every(
      (c, i) =>
        c.token === b[i].token &&
        c.label === b[i].label &&
        c.type === b[i].type
    )
  )
}
