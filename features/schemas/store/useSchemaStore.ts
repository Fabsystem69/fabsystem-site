import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  reconnectEdge as applyReconnectEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import { getComponentDefinition, getEffectiveHandles, MIN_OUTPUTS, MAX_OUTPUTS } from "@/lib/electrical-components/definitions";
import { autoLayoutNodes } from "@/lib/electrical-components/auto-layout";
import { buildExampleSchema } from "@/features/schemas/example";
import type { ElectricalNodeData, CableEdgeData, HandleKind, IconStyle } from "@/types/schema";

const ICON_STYLE_STORAGE_KEY = "fabsystem-schema:icon-style";
const DARK_MODE_STORAGE_KEY = "fabsystem-schema:dark-mode";

function loadIconStyle(): IconStyle {
  if (typeof window === "undefined") return "simple";
  const stored = window.localStorage.getItem(ICON_STYLE_STORAGE_KEY);
  return stored === "pro" ? "pro" : "simple";
}

// Retour utilisateur : "possibilité de passer en vue nuit car le blanc
// m'éclate les yeux dans le noir" — utile en usage réel (bateau/van de nuit).
function loadDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === "1";
}

const DEFAULT_CABLE_TYPE_BY_KIND: Record<HandleKind, string> = {
  positive: "power-positive",
  negative: "power-negative",
  neutral: "other",
  earth: "earth",
};

export type SchemaNode = Node<ElectricalNodeData>;
export type SchemaEdge = Edge<CableEdgeData>;

interface Snapshot {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}

const HANDLE_COLORS: Record<HandleKind, string> = {
  positive: "#dc2626",
  negative: "#111827",
  neutral: "#6b7280",
  earth: "#84cc16",
};

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

function cloneSnapshot(nodes: SchemaNode[], edges: SchemaEdge[]): Snapshot {
  return { nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })), edges: edges.map((e) => ({ ...e, data: { ...e.data } })) };
}

interface SchemaState {
  projectName: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  saveStatus: "saved" | "saving" | "error";
  hydrated: boolean;
  iconStyle: IconStyle;
  darkMode: boolean;
  // Filtre d'affichage (retour utilisateur : "isoler le circuit MPPT ou
  // consommateur pour éviter d'avoir toujours tout le schéma") — catégories
  // volontairement masquées du canvas ; vide = tout affiché. Vue seulement,
  // ne modifie jamais les données du schéma (pas de pas d'historique).
  hiddenCategories: string[];
  // Project client lié (retour utilisateur : "il manque enregistrer lié au
  // compte client") — null = brouillon local uniquement (comportement par
  // défaut, sans compte). Non persisté dans le schéma lui-même : c'est un
  // lien de sauvegarde, pas une donnée du dessin.
  projectId: string | null;

  setProjectName: (name: string) => void;
  setProjectId: (id: string | null) => void;
  setIconStyle: (style: IconStyle) => void;
  setDarkMode: (value: boolean) => void;
  toggleCategoryVisibility: (category: string) => void;
  showAllCategories: () => void;
  onNodesChange: (changes: NodeChange<SchemaNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<SchemaEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addComponent: (type: string, position: { x: number; y: number }, dataOverride?: Record<string, unknown>) => void;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  updateEdgeData: (id: string, patch: Record<string, unknown>) => void;
  setOutputCount: (id: string, count: number) => void;
  reconnectEdge: (oldEdge: SchemaEdge, newConnection: Connection) => void;
  spliceNodeOnEdge: (edgeId: string, type: string, position: { x: number; y: number }) => void;
  duplicateNode: (id: string) => void;
  rotateNode: (id: string) => void;
  autoLayout: () => void;
  deleteSelected: () => void;
  select: (kind: "node" | "edge" | null, id: string | null) => void;
  undo: () => void;
  redo: () => void;
  newProject: () => void;
  loadExample: () => void;
  setSaveStatus: (status: "saved" | "saving" | "error") => void;
  hydrate: (snapshot: { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] }) => void;
}

// Historique undo/redo par snapshots (docs/schema/CDC_FabSystem_Schema_V1.md
// §29) : granularité volontairement grossière pour cette première ébauche —
// un pas d'historique par ajout, suppression, connexion ou fin de
// déplacement. Les modifications de propriétés dans le panneau ne créent pas
// encore de pas d'historique dédié (limitation connue, à affiner plus tard).
function commit(state: SchemaState): Pick<SchemaState, "past" | "future"> {
  return {
    past: [...state.past, cloneSnapshot(state.nodes, state.edges)].slice(-50),
    future: [],
  };
}

