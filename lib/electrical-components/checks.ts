import { getComponentDefinition, getEffectiveHandles } from "./definitions";
import { estimateConnectedAmps, evaluateEdgeSection } from "./auto-size";
import type { ElectricalNodeData, CableEdgeData, HandleKind } from "@/types/schema";
import type { Node, Edge } from "@xyflow/react";

export type SchemaIssueAction = "recalculate-all-cable-sections";
export type SchemaIssueSeverity = "error" | "warning" | "info";
export type SchemaIssueCategory = "topology" | "connection" | "protection" | "cabling" | "solar" | "ac-safety";

export interface SchemaIssueReference {
  label: string;
  sourceUrl?: string;
  edition?: string;
  clause?: string;
}

export interface SchemaIssue {
  id: string;
  targetKind: "node" | "edge";
  targetId: string;
  message: string;
  /** Les anciennes regles restent des avertissements tant qu'elles n'ont pas
   * ete revalidees une a une avec leur source primaire. */
  severity?: SchemaIssueSeverity;
  category?: SchemaIssueCategory;
  reference?: SchemaIssueReference;
  action?: SchemaIssueAction;
}

type SchemaNodeInternal = Node<ElectricalNodeData>;
type SchemaEdgeInternal = Edge<CableEdgeData>;

// Le panneau global et chaque vignette de composant consultent les mêmes
// contrôles. Le store remplace les tableaux à chaque modification, ce cache
// par référence garantit donc un calcul unique par état du schéma, même avec
// plusieurs dizaines de composants visibles.
let cachedNodes: SchemaNodeInternal[] | null = null;
let cachedEdges: SchemaEdgeInternal[] | null = null;
let cachedIssues: SchemaIssue[] | null = null;

function classifyIssues(
  issues: SchemaIssue[],
  defaults: Pick<SchemaIssue, "severity" | "category">,
): SchemaIssue[] {
  return issues.map((issue) => ({ ...defaults, ...issue }));
}

// V2 — règles électriques indicatives (retour d'analyse concurrentielle :
// Wireframe signale "pas de fusible principal", "MPPT sans protection",
// "pas de masse dans le système" en plus des contrôles structurels).
// Décision produit : on les ajoute, mais toujours comme rappels dans le
// même panneau "À vérifier" — jamais un blocage, jamais présenté comme une
// certification ou une validation réglementaire (CDC §31, §37).
//
// La détection reste volontairement tolérante (recherche sur 2 sauts, en
// traversant les busbars/platines comme de simples jonctions) plutôt qu'une
// vraie analyse de circuit : assez pour attraper l'oubli évident montré en
// démo concurrente, pas assez pour prétendre à une vérification complète.

const PASSTHROUGH_TYPES = new Set(["busbar", "battery-switch", "battery-protect"]);
// Lynx Smart BMS coupe automatiquement la batterie en cas de défaut : même
// rôle protecteur qu'un fusible/disjoncteur pour cette détection.
const PROTECTION_TYPES = new Set(["fuse", "circuit-breaker", "fuse-block", "distribution-panel", "lynx-smart-bms", "lynx-power-in", "lynx-distributor", "mini-bms"]);

// Bornes de sortie « charge » à protéger avant la batterie, par type de
// composant source.
const CHARGE_SOURCE_OUTPUT_HANDLE: Record<string, string> = {
  mppt: "bat-positive",
  // Audit : oublié jusqu'ici alors qu'un régulateur PWM charge la batterie
  // exactement comme un MPPT (même borne BAT+) — un PWM câblé sans
  // protection avant la batterie n'était jamais signalé.
  pwm: "bat-positive",
  dcdc: "out-positive",
  "ac-charger": "bat-positive",
  alternator: "positive",
  "wind-turbine": "positive",
};

const AC_COMPONENT_TYPES = new Set(["ac-panel", "socket-220v", "ac-charger", "inverter", "inverter-charger", "shore-power", "power-station", "easysolar", "ac-transfer-switch"]);

// Resout la polarite reelle d'une borne (via resolveHandleKind si le
// composant en a un, ex. busbar +/− configurable) — reutilise par
// computePolarityIssues ici et par CableEdge.tsx pour l'avertissement
// visuel direct sur le cable, une seule logique pour les deux.
export function resolveHandleKindForNode(
  node: SchemaNodeInternal | undefined,
  handleId: string | null | undefined,
): HandleKind | undefined {
  if (!node || !handleId) return undefined;
  const def = getComponentDefinition(node.data.componentType);
  if (!def) return undefined;
  const handleDef = getEffectiveHandles(def, node.data).find((h) => h.id === handleId);
  if (!handleDef) return undefined;
  return def.resolveHandleKind ? def.resolveHandleKind(node.data, handleDef) : handleDef.kind;
}

