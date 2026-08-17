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
import { recalculateCableSections, recalculateFuseRatings, estimateConnectedAmps } from "@/lib/electrical-components/auto-size";
import { getEdgeDefaultPreset } from "@/lib/electrical-components/cable-lengths";
import { getBrandModelsForType } from "@/lib/electrical-components/brand-models";
import { getSchemaTemplate } from "@/features/schemas/templates";
import type { ElectricalNodeData, CableEdgeData, HandleKind, IconStyle } from "@/types/schema";

const ICON_STYLE_STORAGE_KEY = "fabsystem-schema:icon-style";
const DARK_MODE_STORAGE_KEY = "fabsystem-schema:dark-mode";
const LEFT_PANEL_COLLAPSED_KEY = "fabsystem-schema:left-panel-collapsed";
const RIGHT_PANEL_COLLAPSED_KEY = "fabsystem-schema:right-panel-collapsed";

// Retour v2.1 : le mode illustration ("pro") est plus vendeur/lisible pour
// un nouvel utilisateur que les symboles électriques. Devient le défaut pour
// qui n'a jamais choisi — un utilisateur qui a déjà explicitement basculé en
// "simple" garde son choix (stocké dans localStorage).
function loadIconStyle(): IconStyle {
  if (typeof window === "undefined") return "pro";
  const stored = window.localStorage.getItem(ICON_STYLE_STORAGE_KEY);
  return stored === "simple" ? "simple" : "pro";
}

// Retour utilisateur : "possibilité de passer en vue nuit car le blanc
// m'éclate les yeux dans le noir" — utile en usage réel (bateau/van de nuit).
function loadDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === "1";
}

