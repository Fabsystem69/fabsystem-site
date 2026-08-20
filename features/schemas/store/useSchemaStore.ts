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
import { recalculateCableSections, recalculateFuseRatings, estimateConnectedAmps, formatSectionLabel } from "@/lib/electrical-components/auto-size";
import { calcSection } from "@/lib/calc/section-cable";
import { getEdgeDefaultPreset } from "@/lib/electrical-components/cable-lengths";
import { getBrandModelsForType, getBrandModel } from "@/lib/electrical-components/brand-models";
import { getSchemaTemplate } from "@/features/schemas/templates";
import { getBendPoints } from "@/lib/schema-editor/cable-bend-points";
import { computeAutoLayout } from "@/lib/schema-editor/auto-layout";
import type { SolarInstallPlan } from "@/lib/schema-editor/guided-install/solar";
import type { CustomCatalogItem } from "@/features/schemas/customCatalogApi";
import type { ElectricalNodeData, CableEdgeData, HandleKind, IconStyle } from "@/types/schema";

const ICON_STYLE_STORAGE_KEY = "fabsystem-schema:icon-style";
const DARK_MODE_STORAGE_KEY = "fabsystem-schema:dark-mode";
const LEFT_PANEL_COLLAPSED_KEY = "fabsystem-schema:left-panel-collapsed";

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
// Retour utilisateur : "laisser réduit le bandeau gauche mais pas le
// supprimer non plus" — depuis l'ajout de l'onglet "Ajouter" du ruban (voie
// principale pour poser un composant), le panneau gauche démarre replié par
// défaut ; quiconque l'a déjà explicitement rouvert/refermé garde son choix
// (valeur "0"/"1" en localStorage), seule l'absence de préférence bascule.
function loadPanelCollapsed(key: string): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(key);
  return stored === null ? true : stored === "1";
}

// v2.1 : palier gratuit — 3 composants "consommateurs" (category === "consumers"
// dans lib/electrical-components/definitions.ts, pas seulement type ===
// "consumer" : couvre aussi bilge-pump, socket-220v) au-delà de ce qui est
// déjà présent au chargement (voir consumerBaseline). Contournable seulement
// par hasUnlimitedConsumers (achat unitaire ou code promo, statut serveur
// injecté via setHasUnlimitedConsumers).
export const FREE_CONSUMER_LIMIT = 3;

function countConsumerNodes(nodes: SchemaNode[]) {
  return nodes.filter((n) => getComponentDefinition(n.data.componentType)?.category === "consumers")
    .length;
}

function isConsumerType(type: string) {
  return getComponentDefinition(type)?.category === "consumers";
}

// Retour bêta : "j'ai mis 2 batteries (en quantité)... pas demandé si elles
// étaient en série ou en parallèle" — dès qu'une 2e batterie apparaît sur un
// schéma qui n'en avait qu'une, on propose de les relier (l'utilisateur peut
// toujours ignorer). Volontairement limité au cas "exactement 2 batteries" :
// au-delà, deviner quelle paire relier serait plus souvent faux que juste
// (ex. batterie moteur + batterie auxiliaire, systèmes déjà distincts).
function findSoleOtherBattery(nodeId: string, nodes: SchemaNode[]): string | null {
  const others = nodes.filter((n) => n.id !== nodeId && n.data.componentType === "battery");
  return others.length === 1 ? others[0].id : null;
}

// Retour utilisateur : "j'ai trouvé une incohérence pour les BMV, c'est
// l'écran d'affichage qui montrait, mais dans un kit BMV il y a le shunt +
// affichage... crée une fonction : quand on ajoute un BMV, l'écran et le
// shunt s'ajoutent sur le canvas" — un vrai kit BMV-700/702/712 est vendu
// avec son écran filaire dédié, contrairement au SmartShunt (Bluetooth
// seul, pas d'écran physique) volontairement exclu de cette liste.
const BMV_DISPLAY_SHUNT_IDS = new Set(["victron-bmv-700", "victron-bmv-702", "victron-bmv-712"]);

// Modèle d'écran à appliquer automatiquement à l'écran jumeau (retour
// utilisateur : les vraies photos d'écran, déplacées depuis les entrées
// "shunt" vers ces entrées "system-monitor" dédiées) — sans ça, l'écran créé
// afficherait une icône générique au lieu de la vraie photo du kit BMV.
const BMV_DISPLAY_MODEL_BY_SHUNT_ID: Record<string, string> = {
  "victron-bmv-700": "victron-bmv-700-display",
  "victron-bmv-702": "victron-bmv-702-display",
  "victron-bmv-712": "victron-bmv-712-display",
};