// Retour utilisateur : "avertissement clair si l'utilisateur tente un
// branchement incoherent, par exemple un + sur un -". Ne signale que le cas
// sans ambiguite (positive <-> negative directement relies) : neutre/terre
// ne sont volontairement pas inclus ici, trop de faux positifs plausibles
// en cablage 230V/bus de communication pour un controle "indicatif" (CDC
// §31, §37 — jamais un blocage, jamais une certification).
function computePolarityIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const edge of edges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    const sourceKind = resolveHandleKindForNode(sourceNode, edge.sourceHandle);
    const targetKind = resolveHandleKindForNode(targetNode, edge.targetHandle);

    const isPolarityMismatch =
      (sourceKind === "positive" && targetKind === "negative") ||
      (sourceKind === "negative" && targetKind === "positive");

    // Deux panneaux reliés + vers - forment une chaîne série valide. Le
    // contrôle V2 signalait jusque-là ce cas réel comme un court-circuit.
    const isSolarSeriesConnection =
      sourceNode?.data.componentType === "solar-panel" && targetNode?.data.componentType === "solar-panel";

    if (isPolarityMismatch && !isSolarSeriesConnection) {
      issues.push({
        id: `${edge.id}-polarity-mismatch`,
        targetKind: "edge",
        targetId: edge.id,
        message: "Ce câble relie directement un + à un − : c'est probablement un court-circuit, vérifiez le branchement.",
      });
    }
  }

  return issues;
}

function isAcPowerHandle(node: SchemaNodeInternal | undefined, handleId: string | null | undefined): boolean {
  if (!node || !handleId) return false;
  const def = getComponentDefinition(node.data.componentType);
  const handle = def && getEffectiveHandles(def, node.data).find((candidate) => candidate.id === handleId);
  if (!handle || handle.kind !== "neutral") return false;
  return /^ac-|^in-|^out$|230v/i.test(handle.id) || /230v|secteur|ac/i.test(handle.label);
}

function isDcPowerHandle(node: SchemaNodeInternal | undefined, handleId: string | null | undefined): boolean {
  if (!node || !handleId) return false;
  const def = getComponentDefinition(node.data.componentType);
  const handle = def && getEffectiveHandles(def, node.data).find((candidate) => candidate.id === handleId);
  if (!handle || (handle.kind !== "positive" && handle.kind !== "negative")) return false;
  return !handle.id.startsWith("pv-");
}

// Règles V2.1 reprises de l'analyse V3, écrites directement sur le modèle
// React Flow V2 : elles améliorent les contrôles sans créer de second moteur.
function computeConnectionIntegrityIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const terminalCounts = new Map<string, number>();

  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    const sourceDef = source && getComponentDefinition(source.data.componentType);
    const targetDef = target && getComponentDefinition(target.data.componentType);
    const sourceExists = sourceDef && edge.sourceHandle && getEffectiveHandles(sourceDef, source.data).some((handle) => handle.id === edge.sourceHandle);
    const targetExists = targetDef && edge.targetHandle && getEffectiveHandles(targetDef, target.data).some((handle) => handle.id === edge.targetHandle);

    if (!sourceExists || !targetExists) {
      issues.push({
        id: `${edge.id}-invalid-endpoint`,
        targetKind: "edge",
        targetId: edge.id,
        message: "Ce câble est relié à une borne qui n'existe plus : reconnectez-le ou supprimez-le.",
      });
      continue;
    }

    const sourceKey = `${source.id}:${edge.sourceHandle}`;
    const targetKey = `${target.id}:${edge.targetHandle}`;
    terminalCounts.set(sourceKey, (terminalCounts.get(sourceKey) ?? 0) + 1);
    terminalCounts.set(targetKey, (terminalCounts.get(targetKey) ?? 0) + 1);

    const acToDc = isAcPowerHandle(source, edge.sourceHandle) && isDcPowerHandle(target, edge.targetHandle);
    const dcToAc = isDcPowerHandle(source, edge.sourceHandle) && isAcPowerHandle(target, edge.targetHandle);
    if (acToDc || dcToAc) {
      issues.push({
        id: `${edge.id}-ac-dc-mismatch`,
        targetKind: "edge",
        targetId: edge.id,
        message: "Ce câble relie directement un circuit 230 V et un circuit continu : utilisez un appareil de conversion adapté.",
      });
    }
  }

  for (const node of nodes) {
    const def = getComponentDefinition(node.data.componentType);
    if (!def) continue;
    const handles = getEffectiveHandles(def, node.data);

    for (const handle of handles) {
      const terminalCount = terminalCounts.get(`${node.id}:${handle.id}`) ?? 0;
      if (terminalCount > 4) {
        issues.push({
          id: `${node.id}-${handle.id}-too-many-terminals`,
          targetKind: "node",
          targetId: node.id,
          message: `« ${String(node.data.label ?? def.label)} » a plus de 4 câbles sur une même borne : utilisez un busbar plutôt qu'un empilement de cosses.`,
        });
      }

      if (handle.kind === "earth" && terminalCount === 0) {
        issues.push({
          id: `${node.id}-${handle.id}-earth-missing`,
          targetKind: "node",
          targetId: node.id,
          message: `« ${String(node.data.label ?? def.label)} » a une borne de terre non raccordée.`,
        });
      }
    }
  }

  return issues;
}

