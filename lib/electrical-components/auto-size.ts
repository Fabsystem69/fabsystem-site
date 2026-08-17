import type { Node, Edge } from "@xyflow/react";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";
import { calcSection, AVAILABLE_FUSES_A } from "@/lib/calc/section-cable";
import { getEdgeDefaultLength } from "@/lib/electrical-components/cable-lengths";

// Moteur de recalcul en masse (V2 — inspiré de "Recalculate All Wire
// Sizes"/"Recalculate All Fuse Ratings" chez Wireframe, un concurrent
// SaaS). Réutilise volontairement le même moteur que la suggestion par
// câble (ItemPropertiesPopup `SectionSuggestion`/`FuseSuggestion`, lib/calc/
// section-cable.ts) plutôt que d'en écrire un second — juste appliqué à
// tout le schéma en une fois. Reste une suggestion : n'écrase que les
// valeurs qu'on sait recalculer (câble relié à un consommateur de
// puissance connue), jamais une "validation" appliquée de force.

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;
type PowerCableType = "power-positive" | "power-negative";

const SOURCE_TYPES = new Set(["battery", "power-station"]);

export interface EdgeSectionDiagnostic {
  amps: number;
  loadAmps: number | null;
  protectionAmps: number | null;
  ampsSource: "load" | "protection";
  voltage: number;
  length: number;
  recommendedSectionMm2: number;
  recommendedSectionLabel: string;
  currentSectionMm2: number | null;
  currentSectionLabel: string | null;
  status: "missing" | "undersized" | "ok";
}

export function findBatteryVoltage(nodes: SchemaNode[]): number {
  const battery = nodes.find((n) => n.data.componentType === "battery");
  return Number(battery?.data.voltage) || 12;
}

function isPowerCableType(value: string | undefined): value is PowerCableType {
  return value === "power-positive" || value === "power-negative";
}

function formatSectionLabel(sectionMm2: number): string {
  return `${String(sectionMm2).replace(".", ",")} mm²`;
}

function parseSectionMm2(section: string | undefined): number | null {
  const matches = section?.match(/\d+(?:[.,]\d+)?/g);
  const raw = matches?.[matches.length - 1];
  if (!raw) return null;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function getEdgeSizingLength(edge: SchemaEdge, nodes: SchemaNode[]): number {
  const sourceType = nodes.find((n) => n.id === edge.source)?.data.componentType;
  const targetType = nodes.find((n) => n.id === edge.target)?.data.componentType;
  return edge.data?.length ?? getEdgeDefaultLength(sourceType, targetType, edge.data?.section ?? "", edge.data?.cableType) ?? 4;
}

function getProtectionAmperage(node: SchemaNode | undefined): number | null {
  if (!node) return null;
  if (node.data.componentType !== "fuse" && node.data.componentType !== "circuit-breaker") return null;
  const amperage = Number(node.data.amperage) || 0;
  return amperage > 0 ? amperage : null;
}

// Ampérage traversant un fusible/disjoncteur : suit sa borne "output" (le
// côté charge, par convention dans toutes les définitions à 2 bornes —
// fuse/circuit-breaker) et somme les consommateurs en aval via
// `estimateEdgeAmps`, pas seulement un consommateur directement raccordé
// (même correction que pour les câbles — retour utilisateur : "le vrai
// circuit de puissance"). Repli sur l'ancien comportement (consommateur
// adjacent) pour les types de nœud sans borne "output" nommée ainsi.
export function estimateConnectedAmps(nodeId: string, nodes: SchemaNode[], edges: SchemaEdge[]): number | null {
  const outputEdge = edges.find((e) => (e.source === nodeId && e.sourceHandle === "output") || (e.target === nodeId && e.targetHandle === "output"));
  if (outputEdge) {
    const amps = estimateEdgeAmps(outputEdge, nodes, edges);
    if (amps !== null) return amps;
  }
  const connectedIds = new Set(edges.filter((e) => e.source === nodeId || e.target === nodeId).flatMap((e) => [e.source, e.target]));
  connectedIds.delete(nodeId);
  const consumerNode = nodes.find((n) => connectedIds.has(n.id) && n.data.componentType === "consumer");
  const powerW = Number(consumerNode?.data.powerW) || 0;
  if (!consumerNode || powerW <= 0) return null;
  return powerW / findBatteryVoltage(nodes);
}

// Tous les nœuds atteignables depuis `startId` en ne traversant QUE des
// câbles du même `cableType` (retour utilisateur : "il ne calcule pas la
// section des câbles les plus importants, ceux de la batterie au
// coupe-circuit ou à la platine de distribution — le vrai circuit de
// puissance") — se limiter à une seule polarité à la fois est ce qui rend
// la traversée fiable : le rail + et le rail − forment chacun un arbre
// séparé depuis la batterie (aucun cycle), alors que mélanger les deux
// referait boucler n'importe quelle branche jusqu'à la batterie par le
// retour de masse d'un consommateur, rendant impossible de savoir quel
// côté d'un câble est "en amont" (côté source) ou "en aval" (côté charge).
function reachableSameCableType(startId: string, excludeEdgeId: string, cableType: string, edges: SchemaEdge[]): Set<string> {
  const visited = new Set<string>([startId]);
  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const e of edges) {
      if (e.id === excludeEdgeId || e.data?.cableType !== cableType) continue;
      const otherId = e.source === id ? e.target : e.target === id ? e.source : null;
      if (otherId && !visited.has(otherId)) {
        visited.add(otherId);
        queue.push(otherId);
      }
    }
  }
  return visited;
}