// Construit l'écran de contrôle jumeau + le câble VE.Direct qui le relie au
// shunt — jamais si ce shunt a déjà un écran relié (évite d'en empiler un
// second si l'utilisateur choisit/rechoisit un modèle BMV plusieurs fois).
function buildPairedShuntMonitor(shuntNode: SchemaNode, edges: SchemaEdge[]): { node: SchemaNode; edge: SchemaEdge } | null {
  const alreadyPaired = edges.some(
    (e) => (e.source === shuntNode.id && e.sourceHandle === "ve-direct") || (e.target === shuntNode.id && e.targetHandle === "ve-direct"),
  );
  if (alreadyPaired) return null;

  const monitorDef = getComponentDefinition("system-monitor");
  if (!monitorDef) return null;

  const shuntBrandModelId = String(shuntNode.data.brandModelId ?? "");
  const displayModelId = BMV_DISPLAY_MODEL_BY_SHUNT_ID[shuntBrandModelId];
  const displayModel = displayModelId ? getBrandModel(displayModelId) : undefined;

  const monitorNode: SchemaNode = {
    id: nextId("system-monitor"),
    type: "electrical",
    position: { x: shuntNode.position.x + 170, y: shuntNode.position.y },
    data: {
      componentType: "system-monitor",
      label: displayModel ? `Écran ${displayModel.model}` : monitorDef.label,
      ...monitorDef.defaultData,
      ...(displayModel ? { brandModelId: displayModel.id, brand: displayModel.brand, model: displayModel.model, ...displayModel.defaults } : {}),
    },
  };
  const edge: SchemaEdge = {
    id: nextId("edge"),
    source: shuntNode.id,
    sourceHandle: "ve-direct",
    target: monitorNode.id,
    targetHandle: "ve-direct",
    type: "cable",
    data: { color: "#16a34a", cableType: "data-bus" },
  };
  return { node: monitorNode, edge };
}

// Retour utilisateur : "le GX Touch 70 ne peut pas être dissocié du Cerbo GX
// car il n'a aucun contrôle, à la différence du Cerbo qui est le
// calculateur mais sans écran" — même principe que le pairage BMV
// shunt/écran, mais inversé : ici c'est l'écran (GX Touch, sans aucune
// intelligence propre) qui, choisi seul, exige son cerveau (Cerbo GX, sans
// écran) plutôt que l'inverse.
// GX Touch 50 : même principe que le 70 (retour utilisateur) — écran seul,
// aucune intelligence propre, toujours jumelé à un Cerbo/Venus GX. Ekrano GX
// est volontairement absent de cette liste : contrairement aux GX Touch, il
// combine écran ET calculateur dans le même boîtier, donc autonome.
const GX_TOUCH_MODEL_IDS = new Set(["victron-gx-touch-70", "victron-gx-touch-50"]);
const CERBO_GX_MODEL_ID = "victron-cerbo-gx";