function neighborsViaHandle(nodeId: string, handleId: string, edges: SchemaEdgeInternal[]): string[] {
  return edges
    .filter((e) => (e.source === nodeId && e.sourceHandle === handleId) || (e.target === nodeId && e.targetHandle === handleId))
    .map((e) => (e.source === nodeId ? e.target : e.source));
}

// Vrai si un composant de protection (fusible, disjoncteur, platine…) est
// atteint à moins de `maxHops` sauts depuis `nodeId`, en traversant
// librement les busbars/coupe-batterie (simples jonctions/interrupteurs,
// pas des protections en eux-mêmes).
function reachesProtection(
  startNodeId: string,
  startHandle: string,
  nodes: SchemaNodeInternal[],
  edges: SchemaEdgeInternal[],
  maxHops = 2,
): boolean {
  let frontier = neighborsViaHandle(startNodeId, startHandle, edges);
  const visited = new Set<string>([startNodeId]);

  for (let hop = 0; hop < maxHops; hop++) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.find((n) => n.id === id);
      if (!node) continue;
      const type = node.data.componentType;
      // Audit : un "Tableau de distribution" en apparence "Interrupteurs
      // seuls" (par défaut) n'a pas d'entrée commune fusible — ce n'est une
      // vraie protection que dans sa variante "Interrupteurs + fusibles"
      // (voir distributionPanelHandles). Sans cette exception, une batterie
      // câblée directement sur un tableau à interrupteurs était
      // silencieusement considérée comme protégée.
      if (type === "distribution-panel" ? node.data.layout === "with-fuses" : PROTECTION_TYPES.has(type)) return true;
      if (PASSTHROUGH_TYPES.has(type)) {
        // On continue à travers toutes les bornes de ce nœud, pas seulement
        // celle par laquelle on est arrivé (un busbar redistribue).
        for (const e of edges) {
          if (e.source === id && !visited.has(e.target)) next.push(e.target);
          else if (e.target === id && !visited.has(e.source)) next.push(e.source);
        }
      }
    }
    frontier = next;
  }
  return false;
}

// Types de protection avec un calibre unique et directement lisible dans
// `data.amperage` (contrairement à fuse-block/distribution-panel/
// lynx-distributor qui répartissent en plusieurs branches à calibres
// indépendants — pas un seul chiffre à comparer à la source).
const PROTECTION_AMPERAGE_TYPES = new Set(["fuse", "circuit-breaker", "lynx-smart-bms", "lynx-power-in", "mini-bms"]);

// Mêmes traversée/tolérance que `reachesProtection` (busbar/coupe-batterie
// en passe-plats, 2 sauts), mais retourne les nœuds de protection trouvés au
// lieu d'un simple booléen — nécessaire pour comparer leur calibre à celui
// de la source (voir `computeOversizedProtectionIssues`).
function findNearestProtections(
  startNodeId: string,
  startHandle: string,
  nodes: SchemaNodeInternal[],
  edges: SchemaEdgeInternal[],
  maxHops = 2,
): SchemaNodeInternal[] {
  const found: SchemaNodeInternal[] = [];
  let frontier = neighborsViaHandle(startNodeId, startHandle, edges);
  const visited = new Set<string>([startNodeId]);

  for (let hop = 0; hop < maxHops; hop++) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.find((n) => n.id === id);
      if (!node) continue;
      const type = node.data.componentType;
      if (PROTECTION_AMPERAGE_TYPES.has(type)) {
        found.push(node);
        continue;
      }
      if (PASSTHROUGH_TYPES.has(type)) {
        for (const e of edges) {
          if (e.source === id && !visited.has(e.target)) next.push(e.target);
          else if (e.target === id && !visited.has(e.source)) next.push(e.source);
        }
      }
    }
    frontier = next;
  }

  return found;
}

// Courant nominal max d'une source de charge, par type — même liste que
// `CHARGE_SOURCE_OUTPUT_HANDLE` mais avec le champ (parfois nommé
// différemment, ex. "chargeAmperage" sur le chargeur secteur) qui porte le
// courant réel à comparer au calibre de la protection en aval.
const SOURCE_AMPS_GETTERS: Record<string, (data: Record<string, unknown>) => number> = {
  mppt: (data) => Number(data.amperage) || 0,
  pwm: (data) => Number(data.amperage) || 0,
  dcdc: (data) => Number(data.amperage) || 0,
  "ac-charger": (data) => Number(data.chargeAmperage) || 0,
  alternator: (data) => Number(data.amperage) || 0,
  "wind-turbine": (data) => {
    const voltage = Number(data.voltage) || 0;
    const powerW = Number(data.powerW) || 0;
    return voltage > 0 ? powerW / voltage : 0;
  },
};

// Marge tolérée entre le courant nominal d'une source et le calibre de sa
// protection : ~1,25x est une pratique standard (courant continu), on ne
// signale qu'au-delà pour éviter les faux positifs sur un choix de calibre
// légèrement large mais raisonnable.
const PROTECTION_OVERSIZE_RATIO = 1.5;

