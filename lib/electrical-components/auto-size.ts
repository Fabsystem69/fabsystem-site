import type { Node, Edge } from "@xyflow/react";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";
import { calcSection, calcSectionSafe, AVAILABLE_FUSES_A, AVAILABLE_SECTIONS_MM2, CONTINUOUS_LOAD_MARGIN, pickSectionForAmpacity } from "@/lib/calc/section-cable";
import { INVERTER_EFFICIENCY } from "@/lib/calc/inverter-size";
import { CHARGER_EFFICIENCY, MAINS_VOLTAGE_V } from "@/lib/calc/charge-secteur";
import { getEdgeDefaultLength } from "@/lib/electrical-components/cable-lengths";
import { getBrandModel } from "@/lib/electrical-components/brand-models";

// Correctif sécurité (retour client : incohérences dangereuses relevées sur
// des sections de câble, notamment DC-DC et MultiPlus) : `calcSection` ne
// vérifie QUE la chute de tension, jamais l'ampacité (le courant maximal
// qu'un câble supporte sans surchauffer) — un câble très court à fort
// courant (batterie, DC-DC, onduleur) peut satisfaire la chute de tension
// avec une section dangereusement insuffisante pour le courant réel. Même
// principe que le calculateur public déjà correct (lib/calc/wire-size.ts,
// "recommande la section la PLUS GRANDE entre ampacité et chute de
// tension"), appliqué ici au moteur de l'éditeur de schéma.

/** Marge réglementaire sur un circuit continu ≥3h — même convention que
 * lib/calc/wire-size.ts (CONTINUOUS_MARGIN) et ISO 10133
 * (continuousLoadFactor). Toujours appliquée ici : un circuit embarqué
 * (batterie, DC-DC, onduleur) est traité comme continu par défaut, jamais
 * comme un cas favorable non démontré — retour client : "on joue toujours
 * sécurité". Alias de lib/calc/section-cable.ts (CONTINUOUS_LOAD_MARGIN,
 * même constante) : conservé sous ce nom pour ne pas casser les imports
 * existants dans ce fichier et dans les popups de suggestion. */
export const CONTINUOUS_MARGIN = CONTINUOUS_LOAD_MARGIN;

/** Chute de tension maximale visée, en % — Victron Energy, "Wiring
 * Unlimited" (rev02, 08/2024), p.10 et p.22 : "we advise aiming for a
 * voltage drop no bigger than 2.5%" / "You should aim for a voltage drop
 * below 2.5%". Remplace l'ancien seuil de 3% (EN 1648-2) : Victron est le
 * fabricant le plus représenté dans le catalogue de l'éditeur, sa propre
 * recommandation devient la référence par défaut. */
export const DC_MAX_VOLTAGE_DROP_PCT = 2.5;

// pickSectionForAmpacity ré-exportée depuis lib/calc/section-cable.ts (import
// ci-dessus) — retour utilisateur (bug relevé sur un cas réel : 120 A, 1 m,
// 12 V → recommandait 16 mm² au lieu de 35 mm² nécessaires) : les popups
// interactives de suggestion (SizingPopup.tsx `CableSizingPopup`,
// ItemPropertiesPopup.tsx `SectionSuggestion`) et plusieurs calculateurs
// publics (MpptCalculator.tsx, lib/calc/inverter-size.ts,
// lib/calc/battery-bank.ts) appelaient `calcSection` seule — donc
// uniquement la chute de tension, jamais l'ampacité. Tous utilisent
// désormais `calcSectionSafe`/`pickSectionForAmpacity` du même module
// canonique, pour ne plus jamais dupliquer cette logique de sécurité.
export { pickSectionForAmpacity };

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
  sourceAmps: number | null;
  ampsSource: "load" | "protection" | "charger" | "solar";
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

export function isPowerCableType(value: string | undefined): value is PowerCableType {
  return value === "power-positive" || value === "power-negative";
}

export function formatSectionLabel(sectionMm2: number): string {
  return `${String(sectionMm2).replace(".", ",")} mm²`;
}