function sumConsumerWattage(ids: Set<string>, nodes: SchemaNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (ids.has(node.id) && node.data.componentType === "consumer") total += Number(node.data.powerW) || 0;
  }
  return total;
}

function hasSource(ids: Set<string>, nodes: SchemaNode[]): boolean {
  return nodes.some((n) => ids.has(n.id) && SOURCE_TYPES.has(n.data.componentType));
}

function getEdgeLoadSide(edge: SchemaEdge, nodes: SchemaNode[], edges: SchemaEdge[]): Set<string> | null {
  const cableType = edge.data?.cableType;
  if (!isPowerCableType(cableType)) return null;

  const sourceSide = reachableSameCableType(edge.source, edge.id, cableType, edges);
  const targetSide = reachableSameCableType(edge.target, edge.id, cableType, edges);
  const sourceHasBattery = hasSource(sourceSide, nodes);
  const targetHasBattery = hasSource(targetSide, nodes);

  if (sourceHasBattery && !targetHasBattery) return targetSide;
  if (targetHasBattery && !sourceHasBattery) return sourceSide;
  return null;
}

function getEdgeProtectionReferenceAmps(edge: SchemaEdge, nodes: SchemaNode[], loadSide: Set<string> | null): number | null {
  const adjacentProtectionAmps = Math.max(
    getProtectionAmperage(nodes.find((node) => node.id === edge.source)) ?? 0,
    getProtectionAmperage(nodes.find((node) => node.id === edge.target)) ?? 0,
  );

  const downstreamProtectionAmps = Math.max(
    0,
    ...(loadSide
      ? nodes
          .filter((node) => loadSide.has(node.id))
          .map((node) => getProtectionAmperage(node) ?? 0)
      : []),
  );

  const protectionAmps = Math.max(adjacentProtectionAmps, downstreamProtectionAmps);
  return protectionAmps > 0 ? protectionAmps : null;
}

// Ampérage estimé traversant CE câble précis : la somme de puissance de
// tous les consommateurs situés du côté "charge" (pas seulement un
// consommateur directement raccordé aux deux bouts) — c'est ce qui permet
// de dimensionner un câble batterie → coupe-circuit → platine de
// distribution, qui ne touche jamais un consommateur directement mais
// transporte pourtant le courant cumulé de tout ce qui est en aval.
export function estimateEdgeAmps(edge: SchemaEdge, nodes: SchemaNode[], edges: SchemaEdge[]): number | null {
  const cableType = edge.data?.cableType;
  if (!isPowerCableType(cableType)) return null;

  const loadSide = getEdgeLoadSide(edge, nodes, edges);
  if (!loadSide) return null;

  const totalW = sumConsumerWattage(loadSide, nodes);
  if (totalW <= 0) return null;
  return totalW / findBatteryVoltage(nodes);
}

