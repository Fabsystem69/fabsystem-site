"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ConnectionMode,
  PanOnScrollMode,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
} from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { ElectricalNode } from "./nodes/ElectricalNode";
import { CableEdge, cableCaption } from "./edges/CableEdge";
import { CableCrossingOverlay } from "./edges/CableCrossingOverlay";
import { CableWaypointNode } from "./nodes/CableWaypointNode";
import { ZoneNode } from "./nodes/ZoneNode";
import { getConsumerPreset, getComponentDefinition } from "@/lib/electrical-components/definitions";
import { filterNodesByZone, filterEdgesForNodes } from "@/features/schemas/export";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

const nodeTypes = { electrical: ElectricalNode, cableWaypoint: CableWaypointNode, zone: ZoneNode };
const edgeTypes = { cable: CableEdge };

// Préfixe des nœuds de coude de câble synthétiques (retour utilisateur : "la
// vignette câble devrait avoir les mêmes propriétés qu'une vignette item…
// les câbles les suivent parfaitement") — ajoutés uniquement à la liste
// passée à <ReactFlow>, jamais aux nœuds persistés du schéma (voir plus
// bas) : ni le récapitulatif matériel, ni les contrôles électriques, ni la
// sauvegarde ne doivent en avoir connaissance, seul `edge.data.bendPoint`
// est source de vérité.
const WAYPOINT_ID_PREFIX = "wp-";

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
  const allNodes = useSchemaStore((s) => s.nodes) as Node<ElectricalNodeData>[];
  const allEdges = useSchemaStore((s) => s.edges) as Edge<CableEdgeData>[];
  const hiddenCategories = useSchemaStore((s) => s.hiddenCategories);
  const exportIsolatedZoneId = useSchemaStore((s) => s.exportIsolatedZoneId);
  const onNodesChange = useSchemaStore((s) => s.onNodesChange);
  const onEdgesChange = useSchemaStore((s) => s.onEdgesChange);
  const onConnect = useSchemaStore((s) => s.onConnect);
  const addComponent = useSchemaStore((s) => s.addComponent);
  const addZone = useSchemaStore((s) => s.addZone);
  const spliceNodeOnEdge = useSchemaStore((s) => s.spliceNodeOnEdge);
  const reconnectEdgeAction = useSchemaStore((s) => s.reconnectEdge);
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);
  const select = useSchemaStore((s) => s.select);
  const openItemPropertiesPopup = useSchemaStore((s) => s.openItemPropertiesPopup);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const { screenToFlowPosition } = useReactFlow();

  // Isolement par catégorie (retour utilisateur : "isoler le circuit MPPT ou
  // consommateur") : les nœuds masqués disparaissent du canvas — et par
  // ricochet des exports (PNG/PDF/liste de matériel), qui lisent l'état
  // React Flow réel via getNodes()/getEdges(), pas le store complet. Un
  // câble dont une seule extrémité est masquée disparaît aussi (sinon il
  // pointerait dans le vide).
  const nodes = useMemo(() => {
    // Isolement export par zone (retour utilisateur : "isoler uniquement la
    // zone pour les imprimer") — posé juste avant une capture d'export par
    // ExportMenu.tsx ; s'applique AVANT le filtre par catégorie pour que les
    // deux filtres se cumulent si jamais les deux sont actifs en même temps.
    const zoneFiltered = filterNodesByZone(allNodes, exportIsolatedZoneId);
    if (hiddenCategories.length === 0) return zoneFiltered;
    return zoneFiltered.filter((n) => {
      const def = getComponentDefinition(n.data.componentType);
      return !def || !hiddenCategories.includes(def.category);
    });
  }, [allNodes, hiddenCategories, exportIsolatedZoneId]);

  const edges = useMemo(() => {
    if (hiddenCategories.length === 0 && !exportIsolatedZoneId) return allEdges;
    return filterEdgesForNodes(allEdges, nodes);
  }, [allEdges, hiddenCategories, exportIsolatedZoneId, nodes]);

  // Nœuds de coude de câble (retour utilisateur : "la vignette câble
  // devrait avoir les mêmes propriétés qu'une vignette item… les câbles les
  // suivent parfaitement") — un vrai nœud React Flow par câble déplacé,
  // ajouté seulement ici (jamais dans le store) pour que son glisser passe
  // par le même mécanisme natif, éprouvé, que n'importe quel composant.
  const waypointNodes = useMemo<Node[]>(
    () =>
      edges
        .filter((e) => e.data?.bendPoint)
        .map((e) => ({
          id: `${WAYPOINT_ID_PREFIX}${e.id}`,
          type: "cableWaypoint",
          position: e.data!.bendPoint!,
          // Par défaut `position` désigne le coin haut-gauche du nœud — le
          // tracé du câble doit passer par son CENTRE (comme l'ancienne
          // vignette, centrée via `translate(-50%,-50%)`). `origin: [0.5,
          // 0.5]` réoriente ce point de référence sans toucher au réglage
          // global `nodeOrigin` de <ReactFlow>, qui s'appliquerait à tort à
          // tous les vrais composants du schéma.
          origin: [0.5, 0.5] as [number, number],
          data: { edgeId: e.id, label: cableCaption(e.data) },
          draggable: true,
          selectable: false,
          zIndex: 1001,
        })),
    [edges],
  );

  const reactFlowNodes = useMemo<Node[]>(() => [...nodes, ...waypointNodes], [nodes, waypointNodes]);

  // Sépare les changements de position des nœuds de coude synthétiques (à
  // écrire dans `edge.data.bendPoint`) des changements sur de vrais nœuds
  // du schéma (route normale du store) — un nœud de coude n'existe jamais
  // dans `state.nodes`, le laisser passer par `onNodesChange` du store
  // serait un no-op silencieux qui perdrait le déplacement.
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const waypointChanges: { edgeId: string; position: { x: number; y: number }; trackHistory: boolean }[] = [];
      const realChanges: NodeChange<Node>[] = [];
      for (const change of changes) {
        if ("id" in change && change.id.startsWith(WAYPOINT_ID_PREFIX)) {
          if (change.type === "position" && change.position) {
            waypointChanges.push({
              edgeId: change.id.slice(WAYPOINT_ID_PREFIX.length),
              position: change.position,
              trackHistory: change.dragging === false,
            });
          }
          continue;
        }
        realChanges.push(change);
      }
      for (const { edgeId, position, trackHistory } of waypointChanges) {
        updateEdgeData(edgeId, { bendPoint: position }, { trackHistory });
      }
      if (realChanges.length > 0) onNodesChange(realChanges as Parameters<typeof onNodesChange>[0]);
    },
    [onNodesChange, updateEdgeData],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/fabsystem-component");
      if (!type) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      if (type === "zone") {
        addZone({ x: position.x - 190, y: position.y - 130 });
        return;
      }
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
    [addComponent, addZone, spliceNodeOnEdge, screenToFlowPosition],
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
        nodes={reactFlowNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={handleReconnect}
        edgesReconnectable
        reconnectRadius={28}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        // V2, retour utilisateur : "pour relier chaque élément, cliquer sur
        // la sortie qu'on veut relier et cliquer sur l'entrée de l'autre
        // élément, ou inversement" — fonctionnalité native de React Flow
        // (pas de logique maison à maintenir : gère déjà l'annulation via
        // Échap/reclic sur la même borne, et le retour visuel pendant la
        // connexion). Le glisser-déposer existant reste inchangé, les deux
        // méthodes coexistent.
        connectOnClick
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode={["Backspace", "Delete"]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        // V2, retour utilisateur : le geste à deux doigts sur trackpad
        // zoomait au lieu de déplacer le canvas — comportement par défaut
        // de React Flow (zoomOnScroll=true, panOnScroll=false). On inverse
        // pour suivre la convention trackpad usuelle (Figma, Miro…) : deux
        // doigts qui défilent déplacent, le pincement zoome (zoomOnPinch
        // reste actif ; les navigateurs remontent un pincement comme un
        // wheel event avec ctrlKey, que React Flow gère séparément).
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        zoomOnScroll={false}
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          if (node.id.startsWith(WAYPOINT_ID_PREFIX)) return;
          select("node", node.id);
        }}
        onEdgeClick={(_, edge) => select("edge", edge.id)}
        onPaneClick={() => select(null, null)}
        // v2.1, retour utilisateur : "supprimer le bandeau de droite... le
        // double-clic ouvre les informations item en popup" — remplace
        // l'ancien bandeau permanent (voir ItemPropertiesPopup.tsx).
        onNodeDoubleClick={(_, node) => {
          if (node.id.startsWith(WAYPOINT_ID_PREFIX)) return;
          select("node", node.id);
          openItemPropertiesPopup();
        }}
        onEdgeDoubleClick={(_, edge) => {
          select("edge", edge.id);
          openItemPropertiesPopup();
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={darkMode ? "#3f3f46" : "#d4d4d4"} />
        <Controls showInteractive={false} position="bottom-left" className={darkMode ? "!fill-white [&_button]:!border-neutral-700 [&_button]:!bg-neutral-800 [&_button]:!text-white [&_path]:!fill-white" : undefined} />
        <CableCrossingOverlay />
      </ReactFlow>

      {allNodes.length === 0 ? (
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
      ) : nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`rounded-2xl border border-dashed px-8 py-6 text-center backdrop-blur-sm ${
              darkMode ? "border-neutral-700 bg-neutral-900/80" : "border-neutral-300 bg-white/80"
            }`}
          >
            <p className={`text-base font-semibold ${darkMode ? "text-neutral-100" : "text-neutral-800"}`}>Rien à afficher avec ce filtre</p>
            <p className={`mt-1 text-sm ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Aucune catégorie visible ne contient de composant.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
