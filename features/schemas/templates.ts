import type { Node, Edge } from "@xyflow/react";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { buildExampleSchema } from "@/features/schemas/example";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

// Galerie de schémas de départ (V2 — inspirée des "pre-built wiring
// templates" de Wireframe, un concurrent SaaS anglophone du même secteur :
// plusieurs points de départ par cas d'usage courant, plutôt qu'un exemple
// unique). Volontairement en local pour l'instant, non branché sur un vrai
// menu de sélection tant que le choix n'est pas validé — voir
// features/schemas/store/useSchemaStore.ts `loadTemplate`.

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

export interface SchemaTemplate {
  id: string;
  label: string;
  description: string;
  build: () => { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] };
}

function buildNode(id: string, type: string, x: number, y: number, data: { label: string } & Record<string, unknown>): SchemaNode {
  const def = getComponentDefinition(type);
  if (!def) throw new Error(`Composant inconnu dans le gabarit : ${type}`);
  return { id, type: "electrical", position: { x, y }, data: { componentType: type, ...data } };
}

// Zone colorée (regroupement visuel, purement décoratif — voir le même
// pattern dans features/schemas/example.ts). En tête du tableau `nodes`
// (zIndex -1 les garde derrière de toute façon) pour ne pas dépendre de
// l'ordre d'insertion des composants.
function buildZone(id: string, x: number, y: number, width: number, height: number, label: string, color: string): SchemaNode {
  return { id, type: "zone", position: { x, y }, width, height, zIndex: -1, data: { componentType: "zone", label, color } };
}

function buildEdge(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  color: string,
  cableType: string,
  section?: string,
  length?: number,
  bendPoint?: { x: number; y: number },
): SchemaEdge {
  return { id, source, sourceHandle, target, targetHandle, type: "cable", data: { color, cableType, section, length, bendPoint } };
}

const RED = "#dc2626";
const BLACK = "#111827";
const PURPLE_230V = "#7c3aed";
const LIME = "#84cc16";

// Gabarit débutant (retour utilisateur : "premier pas solaire avec 2
// panneaux solaire, un MPPT, une batterie et un écran de communication") —
// volontairement réduit au strict nécessaire pour un premier système
// solaire 12V, sans consommateur ni distribution : le but est de comprendre
// la chaîne panneaux → régulateur → batterie → suivi, pas de câbler une
// installation complète. Les deux panneaux se rejoignent en parallèle
// directement sur les bornes PV du MPPT (montage courant à cette échelle,
// pas besoin d'un combineur dédié pour deux chaînes).
function buildSolarBasicTemplate(): { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const nodes: SchemaNode[] = [
    buildNode("sb-solar-1", "solar-panel", 40, 40, { label: "Panneau solaire 1", powerW: 100, voltage: 0 }),
    buildNode("sb-solar-2", "solar-panel", 40, 220, { label: "Panneau solaire 2", powerW: 100, voltage: 0 }),
    buildNode("sb-mppt", "mppt", 320, 130, { label: "MPPT", amperage: 20, systemVoltage: 12 }),
    buildNode("sb-fuse-mppt", "fuse", 560, 130, { label: "Fusible MPPT", fuseType: "midi", amperage: 25 }),
    buildNode("sb-battery", "battery", 800, 130, { label: "Batterie 12V", voltage: 12, capacityAh: 100, technology: "agm" }),
    buildNode("sb-fuse-monitor", "fuse", 800, 320, { label: "Fusible écran", fuseType: "lame", amperage: 2 }),
    buildNode("sb-monitor", "system-monitor", 1040, 320, { label: "Écran de contrôle" }),
  ];

  const edges: SchemaEdge[] = [
    // Deux panneaux en parallèle → MPPT
    buildEdge("sb-e1", "sb-solar-1", "positive", "sb-mppt", "pv-positive", RED, "power-positive", "4 mm²", 3),
    buildEdge("sb-e2", "sb-solar-1", "negative", "sb-mppt", "pv-negative", BLACK, "power-negative", "4 mm²", 3),
    buildEdge("sb-e3", "sb-solar-2", "positive", "sb-mppt", "pv-positive", RED, "power-positive", "4 mm²", 3),
    buildEdge("sb-e4", "sb-solar-2", "negative", "sb-mppt", "pv-negative", BLACK, "power-negative", "4 mm²", 3),

    // MPPT → fusible → batterie (protection sortie MPPT, sert aussi de
    // fusible principal batterie)
    buildEdge("sb-e5", "sb-mppt", "bat-positive", "sb-fuse-mppt", "input", RED, "power-positive", "6 mm²", 1.5),
    buildEdge("sb-e6", "sb-fuse-mppt", "output", "sb-battery", "positive", RED, "power-positive", "6 mm²", 1.5),
    buildEdge("sb-e7", "sb-mppt", "bat-negative", "sb-battery", "negative", BLACK, "power-negative", "6 mm²", 1.5),

    // Écran de contrôle : alimentation directe batterie + liaison VE.Direct MPPT
    buildEdge("sb-e8", "sb-battery", "positive", "sb-fuse-monitor", "input", RED, "power-positive", "0,75 mm²", 1),
    buildEdge("sb-e9", "sb-fuse-monitor", "output", "sb-monitor", "positive", RED, "power-positive", "0,75 mm²", 2),
    buildEdge("sb-e10", "sb-battery", "negative", "sb-monitor", "negative", BLACK, "power-negative", "0,75 mm²", 2.5),
    buildEdge("sb-e11", "sb-mppt", "ve-direct", "sb-monitor", "ve-direct", "#16a34a", "data-bus", undefined, 2),
  ];

  return { projectName: "Gabarit : premier pas solaire", nodes, edges };
}

