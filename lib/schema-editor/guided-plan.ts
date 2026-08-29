import type { Edge, Node } from "@xyflow/react";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

export type GuidedPlanZoneId =
  | "alternator"
  | "solar"
  | "shore-ac"
  | "dc-core"
  | "dc-distribution"
  | "ac-system"
  | "battery"
  | "monitoring"
  | "chassis-ground";

export interface GuidedPlanZone {
  id: GuidedPlanZoneId;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Plan de lecture A2 paysage : sources en haut, distribution au centre,
// stockage en bas et 230 V sur la droite. Ces coordonnées restent des
// coordonnées canvas, pas un format d'export impose.
export const GUIDED_PLAN_ZONES: GuidedPlanZone[] = [
  { id: "alternator", label: "Charge alternateur", color: "#f59e0b", x: 80, y: 90, width: 460, height: 560 },
  { id: "solar", label: "Système solaire", color: "#eab308", x: 650, y: 60, width: 820, height: 590 },
  { id: "shore-ac", label: "Entrée quai / secteur", color: "#14b8a6", x: 1720, y: 90, width: 500, height: 560 },
  // Un seul rail de masse, place entre les sources et les noyaux de
  // puissance. Il remplace les petites zones "Châssis" dispersées.
  { id: "chassis-ground", label: "Châssis / masse", color: "#64748b", x: 80, y: 710, width: 2140, height: 120 },
  { id: "dc-core", label: "Coeur DC", color: "#8b5cf6", x: 700, y: 880, width: 960, height: 440 },
  { id: "dc-distribution", label: "Distribution DC", color: "#10b981", x: 80, y: 900, width: 540, height: 650 },
  { id: "ac-system", label: "Système AC", color: "#ef4444", x: 1720, y: 880, width: 550, height: 680 },
  { id: "battery", label: "Batteries", color: "#3b82f6", x: 700, y: 1380, width: 960, height: 310 },
  { id: "monitoring", label: "Monitoring", color: "#64748b", x: 700, y: 1760, width: 960, height: 180 },
];

const ZONE_BY_ID = new Map(GUIDED_PLAN_ZONES.map((zone) => [zone.id, zone]));
const GUIDED_ZONE_PREFIX = "guided-zone-";
const NODE_WIDTH = 130;
const NODE_HEIGHT = 110;
const SLOT_GAP_X = 60;
const SLOT_GAP_Y = 46;
const CONTENT_PADDING_X = 48;
const CONTENT_PADDING_TOP = 78;
const ZONE_CONTENT_MARGIN = 80;
const ZONE_GAP_X = 120;
const ZONE_GAP_Y = 120;

const COMPONENT_ZONE: Record<string, GuidedPlanZoneId> = {
  alternator: "alternator",
  dcdc: "alternator",
  "wind-turbine": "alternator",
  "battery-isolator": "alternator",
  "battery-combiner": "alternator",
  "solar-panel": "solar",
  mppt: "solar",
  pwm: "solar",
  "solar-router": "solar",
  "shore-power": "shore-ac",
  "ac-charger": "shore-ac",
  "galvanic-isolator": "shore-ac",
  battery: "battery",
  "mini-bms": "battery",
  "smart-bms-ng": "battery",
  "vebus-bms-ng": "battery",
  "lynx-smart-bms": "battery",
  busbar: "dc-core",
  "lynx-power-in": "dc-core",
  "lynx-distributor": "dc-core",
  fuse: "dc-core",
  "battery-switch": "dc-core",
  "battery-protect": "dc-core",
  // Une commande de consommateur ne fait pas partie du coeur de puissance :
  // elle reste dans le tableau de distribution, au voisinage du circuit
  // qu'elle pilote (eclairage, pompe, feux, etc.).
  switch: "dc-distribution",
  relay: "dc-core",
  splice: "dc-core",
  "fuse-block": "dc-distribution",
  "distribution-panel": "dc-distribution",
  consumer: "dc-distribution",
  "bilge-pump": "dc-distribution",
  inverter: "ac-system",
  "inverter-charger": "ac-system",
  easysolar: "ac-system",
  "ac-transfer-switch": "ac-system",
  "ac-panel": "ac-system",
  "socket-220v": "ac-system",
  shunt: "monitoring",
  "system-monitor": "monitoring",
  "jauge-niveau": "monitoring",
  "compteur-niveau": "monitoring",
  ground: "chassis-ground",
};

function isGuidedZone(node: SchemaNode) {
  return node.type === "zone" && node.id.startsWith(GUIDED_ZONE_PREFIX);
}

export function zoneForComponent(type: string): GuidedPlanZoneId {
  return COMPONENT_ZONE[type] ?? "dc-distribution";
}

// La batterie moteur appartient physiquement au bloc alternateur/DC-DC. La
// batterie de servitude reste, elle, dans sa zone de stockage propre. Le nom
// est volontairement la donnée de repli : les anciens schémas ne possèdent
// pas encore de champ "role de batterie" structuré.
export function zoneForNode(node: SchemaNode): GuidedPlanZoneId {
  if (node.data.componentType === "battery") {
    const label = String(node.data.label ?? "").toLocaleLowerCase("fr-FR");
    if (/\b(moteur|d.marrage|starter|start)\b/.test(label)) return "alternator";
  }
  return zoneForComponent(node.data.componentType);
}

function positionForIndex(zone: GuidedPlanZone, index: number) {
  const columns = Math.max(1, Math.floor((zone.width - CONTENT_PADDING_X * 2 + SLOT_GAP_X) / (NODE_WIDTH + SLOT_GAP_X)));
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: zone.x + CONTENT_PADDING_X + column * (NODE_WIDTH + SLOT_GAP_X),
    y: zone.y + CONTENT_PADDING_TOP + row * (NODE_HEIGHT + SLOT_GAP_Y),
  };
}