// Construit le Cerbo GX jumeau + le câble GX (VE.Direct) qui l'alimente en
// données — jamais si ce GX Touch a déjà un Cerbo relié (même garde-fou que
// buildPairedShuntMonitor : évite d'en empiler un second si l'utilisateur
// rechoisit GX Touch 70 plusieurs fois).
function buildPairedCerboForGxTouch(touchNode: SchemaNode, edges: SchemaEdge[]): { node: SchemaNode; edge: SchemaEdge } | null {
  const alreadyPaired = edges.some(
    (e) => (e.source === touchNode.id && e.sourceHandle === "ve-direct") || (e.target === touchNode.id && e.targetHandle === "ve-direct"),
  );
  if (alreadyPaired) return null;

  const monitorDef = getComponentDefinition("system-monitor");
  const cerboModel = getBrandModel(CERBO_GX_MODEL_ID);
  if (!monitorDef || !cerboModel) return null;

  const cerboNode: SchemaNode = {
    id: nextId("system-monitor"),
    type: "electrical",
    position: { x: touchNode.position.x + 170, y: touchNode.position.y },
    data: {
      componentType: "system-monitor",
      label: cerboModel.model,
      ...monitorDef.defaultData,
      brandModelId: cerboModel.id,
      brand: cerboModel.brand,
      model: cerboModel.model,
      ...cerboModel.defaults,
    },
  };
  const edge: SchemaEdge = {
    id: nextId("edge"),
    source: touchNode.id,
    sourceHandle: "ve-direct",
    target: cerboNode.id,
    targetHandle: "ve-direct",
    type: "cable",
    data: { color: "#16a34a", cableType: "data-bus" },
  };
  return { node: cerboNode, edge };
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
  // Retour utilisateur : "le bouton Grille ne fait pas apparaître et
  // disparaître la grille, elle y est toujours sur le canvas" — le switch
  // du ruban ne pilotait que l'export/impression (Canvas.tsx ne le lisait
  // pas) ; levé au store pour que Canvas.tsx (affichage réel) ET les
  // captures d'export lisent la même valeur.
  showGrid: boolean;
  leftPanelCollapsed: boolean;
  // v2.1, retour utilisateur : "le bandeau de droite... si celui est réduit
  // on ne sait même pas qu'on peut modifier, on refait un montage avec un
  // nouvel item" — remplace le bandeau permanent (et son état
  // réduit/déployé, désormais supprimé) par un popup ouvert explicitement au
  // double-clic sur un composant/câble (voir ItemPropertiesPopup.tsx,
  // Canvas.tsx onNodeDoubleClick/onEdgeDoubleClick).
  itemPropertiesPopupOpen: boolean;
  // État purement visuel du glisser en cours depuis la bibliothèque (retour
  // utilisateur : "insertion fluide de composants sur câble") — permet à
  // Canvas.tsx de savoir, pendant le survol, si l'item en cours de glisser
  // peut s'insérer sur un câble (HTML5 drag-and-drop n'expose pas la valeur
  // réelle du dataTransfer avant le dépôt, seulement ses clés). Jamais un
  // pas d'historique, jamais persisté.
  draggingComponentType: string | null;
  // Câble actuellement survolé par un glisser spliceable — CableEdge.tsx
  // s'en sert pour se mettre visuellement en évidence (retour utilisateur :
  // rendre l'insertion sur câble plus "fluide", donc visible avant même de
  // lâcher le clic).
  spliceHoverEdgeId: string | null;
  setDraggingComponentType: (type: string | null) => void;
  setSpliceHoverEdgeId: (edgeId: string | null) => void;
  // Guide d'alignement magnétique pendant le glisser d'un composant (retour
  // utilisateur : "pas toujours possible de laisser un fil conducteur
  // droit, il y a souvent un décalage") — coordonnée(s) sur laquelle le
  // nœud déplacé vient de s'accrocher, purement pour l'affichage du repère
  // visuel dans Canvas.tsx (voir AlignmentGuideOverlay). Jamais persisté ni
  // compté dans l'historique.
  alignmentGuides: { x: number | null; y: number | null };
  setAlignmentGuides: (guides: { x: number | null; y: number | null }) => void;
  // Signaux "utilisateur bloqué" (retour utilisateur : proposer un pack de
  // coaching quand on sent quelqu'un coincé) — purement éphémères, jamais
  // persistés ni comptés dans l'historique annuler/rétablir.
  // Horodatage de la dernière action qui fait vraiment avancer le schéma
  // (ajout de composant, câble connecté, insertion sur câble) — remis à
  // zéro à chaque action de ce type ; CoachingOfferWidget s'en sert pour
  // détecter une inactivité prolongée alors que le schéma a des points à
  // vérifier non résolus.
  lastMeaningfulActionAt: number;
  // Nombre d'annulations consécutives du sélecteur de modèle sans ajout
  // réussi entre deux — un débutant qui ouvre/referme plusieurs fois de
  // suite sans jamais choisir est un signal d'hésitation plus immédiat
  // qu'un simple minuteur d'inactivité.
  pickerCancelStreak: number;
  touchMeaningfulAction: () => void;
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
  // v2.1, retour utilisateur : "l'ajout se fasse par glisser-déposer ou
  // double-clic... pour item avec choix uniquement quand c'est choisi" — un
  // item de la bibliothèque qui a des modèles de marque catalogués ne place
  // plus de nœud générique immédiatement au double-clic : rien n'existe
  // encore dans `nodes` tant qu'un modèle (ou "Générique" explicitement)
  // n'a pas été choisi. Distinct de `pendingModelPickerNodeId`, qui reste
  // pour le glisser-déposer (comportement inchangé : place au point de
  // dépose, popup ensuite pour affiner un nœud déjà réel).
  pendingLibraryPick: { type: string; position: { x: number; y: number }; dataOverride?: Record<string, unknown> } | null;
  // V2, retour utilisateur : "pour l'ajout de fusible ou câble, je veux la
  // section et ampérage... automatique quand celui est connecté et ouvre le
  // pop up pour modifier". Posé par `onConnect` quand la nouvelle connexion
  // permet un calcul (consommateur de puissance connue à proximité) —
  // sinon reste `null`, pas de popup vide.
  pendingSizingTarget: { kind: "cable"; edgeId: string } | { kind: "fuse"; nodeId: string } | null;
  // Retour bêta : "j'ai mis 2 batteries... pas demandé si elles étaient en
  // série ou en parallèle" — posé par `addComponent`/`addComponentWithModel`/
  // `duplicateNode` quand une 2e batterie apparaît alors qu'une seule autre
  // existait déjà (voir `findSoleOtherBattery`), consommé par
  // BatteryPairPopup. N'écrase jamais silencieusement un choix de modèle en
  // cours : la popup ne s'affiche qu'une fois `pendingModelPickerNodeId` et
  // `pendingLibraryPick` retombés à `null`.
  pendingBatteryPairPrompt: { nodeId: string; partnerId: string } | null;
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
  // Retour utilisateur : "un module débutant guidé genre chat box... je
  // veux installer des panneaux solaires sur mon van, tu lui demande ce
  // qu'il a et tu viens rajouter les panneaux dans un autre zone" — état
  // d'ouverture pur (même famille que guidedMode), consommé par
  // InstallAssistant.tsx. Distinct de guidedMode (qui enseigne l'usage de
  // l'éditeur) : celui-ci construit une vraie installation à la demande,
  // à tout moment, sur un schéma déjà en cours.
  installAssistantOpen: boolean;
  // v2.1 : nombre de composants "consommateurs" déjà présents au moment du
  // dernier chargement (newProject/loadTemplate/hydrate/startGuidedMode) —
  // un starter de guide (P280, Victron) en a souvent plus de 3 à l'ouverture,
  // ils sont exemptés ; seuls les ajouts au-delà comptent contre la limite
  // gratuite (FREE_CONSUMER_LIMIT).
  consumerBaseline: number;
  // Statut serveur (achat 60 jours ou code promo 7 jours) injecté depuis
  // l'extérieur du store — le store lui-même ne connaît ni Stripe ni les
  // capacités client, voir lib/services/schema-unlock.ts.
  hasUnlimitedConsumers: boolean;
  // Session client active ou non — même origine que hasUnlimitedConsumers
  // (statut serveur injecté depuis l'extérieur, voir Editor.tsx). Sert à
  // proposer la création de compte (SignupPromptWidget) et à savoir si un
  // formulaire de connexion ou d'inscription doit s'afficher dans les
  // popups d'achat/redemption.
  isLoggedIn: boolean;
  /** Items de catalogue créés par l'utilisateur (retour utilisateur :
   * "widget de création d'item personnalisé si manquant") — chargés depuis
   * /api/schema-editor/custom-items par Editor.tsx, même mécanisme que
   * hasUnlimitedConsumers/isLoggedIn ci-dessus (statut serveur injecté
   * depuis l'extérieur du store). */
  customCatalogItems: CustomCatalogItem[];
  // Popup de limite gratuite (achat / code promo / coaching) — posée par
  // addComponent/duplicateNode/spliceNodeOnEdge quand un ajout de
  // consommateur est refusé, jamais silencieusement ignorée.
  freemiumLimitPopupOpen: boolean;

  setProjectName: (name: string) => void;
  setProjectId: (id: string | null) => void;
  setIconStyle: (style: IconStyle) => void;
  setDarkMode: (value: boolean) => void;
  setShowGrid: (value: boolean) => void;
  toggleLeftPanel: () => void;
  openItemPropertiesPopup: () => void;
  closeItemPropertiesPopup: () => void;
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
  applyBrandModelToNode: (id: string, brandModelId: string) => void;
  updateEdgeData: (id: string, patch: Record<string, unknown>, options?: { trackHistory?: boolean }) => void;
  /** Insère un nouveau point de coude juste après `index` (retour
   * utilisateur : "poignées/points intermédiaires sur les câbles"). */
  addEdgeWaypointAfter: (edgeId: string, index: number) => void;
  /** Retire uniquement le point `index` — les autres points du même câble
   * restent en place ; un câble qui n'a plus aucun point revient au tracé
   * automatique. */
  removeEdgeWaypoint: (edgeId: string, index: number) => void;
  setOutputCount: (id: string, count: number) => void;
  reconnectEdge: (oldEdge: SchemaEdge, newConnection: Connection) => void;
  spliceNodeOnEdge: (edgeId: string, type: string, position: { x: number; y: number }) => void;
  duplicateNode: (id: string) => void;
  rotateNode: (id: string) => void;
  /** Réorganise tout le schéma automatiquement : dispose chaque zone (et le
   * groupe de nœuds hors zone) avec un algorithme de mise en page en
   * couches, puis range les blocs obtenus côte à côte avec un espacement
   * généreux — retour utilisateur : "widget qui calcule le placement le
   * plus optimisé... bien aéré dans chaque zone et entre les zones". */
  autoLayout: () => void;
  setCustomCatalogItems: (items: CustomCatalogItem[]) => void;
  /** Verrouille/déverrouille le déplacement et le redimensionnement d'une
   * zone (retour utilisateur : "épingler les zones pour éviter qu'un clic
   * les déplace") — ne concerne que les nœuds de type "zone". */
  toggleZoneLock: (id: string) => void;
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
  openLibraryPick: (type: string, position: { x: number; y: number }, dataOverride?: Record<string, unknown>) => void;
  cancelLibraryPick: () => void;
  addComponentWithModel: (
    type: string,
    position: { x: number; y: number },
    brandModelId: string | null,
    dataOverride?: Record<string, unknown>
  ) => void;
  dismissSizingPopup: () => void;
  resolveBatteryPairPrompt: (mode: "series" | "parallel" | "skip") => void;
  startGuidedMode: () => void;
  exitGuidedMode: () => void;
  advanceGuidedStep: () => void;
  retreatGuidedStep: () => void;
  openInstallAssistant: () => void;
  closeInstallAssistant: () => void;
  // Retour utilisateur : assistant débutant guidé — pose une zone + les
  // composants du plan (voir lib/schema-editor/guided-install/solar.ts)
  // dans une zone vide du canvas, en un seul pas d'historique. Retourne
  // l'id de la zone créée pour que l'UI puisse la sélectionner/centrer la
  // vue dessus.
  insertGuidedInstall: (plan: SolarInstallPlan) => string;
  setHasUnlimitedConsumers: (value: boolean) => void;
  setIsLoggedIn: (value: boolean) => void;
  dismissFreemiumLimitPopup: () => void;
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
  showGrid: true,
  leftPanelCollapsed: loadPanelCollapsed(LEFT_PANEL_COLLAPSED_KEY),
  itemPropertiesPopupOpen: false,
  draggingComponentType: null,
  spliceHoverEdgeId: null,
  alignmentGuides: { x: null, y: null },
  lastMeaningfulActionAt: Date.now(),
  pickerCancelStreak: 0,
  hiddenCategories: [],
  exportIsolatedZoneId: null,
  projectId: null,
  pendingModelPickerNodeId: null,
  pendingLibraryPick: null,
  pendingSizingTarget: null,
  pendingBatteryPairPrompt: null,
  guidedMode: false,
  guidedStepIndex: 0,
  installAssistantOpen: false,
  consumerBaseline: 0,
  hasUnlimitedConsumers: false,
  isLoggedIn: false,
  customCatalogItems: [],
  freemiumLimitPopupOpen: false,

  setProjectName: (name) => set({ projectName: name }),
  setHasUnlimitedConsumers: (value) => set({ hasUnlimitedConsumers: value }),
  setIsLoggedIn: (value) => set({ isLoggedIn: value }),
  setCustomCatalogItems: (items) => set({ customCatalogItems: items }),
  dismissFreemiumLimitPopup: () => set({ freemiumLimitPopupOpen: false }),
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

  setShowGrid: (value) => set({ showGrid: value }),

  toggleLeftPanel: () =>
    set((state) => {
      const next = !state.leftPanelCollapsed;
      if (typeof window !== "undefined") window.localStorage.setItem(LEFT_PANEL_COLLAPSED_KEY, next ? "1" : "0");
      return { leftPanelCollapsed: next };
    }),

  openItemPropertiesPopup: () => set({ itemPropertiesPopupOpen: true }),
  closeItemPropertiesPopup: () => set({ itemPropertiesPopupOpen: false }),
  setDraggingComponentType: (type) => set({ draggingComponentType: type }),
  setSpliceHoverEdgeId: (edgeId) => set({ spliceHoverEdgeId: edgeId }),
  setAlignmentGuides: (guides) => set({ alignmentGuides: guides }),
  touchMeaningfulAction: () => set({ lastMeaningfulActionAt: Date.now(), pickerCancelStreak: 0 }),

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
        lastMeaningfulActionAt: Date.now(),
        pickerCancelStreak: 0,
        ...commit(state),
      };
    }),

  addComponent: (type, position, dataOverride) =>
    set((state) => {
      const def = getComponentDefinition(type);
      if (!def) return {};
      if (
        !state.hasUnlimitedConsumers &&
        isConsumerType(type) &&
        countConsumerNodes(state.nodes) - state.consumerBaseline >= FREE_CONSUMER_LIMIT
      ) {
        return { freemiumLimitPopupOpen: true };
      }
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
      const batteryPartnerId = !state.guidedMode && type === "battery" ? findSoleOtherBattery(node.id, [...state.nodes, node]) : null;
      return {
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        selectedEdgeId: null,
        pendingModelPickerNodeId: hasBrandModels ? node.id : null,
        pendingBatteryPairPrompt: batteryPartnerId ? { nodeId: node.id, partnerId: batteryPartnerId } : null,
        lastMeaningfulActionAt: Date.now(),
        pickerCancelStreak: 0,
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

  // v2.1, retour utilisateur : double-clic sur un item avec modèles de
  // marque catalogués — ouvre le choix sans encore rien placer sur le
  // canvas (voir `pendingLibraryPick`). `addComponent` reste inchangé pour
  // le glisser-déposer (place immédiatement, popup ensuite pour affiner).
  openLibraryPick: (type, position, dataOverride) =>
    set({ pendingLibraryPick: { type, position, dataOverride } }),
  cancelLibraryPick: () =>
    set((state) => ({ pendingLibraryPick: null, pickerCancelStreak: state.pickerCancelStreak + 1 })),

  addComponentWithModel: (type, position, brandModelId, dataOverride) =>
    set((state) => {
      const def = getComponentDefinition(type);
      if (!def) return { pendingLibraryPick: null };
      if (
        !state.hasUnlimitedConsumers &&
        isConsumerType(type) &&
        countConsumerNodes(state.nodes) - state.consumerBaseline >= FREE_CONSUMER_LIMIT
      ) {
        return { pendingLibraryPick: null, freemiumLimitPopupOpen: true };
      }
      const brandModel = brandModelId ? getBrandModel(brandModelId) : undefined;
      const node: SchemaNode = {
        id: nextId(type),
        type: "electrical",
        position,
        data: {
          componentType: type,
          label: def.label,
          ...def.defaultData,
          ...dataOverride,
          ...(brandModel
            ? { brandModelId: brandModel.id, brand: brandModel.brand, model: brandModel.model, ...brandModel.defaults }
            : {}),
        },
      };
      const batteryPartnerId = type === "battery" ? findSoleOtherBattery(node.id, [...state.nodes, node]) : null;

      const pairedMonitor =
        type === "shunt" && brandModel && BMV_DISPLAY_SHUNT_IDS.has(brandModel.id)
          ? buildPairedShuntMonitor(node, state.edges)
          : type === "system-monitor" && brandModel && GX_TOUCH_MODEL_IDS.has(brandModel.id)
            ? buildPairedCerboForGxTouch(node, state.edges)
            : null;
      const nodes = pairedMonitor ? [...state.nodes, node, pairedMonitor.node] : [...state.nodes, node];
      const edges = pairedMonitor ? [...state.edges, pairedMonitor.edge] : state.edges;

      return {
        nodes,
        edges,
        selectedNodeId: node.id,
        selectedEdgeId: null,
        pendingLibraryPick: null,
        pendingBatteryPairPrompt: batteryPartnerId ? { nodeId: node.id, partnerId: batteryPartnerId } : null,
        lastMeaningfulActionAt: Date.now(),
        pickerCancelStreak: 0,
        ...commit(state),
      };
    }),

  dismissSizingPopup: () => set({ pendingSizingTarget: null }),

  // Retour bêta : voir `pendingBatteryPairPrompt` — relie la batterie qui
  // vient d'être ajoutée à l'unique autre batterie déjà présente. "skip" ne
  // câble rien (cas normal : deux banques indépendantes, ex. batterie moteur
  // + batterie auxiliaire). Mêmes handles/couleurs que `onConnect` pour une
  // borne + ou − (HANDLE_COLORS/DEFAULT_CABLE_TYPE_BY_KIND).
  resolveBatteryPairPrompt: (mode) =>
    set((state) => {
      const prompt = state.pendingBatteryPairPrompt;
      if (!prompt) return {};
      if (mode === "skip") return { pendingBatteryPairPrompt: null };

      const a = state.nodes.find((n) => n.id === prompt.partnerId);
      const b = state.nodes.find((n) => n.id === prompt.nodeId);
      if (!a || !b) return { pendingBatteryPairPrompt: null };

      const positiveData = { color: HANDLE_COLORS.positive, cableType: DEFAULT_CABLE_TYPE_BY_KIND.positive };
      const negativeData = { color: HANDLE_COLORS.negative, cableType: DEFAULT_CABLE_TYPE_BY_KIND.negative };

      const newEdges: SchemaEdge[] =
        mode === "parallel"
          ? [
              { id: nextId("edge"), source: a.id, sourceHandle: "positive", target: b.id, targetHandle: "positive", type: "cable", data: positiveData },
              { id: nextId("edge"), source: a.id, sourceHandle: "negative", target: b.id, targetHandle: "negative", type: "cable", data: negativeData },
            ]
          : [
              { id: nextId("edge"), source: a.id, sourceHandle: "positive", target: b.id, targetHandle: "negative", type: "cable", data: positiveData },
            ];

      return {
        edges: [...state.edges, ...newEdges],
        pendingBatteryPairPrompt: null,
        lastMeaningfulActionAt: Date.now(),
        ...commit(state),
      };
    }),

  updateNodeData: (id, patch, options) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      ...(options?.trackHistory === false ? null : commit(state)),
    })),

  // Utilisé par ModelPickerModal quand un modèle est choisi pour un nœud
  // déjà posé sur le canvas (glisser-déposer) — même effet que
  // `updateNodeData` avec les champs du modèle, plus le pairage écran/shunt
  // BMV (voir `buildPairedShuntMonitor`) qu'un simple `updateNodeData` ne
  // peut pas faire (il ne crée jamais de second nœud).
  applyBrandModelToNode: (id, brandModelId) =>
    set((state) => {
      const node = state.nodes.find((n) => n.id === id);
      const brandModel = getBrandModel(brandModelId);
      if (!node || !brandModel) return {};

      const updatedNode: SchemaNode = {
        ...node,
        data: { ...node.data, brandModelId: brandModel.id, brand: brandModel.brand, model: brandModel.model, ...brandModel.defaults },
      };
      const nodes = state.nodes.map((n) => (n.id === id ? updatedNode : n));

      const pairedMonitor =
        node.data.componentType === "shunt" && BMV_DISPLAY_SHUNT_IDS.has(brandModel.id)
          ? buildPairedShuntMonitor(updatedNode, state.edges)
          : node.data.componentType === "system-monitor" && GX_TOUCH_MODEL_IDS.has(brandModel.id)
            ? buildPairedCerboForGxTouch(updatedNode, state.edges)
            : null;

      return {
        nodes: pairedMonitor ? [...nodes, pairedMonitor.node] : nodes,
        edges: pairedMonitor ? [...state.edges, pairedMonitor.edge] : state.edges,
        ...commit(state),
      };
    }),

  updateEdgeData: (id, patch, options) =>
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...patch } } : e)),
      ...(options?.trackHistory === false ? null : commit(state)),
    })),

  addEdgeWaypointAfter: (edgeId, index) =>
    set((state) => {
      const edge = state.edges.find((e) => e.id === edgeId);
      if (!edge) return {};
      const points = getBendPoints(edge.data);
      const anchor = points[index];
      if (!anchor) return {};
      // Décalage fixe pour que le nouveau point soit immédiatement visible
      // et déplaçable, plutôt que superposé pile sur celui d'à côté.
      const newPoint = { x: anchor.x + 40, y: anchor.y + 40 };
      const nextPoints = [...points.slice(0, index + 1), newPoint, ...points.slice(index + 1)];
      return {
        edges: state.edges.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, bendPoints: nextPoints } } : e)),
        ...commit(state),
      };
    }),

  removeEdgeWaypoint: (edgeId, index) =>
    set((state) => {
      const edge = state.edges.find((e) => e.id === edgeId);
      if (!edge) return {};
      const points = getBendPoints(edge.data).filter((_, i) => i !== index);
      return {
        edges: state.edges.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, bendPoints: points } } : e)),
        ...commit(state),
      };
    }),

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
      if (
        !state.hasUnlimitedConsumers &&
        isConsumerType(type) &&
        countConsumerNodes(state.nodes) - state.consumerBaseline >= FREE_CONSUMER_LIMIT
      ) {
        return { freemiumLimitPopupOpen: true };
      }
      const handles = getEffectiveHandles(def, def.defaultData);
      const inputHandle = handles.find((h) => h.id === "input") ?? handles[0];
      // Résolution générique (plutôt qu'une liste de types codée en dur) :
      // "output" pour un composant à IN/OUT classique (fusible, disjoncteur,
      // interrupteur, relais…), sinon "out-1" pour un busbar/épissure/
      // tableau/platine (bornes numérotées sans OUT dédié).
      const outputHandle = handles.find((h) => h.id === "output") ?? handles.find((h) => h.id === "out-1") ?? handles[1];
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
        lastMeaningfulActionAt: Date.now(),
        pickerCancelStreak: 0,
        ...commit(state),
      };
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

  autoLayout: () =>
    set((state) => {
      const { nodes, edges } = computeAutoLayout(state.nodes, state.edges);
      return { nodes, edges, ...commit(state) };
    }),

  toggleZoneLock: (id) =>
    set((state) => {
      const nodes = state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, locked: !n.data.locked } } : n));
      // Purement un réglage d'interaction (pas une donnée du schéma qui
      // mérite un pas d'annuler/rétablir) — pas de commit(state) ici,
      // contrairement à rotateNode.
      return { nodes };
    }),

  duplicateNode: (id) =>
    set((state) => {
      const original = state.nodes.find((n) => n.id === id);
      if (!original) return {};
      if (
        !state.hasUnlimitedConsumers &&
        isConsumerType(original.data.componentType) &&
        countConsumerNodes(state.nodes) - state.consumerBaseline >= FREE_CONSUMER_LIMIT
      ) {
        return { freemiumLimitPopupOpen: true };
      }
      const node: SchemaNode = {
        ...original,
        id: nextId(original.data.componentType),
        position: { x: original.position.x + 32, y: original.position.y + 32 },
        selected: false,
        data: { ...original.data },
      };
      const batteryPartnerId =
        node.data.componentType === "battery" ? findSoleOtherBattery(node.id, [...state.nodes, node]) : null;
      return {
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        selectedEdgeId: null,
        pendingBatteryPairPrompt: batteryPartnerId ? { nodeId: node.id, partnerId: batteryPartnerId } : state.pendingBatteryPairPrompt,
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

  // Retour utilisateur : "c'est dérangeant de cliquer sur le i à chaque
  // fois" — le popup de propriétés s'ouvre automatiquement dès qu'un
  // élément est sélectionné (un clic suffit) et se ferme dès qu'on
  // désélectionne (clic sur le fond du canvas), plutôt que de dépendre
  // d'un bouton dédié ou d'un double-clic. Reste un popup minimaliste, pas
  // un bandeau permanent (retour utilisateur explicite) : rien n'est
  // affiché tant que rien n'est sélectionné.
  select: (kind, id) =>
    set({
      selectedNodeId: kind === "node" ? id : null,
      selectedEdgeId: kind === "edge" ? id : null,
      itemPropertiesPopupOpen: kind !== null && id !== null,
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
      consumerBaseline: 0,
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
      // v2.1 : les starters de guides (P280, Victron...) partent souvent
      // avec plus de 3 consommateurs — exemptés à l'ouverture, seuls les
      // ajouts au-delà comptent contre la limite gratuite.
      consumerBaseline: countConsumerNodes(nodes),
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
      // v2.1 : reprise d'un projet déjà sauvegardé (cloud ou brouillon local)
      // — ce qui est déjà là ne redevient jamais bloquant rétroactivement,
      // seuls les ajouts au-delà comptent contre la limite gratuite.
      consumerBaseline: countConsumerNodes(snapshot.nodes),
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
      consumerBaseline: 0,
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

  openInstallAssistant: () => set({ installAssistantOpen: true }),
  closeInstallAssistant: () => set({ installAssistantOpen: false }),

  // Retour utilisateur : "un module débutant guidé genre chat box... tu
  // viens rajouter les panneaux dans un autre zone" — pose une zone neuve
  // à droite de tout ce qui existe déjà (jamais par-dessus), puis les
  // composants du plan dedans, entièrement câblés et dimensionnés (section
  // de câble + calibre déjà corrects, pas besoin d'un second passage de
  // "Recalculer les sections"). Un seul commit d'historique : un "Annuler"
  // retire toute l'installation d'un coup, pas composant par composant.
  insertGuidedInstall: (plan) => {
    let zoneId = "";
    set((state) => {
      const maxX = state.nodes.length > 0 ? Math.max(...state.nodes.map((n) => n.position.x + (n.width ?? 220))) : 0;
      const minY = state.nodes.length > 0 ? Math.min(...state.nodes.map((n) => n.position.y)) : 0;
      const anchor = { x: state.nodes.length > 0 ? maxX + 120 : 40, y: state.nodes.length > 0 ? minY : 40 };

      const zoneNode: SchemaNode = {
        id: nextId("zone"),
        type: "zone",
        position: anchor,
        zIndex: -1,
        width: plan.zoneWidth,
        height: plan.zoneHeight,
        data: {
          componentType: "zone",
          label: "Panneaux solaires",
          color: ZONE_COLORS[state.nodes.filter((n) => n.type === "zone").length % ZONE_COLORS.length],
        },
      };
      zoneId = zoneNode.id;

      const keyToId = new Map<string, string>();
      const newNodes: SchemaNode[] = [zoneNode];
      for (const comp of plan.components) {
        const def = getComponentDefinition(comp.type);
        if (!def) continue;
        const id = nextId(comp.type);
        keyToId.set(comp.key, id);
        newNodes.push({
          id,
          type: "electrical",
          position: { x: anchor.x + comp.offsetX, y: anchor.y + comp.offsetY },
          data: { componentType: comp.type, label: comp.label, ...def.defaultData, ...comp.dataOverride },
        });
      }

      // Section de câble + longueur par défaut au fil à fil (panneau→MPPT :
      // 2m, run de toit plausible ; MPPT→fusible : 0,3m, cavalier court) —
      // mêmes formules que le reste de l'app (calcSection, chute 3%).
      const newEdges: SchemaEdge[] = plan.edges.map((e) => {
        const sourceId = keyToId.get(e.sourceKey) ?? "";
        const targetId = keyToId.get(e.targetKey) ?? "";
        const sourceNode = newNodes.find((n) => n.id === sourceId);
        const def = sourceNode ? getComponentDefinition(sourceNode.data.componentType) : undefined;
        const handleDef = def && sourceNode ? getEffectiveHandles(def, sourceNode.data).find((h) => h.id === e.sourceHandle) : undefined;
        const kind = handleDef && def ? (def.resolveHandleKind ? def.resolveHandleKind(sourceNode!.data, handleDef) : handleDef.kind) : undefined;
        // Câble panneau→MPPT : ne porte QUE le courant de CE panneau (branches
        // parallèles indépendantes), pas le total du champ — sinon toutes les
        // sections seraient surdimensionnées d'un facteur = nombre de panneaux.
        const isPanelLeg = e.sourceKey.startsWith("panel-");
        const amps = isPanelLeg ? (sourceNode ? Number(sourceNode.data.powerW ?? 0) : 0) / plan.systemVoltage : plan.mpptAmperage;
        const length = isPanelLeg ? 2 : 0.3;
        const { section } = calcSection(amps, length, 3, plan.systemVoltage);
        return {
          id: nextId("edge"),
          source: sourceId,
          sourceHandle: e.sourceHandle,
          target: targetId,
          targetHandle: e.targetHandle,
          type: "cable",
          data: {
            color: kind ? HANDLE_COLORS[kind] : HANDLE_COLORS.neutral,
            cableType: kind ? DEFAULT_CABLE_TYPE_BY_KIND[kind] : "other",
            section: formatSectionLabel(section),
            length,
          },
        };
      });

      return {
        nodes: [...state.nodes, ...newNodes],
        edges: [...state.edges, ...newEdges],
        selectedNodeId: zoneNode.id,
        selectedEdgeId: null,
        installAssistantOpen: false,
        lastMeaningfulActionAt: Date.now(),
        pickerCancelStreak: 0,
        ...commit(state),
      };
    });
    return zoneId;
  },
}));

export function selectComponentDefinition(node: SchemaNode) {
  return getComponentDefinition(node.data.componentType);
}