// Gabarit bateau : alimentation de quai + chargeur secteur, sans onduleur —
// cas d'usage courant pour un bateau qui reste souvent au port (recharge sur
// le 230V du ponton), distinct du gabarit van (mobile, alternateur/solaire).
// Complété (retour utilisateur) d'un appoint solaire pour les jours sans
// prise, et d'une pompe de cale — présence quasi systématique sur un bateau,
// même en restant au port.
function buildShorePowerTemplate(): { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const nodes: SchemaNode[] = [
    buildNode("qt-shore", "shore-power", 40, 40, { label: "Prise de quai" }),
    buildNode("qt-ac-panel", "ac-panel", 320, 40, { label: "Tableau 220V" }),
    buildNode("qt-socket", "socket-220v", 600, 40, { label: "Prise 220V", powerW: 500 }),
    buildNode("qt-ground", "ground", 460, 220, { label: "Point de masse" }),
    buildNode("qt-charger", "ac-charger", 320, 380, { label: "Chargeur secteur", chargeAmperage: 20 }),
    buildNode("qt-fuse-main", "fuse", 600, 380, { label: "Fusible principal", fuseType: "midi", amperage: 30 }),
    buildNode("qt-battery", "battery", 840, 380, { label: "Batterie 12V", voltage: 12, capacityAh: 150, technology: "agm" }),
    buildNode("qt-busbar", "busbar", 1080, 380, { label: "Busbar +", polarity: "positive", outputCount: 3 }),
    buildNode("qt-switch-frigo", "switch", 1320, 280, { label: "Interrupteur", amperage: 0 }),
    buildNode("qt-frigo", "consumer", 1540, 280, { label: "Réfrigérateur à compression", presetType: "refrigerateur", powerW: 45 }),
    buildNode("qt-switch-eclairage", "switch", 1320, 480, { label: "Interrupteur", amperage: 0 }),
    buildNode("qt-eclairage", "consumer", 1540, 480, { label: "Éclairage LED", presetType: "eclairage-led", powerW: 10 }),

    // Appoint solaire
    buildNode("qt-solar", "solar-panel", 40, 620, { label: "Panneau solaire", powerW: 100, voltage: 0 }),
    buildNode("qt-mppt", "mppt", 320, 620, { label: "MPPT", amperage: 15, systemVoltage: 12 }),
    buildNode("qt-fuse-mppt", "fuse", 600, 620, { label: "Fusible MPPT", fuseType: "midi", amperage: 20 }),

    // Pompe de cale — deux bornes + distinctes, voir commentaire sur les
    // câbles plus bas.
    buildNode("qt-fuse-pompe-auto", "fuse", 840, 620, { label: "Fusible pompe (auto)", fuseType: "lame", amperage: 15 }),
    buildNode("qt-switch-pompe", "switch", 1320, 650, { label: "Interrupteur", amperage: 0 }),
    buildNode("qt-pompe", "bilge-pump", 1540, 650, { label: "Pompe de cale", powerW: 40 }),
  ];

  const edges: SchemaEdge[] = [
    // Quai → chargeur secteur + tableau 220V (deux charges sur la même ligne de quai)
    buildEdge("qt-e1", "qt-shore", "ac", "qt-charger", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 4),
    buildEdge("qt-e2", "qt-shore", "ac", "qt-ac-panel", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 4),
    buildEdge("qt-e3", "qt-ac-panel", "ac-out", "qt-socket", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),

    // Terres → point de masse
    buildEdge("qt-e4", "qt-ac-panel", "earth", "qt-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("qt-e5", "qt-socket", "earth", "qt-ground", "ground", LIME, "earth", "1,5 mm²", 1),

    // Chargeur → fusible → batterie
    buildEdge("qt-e6", "qt-charger", "bat-positive", "qt-fuse-main", "input", RED, "power-positive", "10 mm²", 1.5),
    buildEdge("qt-e7", "qt-fuse-main", "output", "qt-battery", "positive", RED, "power-positive", "10 mm²", 1.5),
    buildEdge("qt-e8", "qt-charger", "bat-negative", "qt-battery", "negative", BLACK, "power-negative", "10 mm²", 1.5),

    // Batterie → busbar → interrupteurs → consommateurs
    buildEdge("qt-e9", "qt-battery", "positive", "qt-busbar", "input", RED, "power-positive", "16 mm²", 0.5),
    buildEdge("qt-e10", "qt-busbar", "out-1", "qt-switch-frigo", "input", RED, "power-positive", "1,5 mm²", 3),
    buildEdge("qt-e11", "qt-switch-frigo", "output", "qt-frigo", "positive", RED, "power-positive", "1,5 mm²", 1),
    buildEdge("qt-e12", "qt-busbar", "out-2", "qt-switch-eclairage", "input", RED, "power-positive", "0,75 mm²", 4),
    buildEdge("qt-e13", "qt-switch-eclairage", "output", "qt-eclairage", "positive", RED, "power-positive", "0,75 mm²", 1),

    // Retour négatif direct
    buildEdge("qt-e14", "qt-battery", "negative", "qt-frigo", "negative", BLACK, "power-negative", "1,5 mm²", 4),
    buildEdge("qt-e15", "qt-battery", "negative", "qt-eclairage", "negative", BLACK, "power-negative", "0,75 mm²", 5),

    // Appoint solaire → fusible → batterie (deuxième source de charge, à
    // côté du chargeur secteur)
    buildEdge("qt-e16", "qt-solar", "positive", "qt-mppt", "pv-positive", RED, "power-positive", "4 mm²", 3),
    buildEdge("qt-e17", "qt-solar", "negative", "qt-mppt", "pv-negative", BLACK, "power-negative", "4 mm²", 3),
    buildEdge("qt-e18", "qt-mppt", "bat-positive", "qt-fuse-mppt", "input", RED, "power-positive", "6 mm²", 1.5),
    buildEdge("qt-e19", "qt-fuse-mppt", "output", "qt-battery", "positive", RED, "power-positive", "6 mm²", 1.5),
    buildEdge("qt-e20", "qt-mppt", "bat-negative", "qt-battery", "negative", BLACK, "power-negative", "6 mm²", 1.5),

    // Pompe de cale : « + Auto » (flotteur) reste sous tension en
    // permanence, câblée en direct depuis la batterie via son propre
    // fusible dédié — surtout pas via le busbar général, sinon la pompe
    // s'arrête dès qu'on coupe le reste de l'installation. « + Manuel »
    // suit le circuit conventionnel (busbar → interrupteur).
    buildEdge("qt-e21", "qt-battery", "positive", "qt-fuse-pompe-auto", "input", RED, "power-positive", "2,5 mm²", 1),
    buildEdge("qt-e22", "qt-fuse-pompe-auto", "output", "qt-pompe", "positive-auto", RED, "power-positive", "2,5 mm²", 3),
    buildEdge("qt-e23", "qt-busbar", "out-3", "qt-switch-pompe", "input", RED, "power-positive", "2,5 mm²", 3),
    buildEdge("qt-e24", "qt-switch-pompe", "output", "qt-pompe", "positive-manual", RED, "power-positive", "2,5 mm²", 1),
    buildEdge("qt-e25", "qt-battery", "negative", "qt-pompe", "negative", BLACK, "power-negative", "2,5 mm²", 4),
  ];

  return { projectName: "Gabarit : quai tranquille (bateau)", nodes, edges };
}

// Gabarit "station électrique tout-en-1" (retour utilisateur : "panneau
// solaire, station électrique, prise de quai, un circuit protégé 220V et un
// circuit 12V frigo/éclairage/pompe", puis "utilise la batterie ecoflow et
// le tableau de distribution avec fusible", puis "ce n'est pas pour un
// bateau, principalement utilisé dans les vans — remplace la pompe de cale
// par une pompe à eau basique et intègre-la à la zone circuit 12V", puis
// repositionnement + retour négatif regroupé sur un busbar dédié — repris
// tel quel depuis l'export du brouillon édité à la main dans l'éditeur) —
// la station remplace batterie + MPPT + onduleur, chargée à la fois par le
// solaire et par le quai ; elle alimente en retour un circuit 230V protégé
// (tableau + masse) et un circuit 12V (tableau de distribution à fusibles +
// interrupteurs pour le +, busbar négatif commun pour le retour).
function buildPowerStationTemplate(): { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const nodes: SchemaNode[] = [
    buildNode("ps-solar", "solar-panel", 40, 240, { label: "Panneau solaire", powerW: 200, voltage: 0 }),
    buildNode("ps-shore", "shore-power", 160, -20, { label: "Prise de quai" }),
    buildNode("ps-station", "power-station", 200, 80, { label: "EcoFlow Delta 3", powerW: 1600, capacityWh: 1024, brandModelId: "ecoflow-delta-3" }),

    // Circuit 220V protégé : tableau + prise + masse, en aval de la sortie AC.
    buildNode("ps-ac-panel", "ac-panel", 580, -140, { label: "Tableau 220V" }),
    buildNode("ps-socket", "socket-220v", 900, -160, { label: "Prise 220V", powerW: 500 }),
    buildNode("ps-ground", "ground", 760, -40, { label: "Point de masse", rotation: 270 }),

    // Circuit 12V : fusible principal → tableau de distribution à fusibles → interrupteurs → consommateurs (frigo, éclairage, pompe à eau).
    buildNode("ps-fuse-dc", "fuse", 600, 340, { label: "Fusible circuit 12V", fuseType: "midi", amperage: 30 }),
    buildNode("ps-panel", "distribution-panel", 840, 300, { label: "Tableau de distribution", layout: "with-fuses", outputCount: 3 }),
    buildNode("ps-switch-frigo", "switch", 1140, 140, { label: "Interrupteur", amperage: 0 }),
    buildNode("ps-frigo", "consumer", 1320, 180, { label: "Réfrigérateur à compression", presetType: "refrigerateur", powerW: 45 }),
    buildNode("ps-switch-eclairage", "switch", 1100, 340, { label: "Interrupteur", amperage: 0 }),
    buildNode("ps-eclairage", "consumer", 1340, 280, { label: "Éclairage LED", presetType: "eclairage-led", powerW: 10 }),
    buildNode("ps-switch-pompe", "switch", 1220, 480, { label: "Interrupteur", amperage: 0 }),
    buildNode("ps-pompe", "consumer", 1320, 410, { label: "Pompe à eau", presetType: "pompe-eau", powerW: 60 }),

    // Retour négatif commun : busbar dédié plutôt que 3 câbles individuels
    // depuis la station (retour utilisateur, édition directe dans l'éditeur).
    buildNode("ps-busbar-neg", "busbar", 640, 220, { label: "Busbar", polarity: "negative", outputCount: 4 }),
  ];

  const edges: SchemaEdge[] = [
    // Solaire → station (entrée PV)
    buildEdge("ps-e1", "ps-solar", "positive", "ps-station", "pv-positive", RED, "power-positive", "4 mm²", 3),
    buildEdge("ps-e2", "ps-solar", "negative", "ps-station", "pv-negative", BLACK, "power-negative", "4 mm²", 3),

    // Quai → station (entrée AC)
    buildEdge("ps-e3", "ps-shore", "ac", "ps-station", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 4),

    // Station → circuit 220V protégé
    buildEdge("ps-e4", "ps-station", "ac-out", "ps-ac-panel", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("ps-e5", "ps-ac-panel", "ac-out", "ps-socket", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("ps-e6", "ps-ac-panel", "earth", "ps-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("ps-e7", "ps-socket", "earth", "ps-ground", "ground", LIME, "earth", "1,5 mm²", 1),

    // Station → fusible → tableau de distribution (circuit 12V)
    buildEdge("ps-e8", "ps-station", "dc-positive", "ps-fuse-dc", "input", RED, "power-positive", "6 mm²", 1),
    buildEdge("ps-e9", "ps-fuse-dc", "output", "ps-panel", "input", RED, "power-positive", "6 mm²", 1),

    // Tableau → interrupteurs → consommateurs
    buildEdge("ps-e10", "ps-panel", "out-1", "ps-switch-frigo", "input", RED, "power-positive", "1,5 mm²", 3, { x: 957, y: 190 }),
    buildEdge("ps-e11", "ps-switch-frigo", "output", "ps-frigo", "positive", RED, "power-positive", "1,5 mm²", 1),
    buildEdge("ps-e12", "ps-panel", "out-2", "ps-switch-eclairage", "input", RED, "power-positive", "0,75 mm²", 2),
    buildEdge("ps-e13", "ps-switch-eclairage", "output", "ps-eclairage", "positive", RED, "power-positive", "0,75 mm²", 1),

    // Pompe à eau : troisième sortie du tableau, comme frigo/éclairage.
    buildEdge("ps-e17", "ps-panel", "out-3", "ps-switch-pompe", "input", RED, "power-positive", "1,5 mm²", 3, { x: 1180, y: 260 }),
    buildEdge("ps-e18", "ps-switch-pompe", "output", "ps-pompe", "positive", RED, "power-positive", "1,5 mm²", 1),

    // Retour négatif : station → busbar négatif → chaque consommateur.
    buildEdge("ps-e19", "ps-station", "dc-negative", "ps-busbar-neg", "input", BLACK, "power-negative", "6 mm²", 2),
    buildEdge("ps-e20", "ps-busbar-neg", "out-1", "ps-frigo", "negative", BLACK, "power-negative", "1,5 mm²", 2, { x: 1040, y: 220 }),
    buildEdge("ps-e21", "ps-busbar-neg", "out-4", "ps-eclairage", "negative", BLACK, "power-negative", "0,5 mm²", 2),
    buildEdge("ps-e22", "ps-busbar-neg", "out-2", "ps-pompe", "negative", BLACK, "power-negative", "2,5 mm²", 2),
  ];

  // Zones (retour utilisateur) — purement visuel, comme dans l'exemple van
  // complet : regrouper les nœuds par sous-système pour rendre le gabarit
  // lisible d'un coup d'œil.
  const zones: SchemaNode[] = [
    buildZone("ps-zone-entrees", -20, -40, 460, 380, "Entrées & station", "#f59e0b"),
    buildZone("ps-zone-220v", 560, -200, 420, 300, "220V protégé", "#7c3aed"),
    buildZone("ps-zone-12v", 560, 120, 900, 440, "Circuit 12V", "#3b82f6"),
  ];

  return { projectName: "Gabarit : station électrique tout-en-1", nodes: [...zones, ...nodes], edges };
}

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    id: "van-complet",
    label: "Le van tout confort",
    description: "Solaire + alternateur/DC-DC + convertisseur-chargeur + alimentation de quai — schéma déjà avancé, pour s'inspirer d'un système complet.",
    build: buildExampleSchema,
  },
  {
    id: "solaire-simple",
    label: "Le premier pas solaire",
    description: "Deux panneaux, un MPPT, une batterie et un écran de contrôle — la chaîne solaire minimale, pour un premier système ou pour découvrir l'éditeur.",
    build: buildSolarBasicTemplate,
  },
  {
    id: "quai-tranquille",
    label: "Le quai tranquille",
    description: "Alimentation de quai + chargeur secteur + appoint solaire, sans onduleur, avec pompe de cale — pour un bateau qui reste surtout au port.",
    build: buildShorePowerTemplate,
  },
  {
    id: "station-electrique",
    label: "La station électrique",
    description: "Panneau solaire + prise de quai en entrée d'une station tout-en-1, avec un circuit 220V protégé et un circuit 12V (frigo, éclairage, pompe) en sortie — pas de batterie ni d'onduleur séparés à câbler.",
    build: buildPowerStationTemplate,
  },
];

export function getSchemaTemplate(id: string): SchemaTemplate | undefined {
  return SCHEMA_TEMPLATES.find((t) => t.id === id);
}