export function parseSectionMm2(section: string | undefined): number | null {
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

const PV_PASSTHROUGH_TYPES = new Set(["solar-panel", "fuse", "circuit-breaker", "busbar"]);
const PV_REGULATOR_TYPES = new Set(["mppt", "pwm", "easysolar"]);
// Isc est le courant maximal du module. Une marge de conception de 25 %
// évite de dimensionner un conducteur PV exactement à sa valeur STC.
const PV_DESIGN_CURRENT_FACTOR = 1.25;

function isPvTerminal(node: SchemaNode | undefined, handle: string | null | undefined): boolean {
  if (!node) return false;
  return node.data.componentType === "solar-panel" || (PV_REGULATOR_TYPES.has(node.data.componentType) && Boolean(handle?.startsWith("pv-")));
}

function isPvCircuitEdge(edge: SchemaEdge, nodes: SchemaNode[]): boolean {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  return isPvTerminal(source, edge.sourceHandle) || isPvTerminal(target, edge.targetHandle);
}

// Remonte le sous-réseau PV autour du câble sans traverser le MPPT : un
// fusible ou un busbar PV est traversé, mais jamais le régulateur vers la
// batterie. Cela permet de distinguer une chaîne série d'un vrai parallèle.
function collectPvPanelsForEdge(edge: SchemaEdge, nodes: SchemaNode[], edges: SchemaEdge[]): SchemaNode[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const queue = [edge.source, edge.target].filter((id) => PV_PASSTHROUGH_TYPES.has(nodeById.get(id)?.data.componentType ?? ""));

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const candidate of edges) {
      const otherId = candidate.source === id ? candidate.target : candidate.target === id ? candidate.source : null;
      if (!otherId || visited.has(otherId)) continue;
      const other = nodeById.get(otherId);
      if (other && PV_PASSTHROUGH_TYPES.has(other.data.componentType)) queue.push(otherId);
    }
  }

  return nodes.filter((node) => visited.has(node.id) && node.data.componentType === "solar-panel");
}

function collectSolarStrings(panels: SchemaNode[], edges: SchemaEdge[]): SchemaNode[][] {
  const panelIds = new Set(panels.map((panel) => panel.id));
  const strings: SchemaNode[][] = [];
  const visited = new Set<string>();

  for (const panel of panels) {
    if (visited.has(panel.id)) continue;
    const string: SchemaNode[] = [];
    const queue = [panel.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const current = panels.find((candidate) => candidate.id === id);
      if (current) string.push(current);
      for (const edge of edges) {
        const otherId = edge.source === id ? edge.target : edge.target === id ? edge.source : null;
        if (otherId && panelIds.has(otherId) && !visited.has(otherId)) queue.push(otherId);
      }
    }
    if (string.length > 0) strings.push(string);
  }
  return strings;
}

function evaluatePvEdgeSection(edge: SchemaEdge, nodes: SchemaNode[], edges: SchemaEdge[]): EdgeSectionDiagnostic | null {
  if (!isPowerCableType(edge.data?.cableType) || !isPvCircuitEdge(edge, nodes)) return null;
  const strings = collectSolarStrings(collectPvPanelsForEdge(edge, nodes, edges), edges);
  if (strings.length === 0) return null;

  const details = strings.map((string) => ({
    isc: Math.min(...string.map((panel) => Number(panel.data.shortCircuitCurrentA) || 0)),
    vmp: string.reduce((sum, panel) => sum + (Number(panel.data.voltage) || 0), 0),
  }));
  if (details.some((detail) => detail.isc <= 0 || detail.vmp <= 0)) return null;

  const amps = details.reduce((sum, detail) => sum + detail.isc, 0) * PV_DESIGN_CURRENT_FACTOR;
  const voltage = Math.min(...details.map((detail) => detail.vmp));
  const length = getEdgeSizingLength(edge, nodes);
  // Un fusible/disjoncteur posé sur ce câble PV doit rester couvert par
  // l'ampacité retenue, même si son calibre dépasse le courant réel de la
  // chaîne (retour client : disjoncteur 40 A laissé sur un câble dimensionné
  // pour ~9 A de courant PV réel — même trou de sécurité que côté DC
  // général). `amps` intègre déjà la marge de conception PV (×1,25 sur Isc),
  // jamais margé une seconde fois ; le calibre de protection, lui, reçoit la
  // même marge circuit continu que partout ailleurs (CONTINUOUS_MARGIN).
  const adjacentProtectionA = Math.max(
    getProtectionAmperage(nodes.find((n) => n.id === edge.source)) ?? 0,
    getProtectionAmperage(nodes.find((n) => n.id === edge.target)) ?? 0,
  );
  const ampacityDesignA = Math.max(amps, adjacentProtectionA * CONTINUOUS_MARGIN);
  const { section: dropSectionMm2 } = calcSection(amps, length, DC_MAX_VOLTAGE_DROP_PCT, voltage);
  const section = Math.max(pickSectionForAmpacity(ampacityDesignA), dropSectionMm2);
  const currentSectionMm2 = parseSectionMm2(edge.data?.section);

  return {
    amps,
    loadAmps: null,
    protectionAmps: null,
    sourceAmps: null,
    ampsSource: "solar",
    voltage,
    length,
    recommendedSectionMm2: section,
    recommendedSectionLabel: formatSectionLabel(section),
    currentSectionMm2,
    currentSectionLabel: edge.data?.section ? String(edge.data.section) : null,
    status: currentSectionMm2 === null ? "missing" : currentSectionMm2 < section ? "undersized" : "ok",
  };
}