// Bandeaux latéraux réductibles (V2, retour utilisateur) — plus d'espace
// canvas sur petit écran ou pour se concentrer sur le dessin. Préférence
// d'affichage pure, comme darkMode/iconStyle : pas un pas d'historique, pas
// dans le brouillon du schéma.
function loadPanelCollapsed(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "1";
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

export type SchemaSaveScope = "local" | "cloud";

export type SchemaSaveAssistantCode =
  | "LOCAL_STORAGE_UNAVAILABLE"
  | "AUTH_REQUIRED"
  | "ACCESS_DENIED"
  | "PROJECT_NOT_FOUND"
  | "SERVICE_UNAVAILABLE"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "BAD_REQUEST"
  | "NETWORK"
  | "UNKNOWN";

export interface SchemaSaveAssistant {
  code: SchemaSaveAssistantCode;
  title: string;
  message: string;
  retryAfterSeconds?: number | null;
}

const HANDLE_COLORS: Record<HandleKind, string> = {
  positive: "#dc2626",
  negative: "#111827",
  neutral: "#6b7280",
  earth: "#84cc16",
};

// Palette des zones (retour utilisateur : "zone MPPT solaire, zone 230V…")
// — couleurs distinctes de celles déjà utilisées pour les câbles
// (lib/electrical-components/cable-types.ts), pour ne jamais laisser croire
// qu'une couleur de zone a une signification électrique. Chaque nouvelle
// zone prend la suivante dans l'ordre, cycliquement.
export const ZONE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];

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
  saveScope: SchemaSaveScope;
  saveMessage: string;
  saveAssistant: SchemaSaveAssistant | null;
  hydrated: boolean;
  iconStyle: IconStyle;
  darkMode: boolean;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  // Filtre d'affichage (retour utilisateur : "isoler le circuit MPPT ou
  // consommateur pour éviter d'avoir toujours tout le schéma") — catégories
  // volontairement masquées du canvas ; vide = tout affiché. Vue seulement,
  // ne modifie jamais les données du schéma (pas de pas d'historique).
  hiddenCategories: string[];
  // Isolement export par zone (retour utilisateur : "isoler uniquement la
  // zone pour les imprimer, beaucoup plus intelligent que par famille") —
  // même principe que `hiddenCategories` : purement un filtre d'affichage
  // consommé par Canvas.tsx, jamais un pas d'historique. Posé juste avant
  // une capture d'export (ExportMenu.tsx) le temps que React Flow ne rende
  // plus que le contenu de la zone choisie, puis remis à `null` juste
  // après — sans quoi la capture (qui lit le DOM réel du canvas, pas
  // seulement les tableaux nodes/edges) continuerait d'inclure les
  // composants voisins simplement parce qu'ils sont encore affichés.
  exportIsolatedZoneId: string | null;
  // Project client lié (retour utilisateur : "il manque enregistrer lié au
  // compte client") — null = brouillon local uniquement (comportement par
  // défaut, sans compte). Non persisté dans le schéma lui-même : c'est un
  // lien de sauvegarde, pas une donnée du dessin.
  projectId: string | null;
  // V2, retour utilisateur : "à chaque ajout d'élément comme batterie,
  // MPPT, DC-DC, Multiplus... ouvrir un pop up pour choisir le modèle avec
  // puissance" — posé par `addComponent` juste après la création d'un nœud
  // d'un type qui a des modèles de marque catalogués (voir
  // lib/electrical-components/brand-models.ts), consommé par
  // ModelPickerModal. `null` = aucune popup à afficher.
  pendingModelPickerNodeId: string | null;
  // V2, retour utilisateur : "pour l'ajout de fusible ou câble, je veux la
  // section et ampérage... automatique quand celui est connecté et ouvre le
  // pop up pour modifier". Posé par `onConnect` quand la nouvelle connexion
  // permet un calcul (consommateur de puissance connue à proximité) —
  // sinon reste `null`, pas de popup vide.
  pendingSizingTarget: { kind: "cable"; edgeId: string } | { kind: "fuse"; nodeId: string } | null;
  // Mode guidé pas à pas (retour utilisateur : "capable de faire un schéma
  // basique... en mode guidé étape par étape") — préférence d'affichage pure
  // comme darkMode/iconStyle : pas un pas d'historique, pas persistée dans
  // le brouillon. Consommée par GuidedTutorial.tsx et ComponentLibrary.tsx
  // (mise en évidence du composant à ajouter) via lib/schema-editor/useGuidedStep.
  guidedMode: boolean;
  // Index explicite plutôt que dérivé de `isComplete` : les étapes
  // "explain" (intro/conclusion) n'ont pas d'action à détecter dans le
  // schéma, elles n'avancent que via le bouton "Suivant" de
  // GuidedTutorial.tsx. Les étapes "task" avancent automatiquement (voir
  // l'effet qui appelle `advanceGuidedStep` dans ce composant).
  guidedStepIndex: number;

  setProjectName: (name: string) => void;
  setProjectId: (id: string | null) => void;
  setIconStyle: (style: IconStyle) => void;
  setDarkMode: (value: boolean) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleCategoryVisibility: (category: string) => void;
  showAllCategories: () => void;
  setExportIsolatedZoneId: (id: string | null) => void;
  onNodesChange: (changes: NodeChange<SchemaNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<SchemaEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addComponent: (type: string, position: { x: number; y: number }, dataOverride?: Record<string, unknown>) => void;
  /** Zone colorée (retour utilisateur : "possible de créer des carrés de
   * couleur pour créer des zones de schéma") — un nœud comme un autre
   * (`data.componentType: "zone"`), volontairement hors du catalogue
   * `COMPONENT_DEFINITIONS` : pas un vrai composant électrique, juste un
   * regroupement visuel dans lequel l'utilisateur glisse des composants à
   * la main (pas de logique de rattachement automatique). */
  addZone: (position: { x: number; y: number }) => void;
  updateNodeData: (id: string, patch: Record<string, unknown>, options?: { trackHistory?: boolean }) => void;
  updateEdgeData: (id: string, patch: Record<string, unknown>, options?: { trackHistory?: boolean }) => void;
  setOutputCount: (id: string, count: number) => void;
  reconnectEdge: (oldEdge: SchemaEdge, newConnection: Connection) => void;
  spliceNodeOnEdge: (edgeId: string, type: string, position: { x: number; y: number }) => void;
  duplicateNode: (id: string) => void;
  rotateNode: (id: string) => void;
  autoLayout: () => void;
  /** Recalcule la section de tous les câbles éligibles ; renvoie le nombre modifié. */
  recalculateAllCableSections: () => number;
  /** Recalcule le calibre de tous les fusibles/disjoncteurs éligibles ; renvoie le nombre modifié. */
  recalculateAllFuseRatings: () => number;
  deleteSelected: () => void;
  select: (kind: "node" | "edge" | null, id: string | null) => void;
  undo: () => void;
  redo: () => void;
  newProject: () => void;
  loadTemplate: (id: string) => void;
  setSaveStatus: (
    status: "saved" | "saving" | "error",
    options?: { scope?: SchemaSaveScope; message?: string }
  ) => void;
  setSaveAssistant: (assistant: SchemaSaveAssistant | null) => void;
  hydrate: (snapshot: { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] }) => void;
  dismissModelPicker: () => void;
  dismissSizingPopup: () => void;
  startGuidedMode: () => void;
  exitGuidedMode: () => void;
  advanceGuidedStep: () => void;
  retreatGuidedStep: () => void;
}