// Diagnostic de section pour un câble de puissance précis : utilisé à la
// fois par le recalcul en masse et par les rappels "À vérifier", pour
// garder exactement la même logique métier partout. Règle métier ajoutée :
// pour le câblage principal, un fusible/disjoncteur principal présent sert
// de référence prioritaire s'il autorise plus de courant que la charge aval
// actuellement connue.
export function evaluateEdgeSection(edge: SchemaEdge, nodes: SchemaNode[], edges: SchemaEdge[]): EdgeSectionDiagnostic | null {
  if (!isPowerCableType(edge.data?.cableType)) return null;

  const loadSide = getEdgeLoadSide(edge, nodes, edges);
  const loadAmps = estimateEdgeAmps(edge, nodes, edges);
  const protectionAmps = getEdgeProtectionReferenceAmps(edge, nodes, loadSide);
  const amps = Math.max(loadAmps ?? 0, protectionAmps ?? 0);
  if (amps <= 0) return null;

  const voltage = findBatteryVoltage(nodes);
  const length = getEdgeSizingLength(edge, nodes);
  const { section } = calcSection(amps, length, 3, voltage);
  const currentSectionMm2 = parseSectionMm2(edge.data?.section);

  return {
    amps,
    loadAmps,
    protectionAmps,
    ampsSource: protectionAmps !== null && protectionAmps > (loadAmps ?? 0) ? "protection" : "load",
    voltage,
    length,
    recommendedSectionMm2: section,
    recommendedSectionLabel: formatSectionLabel(section),
    currentSectionMm2,
    currentSectionLabel: edge.data?.section ? String(edge.data.section) : null,
    status: currentSectionMm2 === null ? "missing" : currentSectionMm2 < section ? "undersized" : "ok",
  };
}

// Recalcule la section de tous les câbles de puissance DC (batterie,
// protection, distribution, consommateurs confondus — voir
// `estimateEdgeAmps` ci-dessus) — inchangé pour le secteur AC, les terres
// et les bus de données (VE.Direct), dont le dimensionnement ne suit pas
// cette formule, et pour les câbles qu'on ne sait pas estimer (aucun
// consommateur de puissance connue en aval).
export function recalculateCableSections(
  nodes: SchemaNode[],
  edges: SchemaEdge[],
): { edges: SchemaEdge[]; updatedCount: number } {
  let updatedCount = 0;

  const nextEdges = edges.map((edge) => {
    const diagnostic = evaluateEdgeSection(edge, nodes, edges);
    if (!diagnostic) return edge;
    if (edge.data?.section === diagnostic.recommendedSectionLabel) return edge;
    updatedCount += 1;
    return { ...edge, data: { ...edge.data, section: diagnostic.recommendedSectionLabel } };
  });

  return { edges: nextEdges, updatedCount };
}

// Recalcule le calibre de tous les fusibles/disjoncteurs dont le courant en
// aval peut être estimé — même règle (marge 25 %) que la suggestion
// débutant affichée dans le panneau propriétés.
export function recalculateFuseRatings(
  nodes: SchemaNode[],
  edges: SchemaEdge[],
): { nodes: SchemaNode[]; updatedCount: number } {
  let updatedCount = 0;

  const nextNodes = nodes.map((node) => {
    if (node.data.componentType !== "fuse" && node.data.componentType !== "circuit-breaker") return node;
    const amps = estimateConnectedAmps(node.id, nodes, edges);
    if (amps === null) return node;
    const rating = AVAILABLE_FUSES_A.find((f) => f >= amps * 1.25);
    if (!rating || node.data.amperage === rating) return node;
    updatedCount += 1;
    return { ...node, data: { ...node.data, amperage: rating } };
  });

  return { nodes: nextNodes, updatedCount };
}
