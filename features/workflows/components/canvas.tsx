"use client"

import { useCallback, useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ConnectionLineType,
  type ColorMode,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

const initialNodes: Node[] = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
]

const initialEdges: Edge[] = [{ id: "n1-n2", source: "n1", target: "n2" }]

const subscribe = () => () => {}

export function Canvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  const { resolvedTheme } = useTheme()
  // resolvedTheme is unknown on the server, so render "light" until hydrated
  // to keep React Flow's color mode class consistent with the server HTML.
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const colorMode: ColorMode =
    isMounted && resolvedTheme === "dark" ? "dark" : "light"

  const onNodesChange: OnNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  )
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  )
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  )

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={colorMode}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "var(--border)" }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "var(--border)" },
        }}
        style={
          {
            "--xy-background-color": "var(--background)",
            "--xy-edge-stroke-width": 2,
            "--xy-connectionline-stroke-width": 2,
          } as React.CSSProperties
        }
        maxZoom={1}
      >
        {/* <Background /> */}
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
