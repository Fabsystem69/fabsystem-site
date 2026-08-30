"use client";

import { useEffect, useState } from "react";
import { Background, BackgroundVariant, ReactFlow, ReactFlowProvider, type Edge, type Node } from "@xyflow/react";
import { ElectricalNode } from "./nodes/ElectricalNode";
import { CableEdge } from "./edges/CableEdge";
import { ZoneNode } from "./nodes/ZoneNode";
import { useSchemaStore, type SchemaEdge, type SchemaNode } from "@/features/schemas/store/useSchemaStore";

const nodeTypes = { electrical: ElectricalNode, zone: ZoneNode };
const edgeTypes = { cable: CableEdge };

export function SharedSchemaViewer({ token }: { token: string }) {
  const [schema, setSchema] = useState<{ projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hydrate = useSchemaStore((state) => state.hydrate);

  useEffect(() => {
    fetch(`/api/schema-share/${token}`)
      .then(async (response) => {
        const body = await response.json() as { schema?: { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] }; error?: string };
        if (!response.ok || !body.schema) throw new Error(body.error || "Lien introuvable ou révoqué.");
        setSchema(body.schema);
        hydrate(body.schema);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Lien introuvable ou révoqué."));
  }, [token, hydrate]);

  if (error) return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">Lien indisponible</h1><p className="mt-2 text-slate-600">{error}</p></div></main>;
  if (!schema) return <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-500">Chargement du schéma…</main>;
  return <main className="flex h-screen flex-col bg-slate-100"><header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">FabSystem · lecture seule</p><h1 className="text-lg font-semibold text-slate-900">{schema.projectName}</h1></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600">Lien partagé</span></header><div className="min-h-0 flex-1"><ReactFlowProvider><ReactFlow nodes={schema.nodes as Node[]} edges={schema.edges as Edge[]} nodeTypes={nodeTypes} edgeTypes={edgeTypes} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} panOnDrag zoomOnScroll fitView fitViewOptions={{ padding: 0.15 }} minZoom={0.1} maxZoom={2}><Background variant={BackgroundVariant.Lines} gap={20} size={1} color="#e2e8f0" /></ReactFlow></ReactFlowProvider></div></main>;
}