// Historique undo/redo par snapshots (docs/schema/CDC_FabSystem_Schema_V1.md
// §29) : granularité volontairement grossière pour cette première ébauche —
// un pas d'historique par ajout, suppression, connexion, réglage dans les
// panneaux ou fin de déplacement significatif. Les déplacements
// intermédiaires des points de câble restent exclus de l'historique pour ne
// pas polluer l'undo pendant le glisser.
function commit(state: SchemaState): Pick<SchemaState, "past" | "future"> {
  return {
    past: [...state.past, cloneSnapshot(state.nodes, state.edges)].slice(-50),
    future: [],
  };
}

function defaultSaveMessage(status: SchemaState["saveStatus"], scope: SchemaSaveScope) {
  if (status === "saving") {
    return scope === "cloud" ? "Enregistrement cloud…" : "Enregistrement local…";
  }
  if (status === "error") {
    return scope === "cloud" ? "Erreur de sauvegarde cloud" : "Erreur de brouillon local";
  }
  return scope === "cloud" ? "Cloud enregistré" : "Brouillon local enregistré";
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
  saveScope: "local",
  saveMessage: "Brouillon local prêt",
  saveAssistant: null,
  hydrated: false,
  iconStyle: loadIconStyle(),
  darkMode: loadDarkMode(),
  leftPanelCollapsed: loadPanelCollapsed(LEFT_PANEL_COLLAPSED_KEY),
  rightPanelCollapsed: loadPanelCollapsed(RIGHT_PANEL_COLLAPSED_KEY),
  hiddenCategories: [],
  exportIsolatedZoneId: null,
  projectId: null,
  pendingModelPickerNodeId: null,
  pendingSizingTarget: null,
  guidedMode: false,
  guidedStepIndex: 0,

  setProjectName: (name) => set({ projectName: name }),
  setProjectId: (id) => set({ projectId: id }),

  toggleCategoryVisibility: (category) =>
    set((state) => ({
      hiddenCategories: state.hiddenCategories.includes(category)
        ? state.hiddenCategories.filter((c) => c !== category)
        : [...state.hiddenCategories, category],
    })),

  showAllCategories: () => set({ hiddenCategories: [] }),

  setExportIsolatedZoneId: (id) => set({ exportIsolatedZoneId: id }),

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

  toggleLeftPanel: () =>
    set((state) => {
      const next = !state.leftPanelCollapsed;
      if (typeof window !== "undefined") window.localStorage.setItem(LEFT_PANEL_COLLAPSED_KEY, next ? "1" : "0");
      return { leftPanelCollapsed: next };
    }),

  toggleRightPanel: () =>
    set((state) => {
      const next = !state.rightPanelCollapsed;
      if (typeof window !== "undefined") window.localStorage.setItem(RIGHT_PANEL_COLLAPSED_KEY, next ? "1" : "0");
      return { rightPanelCollapsed: next };
    }),

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
      const targetNode = state.nodes.find((n) => n.id === connection.target);
      const defaultPreset = getEdgeDefaultPreset(sourceNode?.data.componentType, targetNode?.data.componentType, cableType);

      const edge: SchemaEdge = {
        id: nextId("edge"),
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: connection.target,
        targetHandle: connection.targetHandle,
        type: "cable",
        data: { color, cableType, ...defaultPreset },
      };

      // Popup de dimensionnement (V2, retour utilisateur) — pour le câble :
      // systématique sur tout câble de puissance (+ ou −), qu'un ampérage
      // soit devinable ou non (retour utilisateur explicite : le popup ne
      // s'affichait que si un consommateur de puissance connue était
      // directement atteignable — pas assez de cas couverts, "je pense le
      // plus simple c'est de l'activer pour tous les câbles puissance
      // positif et négatif" ; l'intensité reste modifiable à la main dans
      // le popup si elle n'a pas pu être estimée). Le calibre de
      // fusible/disjoncteur reste conditionné à une estimation réussie —
      // non concerné par cette demande.
      let pendingSizingTarget: SchemaState["pendingSizingTarget"] = null;
      if (cableType === "power-positive" || cableType === "power-negative") {
        pendingSizingTarget = { kind: "cable", edgeId: edge.id };
      }
      if (!pendingSizingTarget) {
        const nextEdges = [...state.edges, edge];
        const FUSE_TYPES = new Set(["fuse", "circuit-breaker"]);
        if (sourceNode && FUSE_TYPES.has(sourceNode.data.componentType) && estimateConnectedAmps(sourceNode.id, state.nodes, nextEdges) !== null) {
          pendingSizingTarget = { kind: "fuse", nodeId: sourceNode.id };
        } else if (targetNode && FUSE_TYPES.has(targetNode.data.componentType) && estimateConnectedAmps(targetNode.id, state.nodes, nextEdges) !== null) {
          pendingSizingTarget = { kind: "fuse", nodeId: targetNode.id };
        }
      }

      return {
        edges: [...state.edges, edge],
        pendingSizingTarget,
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
      // Popup de choix de marque/modèle (V2, retour utilisateur) : seulement
      // pour les types réellement catalogués (voir brand-models.ts) — pas de
      // popup vide pour un fusible ou un interrupteur. Désactivée en mode
      // guidé (retour utilisateur : "automatiser les choix... de la
      // batterie") : le tutoriel porte sur le câblage, pas sur le choix
      // d'une marque — reste générique, modifiable ensuite normalement.
      const hasBrandModels = !state.guidedMode && getBrandModelsForType(type).length > 0;
      return {
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        selectedEdgeId: null,
        pendingModelPickerNodeId: hasBrandModels ? node.id : null,
        ...commit(state),
      };
    }),

  addZone: (position) =>
    set((state) => {
      const node: SchemaNode = {
        id: nextId("zone"),
        type: "zone",
        position,
        // Toujours en arrière-plan (retour utilisateur implicite : une zone
        // sert à regrouper visuellement des composants qu'on glisse
        // "dedans", elle ne doit jamais passer par-dessus eux ni intercepter
        // leurs clics).
        zIndex: -1,
        width: 380,
        height: 260,
        data: { componentType: "zone", label: "Zone", color: ZONE_COLORS[state.nodes.filter((n) => n.type === "zone").length % ZONE_COLORS.length] },
      };
      return {
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        selectedEdgeId: null,
        ...commit(state),
      };
    }),

  dismissModelPicker: () => set({ pendingModelPickerNodeId: null }),
  dismissSizingPopup: () => set({ pendingSizingTarget: null }),

  updateNodeData: (id, patch, options) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      ...(options?.trackHistory === false ? null : commit(state)),
    })),

  updateEdgeData: (id, patch, options) =>
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...patch } } : e)),
      ...(options?.trackHistory === false ? null : commit(state)),
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

  recalculateAllCableSections: () => {
    let updatedCount = 0;
    set((state) => {
      const result = recalculateCableSections(state.nodes, state.edges);
      updatedCount = result.updatedCount;
      if (updatedCount === 0) return {};
      return { edges: result.edges, ...commit(state) };
    });
    return updatedCount;
  },

  recalculateAllFuseRatings: () => {
    let updatedCount = 0;
    set((state) => {
      const result = recalculateFuseRatings(state.nodes, state.edges);
      updatedCount = result.updatedCount;
      if (updatedCount === 0) return {};
      return { nodes: result.nodes, ...commit(state) };
    });
    return updatedCount;
  },

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
      saveStatus: "saved",
      saveScope: "local",
      saveMessage: "Brouillon local prêt",
      saveAssistant: null,
      guidedMode: false,
      guidedStepIndex: 0,
    }),

  loadTemplate: (id) => {
    const template = getSchemaTemplate(id);
    if (!template) return;
    const { projectName, nodes, edges } = template.build();
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
      saveStatus: "saved",
      saveScope: "local",
      saveMessage: "Brouillon local prêt",
      saveAssistant: null,
      guidedMode: false,
      guidedStepIndex: 0,
    });
  },

  setSaveStatus: (status, options) =>
    set((state) => {
      const scope = options?.scope ?? state.saveScope;
      return {
        saveStatus: status,
        saveScope: scope,
        saveMessage: options?.message ?? defaultSaveMessage(status, scope),
      };
    }),

  setSaveAssistant: (assistant) => set({ saveAssistant: assistant }),

  hydrate: (snapshot) =>
    set({
      projectName: snapshot.projectName,
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      past: [],
      future: [],
      saveStatus: "saved",
      saveScope: "local",
      saveMessage: "Brouillon local prêt",
      saveAssistant: null,
      hydrated: true,
      hiddenCategories: [],
      guidedMode: false,
      guidedStepIndex: 0,
    }),

  // Mode guidé pas à pas (retour utilisateur) — repart toujours d'un canvas
  // vierge : les étapes de lib/schema-editor/guided-tutorial.ts supposent un
  // schéma vide au démarrage (elles cherchent "la" batterie, "le" busbar…).
  startGuidedMode: () =>
    set({
      projectName: "Mode guidé — appareils de base",
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      past: [],
      future: [],
      hydrated: true,
      hiddenCategories: [],
      projectId: null,
      saveStatus: "saved",
      saveScope: "local",
      saveMessage: "Brouillon local prêt",
      saveAssistant: null,
      guidedMode: true,
      guidedStepIndex: 0,
    }),

  // Quitter n'efface rien : le schéma construit pendant le mode guidé reste
  // utilisable normalement ensuite (pas une session jetable).
  exitGuidedMode: () => set({ guidedMode: false }),

  advanceGuidedStep: () => set((state) => ({ guidedStepIndex: state.guidedStepIndex + 1 })),

  // Retour utilisateur : "un retour aux étapes précédentes" — pour relire
  // une explication ou refaire une connexion sans tout recommencer. Ne
  // supprime rien du schéma déjà construit, se contente de rouvrir
  // l'instruction précédente.
  retreatGuidedStep: () => set((state) => ({ guidedStepIndex: Math.max(0, state.guidedStepIndex - 1) })),
}));

export function selectComponentDefinition(node: SchemaNode) {
  return getComponentDefinition(node.data.componentType);
}