// Retour utilisateur : "MPPT 20A + fusible 40A sans avertissement, le
// fusible ne sert plus dans ce cas là" — jusqu'ici seule la *présence* d'une
// protection était vérifiée (`reachesProtection`), jamais la cohérence de
// son calibre avec la source qu'elle protège. Un fusible trop large ne
// coupera jamais avant que le courant dépasse ce que le câble (dimensionné
// sur le courant nominal de la source) peut encaisser — piège classique pour
// un débutant qui pense "plus gros = plus sûr".
function computeOversizedProtectionIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const node of nodes) {
    const type = node.data.componentType;
    const outputHandle = CHARGE_SOURCE_OUTPUT_HANDLE[type];
    const getSourceAmps = SOURCE_AMPS_GETTERS[type];
    if (!outputHandle || !getSourceAmps) continue;

    const sourceAmps = getSourceAmps(node.data);
    if (sourceAmps <= 0) continue;

    const protections = findNearestProtections(node.id, outputHandle, nodes, edges);
    for (const protectionNode of protections) {
      const protectionAmps = Number(protectionNode.data.amperage) || 0;
      if (protectionAmps <= 0 || protectionAmps <= sourceAmps * PROTECTION_OVERSIZE_RATIO) continue;

      const sourceLabel = String(node.data.label ?? getComponentDefinition(type)?.label ?? type);
      const protectionLabel = String(
        protectionNode.data.label ?? getComponentDefinition(protectionNode.data.componentType)?.label ?? protectionNode.data.componentType,
      );
      issues.push({
        id: `${protectionNode.id}-oversized-for-${node.id}`,
        targetKind: "node",
        targetId: protectionNode.id,
        message: `« ${protectionLabel} » (${formatAmps(protectionAmps)} A) est largement surdimensionné par rapport à « ${sourceLabel} » (${formatAmps(sourceAmps)} A max) : il ne protège plus vraiment ce circuit, le courant réel ne pourra jamais le faire fondre. Rapprochez son calibre du courant nominal de la source.`,
      });
    }
  }

  return issues;
}

// Une protection trop faible ne protège pas mieux : elle déclenche en usage
// normal. On compare le calibre au courant réellement attendu en aval et,
// pour une source de charge placée juste avant elle, à son courant nominal.
function computeUndersizedProtectionIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const protectionNode of nodes) {
    const type = protectionNode.data.componentType;
    if (type !== "fuse" && type !== "circuit-breaker") continue;

    const rating = Number(protectionNode.data.amperage) || 0;
    if (rating <= 0) continue;

    const downstreamAmps = estimateConnectedAmps(protectionNode.id, nodes, edges) ?? 0;
    const adjacentSourceAmps = Math.max(
      0,
      ...edges
        .filter((edge) => edge.source === protectionNode.id || edge.target === protectionNode.id)
        .map((edge) => nodes.find((node) => node.id === (edge.source === protectionNode.id ? edge.target : edge.source)))
        .map((node) => (node ? SOURCE_AMPS_GETTERS[node.data.componentType]?.(node.data) ?? 0 : 0)),
    );
    const expectedAmps = Math.max(downstreamAmps, adjacentSourceAmps);
    if (expectedAmps <= 0 || rating >= expectedAmps) continue;

    const label = String(protectionNode.data.label ?? getComponentDefinition(type)?.label ?? type);
    issues.push({
      id: `${protectionNode.id}-undersized`,
      targetKind: "node",
      targetId: protectionNode.id,
      message: `« ${label} » (${formatAmps(rating)} A) est sous-calibré pour le courant attendu (${formatAmps(expectedAmps)} A) : il risque de déclencher en fonctionnement normal. Choisissez un calibre au moins égal au courant calculé, puis vérifiez qu'il reste compatible avec le câble.`,
    });
  }

  return issues;
}

const PV_REGULATOR_TYPES = new Set(["mppt", "pwm"]);
const PV_INPUT_HANDLES = ["pv-positive", "pv-negative"];

// Panneaux solaires en amont d'un régulateur, en traversant les jonctions
// (busbar, coupe-batterie) comme de simples passe-plats — même logique que
// `reachesProtection`, mais remonte le graphe au lieu de le descendre.
// Un panneau NE stoppe PAS la remontée : en montage série, les panneaux se
// chaînent directement entre eux (PV+ de A → PV− de B → régulateur), sans
// passer par un busbar — s'arrêter au premier panneau rencontré manquerait
// tous les suivants de la chaîne et sous-évaluerait la puissance réelle
// (retour utilisateur : "fait attention au montage en série également").
// `visited` empêche toute boucle même si le schéma est mal câblé en anneau.
function collectUpstreamSolarPanels(
  nodeId: string,
  handles: string[],
  nodes: SchemaNodeInternal[],
  edges: SchemaEdgeInternal[],
): SchemaNodeInternal[] {
  const panels: SchemaNodeInternal[] = [];
  const visited = new Set<string>([nodeId]);
  let frontier: string[] = handles.flatMap((h) => neighborsViaHandle(nodeId, h, edges));

  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.find((n) => n.id === id);
      if (!node) continue;
      const type = node.data.componentType;
      if (type === "solar-panel") panels.push(node);
      if (type === "solar-panel" || PASSTHROUGH_TYPES.has(type)) {
        for (const e of edges) {
          if (e.source === id && !visited.has(e.target)) next.push(e.target);
          else if (e.target === id && !visited.has(e.source)) next.push(e.source);
        }
      }
    }
    frontier = next;
  }

  return panels;
}