export const useSchemaStore = create<SchemaState>((set) => ({
  projectName: "Nouveau schéma",
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  past: [],
  future: [],
  saveStatus: "saved",
  hydrated: false,
  iconStyle: loadIconStyle(),
  darkMode: loadDarkMode(),
  hiddenCategories: [],
  projectId: null,

  setProjectName: (name) => set({ projectName: name }),
  setProjectId: (id) => set({ projectId: id }),

  toggleCategoryVisibility: (category) =>
    set((state) => ({
      hiddenCategories: state.hiddenCategories.includes(category)
        ? state.hiddenCategories.filter((c) => c !== category)
        : [...state.hiddenCategories, category],
    })),

  showAllCategories: () => set({ hiddenCategories: [] }),

  // Préférence d'affichage indépendante du schéma (pas un pas d'historique,
  // pas sauvegardée dans le brouillon) — retour utilisateur : "avoir les
  // deux choix d'icône soit débutant soit pro".
  setIconStyle: (style) => {
    if (typeof window !== "undefined") window.localStorage.setItem(ICON_STYLE_STORAGE_KEY, style);
    set({ iconStyle: style });
  },

  setDarkMode: (value) => {
    if (typeof window !== "undefined") window.localStorage.setItem(DARK_MODE_STORAGE_KEY, value ? "1" : "0");
    set({ darkMode: value });
  },

  onNodesChange: (changes) =>
    set((state) => {
      const removed = changes.some((c) => c.type === "remove");
      const dragEnd = changes.some((c) => c.type === "position" && c.dragging === false);
      const nodes = applyNodeChanges(changes, state.nodes);
      return {
        nodes,
        ...(removed || dragEnd ? commit(state) : null),
      };
    }),

  onEdgesChange: (changes) =>
    set((state) => {
      const removed = changes.some((c) => c.type === "remove");
      const edges = applyEdgeChanges(changes, state.edges);
      return {
        edges,
        ...(removed ? commit(state) : null),
      };
    }),

  onConnect: (connection) =>
    set((state) => {
      if (!connection.source || !connection.target) return {};
      const sourceNode = state.nodes.find((n) => n.id === connection.source);
      const def = sourceNode ? getComponentDefinition(sourceNode.data.componentType) : undefined;
      const handleDef = def && sourceNode ? getEffectiveHandles(def, sourceNode.data).find((h) => h.id === connection.sourceHandle) : undefined;
      const kind = handleDef && def ? (def.resolveHandleKind ? def.resolveHandleKind(sourceNode!.data, handleDef) : handleDef.kind) : undefined;
      const color = kind ? HANDLE_COLORS[kind] : HANDLE_COLORS.neutral;
      const cableType = kind ? DEFAULT_CABLE_TYPE_BY_KIND[kind] : "other";

      const edge: SchemaEdge = {
        id: nextId("edge"),
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: connection.target,
        targetHandle: connection.targetHandle,
        type: "cable",
        data: { color, cableType },
      };

      return {
        edges: [...state.edges, edge],
        ...commit(state),
      };
    }),

  addComponent: (type, position, dataOverride) =>
    set((state) => {
      const def = getComponentDefinition(type);
      if (!def) return {};
      const node: SchemaNode = {
        id: nextId(type),
        type: "electrical",
        position,
        data: { componentType: type, label: def.label, ...def.defaultData, ...dataOverride },
      };
      return {
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        selectedEdgeId: null,
        ...commit(state),
      };
    }),

  updateNodeData: (id, patch) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    })),

  updateEdgeData: (id, patch) =>
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...patch } } : e)),
    })),

  // Nombre de sorties d'un busbar/tableau de distribution/platine de
  // fusibles (retour utilisateur : "rajouter des points de sortie") — action
  // dédiée plutôt que updateNodeData car réduire ce nombre doit aussi
  // retirer les câbles reliés aux sorties qui disparaissent, pour ne pas
  // laisser un câble pointer vers une borne qui n'existe plus.
  setOutputCount: (id, count) =>
    set((state) => {
      const node = state.nodes.find((n) => n.id === id);
      const def = node ? getComponentDefinition(node.data.componentType) : undefined;
      if (!node || !def?.getHandles) return {};
      const clamped = Math.max(MIN_OUTPUTS, Math.min(MAX_OUTPUTS, Math.round(count) || MIN_OUTPUTS));
      const newHandleIds = new Set(def.getHandles({ ...node.data, outputCount: clamped }).map((h) => h.id));
      const nodes = state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, outputCount: clamped } } : n));
      const edges = state.edges.filter((e) => {
        if (e.source === id && e.sourceHandle && !newHandleIds.has(e.sourceHandle)) return false;
        if (e.target === id && e.targetHandle && !newHandleIds.has(e.targetHandle)) return false;
        return true;
      });
      return { nodes, edges, ...commit(state) };
    }),

  // Retour utilisateur : "la possibilité de déplacer les câbles librement"
  // — glisser l'extrémité d'un câble existant vers une autre borne au lieu
  // d'être obligé de le supprimer puis d'en retracer un nouveau.
  reconnectEdge: (oldEdge, newConnection) =>
    set((state) => ({
      edges: applyReconnectEdge(oldEdge, newConnection, state.edges),
      ...commit(state),
    })),

  // Retour utilisateur : "si on ajoute un élément sur un câble celui-ci se
  // connecte automatiquement" — dépose d'un fusible/interrupteur/busbar
  // directement sur un câble existant : le câble d'origine est coupé en
  // deux et le nouveau composant s'intercale, plutôt que de rester posé
  // par-dessus sans lien.
  spliceNodeOnEdge: (edgeId, type, position) =>
    set((state) => {
      const edge = state.edges.find((e) => e.id === edgeId);
      const def = getComponentDefinition(type);
      if (!edge || !def) return {};
      const handles = getEffectiveHandles(def, def.defaultData);
      const inputHandle = handles.find((h) => h.id === "input") ?? handles[0];
      const outputHandle =
        type === "busbar" || type === "distribution-panel" || type === "fuse-block"
          ? (handles.find((h) => h.id === "out-1") ?? handles[1])
          : (handles.find((h) => h.id === "output") ?? handles[1]);
      if (!inputHandle || !outputHandle) return {};

      const node: SchemaNode = {
        id: nextId(type),
        type: "electrical",
        position,
        data: { componentType: type, label: def.label, ...def.defaultData },
      };
      const edgeA: SchemaEdge = {
        id: nextId("edge"),
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: node.id,
        targetHandle: inputHandle.id,
        type: "cable",
        data: { ...edge.data },
      };
      const edgeB: SchemaEdge = {
        id: nextId("edge"),
        source: node.id,
        sourceHandle: outputHandle.id,
        target: edge.target,
        targetHandle: edge.targetHandle,
        type: "cable",
        data: { ...edge.data },
      };
      return {
        nodes: [...state.nodes, node],
        edges: [...state.edges.filter((e) => e.id !== edgeId), edgeA, edgeB],
        selectedNodeId: node.id,
        selectedEdgeId: null,
        ...commit(state),
      };
    }),

  // Auto-agencement (retour utilisateur : export "trop petit et illisible")
  // — recalcule toutes les positions en un bloc compact, sans toucher aux
  // connexions ni aux données des composants.
  autoLayout: () =>
    set((state) => {
      if (state.nodes.length === 0) return {};
      return { nodes: autoLayoutNodes(state.nodes, state.edges), ...commit(state) };
    }),

  rotateNode: (id) =>
    set((state) => {
      const nodes = state.nodes.map((n) => {
        if (n.id !== id) return n;
        const current = (Number(n.data.rotation) || 0) % 360;
        return { ...n, data: { ...n.data, rotation: (current + 90) % 360 } };
      });
      return { nodes, ...commit(state) };
    }),

  duplicateNode: (id) =>
    set((state) => {
      const original = state.nodes.find((n) => n.id === id);
      if (!original) return {};
      const node: SchemaNode = {
        ...original,
        id: nextId(original.data.componentType),
        position: { x: original.position.x + 32, y: original.position.y + 32 },
        selected: false,
        data: { ...original.data },
      };
      return {
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        selectedEdgeId: null,
        ...commit(state),
      };
    }),

  deleteSelected: () =>
    set((state) => {
      const { selectedNodeId, selectedEdgeId } = state;
      if (!selectedNodeId && !selectedEdgeId) return {};
      const nodes = selectedNodeId ? state.nodes.filter((n) => n.id !== selectedNodeId) : state.nodes;
      const edges = selectedEdgeId
        ? state.edges.filter((e) => e.id !== selectedEdgeId)
        : state.edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
      return {
        nodes,
        edges,
        selectedNodeId: null,
        selectedEdgeId: null,
        ...commit(state),
      };
    }),

  select: (kind, id) =>
    set({
      selectedNodeId: kind === "node" ? id : null,
      selectedEdgeId: kind === "edge" ? id : null,
    }),

  undo: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return {};
      return {
        nodes: previous.nodes,
        edges: previous.edges,
        past: state.past.slice(0, -1),
        future: [cloneSnapshot(state.nodes, state.edges), ...state.future].slice(0, 50),
        selectedNodeId: null,
        selectedEdgeId: null,
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return {};
      return {
        nodes: next.nodes,
        edges: next.edges,
        future: state.future.slice(1),
        past: [...state.past, cloneSnapshot(state.nodes, state.edges)].slice(-50),
        selectedNodeId: null,
        selectedEdgeId: null,
      };
    }),

  newProject: () =>
    set({
      projectName: "Nouveau schéma",
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      past: [],
      future: [],
      hiddenCategories: [],
      // Repartir de zéro délie le projet client — sinon la prochaine
      // sauvegarde automatique écraserait son schéma avec une page vierge.
      projectId: null,
    }),

  loadExample: () => {
    const { projectName, nodes, edges } = buildExampleSchema();
    set({
      projectName,
      nodes,
      edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      past: [],
      future: [],
      hiddenCategories: [],
      // Même raison que newProject : ne jamais laisser l'exemple écraser
      // le schéma sauvegardé d'un projet client.
      projectId: null,
    });
  },

  setSaveStatus: (status) => set({ saveStatus: status }),

  hydrate: (snapshot) =>
    set({
      projectName: snapshot.projectName,
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      past: [],
      future: [],
      hydrated: true,
      hiddenCategories: [],
    }),
}));

export function selectComponentDefinition(node: SchemaNode) {
  return getComponentDefinition(node.data.componentType);
}
