"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
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
import { getBendPoints } from "@/lib/schema-editor/cable-bend-points";
import { SPLICEABLE_COMPONENT_TYPES } from "@/lib/schema-editor/cable-splice";
import { CableCrossingOverlay } from "./edges/CableCrossingOverlay";
import { AlignmentGuideOverlay } from "./AlignmentGuideOverlay";
import { WiringHintBanner } from "./WiringHintBanner";
import { CableWaypointNode } from "./nodes/CableWaypointNode";
import { ZoneNode } from "./nodes/ZoneNode";
import { SchemaIssuesWidget } from "./SchemaIssuesWidget";
import { getConsumerPreset, getComponentDefinition, getEffectiveHandles } from "@/lib/electrical-components/definitions";
import { filterNodesByZone, filterEdgesForNodes } from "@/features/schemas/export";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

const nodeTypes = { electrical: ElectricalNode, cableWaypoint: CableWaypointNode, zone: ZoneNode };
const edgeTypes = { cable: CableEdge };

type CanvasIconName = "undo" | "redo" | "zoom-out" | "zoom-in" | "frame" | "selection";

// Icônes SVG locales : aucune police de symboles à charger et un sens lisible
// immédiatement sur le bandeau de pilotage du canvas.
function CanvasIcon({ name }: { name: CanvasIconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<CanvasIconName, ReactNode> = {
    undo: <><path {...common} d="M9 7 5 11l4 4" /><path {...common} d="M5 11h8a5 5 0 0 1 5 5" /></>,
    redo: <><path {...common} d="m15 7 4 4-4 4" /><path {...common} d="M19 11h-8a5 5 0 0 0-5 5" /></>,
    "zoom-out": <><circle {...common} cx="10.5" cy="10.5" r="5.5" /><path {...common} d="m15 15 4 4M8 10.5h5" /></>,
    "zoom-in": <><circle {...common} cx="10.5" cy="10.5" r="5.5" /><path {...common} d="m15 15 4 4M8 10.5h5M10.5 8v5" /></>,
    frame: <><path {...common} d="M8 4H4v4m12-4h4v4m0 8v4h-4M8 20H4v-4" /></>,
    selection: <><rect {...common} x="4.5" y="4.5" width="15" height="15" rx="1" strokeDasharray="2.5 2.5" /><path {...common} d="m10 9 4.5 4.5-2.5.6 1.2 2.5-1.5.7-1.2-2.5-1.8 1.8Z" fill="currentColor" stroke="none" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">{paths[name]}</svg>;
}

// Préfixe des nœuds de coude de câble synthétiques (retour utilisateur : "la
// vignette câble devrait avoir les mêmes propriétés qu'une vignette item…
// les câbles les suivent parfaitement") — ajoutés uniquement à la liste
// passée à <ReactFlow>, jamais aux nœuds persistés du schéma (voir plus
// bas) : ni le récapitulatif matériel, ni les contrôles électriques, ni la
// sauvegarde ne doivent en avoir connaissance, seul `edge.data.bendPoints`
// est source de vérité.
const WAYPOINT_ID_PREFIX = "wp-";

// Un câble peut désormais porter plusieurs points de coude (retour
// utilisateur : "poignées/points intermédiaires sur les câbles") — l'index
// est encodé dans l'id du nœud synthétique pour retrouver quel point d'un
// même câble a bougé.
function waypointNodeId(edgeId: string, index: number): string {
  return `${WAYPOINT_ID_PREFIX}${edgeId}::${index}`;
}

function parseWaypointNodeId(id: string): { edgeId: string; index: number } | null {
  if (!id.startsWith(WAYPOINT_ID_PREFIX)) return null;
  const rest = id.slice(WAYPOINT_ID_PREFIX.length);
  const sep = rest.lastIndexOf("::");
  if (sep === -1) return null;
  const index = Number(rest.slice(sep + 2));
  if (!Number.isFinite(index)) return null;
  return { edgeId: rest.slice(0, sep), index };
}

// Composants qui s'intercalent automatiquement quand on les dépose sur un
// câble existant (retour utilisateur : "spécifiquement pour les fusibles,
// interrupteur et busbar") — les autres se posent normalement à l'endroit
// visé, même si un câble passe dessous.
// Tout composant "en ligne" à une seule entrée/sortie (ou borne numérotée
// unique façon busbar) peut s'insérer directement sur un câble existant
// (retour utilisateur : "insertion fluide de composants inline sur câble") —
// exclut les composants à IN/OUT multiples (tableau de distribution,
// platine de fusibles) où le point d'insertion serait ambigu.
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

// Guide d'alignement magnétique (retour utilisateur : "pas toujours possible
// de laisser un fil conducteur droit, il y a souvent un décalage") — pendant
// le glisser d'un composant, si sa position se rapproche de celle d'un
// voisin déjà câblé (même X ou même Y, à quelques pixels près), on accroche
// dessus plutôt que de laisser le câble arriver légèrement de travers. Ne
// compare qu'aux voisins reliés par un câble (pas tous les nœuds du schéma)
// — c'est précisément le cas où garder le fil droit compte visuellement.
const ALIGNMENT_SNAP_THRESHOLD = 6;

function snapToConnectedNeighbors(
  draggedNodeId: string,
  proposedPosition: { x: number; y: number },
  allNodes: Node<ElectricalNodeData>[],
  allEdges: Edge<CableEdgeData>[],
): { position: { x: number; y: number }; guides: { x: number | null; y: number | null } } {
  const neighborIds = new Set<string>();
  for (const edge of allEdges) {
    if (edge.source === draggedNodeId) neighborIds.add(edge.target);
    else if (edge.target === draggedNodeId) neighborIds.add(edge.source);
  }
  if (neighborIds.size === 0) return { position: proposedPosition, guides: { x: null, y: null } };

  let snappedX: number | null = null;
  let snappedY: number | null = null;
  let bestXDelta = ALIGNMENT_SNAP_THRESHOLD;
  let bestYDelta = ALIGNMENT_SNAP_THRESHOLD;

  for (const node of allNodes) {
    if (!neighborIds.has(node.id)) continue;
    const dx = Math.abs(node.position.x - proposedPosition.x);
    if (dx < bestXDelta) {
      bestXDelta = dx;
      snappedX = node.position.x;
    }
    const dy = Math.abs(node.position.y - proposedPosition.y);
    if (dy < bestYDelta) {
      bestYDelta = dy;
      snappedY = node.position.y;
    }
  }

  return {
    position: { x: snappedX ?? proposedPosition.x, y: snappedY ?? proposedPosition.y },
    guides: { x: snappedX, y: snappedY },
  };
}

function edgeIdAtPoint(clientX: number, clientY: number): string | null {
  for (const [dx, dy] of SPLICE_SEARCH_OFFSETS) {
    const found = edgeIdAtExactPoint(clientX + dx, clientY + dy);
    if (found) return found;
  }
  return null;
}

// Un schéma ancien peut référencer une borne supprimée (changement de modèle,
// moins de sorties, etc.). React Flow ne dessine alors plus du tout le câble.
// On garde les données persistées intactes, mais on affiche provisoirement
// l'extrémité absente au centre du boîtier : le câble rouge pointillé devient
// sélectionnable, reconnectable ou supprimable depuis l'alerte.
function renderOrphanEdges(
  edges: Edge<CableEdgeData>[],
  nodes: Node<ElectricalNodeData>[],
): Edge<CableEdgeData>[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const hasHandle = (nodeId: string, handleId: string | null | undefined) => {
    const node = nodesById.get(nodeId);
    const definition = node && getComponentDefinition(node.data.componentType);
    return Boolean(definition && handleId && getEffectiveHandles(definition, node.data).some((handle) => handle.id === handleId));
  };

  return edges.map((edge) => {
    const sourceValid = hasHandle(edge.source, edge.sourceHandle);
    const targetValid = hasHandle(edge.target, edge.targetHandle);
    if (sourceValid && targetValid) return edge;
    return {
      ...edge,
      sourceHandle: sourceValid ? edge.sourceHandle : null,
      targetHandle: targetValid ? edge.targetHandle : null,
    };
  });
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
  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const draggingComponentType = useSchemaStore((s) => s.draggingComponentType);
  const setSpliceHoverEdgeId = useSchemaStore((s) => s.setSpliceHoverEdgeId);
  const setAlignmentGuides = useSchemaStore((s) => s.setAlignmentGuides);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const showGrid = useSchemaStore((s) => s.showGrid);
  const setShowGrid = useSchemaStore((s) => s.setShowGrid);
  const undo = useSchemaStore((s) => s.undo);
  const redo = useSchemaStore((s) => s.redo);
  const toggleLeftPanel = useSchemaStore((s) => s.toggleLeftPanel);
  const canUndo = useSchemaStore((s) => s.past.length > 0);
  const canRedo = useSchemaStore((s) => s.future.length > 0);
  const { screenToFlowPosition, zoomTo, fitView, getZoom } = useReactFlow();
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const canvasControlButtonClass = `flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-35 max-md:h-10 max-md:w-10 ${
    darkMode ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
  }`;

  const setZoom = useCallback(
    (nextZoom: number) => {
      const clamped = Math.max(0.2, Math.min(2, nextZoom));
      setCanvasZoom(clamped);
      void zoomTo(clamped, { duration: 150 });
    },
    [zoomTo],
  );

  const frameCanvas = useCallback(() => {
    void fitView({ padding: 0.16, duration: 250 });
    window.setTimeout(() => setCanvasZoom(getZoom()), 260);
  }, [fitView, getZoom]);

  // Mobile: un premier geste sur un composant sert a le selectionner. Tant
  // qu'il n'est pas selectionne, il laisse le glisser remonter au canvas afin
  // de conserver une navigation fluide a un doigt. Le comportement desktop
  // reste volontairement identique: tout composant peut y etre deplace.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

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
    const categoryFiltered =
      hiddenCategories.length === 0
        ? zoneFiltered
        : zoneFiltered.filter((n) => {
            const def = getComponentDefinition(n.data.componentType);
            return !def || !hiddenCategories.includes(def.category);
          });
    // Zone épinglée (retour utilisateur : "épingler les zones pour éviter
    // qu'un clic les déplace") — `draggable: false` sur le nœud React Flow
    // lui-même, pas seulement un style visuel, sinon un glisser fonctionne
    // toujours malgré l'icône de verrou.
    return categoryFiltered.map((n) => (n.type === "zone" && n.data.locked ? { ...n, draggable: false } : n));
  }, [allNodes, hiddenCategories, exportIsolatedZoneId]);

  const edges = useMemo(() => {
    if (hiddenCategories.length === 0 && !exportIsolatedZoneId) return allEdges;
    return filterEdgesForNodes(allEdges, nodes);
  }, [allEdges, hiddenCategories, exportIsolatedZoneId, nodes]);

  const renderedEdges = useMemo(() => renderOrphanEdges(edges, nodes), [edges, nodes]);

  // Nœuds de coude de câble (retour utilisateur : "la vignette câble
  // devrait avoir les mêmes propriétés qu'une vignette item… les câbles les
  // suivent parfaitement") — un vrai nœud React Flow par câble déplacé,
  // ajouté seulement ici (jamais dans le store) pour que son glisser passe
  // par le même mécanisme natif, éprouvé, que n'importe quel composant.
  const waypointNodes = useMemo<Node[]>(
    () =>
      edges.flatMap((e) => {
        const points = getBendPoints(e.data);
        return points.map((point, index) => ({
          id: waypointNodeId(e.id, index),
          type: "cableWaypoint",
          position: point,
          // Par défaut `position` désigne le coin haut-gauche du nœud — le
          // tracé du câble doit passer par son CENTRE (comme l'ancienne
          // vignette, centrée via `translate(-50%,-50%)`). `origin: [0.5,
          // 0.5]` réoriente ce point de référence sans toucher au réglage
          // global `nodeOrigin` de <ReactFlow>, qui s'appliquerait à tort à
          // tous les vrais composants du schéma.
          origin: [0.5, 0.5] as [number, number],
          // Seul le premier point porte la légende (nom/section/longueur) —
          // avec plusieurs points, la répéter sur chacun serait redondant
          // et chargerait visuellement le câble.
          data: {
            edgeId: e.id,
            index,
            label: index === 0 ? cableCaption(e.data) : undefined,
            labelLayoutKey: `${point.x}:${point.y}`,
            isLast: index === points.length - 1,
          },
          draggable: true,
          selectable: false,
          zIndex: 1001,
        }));
      }),
    [edges],
  );

  const reactFlowNodes = useMemo<Node[]>(
    () => [
      // En sélection multiple, les zones restent le fond visuel et ne
      // capturent plus le rectangle de sélection destiné aux composants.
      ...nodes.map((node) => {
        const selectionAdjustedNode = selectionMode && node.type === "zone" ? { ...node, selectable: false } : node;
        if (!isMobileViewport || (selectionAdjustedNode.type === "zone" && selectionAdjustedNode.data.locked)) {
          return selectionAdjustedNode;
        }
        return {
          ...selectionAdjustedNode,
          // `draggable: false` retire la classe `nopan` de React Flow: le
          // glisser sur un element non selectionne deplace donc le canvas.
          draggable: selectionAdjustedNode.id === selectedNodeId,
        };
      }),
      ...waypointNodes,
    ],
    [nodes, waypointNodes, selectionMode, isMobileViewport, selectedNodeId],
  );

  // Sépare les changements de position des nœuds de coude synthétiques (à
  // écrire dans `edge.data.bendPoints[index]`) des changements sur de vrais
  // nœuds du schéma (route normale du store) — un nœud de coude n'existe
  // jamais dans `state.nodes`, le laisser passer par `onNodesChange` du
  // store serait un no-op silencieux qui perdrait le déplacement. Groupé
  // par câble (plutôt qu'appliqué point par point) pour que plusieurs
  // points d'un même câble qui bougent dans le même lot de changements ne
  // s'écrasent pas l'un l'autre en repartant chacun de l'état d'avant lot.
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const waypointChangesByEdge = new Map<string, { index: number; position: { x: number; y: number }; trackHistory: boolean }[]>();
      const realChanges: NodeChange<Node>[] = [];
      for (const change of changes) {
        if ("id" in change && change.id.startsWith(WAYPOINT_ID_PREFIX)) {
          if (change.type === "position" && change.position) {
            const parsed = parseWaypointNodeId(change.id);
            if (parsed) {
              const list = waypointChangesByEdge.get(parsed.edgeId) ?? [];
              list.push({ index: parsed.index, position: change.position, trackHistory: change.dragging === false });
              waypointChangesByEdge.set(parsed.edgeId, list);
            }
          }
          continue;
        }
        realChanges.push(change);
      }
      for (const [edgeId, edgeChanges] of waypointChangesByEdge) {
        const edge = allEdges.find((e) => e.id === edgeId);
        const points = [...getBendPoints(edge?.data)];
        let trackHistory = false;
        for (const { index, position, trackHistory: t } of edgeChanges) {
          if (index >= 0 && index < points.length) points[index] = position;
          trackHistory = trackHistory || t;
        }
        updateEdgeData(edgeId, { bendPoints: points }, { trackHistory });
      }

      // Guide d'alignement magnétique : n'accroche que pendant un glisser
      // actif (`dragging: true`) d'un seul nœud à la fois — au dépôt
      // (`dragging: false`) ou hors glisser, le repère visuel disparaît.
      let activeGuides: { x: number | null; y: number | null } = { x: null, y: null };
      for (const change of realChanges) {
        if (change.type !== "position" || !change.position || !change.dragging) continue;
        const snap = snapToConnectedNeighbors(change.id, change.position, allNodes, allEdges);
        change.position = snap.position;
        if (snap.guides.x !== null || snap.guides.y !== null) activeGuides = snap.guides;
      }
      setAlignmentGuides(activeGuides);

      if (realChanges.length > 0) onNodesChange(realChanges as Parameters<typeof onNodesChange>[0]);
    },
    [onNodesChange, updateEdgeData, allEdges, allNodes, setAlignmentGuides],
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

      if (SPLICEABLE_COMPONENT_TYPES.has(type)) {
        const edgeId = edgeIdAtPoint(event.clientX, event.clientY);
        if (edgeId) {
          spliceNodeOnEdge(edgeId, type, position);
          setSpliceHoverEdgeId(null);
          return;
        }
      }
      setSpliceHoverEdgeId(null);
      addComponent(type, position, dataOverride);
    },
    [addComponent, addZone, spliceNodeOnEdge, screenToFlowPosition, setSpliceHoverEdgeId],
  );

  // Met le câble visuellement en évidence pendant le survol d'un glisser
  // spliceable (retour utilisateur : "insertion fluide" — le voir avant de
  // lâcher, pas seulement constater après coup que ça a marché). Le type
  // réel glissé n'est jamais lisible depuis `dataTransfer` avant le dépôt
  // (limite HTML5 drag-and-drop) — on lit `draggingComponentType`, posé par
  // ComponentLibrary au `dragstart`.
  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (!draggingComponentType || !SPLICEABLE_COMPONENT_TYPES.has(draggingComponentType)) return;
      setSpliceHoverEdgeId(edgeIdAtPoint(event.clientX, event.clientY));
    },
    [draggingComponentType, setSpliceHoverEdgeId],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent) => {
      // `relatedTarget` reste dans le conteneur canvas quand on survole
      // juste un enfant (nœud, câble…) — ne réinitialise le survol que
      // quand le curseur quitte vraiment le canvas.
      if (event.currentTarget.contains(event.relatedTarget as globalThis.Node | null)) return;
      setSpliceHoverEdgeId(null);
    },
    [setSpliceHoverEdgeId],
  );

  const handleReconnect = useCallback(
    (oldEdge: Edge<CableEdgeData>, newConnection: Connection) => {
      reconnectEdgeAction(oldEdge, newConnection);
    },
    [reconnectEdgeAction],
  );

  return (
    <div
      className={`relative h-full flex-1 ${darkMode ? "bg-neutral-950" : "bg-neutral-50"}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      // Retour utilisateur : "bloque le clic droit sur l'éditeur schéma" —
      // le menu contextuel natif du navigateur (copier l'image, etc.) n'a
      // aucune utilité ici et gêne plus qu'autre chose sur un canvas.
      onContextMenu={(e) => e.preventDefault()}
    >
      <WiringHintBanner />
      <ReactFlow
        nodes={reactFlowNodes}
        edges={renderedEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={handleReconnect}
        edgesReconnectable
        reconnectRadius={28}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // Les câbles électriques peuvent traverser tout le canvas. Le
        // filtrage des éléments hors viewport retirait temporairement une
        // extrémité et faisait disparaître ces longs câbles au panoramique.
        // On privilégie donc une lecture stable du schéma.
        onlyRenderVisibleElements={false}
        connectionMode={ConnectionMode.Loose}
        // Retour utilisateur : "même verrouillée, si on clique sur la zone
        // on ne peut pas déplacer un élément dedans, il faut cliquer à
        // l'extérieur puis sur l'item" — comportement par défaut de React
        // Flow (`elevateNodesOnSelect`) : sélectionner un nœud boost
        // temporairement son z-index par-dessus tout le reste, même si sa
        // zone est intentionnellement en arrière-plan (`zIndex: -1`, voir
        // addZone dans le store). Une zone cliquée passait donc devant les
        // composants qu'elle contient tant qu'elle restait sélectionnée,
        // interceptant leurs clics. Désactivé globalement : les zones
        // restent un vrai calque de fond, jamais devant un composant, que
        // ce soit sélectionné ou non.
        elevateNodesOnSelect={false}
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
        selectionOnDrag={selectionMode}
        // Le même geste ne peut pas déplacer le canvas et tracer une boîte
        // de sélection. Le bouton Sélection bascule donc explicitement de
        // l'un à l'autre, au lieu de laisser React Flow choisir selon le
        // navigateur ou la zone de départ du glisser.
        panOnDrag={!selectionMode}
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
        onMoveEnd={(_, viewport) => setCanvasZoom(viewport.zoom)}
        onNodeDragStart={() => setIsDraggingNode(true)}
        onNodeDragStop={() => setIsDraggingNode(false)}
        onNodeClick={(_, node) => {
          if (node.id.startsWith(WAYPOINT_ID_PREFIX)) return;
          select("node", node.id);
        }}
        onEdgeClick={(_, edge) => select("edge", edge.id)}
        // Retour utilisateur : "dérangeant de cliquer sur le i à chaque
        // fois" — un simple clic (ci-dessus) sélectionne ET ouvre le popup
        // de propriétés (voir `select()` dans useSchemaStore.ts), plus
        // besoin d'un double-clic dédié ni d'un bouton "i" séparé. Un clic
        // sur le fond du canvas désélectionne et referme le popup.
        onPaneClick={() => select(null, null)}
      >
        {showGrid ? (
          <>
            {/* Papier quadrillé: une maille fine pour placer les éléments,
                puis un repère majeur tous les 100 px pour lire l'espace. */}
            <Background id="schema-grid-minor" variant={BackgroundVariant.Lines} gap={10} size={1} color={darkMode ? "#26272d" : "#edf0f3"} />
            <Background id="schema-grid-major" variant={BackgroundVariant.Lines} gap={100} size={1.25} color={darkMode ? "#40424b" : "#d6dbe1"} />
          </>
        ) : null}
        <CableCrossingOverlay suspended={isDraggingNode} />
        <AlignmentGuideOverlay />
      </ReactFlow>

      <div
        className={`schema-mobile-canvas-controls pointer-events-auto absolute bottom-4 left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-1 rounded-[1.35rem] border p-2 shadow-xl backdrop-blur-md max-md:fixed max-md:bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] max-md:z-[60] max-md:gap-0 max-md:p-1.5 ${
          darkMode ? "border-neutral-700/90 bg-neutral-900/95 text-neutral-100" : "border-neutral-200/90 bg-white/95 text-neutral-800"
        }`}
        aria-label="Commandes du canvas"
      >
        <button
          type="button"
          onClick={toggleLeftPanel}
          className={`hidden h-10 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold max-md:flex ${
            darkMode
              ? "border-neutral-700 bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
              : "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
          }`}
          aria-label="Ouvrir les composants"
        >
          <span className="text-2xl leading-none" aria-hidden="true">＋</span>
          <span>Composants</span>
        </button>
        <span className={`hidden h-7 w-px max-md:block ${darkMode ? "bg-neutral-700" : "bg-neutral-200"}`} />
        <div className="flex items-center gap-1 pr-2 max-md:pr-1">
          <button type="button" onClick={undo} disabled={!canUndo} title="Annuler" aria-label="Annuler" className={canvasControlButtonClass}><CanvasIcon name="undo" /></button>
          <button type="button" onClick={redo} disabled={!canRedo} title="Rétablir" aria-label="Rétablir" className={canvasControlButtonClass}><CanvasIcon name="redo" /></button>
        </div>
        <span className={`h-7 w-px max-md:hidden ${darkMode ? "bg-neutral-700" : "bg-neutral-200"}`} />
        <button type="button" onClick={() => setZoom(canvasZoom - 0.1)} title="Réduire le zoom" aria-label="Réduire le zoom" className={`max-md:hidden ${canvasControlButtonClass}`}><CanvasIcon name="zoom-out" /></button>
        <div className={`flex h-9 items-center gap-2 rounded-full px-2 max-md:hidden ${darkMode ? "bg-neutral-800" : "bg-neutral-100"}`}>
          <input
            type="range"
            min="0.2"
            max="2"
            step="0.05"
            value={canvasZoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Niveau de zoom"
            className="h-1.5 w-20 cursor-pointer accent-amber-500 sm:w-28 max-md:hidden"
          />
          <span className="w-9 text-right text-xs font-semibold tabular-nums">{Math.round(canvasZoom * 100)}%</span>
        </div>
        <button type="button" onClick={() => setZoom(canvasZoom + 0.1)} title="Augmenter le zoom" aria-label="Augmenter le zoom" className={`max-md:hidden ${canvasControlButtonClass}`}><CanvasIcon name="zoom-in" /></button>
        <span className={`h-7 w-px max-md:hidden ${darkMode ? "bg-neutral-700" : "bg-neutral-200"}`} />
        <button type="button" onClick={frameCanvas} title="Cadrer tout le schéma" aria-label="Cadrer tout le schéma" className={canvasControlButtonClass}><CanvasIcon name="frame" /></button>
        <button
          type="button"
          onClick={() => setSelectionMode((current) => !current)}
          title="Sélection par zone"
          aria-label="Sélection par zone"
          aria-pressed={selectionMode}
          className={`max-md:hidden ${canvasControlButtonClass} ${selectionMode ? (darkMode ? "bg-amber-500 text-neutral-950" : "bg-amber-400 text-neutral-950") : ""}`}
        >
          <CanvasIcon name="selection" />
        </button>
        <span className={`hidden h-7 w-px max-md:block ${darkMode ? "bg-neutral-700" : "bg-neutral-200"}`} />
        <div className="hidden max-md:block">
          <SchemaIssuesWidget variant="canvas" />
        </div>
      </div>

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