// Regroupe les panneaux en amont d'un régulateur par « string » série : une
// chaîne de panneaux reliés directement entre eux (PV+ de A → PV− de B),
// sans passer par un busbar. Deux strings distinctes de part et d'autre d'un
// busbar sont en parallèle : chacune garde sa tension propre (pas de somme
// entre elles), alors que dans une même string les tensions Voc s'additionnent
// — c'est cette confusion série/parallèle que le contrôle de tension doit
// respecter (retour utilisateur : "il faut que tu ai les données Voc des
// panneaux et la donnée max des MPPT" pour vérifier le montage en série).
function collectPvStrings(
  nodeId: string,
  handles: string[],
  nodes: SchemaNodeInternal[],
  edges: SchemaEdgeInternal[],
): SchemaNodeInternal[][] {
  const strings: SchemaNodeInternal[][] = [];
  const visited = new Set<string>([nodeId]);

  type Frontier = { id: string; chain: SchemaNodeInternal[] };
  let frontier: Frontier[] = handles.flatMap((h) => neighborsViaHandle(nodeId, h, edges).map((id) => ({ id, chain: [] })));

  while (frontier.length > 0) {
    const next: Frontier[] = [];
    for (const { id, chain } of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.find((n) => n.id === id);
      if (!node) continue;
      const type = node.data.componentType;

      if (type === "solar-panel") {
        const newChain = [...chain, node];
        const panelNeighbors: string[] = [];
        for (const e of edges) {
          if (e.source === id && !visited.has(e.target)) panelNeighbors.push(e.target);
          else if (e.target === id && !visited.has(e.source)) panelNeighbors.push(e.source);
        }
        if (panelNeighbors.length === 0) {
          strings.push(newChain);
        } else {
          for (const n of panelNeighbors) next.push({ id: n, chain: newChain });
        }
        continue;
      }

      if (PASSTHROUGH_TYPES.has(type)) {
        // Jonction parallèle : chaque branche reprend à zéro (pas de somme
        // avec ce qui était déjà accumulé côté régulateur).
        for (const e of edges) {
          if (e.source === id && !visited.has(e.target)) next.push({ id: e.target, chain });
          else if (e.target === id && !visited.has(e.source)) next.push({ id: e.source, chain });
        }
      }
    }
    frontier = next;
  }

  return strings;
}

// Marge froid : la Voc réelle d'un panneau augmente par temps froid
// (coefficient de température négatif) — un régulateur dimensionné pile sur
// la Voc "fiche technique" (mesurée à 25°C) peut être détruit par une
// matinée d'hiver. +15% est la marge standard du secteur — retour
// utilisateur : "il serait pas utile de check si il manque pas des
// outils", comparaison avec le calculateur Solar & MPPT du concurrent
// Wireframe qui applique cette même marge avant de comparer à la tension
// max du régulateur (jusqu'ici absente ici, voir aussi
// components/outils/calculators/MpptCalculator.tsx pour le même correctif
// côté calculateur public).
const VOC_COLD_MARGIN = 1.15;

// Tension d'une string série = somme des Voc de ses panneaux (Voc, pas la
// tension nominale "voltage" — c'est la tension réelle à vide, la plus
// pénalisante, celle qui peut dépasser la tension d'entrée max du régulateur
// par temps froid, d'où VOC_COLD_MARGIN). Ignore une string dont un panneau
// n'a pas de Voc renseigné (0 = "non connue", même convention que les
// autres champs facultatifs) : mieux vaut ne pas signaler que signaler à
// partir d'une tension sous-évaluée.
function computeSeriesVoltageIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const node of nodes) {
    const type = node.data.componentType;
    if (!PV_REGULATOR_TYPES.has(type)) continue;

    const maxPvVoltage = Number(node.data.maxPvVoltage) || 0;
    if (maxPvVoltage <= 0) continue;

    const strings = collectPvStrings(node.id, PV_INPUT_HANDLES, nodes, edges);
    let worstStringVoltage = 0;
    for (const string of strings) {
      if (string.some((p) => !(Number(p.data.vocVoltage) > 0))) continue;
      const stringVoltage = string.reduce((sum, p) => sum + Number(p.data.vocVoltage), 0);
      if (stringVoltage > worstStringVoltage) worstStringVoltage = stringVoltage;
    }
    if (worstStringVoltage <= 0) continue;
    const worstStringVoltageCold = worstStringVoltage * VOC_COLD_MARGIN;
    if (worstStringVoltageCold <= maxPvVoltage) continue;

    const label = String(node.data.label ?? getComponentDefinition(type)?.label ?? type);
    const regulatorKind = type === "mppt" ? "MPPT" : "PWM";
    issues.push({
      id: `${node.id}-series-overvoltage`,
      targetKind: "node",
      targetId: node.id,
      message: `« ${label} » (régulateur ${regulatorKind}, ${maxPvVoltage} V max en entrée) reçoit une chaîne de panneaux en série à ${formatAmps(worstStringVoltage)} V en circuit ouvert (Voc), ${formatAmps(worstStringVoltageCold)} V à froid (+15%) : trop élevé, risque de destruction du régulateur — réduisez le nombre de panneaux en série ou câblez-les en parallèle.`,
    });
  }

  return issues;
}

