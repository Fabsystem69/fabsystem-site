"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ConnectionMode,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { ElectricalNode } from "./nodes/ElectricalNode";
import { CableEdge } from "./edges/CableEdge";
import { getConsumerPreset } from "@/lib/electrical-components/definitions";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

const nodeTypes = { electrical: ElectricalNode };
const edgeTypes = { cable: CableEdge };

// Composants qui s'intercalent automatiquement quand on les dépose sur un
// câble existant (retour utilisateur : "spécifiquement pour les fusibles,
// interrupteur et busbar") — les autres se posent normalement à l'endroit
// visé, même si un câble passe dessous.
const SPLICEABLE_TYPES = new Set(["fuse", "switch", "busbar"]);

// Repère l'edge React Flow sous un point écran donné, via l'attribut
// data-testid="rf__edge-{id}" posé par la librairie sur chaque groupe SVG
// d'edge (y compris son tracé interactif élargi, plus facile à viser).
function edgeIdAtExactPoint(clientX: number, clientY: number): string | null {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    const match = el.closest('[data-testid^="rf__edge-"]');
    if (match) {
      const testId = match.getAttribute("data-testid") ?? "";
      return testId.replace("rf__edge-", "");
    }
  }
  return null;
}

// Le point de dépose exact tombe souvent sur la boîte d'un composant voisin
// (busbar, platine…) qui recouvre visuellement le câble qui passe juste à
// côté ou dessous — retour utilisateur : "le câble passe bien par les
// points de connexion" mais rien ne se relie, car document.elementsFromPoint
// renvoie le nœud, pas l'edge, à ce pixel précis. On élargit la recherche en
// tâtonnant sur un petit voisinage autour du point déposé.
const SPLICE_SEARCH_OFFSETS: [number, number][] = [
  [0, 0],
  [-8, 0], [8, 0], [0, -8], [0, 8],
  [-8, -8], [8, -8], [-8, 8], [8, 8],
  [-16, 0], [16, 0], [0, -16], [0, 16],
];

function edgeIdAtPoint(clientX: number, clientY: number): string | null {
  for (const [dx, dy] of SPLICE_SEARCH_OFFSETS) {
    const found = edgeIdAtExactPoint(clientX + dx, clientY + dy);
    if (found) return found;
  }
  return null;
}

// Zone centrale (CDC §16-19) : grille discrète, snap 20px, sélection au clic,
// drag & drop depuis la bibliothèque, écran vide guidé tant qu'aucun
// composant n'est posé (§54).
export function Canvas() {
  const nodes = useSchemaStore((s) => s.nodes) as Node<ElectricalNodeData>[];
  const edges = useSchemaStore((s) => s.edges) as Edge<CableEdgeData>[];
  const onNodesChange = useSchemaStore((s) => s.onNodesChange);
  const onEdgesChange = useSchemaStore((s) => s.onEdgesChange);
  const onConnect = useSchemaStore((s) => s.onConnect);
  const addComponent = useSchemaStore((s) => s.addComponent);
  const spliceNodeOnEdge = useSchemaStore((s) => s.spliceNodeOnEdge);
  const reconnectEdgeAction = useSchemaStore((s) => s.reconnectEdge);
  const select = useSchemaStore((s) => s.select);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const { screenToFlowPosition } = useReactFlow();

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/fabsystem-component");
      if (!type) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const presetValue = event.dataTransfer.getData("application/fabsystem-preset");
      const preset = presetValue ? getConsumerPreset(presetValue) : undefined;
      const dataOverride = preset
        ? { presetType: preset.value, label: preset.label, powerW: preset.typicalPowerW }
        : undefined;

      if (SPLICEABLE_TYPES.has(type)) {
        const edgeId = edgeIdAtPoint(event.clientX, event.clientY);
        if (edgeId) {
          spliceNodeOnEdge(edgeId, type, position);
          return;
        }
      }
      addComponent(type, position, dataOverride);
    },
    [addComponent, spliceNodeOnEdge, screenToFlowPosition],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleReconnect = useCallback(
    (oldEdge: Edge<CableEdgeData>, newConnection: Connection) => {
      reconnectEdgeAction(oldEdge, newConnection);
    },
    [reconnectEdgeAction],
  );

  return (
    <div className={`relative h-full flex-1 ${darkMode ? "bg-neutral-950" : "bg-neutral-50"}`} onDrop={handleDrop} onDragOver={handleDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={handleReconnect}
        edgesReconnectable
        reconnectRadius={28}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode={["Backspace", "Delete"]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => select("node", node.id)}
        onEdgeClick={(_, edge) => select("edge", edge.id)}
        onPaneClick={() => select(null, null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={darkMode ? "#3f3f46" : "#d4d4d4"} />
        <Controls showInteractive={false} position="bottom-left" className={darkMode ? "!fill-white [&_button]:!border-neutral-700 [&_button]:!bg-neutral-800 [&_button]:!text-white [&_path]:!fill-white" : undefined} />
      </ReactFlow>

      {nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`rounded-2xl border border-dashed px-8 py-6 text-center backdrop-blur-sm ${
              darkMode ? "border-neutral-700 bg-neutral-900/80" : "border-neutral-300 bg-white/80"
            }`}
          >
            <p className={`text-base font-semibold ${darkMode ? "text-neutral-100" : "text-neutral-800"}`}>Commence ton schéma</p>
            <p className={`mt-1 text-sm ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Glisse un composant depuis la bibliothèque.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