// Courant DC appelé côté batterie par un appareil qui inverse (12/24/48V →
// 230V) — même formule que le calculateur public (lib/calc/inverter-size.ts,
// INVERTER_EFFICIENCY). Bug relevé par le client : le câble batterie d'un
// MultiPlus n'était dimensionné que sur son courant de CHARGE (chargeAmperage,
// utilisé uniquement branché au secteur), jamais sur son appel réel en
// fonctionnement onduleur — largement supérieur pour un modèle puissant
// (ex. MultiPlus 12/3000/120 : 120 A de charge, mais ≈220 A en onduleur
// plein régime). Le câble doit couvrir le pire des deux sens (voir
// `getSourceAmperage` ci-dessous, cas "inverter"/"inverter-charger"/"easysolar").
function getInverterDcCurrentA(node: SchemaNode, nodes: SchemaNode[]): number {
  const powerW = Number(node.data.powerW) || 0;
  if (powerW <= 0) return 0;
  const voltage = findBatteryVoltage(nodes);
  return voltage > 0 ? powerW / voltage / INVERTER_EFFICIENCY : 0;
}

// Ampérage nominal propre d'une source/chargeur (bug critique retour bêta :
// "j'ai un orion xs 50 situé à 4,2m de ma batterie lithium et ça me met en
// cable seulement 16mm2") — jusqu'ici `estimateEdgeAmps` ne connaissait que
// la puissance des consommateurs en aval, jamais l'ampérage propre du
// chargeur qui alimente la batterie (aucun consommateur entre batterie et
// DC-DC/MPPT/alternateur), donc un câble batterie ↔ chargeur sans fusible
// calibré juste à côté se voyait sous-dimensionné. Chaque type a son propre
// nom de champ ampérage (voir definitions.ts : "amperage" pour dcdc/mppt/
// pwm/solar-router/alternateur, "chargeAmperage" pour ac-charger/inverter-
// charger, les deux pour easysolar qui cumule MPPT + chargeur secteur).
function getSourceAmperage(node: SchemaNode | undefined, nodes: SchemaNode[]): number | null {
  if (!node) return null;
  switch (node.data.componentType) {
    case "dcdc":
    case "mppt":
    case "pwm":
    case "solar-router":
    case "alternator": {
      const amperage = Number(node.data.amperage) || 0;
      return amperage > 0 ? amperage : null;
    }
    case "inverter": {
      const amperage = getInverterDcCurrentA(node, nodes);
      return amperage > 0 ? amperage : null;
    }
    case "ac-charger": {
      const amperage = Number(node.data.chargeAmperage) || 0;
      return amperage > 0 ? amperage : null;
    }
    case "inverter-charger": {
      const amperage = Math.max(Number(node.data.chargeAmperage) || 0, getInverterDcCurrentA(node, nodes));
      return amperage > 0 ? amperage : null;
    }
    case "easysolar": {
      const amperage = Math.max(
        Number(node.data.chargeAmperage) || 0,
        Number(node.data.mpptAmperage) || 0,
        getInverterDcCurrentA(node, nodes),
      );
      return amperage > 0 ? amperage : null;
    }
    default:
      return null;
  }
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

// Les centrales ont une alimentation DC propre, au même titre qu'un
// consommateur. Les autres appareils actifs (MPPT, chargeurs, onduleurs)
// gardent volontairement leur traitement spécialisé: leur `powerW` décrit
// une capacité de conversion, pas leur consommation à vide.
function getLoadPowerW(node: SchemaNode): number {
  if (node.data.componentType !== "consumer" && node.data.componentType !== "system-controller") return 0;

  // Une résistance 230 V ne doit jamais être convertie en courant 12 V.
  // Pour les appareils mixtes, seule la branche 12 V est prise en compte
  // pendant le dimensionnement des câbles DC.
  if (node.data.componentType === "consumer" && node.data.supplyType === "230v") return 0;

  const declaredPower = Number(node.data.powerW) || 0;
  if (declaredPower > 0) return declaredPower;

  const modelId = typeof node.data.brandModelId === "string" ? node.data.brandModelId : "";
  return Number(getBrandModel(modelId)?.defaults.powerW) || 0;
}

function sumConsumerWattage(ids: Set<string>, nodes: SchemaNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (ids.has(node.id)) total += getLoadPowerW(node);
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

// Même patron que `getEdgeProtectionReferenceAmps` ci-dessus, pour la
// référence source/chargeur (voir `getSourceAmperage`) : le câble batterie
// ↔ chargeur direct capte l'ampérage via `adjacentSourceAmps`, un câble en
// amont (ex. batterie → busbar, avant le chargeur) le capte via
// `downstreamSourceAmps` puisque le nœud chargeur fait partie de son
// `loadSide`.
function getEdgeSourceReferenceAmps(edge: SchemaEdge, nodes: SchemaNode[], loadSide: Set<string> | null): number | null {
  const adjacentSourceAmps = Math.max(
    getSourceAmperage(nodes.find((node) => node.id === edge.source), nodes) ?? 0,
    getSourceAmperage(nodes.find((node) => node.id === edge.target), nodes) ?? 0,
  );

  const downstreamSourceAmps = Math.max(
    0,
    ...(loadSide
      ? nodes
          .filter((node) => loadSide.has(node.id))
          .map((node) => getSourceAmperage(node, nodes) ?? 0)
      : []),
  );

  const sourceAmps = Math.max(adjacentSourceAmps, downstreamSourceAmps);
  return sourceAmps > 0 ? sourceAmps : null;
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
  if (!loadSide) {
    // Un départ consommateur peut être dimensionné dès le début du dessin,
    // avant que la batterie ou le reste du réseau soit ajouté. Le calcul
    // utilise alors la tension 12 V par défaut, comme partout ailleurs.
    const directConsumer = nodes.find(
      (node) => (node.id === edge.source || node.id === edge.target) && getLoadPowerW(node) > 0,
    );
    const powerW = directConsumer ? getLoadPowerW(directConsumer) : 0;
    return powerW > 0 ? powerW / findBatteryVoltage(nodes) : null;
  }

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

  const pvDiagnostic = evaluatePvEdgeSection(edge, nodes, edges);
  if (pvDiagnostic) return pvDiagnostic;

  const loadSide = getEdgeLoadSide(edge, nodes, edges);
  const loadAmps = estimateEdgeAmps(edge, nodes, edges);
  const protectionAmps = getEdgeProtectionReferenceAmps(edge, nodes, loadSide);
  const sourceAmps = getEdgeSourceReferenceAmps(edge, nodes, loadSide);
  const amps = Math.max(loadAmps ?? 0, protectionAmps ?? 0, sourceAmps ?? 0);
  if (amps <= 0) return null;

  const voltage = findBatteryVoltage(nodes);
  const length = getEdgeSizingLength(edge, nodes);
  // calcSectionSafe : chute de tension sur le courant réel (non margé,
  // même convention que lib/calc/wire-size.ts), ampacité sur le courant de
  // dimensionnement (×1,25, circuit continu) — la plus grande des deux,
  // jamais la chute de tension seule.
  const { section } = calcSectionSafe(amps, length, DC_MAX_VOLTAGE_DROP_PCT, voltage);
  const currentSectionMm2 = parseSectionMm2(edge.data?.section);

  const ampsSource: EdgeSectionDiagnostic["ampsSource"] =
    sourceAmps !== null && sourceAmps >= (protectionAmps ?? 0) && sourceAmps > (loadAmps ?? 0)
      ? "charger"
      : protectionAmps !== null && protectionAmps > (loadAmps ?? 0)
        ? "protection"
        : "load";

  return {
    amps,
    loadAmps,
    protectionAmps,
    sourceAmps,
    ampsSource,
    voltage,
    length,
    recommendedSectionMm2: section,
    recommendedSectionLabel: formatSectionLabel(section),
    currentSectionMm2,
    currentSectionLabel: edge.data?.section ? String(edge.data.section) : null,
    status: currentSectionMm2 === null ? "missing" : currentSectionMm2 < section ? "undersized" : "ok",
  };
}

// ─── Câblage AC (secteur 230V) ──────────────────────────────────────────
// Gap identifié à l'audit : aucune section de câble AC n'était jamais
// vérifiée, uniquement le DC. Méthode distincte de la formule DC
// (résistivité + chute de tension) : Victron Energy, "Wiring Unlimited"
// (rev02, 08/2024), p.54, donne un rule-of-thumb dédié à l'AC, assumé
// comme tel par le fabricant lui-même ("might not meet your local AC
// wiring standards... meant as a guide only") — pas de moteur générique
// commun avec le DC, la méthode AC est fondamentalement différente.

const AC_SOURCE_TYPES = new Set(["inverter", "inverter-charger", "easysolar", "ac-charger", "shore-power", "power-station"]);

// Puissance AC d'un consommateur — même filtrage que `getLoadPowerW` côté
// DC, miroir exact pour la branche 230V (supplyType "230v" ou "mixed").
function getAcLoadPowerW(node: SchemaNode): number {
  if (node.data.componentType !== "consumer") return 0;
  if (node.data.supplyType !== "230v" && node.data.supplyType !== "mixed") return 0;
  return Number(node.data.power230VW) || 0;
}

// Ampérage AC propre d'une source/chargeur adjacent — un onduleur/
// onduleur-chargeur tire son courant AC de sa puissance nominale
// (powerW / 230V) ; un chargeur secteur le tire de son courant de charge
// DC converti côté secteur (même formule que lib/calc/charge-secteur.ts,
// CHARGER_EFFICIENCY). `shore-power` n'a pas de calibre propre déclaré
// dans l'éditeur : son courant vient uniquement de ce qu'il alimente en
// aval (voir estimateAcEdgeAmps).
function getAcSourceAmperage(node: SchemaNode | undefined): number | null {
  if (!node) return null;
  switch (node.data.componentType) {
    case "inverter":
    case "inverter-charger":
    case "easysolar": {
      const powerW = Number(node.data.powerW) || 0;
      return powerW > 0 ? powerW / MAINS_VOLTAGE_V : null;
    }
    case "ac-charger": {
      const chargeAmperage = Number(node.data.chargeAmperage) || 0;
      const voltageDC = Number(node.data.voltageDC) || 12;
      if (chargeAmperage <= 0) return null;
      return (chargeAmperage * voltageDC) / CHARGER_EFFICIENCY / MAINS_VOLTAGE_V;
    }
    default:
      return null;
  }
}

function hasAcSource(ids: Set<string>, nodes: SchemaNode[]): boolean {
  return nodes.some((n) => ids.has(n.id) && AC_SOURCE_TYPES.has(n.data.componentType));
}

// Même patron que `getEdgeLoadSide` (DC) — cableType "ac-230v" et jeu de
// types "source" propre à l'AC, `reachableSameCableType` reste identique
// (déjà générique par cableType).
function getAcEdgeLoadSide(edge: SchemaEdge, nodes: SchemaNode[], edges: SchemaEdge[]): Set<string> | null {
  if (edge.data?.cableType !== "ac-230v") return null;

  const sourceSide = reachableSameCableType(edge.source, edge.id, "ac-230v", edges);
  const targetSide = reachableSameCableType(edge.target, edge.id, "ac-230v", edges);
  const sourceHasSource = hasAcSource(sourceSide, nodes);
  const targetHasSource = hasAcSource(targetSide, nodes);

  if (sourceHasSource && !targetHasSource) return targetSide;
  if (targetHasSource && !sourceHasSource) return sourceSide;
  return null;
}

function sumAcConsumerWattage(ids: Set<string>, nodes: SchemaNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (ids.has(node.id)) total += getAcLoadPowerW(node);
  }
  return total;
}

// Ampérage AC estimé traversant ce câble précis — miroir de
// `estimateEdgeAmps` (DC) : somme des consommateurs 230V côté charge, avec
// repli sur un consommateur directement raccordé puis sur l'ampérage propre
// de la source adjacente quand aucune consommation avale n'est encore
// connue (schéma en cours de construction, ou câble amont d'une source sans
// détail des consommateurs qu'elle alimente).
export function estimateAcEdgeAmps(edge: SchemaEdge, nodes: SchemaNode[], edges: SchemaEdge[]): number | null {
  if (edge.data?.cableType !== "ac-230v") return null;

  const loadSide = getAcEdgeLoadSide(edge, nodes, edges);
  if (!loadSide) {
    const directConsumer = nodes.find(
      (node) => (node.id === edge.source || node.id === edge.target) && getAcLoadPowerW(node) > 0,
    );
    if (directConsumer) return getAcLoadPowerW(directConsumer) / MAINS_VOLTAGE_V;

    const adjacentSourceA = Math.max(
      getAcSourceAmperage(nodes.find((n) => n.id === edge.source)) ?? 0,
      getAcSourceAmperage(nodes.find((n) => n.id === edge.target)) ?? 0,
    );
    return adjacentSourceA > 0 ? adjacentSourceA : null;
  }

  const totalW = sumAcConsumerWattage(loadSide, nodes);
  if (totalW > 0) return totalW / MAINS_VOLTAGE_V;

  // Aucun consommateur connu en aval (ex. tableau pas encore câblé plus
  // loin) : se rabat sur l'ampérage propre de la source adjacente à CE
  // câble précis — le câble sortant d'un onduleur doit couvrir son plein
  // régime même si rien n'est encore câblé derrière le tableau. Bug
  // corrigé : l'ancienne version ne regardait que les nœuds du "loadSide"
  // (le tableau, jamais une source), donc ne trouvait jamais rien ici.
  const adjacentSourceA = Math.max(
    getAcSourceAmperage(nodes.find((n) => n.id === edge.source)) ?? 0,
    getAcSourceAmperage(nodes.find((n) => n.id === edge.target)) ?? 0,
  );
  return adjacentSourceA > 0 ? adjacentSourceA : null;
}

/** Section AC minimale (mm²) — Victron "Wiring Unlimited" p.54 : courant
 * nominal ÷ 8, puis +1 mm² par tranche de 5 m de câble (arrondi au
 * supérieur — un début de tranche compte entièrement, prudence). */
function computeAcSectionMm2(currentA: number, oneWayLengthM: number): number {
  const rawSectionMm2 = currentA / 8 + Math.ceil(oneWayLengthM / 5);
  const row = AVAILABLE_SECTIONS_MM2.find((s) => s >= rawSectionMm2);
  return row ?? AVAILABLE_SECTIONS_MM2[AVAILABLE_SECTIONS_MM2.length - 1];
}

export function evaluateAcEdgeSection(edge: SchemaEdge, nodes: SchemaNode[], edges: SchemaEdge[]): EdgeSectionDiagnostic | null {
  if (edge.data?.cableType !== "ac-230v") return null;

  const amps = estimateAcEdgeAmps(edge, nodes, edges);
  if (!amps || amps <= 0) return null;

  const length = getEdgeSizingLength(edge, nodes);
  const section = computeAcSectionMm2(amps, length);
  const currentSectionMm2 = parseSectionMm2(edge.data?.section);

  return {
    amps,
    loadAmps: amps,
    protectionAmps: null,
    sourceAmps: null,
    ampsSource: "load",
    voltage: MAINS_VOLTAGE_V,
    length,
    recommendedSectionMm2: section,
    recommendedSectionLabel: formatSectionLabel(section),
    currentSectionMm2,
    currentSectionLabel: edge.data?.section ? String(edge.data.section) : null,
    status: currentSectionMm2 === null ? "missing" : currentSectionMm2 < section ? "undersized" : "ok",
  };
}

// Un cran en dessous de `current` dans l'échelle standard (retour
// utilisateur : "si la ligne est sur-calibrée tu n'as le droit de descendre
// que d'une section, exemple 6mm tu diminues que jusqu'à 4mm pas en
// dessous") — ne s'applique qu'à la baisse : monter reste sans limite,
// seule une réduction agressive en un seul recalcul est jugée risquée (une
// section volontairement surdimensionnée par l'utilisateur, ex. pour une
// extension future, ne doit pas être ramenée d'un coup au strict minimum
// théorique). Valeur hors échelle standard (saisie manuelle) : aucune
// réduction autorisée, par prudence.
function stepDownOnceMm2(current: number): number {
  const idx = AVAILABLE_SECTIONS_MM2.indexOf(current);
  if (idx <= 0) return current;
  return AVAILABLE_SECTIONS_MM2[idx - 1];
}

// Recalcule la section de tous les câbles de puissance DC (batterie,
// protection, distribution, consommateurs confondus — voir
// `estimateEdgeAmps` ci-dessus) et AC (voir `estimateAcEdgeAmps`, méthode
// dédiée) — inchangé pour les terres et les bus de données (VE.Direct),
// dont le dimensionnement ne suit aucune de ces deux formules, et pour les
// câbles qu'on ne sait pas estimer (aucun consommateur de puissance connue
// en aval, ni source AC/DC adjacente).
export function recalculateCableSections(
  nodes: SchemaNode[],
  edges: SchemaEdge[],
): { edges: SchemaEdge[]; updatedCount: number } {
  let updatedCount = 0;

  const nextEdges = edges.map((edge) => {
    const diagnostic = evaluateEdgeSection(edge, nodes, edges) ?? evaluateAcEdgeSection(edge, nodes, edges);
    if (!diagnostic) return edge;

    let targetMm2 = diagnostic.recommendedSectionMm2;
    if (diagnostic.currentSectionMm2 !== null && targetMm2 < diagnostic.currentSectionMm2) {
      targetMm2 = Math.max(targetMm2, stepDownOnceMm2(diagnostic.currentSectionMm2));
    }
    const targetLabel = formatSectionLabel(targetMm2);

    if (edge.data?.section === targetLabel) return edge;
    updatedCount += 1;
    return { ...edge, data: { ...edge.data, section: targetLabel } };
  });

  return { edges: nextEdges, updatedCount };
}

// Même principe que `stepDownOnceMm2` mais pour l'échelle des calibres de
// fusible/disjoncteur.
function stepDownOnceFuseA(current: number): number {
  const idx = AVAILABLE_FUSES_A.indexOf(current);
  if (idx <= 0) return current;
  return AVAILABLE_FUSES_A[idx - 1];
}

// Recalcule le calibre de tous les fusibles/disjoncteurs dont le courant en
// aval peut être estimé — même règle (marge 25 %) que la suggestion
// débutant affichée dans le panneau propriétés, et même prudence à la
// baisse qu'un recalcul de section (retour utilisateur : un calibre
// sur-dimensionné ne descend que d'un cran par recalcul, jamais plus).
export function recalculateFuseRatings(
  nodes: SchemaNode[],
  edges: SchemaEdge[],
): { nodes: SchemaNode[]; updatedCount: number } {
  let updatedCount = 0;

  const nextNodes = nodes.map((node) => {
    if (node.data.componentType !== "fuse" && node.data.componentType !== "circuit-breaker") return node;
    const amps = estimateConnectedAmps(node.id, nodes, edges);
    if (amps === null) return node;
    let rating = AVAILABLE_FUSES_A.find((f) => f >= amps * 1.25);
    if (!rating) return node;
    const currentRating = Number(node.data.amperage) || 0;
    if (currentRating > 0 && rating < currentRating) {
      rating = Math.max(rating, stepDownOnceFuseA(currentRating));
    }
    if (node.data.amperage === rating) return node;
    updatedCount += 1;
    return { ...node, data: { ...node.data, amperage: rating } };
  });

  return { nodes: nextNodes, updatedCount };
}