// Marge de "overpaneling" tolérée : brancher plus de puissance crête que le
// courant nominal ne le suggère en arithmétique pure est une pratique
// standard et documentée par les fabricants (le plein soleil STC simultané
// sur tout le champ est rare), pas une erreur. Vérifié sur catalogue réel :
// le Victron SmartSolar 75/15 (15A) annonce lui-même 220W max en 12V —
// 220/(15×12) ≈ 1,22 — et le 100/30 (30A) annonce 440W — 440/(30×12) ≈ 1,22.
// 1,3 couvre cette marge constructeur sans laisser passer un vrai
// sous-dimensionnement (ex. l'exemple utilisateur 4×300W=1200W sur 15A
// reste très largement au-dessus, ratio ≈ 6,7).
const SOLAR_OVERSIZE_RATIO = 1.3;

// Retour utilisateur : "tu as généré un calcul de vérification de la
// puissance des panneaux solaires par rapport au MPPT ? exemple 4 panneaux
// de 300W = 1200W pour un MPPT de 15A" — jusqu'ici seule une aide textuelle
// sur le champ ampérage existait, aucun contrôle calculé. Courant théorique
// = puissance totale des panneaux ÷ tension système.
function computeSolarSizingIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const node of nodes) {
    const type = node.data.componentType;
    if (!PV_REGULATOR_TYPES.has(type)) continue;

    const panels = collectUpstreamSolarPanels(node.id, PV_INPUT_HANDLES, nodes, edges);
    if (panels.length === 0) continue;

    const totalW = panels.reduce((sum, p) => sum + (Number(p.data.powerW) || 0), 0);
    const systemVoltage = Number(node.data.systemVoltage) || 0;
    const regulatorAmps = Number(node.data.amperage) || 0;
    if (totalW <= 0 || systemVoltage <= 0 || regulatorAmps <= 0) continue;

    const requiredAmps = totalW / systemVoltage;
    if (requiredAmps > regulatorAmps * SOLAR_OVERSIZE_RATIO) {
      const label = String(node.data.label ?? getComponentDefinition(type)?.label ?? type);
      const regulatorKind = type === "mppt" ? "MPPT" : "PWM";
      issues.push({
        id: `${node.id}-solar-oversized`,
        targetKind: "node",
        targetId: node.id,
        message: `« ${label} » (régulateur ${regulatorKind} ${formatAmps(regulatorAmps)} A) est sous-dimensionné pour ${totalW} W de panneaux branchés (~${formatAmps(requiredAmps)} A sous ${systemVoltage} V) : passez à un régulateur plus puissant ou réduisez la puissance branchée.`,
      });
    }
  }

  return issues;
}

// Limite de courant de court-circuit côté PV : contrairement au courant de
// charge batterie, elle dépend du montage réel des panneaux. Isc reste celle
// d'un panneau en série, et s'additionne entre strings en parallèle.
function computePvInputCurrentIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const node of nodes) {
    if (!PV_REGULATOR_TYPES.has(node.data.componentType)) continue;
    const maxPvInputCurrentA = Number(node.data.maxPvInputCurrentA) || 0;
    if (maxPvInputCurrentA <= 0) continue;

    const strings = collectPvStrings(node.id, PV_INPUT_HANDLES, nodes, edges);
    if (strings.length === 0 || strings.some((string) => string.some((panel) => !(Number(panel.data.shortCircuitCurrentA) > 0)))) continue;

    const arrayIsc = strings.reduce(
      (sum, string) => sum + Math.min(...string.map((panel) => Number(panel.data.shortCircuitCurrentA))),
      0,
    );
    if (arrayIsc <= maxPvInputCurrentA) continue;

    const label = String(node.data.label ?? getComponentDefinition(node.data.componentType)?.label ?? node.data.componentType);
    issues.push({
      id: `${node.id}-pv-input-overcurrent`,
      targetKind: "node",
      targetId: node.id,
      message: `« ${label} » accepte ${formatAmps(maxPvInputCurrentA)} A Isc maximum côté PV, mais l'array raccordé atteint ${formatAmps(arrayIsc)} A Isc : réduisez les strings en parallèle ou choisissez un régulateur compatible.`,
    });
  }

  return issues;
}