type PlacementLane = "source" | "controller" | "busbar" | "protection" | "negative" | "distribution" | "consumer" | "ac-input" | "ac-output" | "battery" | "monitoring" | "ground" | "default";

function placementLane(type: string, zoneId: GuidedPlanZoneId): PlacementLane {
  if (zoneId === "solar") return type === "solar-panel" ? "source" : "controller";
  if (zoneId === "alternator") return type === "alternator" || type === "wind-turbine" ? "source" : "controller";
  if (zoneId === "shore-ac") return type === "shore-power" ? "source" : "ac-input";
  if (zoneId === "dc-core") {
    if (type === "busbar" || type.startsWith("lynx-")) return "busbar";
    if (type === "shunt") return "negative";
    return "protection";
  }
  if (zoneId === "dc-distribution") return type === "consumer" || type === "bilge-pump" || type === "switch" ? "consumer" : "distribution";
  if (zoneId === "ac-system") return type === "ac-panel" || type === "socket-220v" ? "ac-output" : "ac-input";
  if (zoneId === "battery") return "battery";
  if (zoneId === "monitoring") return "monitoring";
  if (zoneId === "chassis-ground") return "ground";
  return "default";
}

// Placement par role, pas seulement par categorie. Le noyau DC conserve une
// vraie colonne verticale : busbars en haut, protections et shunt dessous,
// batterie directement sous le noyau. Les compteurs par couloir evitent les
// superpositions sans imposer une position a un glisser manuel.
function positionForLane(zone: GuidedPlanZone, lane: PlacementLane, index: number) {
  const x = zone.x;
  const y = zone.y;
  switch (lane) {
    case "source":
      return { x: x + 70 + index * 190, y: y + 95 };
    case "controller":
      return { x: x + 165 + index * 210, y: y + 330 };
    case "busbar":
      return { x: x + 160 + index * 360, y: y + 90 };
    case "negative":
      return { x: x + 180, y: y + 245 + index * 120 };
    case "protection": {
      const column = index % 3;
      const row = Math.floor(index / 3);
      return { x: x + 430 + column * 190, y: y + 225 + row * 155 };
    }
    case "distribution":
      return { x: x + 70 + index * 190, y: y + 110 };
    case "consumer": {
      const column = index % 3;
      const row = Math.floor(index / 3);
      return { x: x + 60 + column * 220, y: y + 320 + row * 155 };
    }
    case "ac-input":
      return { x: x + 210, y: y + 110 + index * 150 };
    case "ac-output":
      return { x: x + 210, y: y + 410 + index * 130 };
    case "battery":
      return { x: x + 150 + index * 220, y: y + 115 };
    case "monitoring":
      return { x: x + 80 + index * 190, y: y + 55 };
    case "ground":
      return { x: x + 150 + index * 760, y: y + 18 };
    default:
      return positionForIndex(zone, index);
  }
}

function placeElectricalNodes(nodes: SchemaNode[], zones: Map<GuidedPlanZoneId, GuidedPlanZone>) {
  const counters = new Map<string, number>();

  return nodes.map((node) => {
    if (node.type !== "electrical") return node;
    const zoneId = zoneForNode(node);
    const zone = zones.get(zoneId)!;
    const lane = placementLane(node.data.componentType, zoneId);
    const counterKey = `${zoneId}:${lane}`;
    const index = counters.get(counterKey) ?? 0;
    counters.set(counterKey, index + 1);
    return { ...node, position: positionForLane(zone, lane, index) };
  });
}

export function suggestedGuidedPosition(type: string, nodes: SchemaNode[]) {
  const zoneId = zoneForComponent(type);
  const zone = ZONE_BY_ID.get(zoneId)!;
  const lane = placementLane(type, zoneId);
  const used = nodes.filter((node) => node.type === "electrical" && zoneForNode(node) === zoneId && placementLane(node.data.componentType, zoneId) === lane).length;
  return positionForLane(zone, lane, used);
}

function buildGuidedZone(zone: GuidedPlanZone): SchemaNode {
  return {
    id: `${GUIDED_ZONE_PREFIX}${zone.id}`,
    type: "zone",
    position: { x: zone.x, y: zone.y },
    width: zone.width,
    height: zone.height,
    zIndex: -1,
    data: { componentType: "zone", label: zone.label, color: zone.color, locked: true },
  };
}