// Alerte volontairement légère : sans les données de fiche technique, le
// moteur refuse de deviner Isc/Vmp ou les limites de tension et puissance
// du MPPT. Le courant Isc reste une donnée de panneau; une limite d'entrée
// MPPT n'est contrôlée que lorsqu'elle est explicitement publiée.
function computeSolarDataCompletenessIssues(nodes: SchemaNodeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const panelFields = [
    ["powerW", "puissance"],
    ["voltage", "Vmp"],
    ["operatingCurrentA", "Imp"],
    ["vocVoltage", "Voc"],
    ["shortCircuitCurrentA", "Isc"],
  ] as const;
  const mpptFields = [
    ["amperage", "courant de charge"],
    ["maxPvVoltage", "tension PV maximale"],
    ["maxPvPower12V", "puissance PV nominale 12 V"],
  ] as const;

  for (const node of nodes) {
    const fields = node.data.componentType === "solar-panel" ? panelFields : node.data.componentType === "mppt" ? mpptFields : null;
    if (!fields) continue;
    const missing = fields.filter(([key]) => !(Number(node.data[key]) > 0)).map(([, label]) => label);
    if (missing.length === 0) continue;
    const label = String(node.data.label ?? getComponentDefinition(node.data.componentType)?.label ?? node.data.componentType);
    issues.push({
      id: `${node.id}-solar-data-incomplete`,
      targetKind: "node",
      targetId: node.id,
      message: `« ${label} » a des caractéristiques solaires incomplètes (${missing.join(", ")}) : les calculs PV resteront partiels tant que la fiche technique n'est pas renseignée.`,
    });
  }

  return issues;
}

function computeElectricalIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const node of nodes) {
    const type = node.data.componentType;
    const label = String(node.data.label ?? getComponentDefinition(type)?.label ?? type);

    // Batterie sans fusible principal accessible sur sa sortie +.
    if (type === "battery") {
      if (!reachesProtection(node.id, "positive", nodes, edges)) {
        issues.push({ id: `${node.id}-no-main-fuse`, targetKind: "node", targetId: node.id, message: `« ${label} » n'a pas de fusible principal repérable sur sa sortie +.` });
      }
      continue;
    }

    // Source de charge (MPPT, DC-DC, chargeur secteur, alternateur) sans
    // protection avant la batterie.
    const outputHandle = CHARGE_SOURCE_OUTPUT_HANDLE[type];
    if (outputHandle && !reachesProtection(node.id, outputHandle, nodes, edges)) {
      issues.push({ id: `${node.id}-unprotected-charge-source`, targetKind: "node", targetId: node.id, message: `« ${label} » n'est pas protégé par un fusible avant la batterie.` });
    }
  }

  // Masse absente alors que le schéma contient au moins un composant AC
  // (secteur/quai) — la masse est requise dès qu'il y a du 230V, pas
  // systématiquement en pur DC.
  const acNode = nodes.find((n) => AC_COMPONENT_TYPES.has(n.data.componentType));
  const hasGround = nodes.some((n) => n.data.componentType === "ground");
  if (acNode && !hasGround) {
    issues.push({ id: "no-ground-point", targetKind: "node", targetId: acNode.id, message: "Aucun point de masse dans le schéma alors qu'il contient du 230V." });
  }

  return issues;
}

function formatAmps(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

function getNodeLabel(nodeId: string, nodes: SchemaNodeInternal[]): string {
  const node = nodes.find((n) => n.id === nodeId);
  const fallback = node?.data.componentType ?? nodeId;
  return String(node?.data.label ?? getComponentDefinition(fallback)?.label ?? fallback);
}

function getEdgeLabel(edge: SchemaEdgeInternal, nodes: SchemaNodeInternal[]): string {
  if (edge.data?.label) return `« ${String(edge.data.label)} »`;
  return `le câble « ${getNodeLabel(edge.source, nodes)} → ${getNodeLabel(edge.target, nodes)} »`;
}

function computeCableSizingIssues(nodes: SchemaNodeInternal[], edges: SchemaEdgeInternal[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  for (const edge of edges) {
    const diagnostic = evaluateEdgeSection(edge, nodes, edges);
    if (!diagnostic || diagnostic.status === "ok") continue;

    const edgeLabel = getEdgeLabel(edge, nodes);
    const recommended = diagnostic.recommendedSectionLabel;
    const currentContext =
      diagnostic.ampsSource === "protection" && diagnostic.protectionAmps !== null
        ? `il est protégé en ${formatAmps(diagnostic.protectionAmps)} A`
        : diagnostic.ampsSource === "charger" && diagnostic.sourceAmps !== null
          ? `il est relié à une source de ${formatAmps(diagnostic.sourceAmps)} A`
          : `il transporte environ ${formatAmps(diagnostic.amps)} A`;

    if (diagnostic.status === "missing") {
      issues.push({
        id: `${edge.id}-missing-section`,
        targetKind: "edge",
        targetId: edge.id,
        message: `${edgeLabel} n'a pas de section renseignée alors que ${currentContext}. Suggestion : ${recommended}.`,
        action: "recalculate-all-cable-sections",
      });
      continue;
    }

    issues.push({
      id: `${edge.id}-undersized-section`,
      targetKind: "edge",
      targetId: edge.id,
      message: `${edgeLabel} est en ${diagnostic.currentSectionLabel}, trop juste alors que ${currentContext}. Suggestion : ${recommended}.`,
      action: "recalculate-all-cable-sections",
    });
  }

  return issues;
}

// Contrôles structurels (CDC §22, §31) : des faits vérifiables sur le
// graphe. Deux règles suffisent à attraper l'essentiel des oublis
// débutants : un composant totalement isolé, ou un composant à 2 bornes
// (+/−) dont une seule est reliée.
//
// V2 : on y ajoute des règles électriques indicatives ciblées (voir
// `computeElectricalIssues` plus haut) — toujours des rappels dans le même
// panneau « À vérifier », jamais une validation réglementaire complète ni
// un blocage (CDC §37). Un composant déjà signalé isolé n'est pas
// re-signalé côté électrique : le vrai problème à corriger d'abord, c'est
// qu'il n'est relié à rien.
export function computeSchemaIssues(
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<CableEdgeData>[],
): SchemaIssue[] {
  if (nodes === cachedNodes && edges === cachedEdges && cachedIssues) return cachedIssues;
  const issues: SchemaIssue[] = [];
  const structurallyBlockedNodeIds = new Set<string>();

  for (const node of nodes) {
    const def = getComponentDefinition(node.data.componentType);
    if (!def) continue;
    // Les bornes facultatives (ex. port de communication VE.Direct) ne
    // comptent pas dans ce contrôle — leur absence de câble n'est jamais un
    // oubli à signaler (retour utilisateur explicite).
    const handles = getEffectiveHandles(def, node.data).filter((h) => !h.optional);
    if (handles.length === 0) continue;

    const connectedHandleIds = new Set(
      edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => (e.source === node.id ? e.sourceHandle : e.targetHandle)),
    );
    const connectedCount = handles.filter((h) => connectedHandleIds.has(h.id)).length;
    const label = String(node.data.label ?? def.label);

    if (connectedCount === 0) {
      structurallyBlockedNodeIds.add(node.id);
      issues.push({ id: `${node.id}-isolated`, targetKind: "node", targetId: node.id, message: `« ${label} » n'est relié à rien.` });
    } else if (handles.length === 2 && connectedCount === 1) {
      structurallyBlockedNodeIds.add(node.id);
      issues.push({ id: `${node.id}-partial`, targetKind: "node", targetId: node.id, message: `« ${label} » n'a qu'une seule borne reliée.` });
    }
  }

  const electricalIssues = computeElectricalIssues(nodes, edges).filter((issue) => !structurallyBlockedNodeIds.has(issue.targetId));
  const cableSizingIssues = computeCableSizingIssues(nodes, edges).filter((issue) => {
    const edge = edges.find((candidate) => candidate.id === issue.targetId);
    if (!edge) return false;
    return !structurallyBlockedNodeIds.has(edge.source) && !structurallyBlockedNodeIds.has(edge.target);
  });
  const polarityIssues = computePolarityIssues(nodes, edges);
  const connectionIntegrityIssues = computeConnectionIntegrityIssues(nodes, edges);
  const solarSizingIssues = computeSolarSizingIssues(nodes, edges).filter((issue) => !structurallyBlockedNodeIds.has(issue.targetId));
  const pvInputCurrentIssues = computePvInputCurrentIssues(nodes, edges).filter((issue) => !structurallyBlockedNodeIds.has(issue.targetId));
  const solarDataCompletenessIssues = computeSolarDataCompletenessIssues(nodes);
  const seriesVoltageIssues = computeSeriesVoltageIssues(nodes, edges).filter((issue) => !structurallyBlockedNodeIds.has(issue.targetId));
  const oversizedProtectionIssues = computeOversizedProtectionIssues(nodes, edges).filter((issue) => !structurallyBlockedNodeIds.has(issue.targetId));
  const undersizedProtectionIssues = computeUndersizedProtectionIssues(nodes, edges).filter((issue) => !structurallyBlockedNodeIds.has(issue.targetId));

  const result = [
    ...classifyIssues(issues, { severity: "warning", category: "topology" }),
    ...classifyIssues(electricalIssues, { severity: "warning", category: "protection" }),
    ...classifyIssues(cableSizingIssues, { severity: "warning", category: "cabling" }),
    ...classifyIssues(polarityIssues, { severity: "error", category: "connection" }),
    ...classifyIssues(connectionIntegrityIssues, { severity: "error", category: "connection" }),
    ...classifyIssues(solarSizingIssues, { severity: "warning", category: "solar" }),
    ...classifyIssues(pvInputCurrentIssues, { severity: "error", category: "solar" }),
    ...classifyIssues(solarDataCompletenessIssues, { severity: "info", category: "solar" }),
    ...classifyIssues(seriesVoltageIssues, { severity: "error", category: "solar" }),
    ...classifyIssues(oversizedProtectionIssues, { severity: "warning", category: "protection" }),
    ...classifyIssues(undersizedProtectionIssues, { severity: "warning", category: "protection" }),
  ];
  cachedNodes = nodes;
  cachedEdges = edges;
  cachedIssues = result;
  return result;
}