function expandZoneToContent(zone: GuidedPlanZone, nodes: SchemaNode[]): Pick<SchemaNode, "width" | "height"> {
  const inZone = nodes.filter((node) => node.type === "electrical" && zoneForNode(node) === zone.id);
  if (inZone.length === 0) return { width: zone.width, height: zone.height };

  // Les dimensions React Flow des vignettes sont variables. Cette estimation
  // volontairement large garantit une marge de lecture, meme avant le
  // premier rendu ou `measured` n'est pas encore disponible.
  const maxRight = Math.max(...inZone.map((node) => node.position.x + NODE_WIDTH));
  const maxBottom = Math.max(...inZone.map((node) => node.position.y + NODE_HEIGHT));
  return {
    width: Math.max(zone.width, maxRight - zone.x + ZONE_CONTENT_MARGIN),
    height: Math.max(zone.height, maxBottom - zone.y + ZONE_CONTENT_MARGIN),
  };
}

function dimensionsForZones(nodes: SchemaNode[], zones: GuidedPlanZone[]) {
  return new Map(
    zones.map((zone) => [zone.id, { ...zone, ...expandZoneToContent(zone, nodes) }]),
  );
}

// Les zones ne sont jamais agrandies isolément : chaque rangée est décalée
// après la précédente. Ainsi, un grand tableau de consommateurs ne peut pas
// recouvrir les batteries ni le monitoring placés sous lui.
function positionZones(dimensions: Map<GuidedPlanZoneId, GuidedPlanZone>): GuidedPlanZone[] {
  const alternator = dimensions.get("alternator")!;
  const solar = dimensions.get("solar")!;
  const shoreAc = dimensions.get("shore-ac")!;
  const chassisGround = dimensions.get("chassis-ground")!;
  const dcDistribution = dimensions.get("dc-distribution")!;
  const dcCore = dimensions.get("dc-core")!;
  const acSystem = dimensions.get("ac-system")!;
  const battery = dimensions.get("battery")!;
  const monitoring = dimensions.get("monitoring")!;

  const topY = 80;
  const alternatorX = 80;
  const solarX = alternatorX + alternator.width + ZONE_GAP_X;
  const shoreAcX = solarX + solar.width + ZONE_GAP_X;
  const sourceBottom = topY + Math.max(alternator.height, solar.height, shoreAc.height);

  const groundY = sourceBottom + ZONE_GAP_Y;
  const mainY = groundY + chassisGround.height + ZONE_GAP_Y;
  const distributionX = 80;
  const coreX = distributionX + dcDistribution.width + ZONE_GAP_X;
  const acX = coreX + dcCore.width + ZONE_GAP_X;
  const mainBottom = mainY + Math.max(dcDistribution.height, dcCore.height, acSystem.height);

  const batteryY = mainBottom + ZONE_GAP_Y;
  const monitoringY = batteryY + battery.height + ZONE_GAP_Y;

  return [
    { ...alternator, x: alternatorX, y: topY },
    { ...solar, x: solarX, y: topY },
    { ...shoreAc, x: shoreAcX, y: topY },
    { ...chassisGround, x: alternatorX, y: groundY, width: shoreAcX + shoreAc.width - alternatorX },
    { ...dcDistribution, x: distributionX, y: mainY },
    { ...dcCore, x: coreX, y: mainY },
    { ...acSystem, x: acX, y: mainY },
    { ...battery, x: coreX, y: batteryY },
    { ...monitoring, x: coreX, y: monitoringY },
  ];
}

// L'action est explicitement demandee par l'utilisateur. Elle ne supprime ni
// zones personnelles ni coudes de cables : seuls les composants et nos zones
// de planification sont recalcules, ce qui garde le retour arriere fiable.
export function applyGuidedPlan(nodes: SchemaNode[], edges: SchemaEdge[]): { nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const existingGuidedZones = new Map(nodes.filter(isGuidedZone).map((node) => [node.id, node]));
  const nonGuidedNodes = nodes.filter((node) => !isGuidedZone(node));
  const draftNodes = placeElectricalNodes(nonGuidedNodes, ZONE_BY_ID);
  const positionedZones = positionZones(dimensionsForZones(draftNodes, GUIDED_PLAN_ZONES));
  const positionedZoneById = new Map(positionedZones.map((zone) => [zone.id, zone]));
  const laidOutNodes = placeElectricalNodes(nonGuidedNodes, positionedZoneById);
  const finalZones = positionZones(dimensionsForZones(laidOutNodes, positionedZones));

  const guidedZones = finalZones.map((zone) => {
    const existing = existingGuidedZones.get(`${GUIDED_ZONE_PREFIX}${zone.id}`);
    const dimensions = expandZoneToContent(zone, laidOutNodes);
    return existing
      ? { ...existing, position: { x: zone.x, y: zone.y }, ...dimensions, zIndex: -1, data: { ...existing.data, label: zone.label, color: zone.color, locked: true } }
      : { ...buildGuidedZone(zone), ...dimensions };
  });

  return { nodes: [...guidedZones, ...laidOutNodes], edges };
}
