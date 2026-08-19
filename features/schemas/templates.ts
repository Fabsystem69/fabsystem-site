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
// même en restant au port. Enrichi (catalogue marin ajouté début 2026) d'un
// isolateur galvanique sur la terre de quai (protection coque, quasi
// systématique dès qu'on reste branché au ponton) et d'un circuit de feux
// réglementaires + klaxon.
function buildShorePowerTemplate(): { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const nodes: SchemaNode[] = [
    buildNode("qt-shore", "shore-power", 40, 40, { label: "Prise de quai" }),
    // Isolateur galvanique : en série sur la terre de quai, avant qu'elle ne
    // rejoigne le point de masse commun du bord — protège la coque contre
    // la corrosion sans court-circuiter la protection terre normale.
    buildNode("qt-galvanic-isolator", "galvanic-isolator", 40, 220, { label: "Isolateur galvanique", brandModelId: "sterling-zincsaver-ii", brand: "Sterling", model: "Zinc Saver II" }),
    buildNode("qt-ac-panel", "ac-panel", 320, 40, { label: "Tableau 220V" }),
    buildNode("qt-socket", "socket-220v", 600, 40, { label: "Prise 220V", powerW: 500 }),
    buildNode("qt-ground", "ground", 460, 220, { label: "Point de masse" }),
    buildNode("qt-charger", "ac-charger", 320, 380, { label: "Chargeur secteur", chargeAmperage: 20 }),
    buildNode("qt-fuse-main", "fuse", 600, 380, { label: "Fusible principal", fuseType: "midi", amperage: 30 }),
    buildNode("qt-battery", "battery", 840, 380, { label: "Batterie 12V", voltage: 12, capacityAh: 150, technology: "agm" }),
    buildNode("qt-busbar", "busbar", 1080, 380, { label: "Busbar +", polarity: "positive", outputCount: 6 }),
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

    // Feux réglementaires : bâbord/tribord/tête de mât commandés ensemble
    // (obligatoire en navigation de nuit), feu de mouillage sur son propre
    // interrupteur (usage seulement à l'ancre, jamais en même temps).
    buildNode("qt-switch-nav", "switch", 1320, 800, { label: "Interrupteur feux de navigation", amperage: 0 }),
    buildNode("qt-feu-babord", "consumer", 1560, 740, { label: "Feu de navigation bâbord", presetType: "feu-babord", powerW: 3 }),
    buildNode("qt-feu-tribord", "consumer", 1560, 800, { label: "Feu de navigation tribord", presetType: "feu-tribord", powerW: 3 }),
    buildNode("qt-feu-mat", "consumer", 1560, 860, { label: "Feu de tête de mât", presetType: "feu-tete-de-mat", powerW: 5 }),
    buildNode("qt-switch-mouillage", "switch", 1320, 920, { label: "Interrupteur feu de mouillage", amperage: 0 }),
    buildNode("qt-feu-mouillage", "consumer", 1560, 920, { label: "Feu de mouillage", presetType: "feu-mouillage", powerW: 5 }),
    buildNode("qt-switch-klaxon", "switch", 1320, 980, { label: "Interrupteur klaxon", amperage: 0 }),
    buildNode("qt-klaxon", "consumer", 1560, 980, { label: "Klaxon", presetType: "klaxon", powerW: 15 }),
  ];

  const edges: SchemaEdge[] = [
    // Quai → chargeur secteur + tableau 220V (deux charges sur la même ligne de quai)
    buildEdge("qt-e1", "qt-shore", "ac", "qt-charger", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 4),
    buildEdge("qt-e2", "qt-shore", "ac", "qt-ac-panel", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 4),
    buildEdge("qt-e3", "qt-ac-panel", "ac-out", "qt-socket", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),

    // Terres → point de masse — la terre de quai passe par l'isolateur
    // galvanique avant de rejoindre le point de masse commun, les terres
    // internes (tableau, prise) le rejoignent directement (bonding normal).
    buildEdge("qt-e4", "qt-ac-panel", "earth", "qt-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("qt-e5", "qt-socket", "earth", "qt-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("qt-e26", "qt-shore", "earth", "qt-galvanic-isolator", "earth-in", LIME, "earth", "2,5 mm²", 2),
    buildEdge("qt-e27", "qt-galvanic-isolator", "earth-out", "qt-ground", "ground", LIME, "earth", "2,5 mm²", 1),

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

    // Feux de navigation : un seul interrupteur alimente les 3 en parallèle
    // (bâbord + tribord + tête de mât toujours ensemble en navigation).
    buildEdge("qt-e28", "qt-busbar", "out-4", "qt-switch-nav", "input", RED, "power-positive", "1,5 mm²", 4),
    buildEdge("qt-e29", "qt-switch-nav", "output", "qt-feu-babord", "positive", RED, "power-positive", "1 mm²", 3),
    buildEdge("qt-e30", "qt-switch-nav", "output", "qt-feu-tribord", "positive", RED, "power-positive", "1 mm²", 3),
    buildEdge("qt-e31", "qt-switch-nav", "output", "qt-feu-mat", "positive", RED, "power-positive", "1 mm²", 4),
    buildEdge("qt-e32", "qt-battery", "negative", "qt-feu-babord", "negative", BLACK, "power-negative", "1 mm²", 5),
    buildEdge("qt-e33", "qt-battery", "negative", "qt-feu-tribord", "negative", BLACK, "power-negative", "1 mm²", 5),
    buildEdge("qt-e34", "qt-battery", "negative", "qt-feu-mat", "negative", BLACK, "power-negative", "1 mm²", 6),

    // Feu de mouillage : interrupteur séparé (usage seulement à l'ancre,
    // jamais avec les feux de navigation ci-dessus).
    buildEdge("qt-e35", "qt-busbar", "out-5", "qt-switch-mouillage", "input", RED, "power-positive", "1 mm²", 4),
    buildEdge("qt-e36", "qt-switch-mouillage", "output", "qt-feu-mouillage", "positive", RED, "power-positive", "1 mm²", 4),
    buildEdge("qt-e37", "qt-battery", "negative", "qt-feu-mouillage", "negative", BLACK, "power-negative", "1 mm²", 6),

    // Klaxon
    buildEdge("qt-e38", "qt-busbar", "out-6", "qt-switch-klaxon", "input", RED, "power-positive", "1,5 mm²", 4),
    buildEdge("qt-e39", "qt-switch-klaxon", "output", "qt-klaxon", "positive", RED, "power-positive", "1,5 mm²", 4),
    buildEdge("qt-e40", "qt-battery", "negative", "qt-klaxon", "negative", BLACK, "power-negative", "1,5 mm²", 6),
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

function buildVictronLightVanTemplate(): { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const nodes: SchemaNode[] = [
    buildNode("vl-solar", "solar-panel", 40, 120, {
      label: "Panneau solaire 200W",
      powerW: 200,
      voltage: 0,
    }),
    buildNode("vl-mppt", "mppt", 320, 110, {
      label: "SmartSolar MPPT 75/15",
      amperage: 15,
      systemVoltage: 12,
      brandModelId: "victron-smartsolar-75-15",
      brand: "Victron",
      model: "SmartSolar MPPT 75/15",
    }),
    buildNode("vl-mppt-fuse", "fuse", 580, 140, {
      label: "Fusible MPPT",
      fuseType: "midi",
      amperage: 20,
    }),
    buildNode("vl-start-battery", "battery", 40, 430, {
      label: "Batterie véhicule 12V",
      voltage: 12,
      capacityAh: 100,
      technology: "agm",
      brandModelId: "renogy-agm-100ah",
      brand: "Véhicule",
      model: "Batterie moteur",
    }),
    buildNode("vl-dcdc-fuse", "fuse", 300, 420, {
      label: "Fusible Orion",
      fuseType: "midi",
      amperage: 25,
    }),
    buildNode("vl-dcdc", "dcdc", 440, 380, {
      label: "Orion-Tr Smart 12/12-18A",
      voltageIn: 12,
      voltageOut: 12,
      amperage: 18,
      brandModelId: "victron-orion-tr-18a",
      brand: "Victron",
      model: "Orion-Tr Smart 12/12-18A",
    }),
    buildNode("vl-service-battery", "battery", 1040, 280, {
      label: "Batterie LiFePO4 150Ah",
      voltage: 12,
      capacityAh: 150,
      technology: "lifepo4",
      brand: "Eco-Worthy",
      model: "LiFePO4 12V 150Ah Bluetooth",
      rotation: 180,
    }),
    buildNode("vl-main-fuse", "fuse", 1080, 180, {
      label: "Fusible principal 100A",
      fuseType: "anl",
      amperage: 100,
    }),
    buildNode("vl-switch", "battery-switch", 1240, 280, {
      label: "Coupe-batterie 275A",
      amperage: 275,
    }),
    buildNode("vl-busbar-pos", "busbar", 1400, 300, {
      label: "Busbar + 12V",
      polarity: "positive",
      outputCount: 3,
    }),
    buildNode("vl-shunt", "shunt", 1200, 540, {
      // Audit gabarits : "300A" ne correspond à aucune référence Victron
      // réellement vendue (gamme SmartShunt : 500A/1000A/2000A) — corrigé en
      // 500A, la plus proche, et rattachée à son modèle de marque pour la
      // vraie photo au lieu de l'icône générique.
      label: "SmartShunt 500A",
      amperage: 500,
      brandModelId: "victron-smartshunt-500a",
      brand: "Victron",
      model: "SmartShunt 500A",
    }),
    buildNode("vl-busbar-neg", "busbar", 1480, 430, {
      label: "Busbar −",
      polarity: "negative",
      outputCount: 7,
      rotation: 180,
    }),
    buildNode("vl-distribution", "distribution-panel", 1720, 350, {
      label: "Blue Sea WeatherDeck 6 positions",
      layout: "with-fuses",
      outputCount: 4,
    }),
    buildNode("vl-switch-frigo", "switch", 2080, 200, {
      label: "Interrupteur",
      amperage: 0,
    }),
    buildNode("vl-frigo", "consumer", 2320, 160, {
      label: "Frigo 12V",
      presetType: "refrigerateur",
      powerW: 45,
    }),
    buildNode("vl-switch-pompe", "switch", 2080, 360, {
      label: "Interrupteur",
      amperage: 0,
    }),
    buildNode("vl-pompe", "consumer", 2340, 280, {
      label: "Pompe a eau",
      presetType: "pompe-eau",
      powerW: 60,
    }),
    buildNode("vl-switch-usb", "switch", 2040, 480, {
      label: "Interrupteur",
      amperage: 0,
    }),
    buildNode("vl-usb", "consumer", 2340, 440, {
      label: "Ports USB",
      presetType: "prise-usb-12v",
      powerW: 15,
    }),
    buildNode("vl-switch-led", "switch", 2160, 620, {
      label: "Interrupteur",
      amperage: 0,
      rotation: 0,
    }),
    buildNode("vl-led", "consumer", 2340, 640, {
      label: "Eclairage LED",
      presetType: "eclairage-led",
      powerW: 10,
      rotation: 270,
    }),
    buildNode("vl-multiplus-breaker", "circuit-breaker", 1720, -40, {
      label: "Protection MultiPlus",
      amperage: 100,
    }),
    buildNode("vl-multiplus", "inverter-charger", 1820, -220, {
      label: "MultiPlus Compact 12/800/35-16",
      powerW: 800,
      voltageDC: 12,
      chargeAmperage: 35,
      // Audit gabarits : pas de photo dédiée au châssis "Compact" au
      // catalogue, mais mêmes caractéristiques (12/800/35) que le "Multi
      // 12/800/35" déjà présent — réutilise sa photo plutôt que l'icône
      // générique.
      brandModelId: "victron-multiplus-800-35",
      brand: "Victron",
      model: "MultiPlus Compact 12/800/35-16",
    }),
    buildNode("vl-shore", "shore-power", 1620, -160, {
      label: "Prise de quai",
    }),
    buildNode("vl-ac-panel", "ac-panel", 2140, -300, {
      label: "Coffret diff + disj 230V",
    }),
    buildNode("vl-socket-1", "socket-220v", 2380, -220, {
      label: "Prise 230V 1",
      powerW: 300,
    }),
    buildNode("vl-socket-2", "socket-220v", 2370, -40, {
      label: "Prise 230V 2",
      powerW: 300,
    }),
    buildNode("vl-ground", "ground", 2080, -60, {
      label: "Point de masse",
    }),
    buildNode("fuse_msw6xsvo_2", "fuse", 640, 440, {
      label: "Fusible Orion",
      fuseType: "midi",
      amperage: 25,
    }),
  ];

  const edges: SchemaEdge[] = [
    buildEdge("vl-e1", "vl-solar", "positive", "vl-mppt", "pv-positive", RED, "power-positive", "4 mm²", 3),
    buildEdge("vl-e2", "vl-solar", "negative", "vl-mppt", "pv-negative", BLACK, "power-negative", "4 mm²", 3),
    buildEdge("vl-e3", "vl-mppt", "bat-positive", "vl-mppt-fuse", "input", RED, "power-positive", "6 mm²", 1.2),
    buildEdge("vl-e4", "vl-mppt-fuse", "output", "vl-service-battery", "positive", RED, "power-positive", "6 mm²", 1.2),
    buildEdge("vl-e5", "vl-mppt", "bat-negative", "vl-busbar-neg", "input", BLACK, "power-negative", "6 mm²", 1.5, { x: 977, y: 330 }),

    buildEdge("vl-e6", "vl-start-battery", "positive", "vl-dcdc-fuse", "input", RED, "power-positive", "16 mm²", 1.5),
    buildEdge("vl-e7", "vl-dcdc-fuse", "output", "vl-dcdc", "in-positive", RED, "power-positive", "16 mm²", 1),
    buildEdge("vl-e8", "vl-start-battery", "negative", "vl-dcdc", "in-negative", BLACK, "power-negative", "16 mm²", 1.5),
    buildEdge("vl-e10", "vl-dcdc", "out-negative", "vl-busbar-neg", "out-1", BLACK, "power-negative", "16 mm²", 2),

    buildEdge("vl-e11", "vl-service-battery", "positive", "vl-main-fuse", "input", RED, "power-positive", "35 mm²", 0.6),
    buildEdge("vl-e12", "vl-main-fuse", "output", "vl-switch", "input", RED, "power-positive", "35 mm²", 0.5),
    buildEdge("vl-e13", "vl-switch", "output", "vl-busbar-pos", "input", RED, "power-positive", "35 mm²", 0.6),
    buildEdge("vl-e14", "vl-service-battery", "negative", "vl-shunt", "battery", BLACK, "power-negative", "35 mm²", 0.6),
    buildEdge("vl-e15", "vl-shunt", "system", "vl-busbar-neg", "input", BLACK, "power-negative", "35 mm²", 0.6),

    buildEdge("vl-e16", "vl-busbar-pos", "out-1", "vl-distribution", "input", RED, "power-positive", "10 mm²", 1.5),
    buildEdge("vl-e17", "vl-distribution", "out-1", "vl-switch-frigo", "input", RED, "power-positive", "4 mm²", 2.5),
    buildEdge("vl-e18", "vl-switch-frigo", "output", "vl-frigo", "positive", RED, "power-positive", "4 mm²", 1),
    buildEdge("vl-e19", "vl-distribution", "out-2", "vl-switch-pompe", "input", RED, "power-positive", "4 mm²", 2.5),
    buildEdge("vl-e20", "vl-switch-pompe", "output", "vl-pompe", "positive", RED, "power-positive", "4 mm²", 1),
    buildEdge("vl-e21", "vl-distribution", "out-3", "vl-switch-usb", "input", RED, "power-positive", "2,5 mm²", 2),
    buildEdge("vl-e22", "vl-switch-usb", "output", "vl-usb", "positive", RED, "power-positive", "2,5 mm²", 1),
    buildEdge("vl-e23", "vl-distribution", "out-4", "vl-switch-led", "input", RED, "power-positive", "1,5 mm²", 2, { x: 1860, y: 620 }),
    buildEdge("vl-e24", "vl-switch-led", "output", "vl-led", "positive", RED, "power-positive", "1,5 mm²", 1),

    buildEdge("vl-e25", "vl-busbar-neg", "out-2", "vl-frigo", "negative", BLACK, "power-negative", "4 mm²", 2.5),
    buildEdge("vl-e26", "vl-busbar-neg", "out-3", "vl-pompe", "negative", BLACK, "power-negative", "4 mm²", 2.5),
    buildEdge("vl-e28", "vl-busbar-neg", "out-5", "vl-led", "negative", BLACK, "power-negative", "1,5 mm²", 2),

    buildEdge("vl-e30", "vl-multiplus-breaker", "output", "vl-multiplus", "dc-positive", RED, "power-positive", "35 mm²", 0.6, { x: 1820, y: -80 }),
    buildEdge("vl-e31", "vl-busbar-neg", "out-6", "vl-multiplus", "dc-negative", BLACK, "power-negative", "35 mm²", 1, { x: 1700, y: 140 }),
    buildEdge("vl-e32", "vl-shore", "ac", "vl-multiplus", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("vl-e33", "vl-multiplus", "ac-out", "vl-ac-panel", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("vl-e34", "vl-ac-panel", "ac-out", "vl-socket-1", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2, { x: 2360, y: -220 }),
    buildEdge("vl-e35", "vl-ac-panel", "ac-out", "vl-socket-2", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("vl-e36", "vl-ac-panel", "earth", "vl-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("vl-e37", "vl-socket-1", "earth", "vl-ground", "ground", LIME, "earth", "1,5 mm²", 1, { x: 2236, y: -90 }),
    buildEdge("vl-e38", "vl-socket-2", "earth", "vl-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("edge_msw6spxz_1", "vl-busbar-pos", "out-3", "vl-multiplus-breaker", "input", RED, "power-positive", "35 mm²", 1, { x: 1435.5, y: 130 }),
    buildEdge("edge_msw6yit0_3", "vl-dcdc", "out-positive", "fuse_msw6xsvo_2", "input", RED, "power-positive", "16 mm²", 1),
    buildEdge("edge_msw6ythr_4", "fuse_msw6xsvo_2", "output", "vl-service-battery", "positive", RED, "power-positive", "16 mm²", 1, { x: 840, y: 420 }),
    buildEdge("edge_msw7303p_5", "vl-busbar-neg", "out-3", "vl-usb", "negative", BLACK, "power-negative", "1 mm²", 4, { x: 2180.5, y: 590 }),
  ];

  const zones: SchemaNode[] = [
    buildZone("vl-zone-solar", -20, 40, 760, 190, "Solaire 200W + MPPT", "#f59e0b"),
    buildZone("vl-zone-drive", -20, 330, 760, 250, "Recharge alternateur (option Orion)", "#10b981"),
    buildZone("vl-zone-battery", 780, 60, 860, 570, "Batterie service + protections", "#3b82f6"),
    buildZone("vl-zone-ac", 1560, -380, 910, 420, "Prise de quai + 230V leger", "#7c3aed"),
    buildZone("vl-zone-dc", 1760, 100, 700, 670, "Distribution 12V", "#14b8a6"),
  ];

  return { projectName: "Gabarit : Victron leger van", nodes: [...zones, ...nodes], edges };
}

function buildAferiyP280Template(): { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const nodes: SchemaNode[] = [
    buildNode("af-solar", "solar-panel", 40, 120, {
      label: "Panneau flexible 200W",
      powerW: 200,
      voltage: 0,
    }),
    buildNode("af-veh-battery", "battery", 40, 460, {
      label: "Batterie véhicule 12V",
      voltage: 12,
      capacityAh: 100,
      technology: "agm",
      brandModelId: "renogy-agm-100ah",
      brand: "Renogy",
      model: "Deep Cycle AGM 12V/100Ah",
    }),
    buildNode("af-dcdc-fuse", "fuse", 290, 440, {
      label: "Fusible charge véhicule",
      fuseType: "midi",
      amperage: 60,
    }),
    buildNode("af-dcdc", "dcdc", 500, 390, {
      label: "Chargeur DC-DC compatible",
      voltageIn: 12,
      voltageOut: 12,
      amperage: 50,
    }),
    buildNode("af-station", "power-station", 860, 190, {
      label: "AFERIY P280",
      powerW: 2800,
      capacityWh: 2048,
      brandModelId: "aferiy-p280",
      brand: "AFERIY",
      model: "P280",
      connectorLayout: "dual-xt90-xt60",
    }),
    buildNode("shore-power_msvzcqef_1", "shore-power", 780, 80, {
      label: "Prise de quai",
    }),
    buildNode("af-ac-panel", "ac-panel", 1200, -220, {
      label: "Tableau 230V",
    }),
    buildNode("af-socket-1", "socket-220v", 1540, -260, {
      label: "Prise AC 1",
      powerW: 500,
    }),
    buildNode("af-socket-2", "socket-220v", 1540, -100, {
      label: "Prise AC 2",
      powerW: 500,
    }),
    buildNode("af-ground", "ground", 1500, 120, {
      label: "Point de masse",
    }),
    buildNode("af-dc-fuse", "fuse", 1020, 320, {
      label: "Fusible principal XT60",
      fuseType: "midi",
      amperage: 25,
    }),
    buildNode("af-panel", "distribution-panel", 1320, 410, {
      label: "Tableau 12V",
      layout: "with-fuses",
      outputCount: 4,
    }),
    buildNode("af-busbar-neg", "busbar", 1240, 520, {
      label: "Busbar −",
      polarity: "negative",
      outputCount: 4,
    }),
    buildNode("af-switch-frigo", "switch", 1610, 300, {
      label: "Interrupteur",
      amperage: 0,
    }),
    buildNode("af-frigo", "consumer", 1800, 250, {
      label: "Réfrigérateur 12V",
      presetType: "refrigerateur",
      powerW: 45,
    }),
    buildNode("af-switch-pompe", "switch", 1600, 470, {
      label: "Interrupteur",
      amperage: 0,
    }),
    buildNode("af-pompe", "consumer", 1800, 420, {
      label: "Pompe à eau",
      presetType: "pompe-eau",
      powerW: 60,
    }),
    buildNode("af-switch-usb", "switch", 1600, 640, {
      label: "Interrupteur",
      amperage: 0,
    }),
    buildNode("af-usb", "consumer", 1790, 590, {
      label: "Ports USB",
      presetType: "prise-usb-12v",
      powerW: 15,
    }),
    buildNode("af-switch-led", "switch", 1400, 640, {
      label: "Interrupteur",
      amperage: 0,
      rotation: 90,
    }),
    buildNode("af-led", "consumer", 1500, 730, {
      label: "Éclairage LED",
      presetType: "eclairage-led",
      powerW: 10,
      rotation: 270,
    }),
  ];

  const edges: SchemaEdge[] = [
    buildEdge("af-e1", "af-solar", "positive", "af-station", "xt90-1-positive", RED, "power-positive", "4 mm²", 3),
    buildEdge("af-e2", "af-solar", "negative", "af-station", "xt90-1-negative", BLACK, "power-negative", "4 mm²", 3),
    buildEdge("af-e3", "af-veh-battery", "positive", "af-dcdc-fuse", "input", RED, "power-positive", "10 mm²", 1.5),
    buildEdge("af-e4", "af-dcdc-fuse", "output", "af-dcdc", "in-positive", RED, "power-positive", "10 mm²", 1),
    buildEdge("af-e5", "af-veh-battery", "negative", "af-dcdc", "in-negative", BLACK, "power-negative", "10 mm²", 1.5),
    buildEdge("af-e6", "af-dcdc", "out-positive", "af-station", "xt90-2-positive", RED, "power-positive", "10 mm²", 2),
    buildEdge("af-e7", "af-dcdc", "out-negative", "af-station", "xt90-2-negative", BLACK, "power-negative", "10 mm²", 2),

    buildEdge("af-e8", "af-station", "xt60-positive", "af-dc-fuse", "input", RED, "power-positive", "6 mm²", 1),
    buildEdge("af-e9", "af-dc-fuse", "output", "af-panel", "input", RED, "power-positive", "6 mm²", 1),
    buildEdge("af-e10", "af-station", "xt60-negative", "af-busbar-neg", "input", BLACK, "power-negative", "6 mm²", 1.5),

    buildEdge("af-e11", "af-panel", "out-1", "af-switch-frigo", "input", RED, "power-positive", "1,5 mm²", 2.5),
    buildEdge("af-e12", "af-switch-frigo", "output", "af-frigo", "positive", RED, "power-positive", "1,5 mm²", 1),
    buildEdge("af-e13", "af-panel", "out-2", "af-switch-pompe", "input", RED, "power-positive", "1,5 mm²", 2.5, { x: 1380, y: 520 }),
    buildEdge("af-e14", "af-switch-pompe", "output", "af-pompe", "positive", RED, "power-positive", "1,5 mm²", 1),
    buildEdge("af-e15", "af-panel", "out-3", "af-switch-usb", "input", RED, "power-positive", "0,75 mm²", 2),
    buildEdge("af-e16", "af-switch-usb", "output", "af-usb", "positive", RED, "power-positive", "0,75 mm²", 1),
    buildEdge("af-e17", "af-panel", "out-4", "af-switch-led", "input", RED, "power-positive", "0,75 mm²", 2, { x: 1520.5, y: 570 }),
    buildEdge("af-e18", "af-switch-led", "output", "af-led", "positive", RED, "power-positive", "0,75 mm²", 1),

    buildEdge("af-e19", "af-busbar-neg", "out-1", "af-frigo", "negative", BLACK, "power-negative", "1,5 mm²", 2, { x: 1540, y: 300 }),
    buildEdge("af-e20", "af-busbar-neg", "out-2", "af-pompe", "negative", BLACK, "power-negative", "1,5 mm²", 2, { x: 1720, y: 620 }),
    buildEdge("af-e21", "af-busbar-neg", "out-3", "af-usb", "negative", BLACK, "power-negative", "0,75 mm²", 2, { x: 1440, y: 300 }),
    buildEdge("af-e22", "af-busbar-neg", "out-4", "af-led", "negative", BLACK, "power-negative", "0,75 mm²", 2),

    buildEdge("af-e23", "af-station", "ac-out", "af-ac-panel", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("af-e24", "af-ac-panel", "ac-out", "af-socket-1", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("af-e25", "af-ac-panel", "ac-out", "af-socket-2", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("af-e26", "af-ac-panel", "earth", "af-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("af-e27", "af-socket-1", "earth", "af-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("af-e28", "af-socket-2", "earth", "af-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("edge_msvzcvid_2", "shore-power_msvzcqef_1", "ac", "af-station", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
  ];

  const zones: SchemaNode[] = [
    buildZone("af-zone-solar", -20, 40, 360, 220, "XT90 solaire", "#f59e0b"),
    buildZone("af-zone-veh", -20, 330, 700, 280, "Recharge véhicule / DC-DC (optionnel)", "#10b981"),
    buildZone("af-zone-station", 700, 40, 410, 340, "AFERIY P280", "#6366f1"),
    buildZone("af-zone-ac", 1180, -300, 520, 500, "230V fixe", "#7c3aed"),
    buildZone("af-zone-12v", 1220, 240, 740, 580, "Réseau 12V via XT60", "#3b82f6"),
  ];

  return { projectName: "Gabarit : AFERIY P280 van", nodes: [...zones, ...nodes], edges };
}

const GREEN_DATA = "#16a34a";

// Gabarit "bateau premium" (retour utilisateur : "le schéma le plus complet
// et premium sur un bateau avec les items disponibles") — quatre sources de
// charge (solaire, éolien, alternateur/DC-DC, quai/groupe électrogène),
// batterie Lithium NG protégée par la famille Lynx complète (Power In,
// Smart BMS, Distributor, Shunt — cohérence de gamme : le Lynx Smart BMS et
// les batteries "NG" vont ensemble, voir le commentaire sur `pb-battery`),
// Cerbo GX pour la supervision, MultiPlus-II pour l'onduleur-chargeur, et
// deux tableaux de distribution 12V séparés (confort / pont-sécurité) avec
// leurs propres bus négatifs, plutôt qu'un seul bus négatif géant (aurait
// dépassé la limite de points de connexion d'un busbar).
//
// Choix de topologie électrique à noter :
// - Chaque source de charge (MPPT, DC-DC, éolienne) et le MultiPlus tapent
//   directement sur la même borne SYS+ du Lynx Smart BMS que le Lynx
//   Distributor (plusieurs cosses sur le même goujon M10, comme en vrai),
//   plutôt que de passer par les 6 sorties du Distributor — leur calibre
//   dépasserait le calibre max d'une sortie MEGA du Distributor (150A).
// - Le Lynx Shunt ne mesure que le courant batterie ↔ reste du système : les
//   retours négatifs des sources de charge et du MultiPlus rejoignent le bus
//   négatif APRÈS le shunt (sur "system"), jamais avant, pour ne pas fausser
//   la mesure.
function buildPremiumBoatTemplate(): { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const nodes: SchemaNode[] = [
    // Solaire
    buildNode("pb-solar-1", "solar-panel", 40, -40, { label: "Panneau solaire 1", powerW: 300, voltage: 0 }),
    buildNode("pb-solar-2", "solar-panel", 40, 140, { label: "Panneau solaire 2", powerW: 300, voltage: 0 }),
    buildNode("pb-mppt", "mppt", 340, 40, { label: "SmartSolar MPPT 100/30", amperage: 30, systemVoltage: 12, brandModelId: "victron-smartsolar-100-30", brand: "Victron", model: "SmartSolar MPPT 100/30" }),
    buildNode("pb-fuse-mppt", "fuse", 620, 40, { label: "Fusible MPPT", fuseType: "midi", amperage: 35 }),

    // Éolien
    buildNode("pb-wind", "wind-turbine", 40, 340, { label: "Éolienne Silent Wind Pro", powerW: 420, voltage: 12, brandModelId: "silentwind-pro-420w", brand: "Silent Wind", model: "Wind Generator Pro 12V/420W" }),
    buildNode("pb-fuse-wind", "fuse", 340, 340, { label: "Fusible éolienne", fuseType: "midi", amperage: 25 }),

    // Alternateur / DC-DC (batterie moteur séparée)
    buildNode("pb-battery-start", "battery", 40, 520, { label: "Batterie moteur 12V", voltage: 12, capacityAh: 100, technology: "agm" }),
    buildNode("pb-alternator", "alternator", 40, 700, { label: "Alternateur", voltage: 12, amperage: 100 }),
    buildNode("pb-fuse-alt", "fuse", 280, 660, { label: "Fusible alternateur", fuseType: "anl", amperage: 120 }),
    buildNode("pb-fuse-dcdc-in", "fuse", 280, 500, { label: "Fusible DC-DC entrée", fuseType: "midi", amperage: 40 }),
    buildNode("pb-dcdc", "dcdc", 520, 520, { label: "Orion-Tr Smart 12/12-30A", voltageIn: 12, voltageOut: 12, amperage: 30, brandModelId: "victron-orion-tr-30a", brand: "Victron", model: "Orion-Tr Smart 12/12-30A" }),
    buildNode("pb-fuse-dcdc-out", "fuse", 780, 520, { label: "Fusible DC-DC sortie", fuseType: "midi", amperage: 30 }),

    // Quai, groupe électrogène et 230V
    buildNode("pb-shore", "shore-power", 640, -260, { label: "Prise de quai" }),
    buildNode("pb-generator", "shore-power", 640, -140, { label: "Groupe électrogène", brandModelId: "honda-eu32i-generator", brand: "Honda", model: "EU32i 3200W" }),
    buildNode("pb-galvanic", "galvanic-isolator", 900, -260, { label: "Isolateur galvanique", brandModelId: "sterling-zincsaver-ii", brand: "Sterling", model: "Zinc Saver II" }),
    buildNode("pb-transfer", "ac-transfer-switch", 900, -140, { label: "Inverseur de source secteur" }),
    buildNode("pb-cerbo", "system-monitor", 1180, -140, { label: "Cerbo GX", connection: "communication-only", brandModelId: "victron-cerbo-gx", brand: "Victron", model: "Cerbo GX" }),
    buildNode("pb-multiplus", "inverter-charger", 1420, -140, { label: "MultiPlus-II 12/3000/120", powerW: 3000, voltageDC: 12, chargeAmperage: 120, brandModelId: "victron-multiplus-ii-12-3000-120", brand: "Victron", model: "MultiPlus-II 12/3000/120-32" }),
    buildNode("pb-ac-panel", "ac-panel", 1680, -220, { label: "Tableau 220V" }),
    buildNode("pb-ground", "ground", 1680, -60, { label: "Point de masse" }),
    buildNode("pb-socket-1", "socket-220v", 1940, -300, { label: "Prise 230V 1", powerW: 500 }),
    buildNode("pb-socket-2", "socket-220v", 1940, -160, { label: "Prise 230V 2", powerW: 500 }),

    // Batterie servitude + bus Lynx complet. Batterie "NG" volontairement
    // choisie (pas la gamme "Smart" plus ancienne) : le Lynx Smart BMS est
    // conçu spécifiquement pour les batteries Lithium NG, incompatible avec
    // l'ancienne gamme Smart sans NG.
    buildNode("pb-battery-house", "battery", 940, 560, { label: "Batterie servitude LiFePO4 300Ah", voltage: 12, capacityAh: 300, technology: "lifepo4", brandModelId: "victron-lithium-ng-300ah", brand: "Victron", model: "Lithium NG 12,8V/300Ah" }),
    buildNode("pb-lynx-power-in", "lynx-power-in", 1180, 560, { label: "Lynx Power In", amperage: 400 }),
    buildNode("pb-lynx-bms", "lynx-smart-bms", 1420, 560, { label: "Lynx Smart BMS", amperage: 500 }),
    buildNode("pb-lynx-distributor", "lynx-distributor", 1660, 460, { label: "Lynx Distributor" }),
    buildNode("pb-fuse-multiplus", "fuse", 1420, 940, { label: "Fusible principal MultiPlus", fuseType: "classe-t", amperage: 300 }),
    buildNode("pb-lynx-shunt", "lynx-shunt", 1420, 760, { label: "Lynx Shunt VE.Can", amperage: 1000 }),
    buildNode("pb-busbar-neg-main", "busbar", 1660, 760, { label: "Busbar − principal", polarity: "negative", outputCount: 8 }),

    // Sorties Lynx Distributor : les deux tableaux 12V, le guindeau (gros
    // consommateur ponctuel, calibre dans la limite MEGA du Distributor) et
    // la pompe de cale automatique (toujours alimentée, en direct).
    buildNode("pb-breaker-guindeau", "circuit-breaker", 1900, 380, { label: "Disjoncteur guindeau", amperage: 80 }),
    buildNode("pb-guindeau", "consumer", 2140, 380, { label: "Guindeau", presetType: "guindeau", powerW: 800 }),
    buildNode("pb-fuse-bilge-auto", "fuse", 1900, 540, { label: "Fusible pompe de cale (auto)", fuseType: "lame", amperage: 15 }),

    // Tableau confort (intérieur)
    buildNode("pb-panel-confort", "fuse-block", 1980, 900, { label: "Tableau fusibles confort", outputCount: 9, layout: "positive" }),
    buildNode("pb-busbar-neg-confort", "busbar", 1980, 1500, { label: "Busbar − confort", polarity: "negative", outputCount: 9 }),
    buildNode("pb-frigo", "consumer", 2260, 780, { label: "Réfrigérateur à compression", presetType: "refrigerateur", powerW: 45 }),
    buildNode("pb-wc", "consumer", 2260, 850, { label: "WC électrique marin", presetType: "wc-electrique", powerW: 30 }),
    buildNode("pb-chauffe-eau", "consumer", 2260, 920, { label: "Chauffe-eau 12V", presetType: "chauffe-eau-12v", powerW: 120 }),
    buildNode("pb-pompe-eau", "consumer", 2260, 990, { label: "Pompe à eau", presetType: "pompe-eau", powerW: 60 }),
    buildNode("pb-switch-eclairage", "switch", 2260, 1060, { label: "Interrupteur", amperage: 0 }),
    buildNode("pb-eclairage-led", "consumer", 2500, 1060, { label: "Éclairage LED", presetType: "eclairage-led", powerW: 5 }),
    buildNode("pb-switch-ruban", "switch", 2260, 1130, { label: "Interrupteur", amperage: 0 }),
    buildNode("pb-ruban-led", "consumer", 2500, 1130, { label: "Ruban LED", presetType: "ruban-led", powerW: 10 }),
    buildNode("pb-switch-plafonnier", "switch", 2260, 1200, { label: "Interrupteur", amperage: 0 }),
    buildNode("pb-plafonnier-led", "consumer", 2500, 1200, { label: "Plafonnier LED", presetType: "plafonnier-led", powerW: 5 }),
    buildNode("pb-usb", "consumer", 2260, 1270, { label: "Prise USB / 12V", presetType: "prise-usb-12v", powerW: 15 }),
    buildNode("pb-electronique-bord", "consumer", 2260, 1340, { label: "Électronique de bord (GPS, VHF…)", presetType: "electronique-bord", powerW: 20 }),

    // Tableau pont & sécurité
    buildNode("pb-panel-pont", "fuse-block", 1980, 1620, { label: "Tableau fusibles pont", outputCount: 7, layout: "positive" }),
    buildNode("pb-busbar-neg-pont", "busbar", 1980, 2140, { label: "Busbar − pont", polarity: "negative", outputCount: 9 }),
    buildNode("pb-switch-nav", "switch", 2260, 1500, { label: "Interrupteur feux de navigation", amperage: 0 }),
    buildNode("pb-feu-babord", "consumer", 2500, 1420, { label: "Feu de navigation bâbord", presetType: "feu-babord", powerW: 3 }),
    buildNode("pb-feu-tribord", "consumer", 2500, 1510, { label: "Feu de navigation tribord", presetType: "feu-tribord", powerW: 3 }),
    buildNode("pb-feu-mat", "consumer", 2500, 1600, { label: "Feu de tête de mât", presetType: "feu-tete-de-mat", powerW: 5 }),
    buildNode("pb-switch-mouillage", "switch", 2260, 1700, { label: "Interrupteur feu de mouillage", amperage: 0 }),
    buildNode("pb-feu-mouillage", "consumer", 2500, 1700, { label: "Feu de mouillage", presetType: "feu-mouillage", powerW: 5 }),
    buildNode("pb-switch-floodlight", "switch", 2260, 1800, { label: "Interrupteur", amperage: 0 }),
    buildNode("pb-projecteur-pont", "consumer", 2500, 1800, { label: "Projecteur de pont", presetType: "projecteur-pont", powerW: 20 }),
    buildNode("pb-switch-marche", "switch", 2260, 1900, { label: "Interrupteur", amperage: 0 }),
    buildNode("pb-eclairage-marche", "consumer", 2500, 1900, { label: "Éclairage de marche", presetType: "eclairage-marche", powerW: 2 }),
    buildNode("pb-switch-klaxon", "switch", 2260, 2000, { label: "Interrupteur klaxon", amperage: 0 }),
    buildNode("pb-klaxon", "consumer", 2500, 2000, { label: "Klaxon", presetType: "klaxon", powerW: 15 }),
    buildNode("pb-pilote", "consumer", 2260, 2100, { label: "Pilote automatique", presetType: "pilote-automatique", powerW: 30 }),
    buildNode("pb-switch-bilge-manual", "switch", 2260, 2200, { label: "Interrupteur", amperage: 0 }),
    buildNode("pb-pompe-cale", "bilge-pump", 2500, 2150, { label: "Pompe de cale", powerW: 40 }),
  ];

  const edges: SchemaEdge[] = [
    // Solaire → MPPT → fusible → bus Lynx
    buildEdge("pb-e1", "pb-solar-1", "positive", "pb-mppt", "pv-positive", RED, "power-positive", "6 mm²", 3),
    buildEdge("pb-e2", "pb-solar-1", "negative", "pb-mppt", "pv-negative", BLACK, "power-negative", "6 mm²", 3),
    buildEdge("pb-e3", "pb-solar-2", "positive", "pb-mppt", "pv-positive", RED, "power-positive", "6 mm²", 3),
    buildEdge("pb-e4", "pb-solar-2", "negative", "pb-mppt", "pv-negative", BLACK, "power-negative", "6 mm²", 3),
    buildEdge("pb-e5", "pb-mppt", "bat-positive", "pb-fuse-mppt", "input", RED, "power-positive", "10 mm²", 1),
    buildEdge("pb-e6", "pb-fuse-mppt", "output", "pb-lynx-bms", "sys-positive", RED, "power-positive", "10 mm²", 2),
    buildEdge("pb-e7", "pb-mppt", "bat-negative", "pb-busbar-neg-main", "out-1", BLACK, "power-negative", "10 mm²", 2.5),

    // Éolienne → fusible → bus Lynx
    buildEdge("pb-e8", "pb-wind", "positive", "pb-fuse-wind", "input", RED, "power-positive", "6 mm²", 1),
    buildEdge("pb-e9", "pb-fuse-wind", "output", "pb-lynx-bms", "sys-positive", RED, "power-positive", "10 mm²", 2.5),
    buildEdge("pb-e10", "pb-wind", "negative", "pb-busbar-neg-main", "out-2", BLACK, "power-negative", "6 mm²", 2.5),

    // Alternateur → batterie moteur → DC-DC → fusible → bus Lynx
    buildEdge("pb-e11", "pb-alternator", "positive", "pb-fuse-alt", "input", RED, "power-positive", "25 mm²", 0.5),
    buildEdge("pb-e12", "pb-fuse-alt", "output", "pb-battery-start", "positive", RED, "power-positive", "25 mm²", 1),
    buildEdge("pb-e13", "pb-alternator", "negative", "pb-battery-start", "negative", BLACK, "power-negative", "25 mm²", 1),
    buildEdge("pb-e14", "pb-battery-start", "positive", "pb-fuse-dcdc-in", "input", RED, "power-positive", "10 mm²", 1),
    buildEdge("pb-e15", "pb-fuse-dcdc-in", "output", "pb-dcdc", "in-positive", RED, "power-positive", "10 mm²", 1),
    buildEdge("pb-e16", "pb-battery-start", "negative", "pb-dcdc", "in-negative", BLACK, "power-negative", "10 mm²", 1.5),
    buildEdge("pb-e17", "pb-dcdc", "out-positive", "pb-fuse-dcdc-out", "input", RED, "power-positive", "10 mm²", 1),
    buildEdge("pb-e18", "pb-fuse-dcdc-out", "output", "pb-lynx-bms", "sys-positive", RED, "power-positive", "10 mm²", 2.5),
    buildEdge("pb-e19", "pb-dcdc", "out-negative", "pb-busbar-neg-main", "out-3", BLACK, "power-negative", "10 mm²", 2.5),

    // Quai / groupe → isolateur galvanique / inverseur → MultiPlus (AC IN)
    buildEdge("pb-e20", "pb-shore", "ac", "pb-transfer", "in-1", PURPLE_230V, "ac-230v", "3G2,5 mm²", 3),
    buildEdge("pb-e21", "pb-generator", "ac", "pb-transfer", "in-2", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("pb-e22", "pb-transfer", "out", "pb-multiplus", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("pb-e23", "pb-shore", "earth", "pb-galvanic", "earth-in", LIME, "earth", "2,5 mm²", 3),
    buildEdge("pb-e24", "pb-galvanic", "earth-out", "pb-ground", "ground", LIME, "earth", "2,5 mm²", 2),

    // MultiPlus (AC OUT) → tableau 220V → prises + terres
    buildEdge("pb-e25", "pb-multiplus", "ac-out", "pb-ac-panel", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("pb-e26", "pb-ac-panel", "ac-out", "pb-socket-1", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 3),
    buildEdge("pb-e27", "pb-ac-panel", "ac-out", "pb-socket-2", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 2),
    buildEdge("pb-e28", "pb-ac-panel", "earth", "pb-ground", "ground", LIME, "earth", "1,5 mm²", 1),
    buildEdge("pb-e29", "pb-socket-1", "earth", "pb-ground", "ground", LIME, "earth", "1,5 mm²", 2),
    buildEdge("pb-e30", "pb-socket-2", "earth", "pb-ground", "ground", LIME, "earth", "1,5 mm²", 1),

    // MultiPlus (DC) : tap dédié Classe T directement sur le bus Lynx,
    // en parallèle du Distributor (calibre trop élevé pour une sortie MEGA)
    buildEdge("pb-e31", "pb-lynx-bms", "sys-positive", "pb-fuse-multiplus", "input", RED, "power-positive", "50 mm²", 0.6),
    buildEdge("pb-e32", "pb-fuse-multiplus", "output", "pb-multiplus", "dc-positive", RED, "power-positive", "50 mm²", 1.5),
    buildEdge("pb-e33", "pb-multiplus", "dc-negative", "pb-busbar-neg-main", "out-4", BLACK, "power-negative", "50 mm²", 1.5),

    // Batterie servitude → Lynx Power In → Lynx Smart BMS → Lynx Distributor
    buildEdge("pb-e34", "pb-battery-house", "positive", "pb-lynx-power-in", "input", RED, "power-positive", "50 mm²", 0.3),
    buildEdge("pb-e35", "pb-lynx-power-in", "output", "pb-lynx-bms", "batt-positive", RED, "power-positive", "50 mm²", 0.3),
    buildEdge("pb-e36", "pb-lynx-bms", "sys-positive", "pb-lynx-distributor", "input", RED, "power-positive", "35 mm²", 0.3),
    buildEdge("pb-e37", "pb-battery-house", "negative", "pb-lynx-bms", "batt-negative", BLACK, "power-negative", "50 mm²", 0.3),
    buildEdge("pb-e38", "pb-lynx-bms", "sys-negative", "pb-lynx-shunt", "battery", BLACK, "power-negative", "50 mm²", 0.3),
    buildEdge("pb-e39", "pb-lynx-shunt", "system", "pb-busbar-neg-main", "input", BLACK, "power-negative", "35 mm²", 0.3),

    // Communication VE.Direct/VE.Can → Cerbo GX (simplifié en un seul port
    // logique, voir ElectricalNode : la distinction VE.Direct/VE.Can/VE.Bus
    // n'est pas modélisée borne par borne)
    buildEdge("pb-e40", "pb-mppt", "ve-direct", "pb-cerbo", "ve-direct", GREEN_DATA, "data-bus", undefined, 4),
    buildEdge("pb-e41", "pb-lynx-bms", "ve-can", "pb-cerbo", "ve-direct", GREEN_DATA, "data-bus", undefined, 2),
    buildEdge("pb-e42", "pb-lynx-shunt", "ve-can", "pb-cerbo", "ve-direct", GREEN_DATA, "data-bus", undefined, 2),
    buildEdge("pb-e43", "pb-multiplus", "ve-direct", "pb-cerbo", "ve-direct", GREEN_DATA, "data-bus", undefined, 2),

    // Lynx Distributor → guindeau + pompe de cale (auto) + les deux tableaux
    buildEdge("pb-e44", "pb-lynx-distributor", "out-4", "pb-breaker-guindeau", "input", RED, "power-positive", "16 mm²", 1),
    buildEdge("pb-e45", "pb-breaker-guindeau", "output", "pb-guindeau", "positive", RED, "power-positive", "16 mm²", 2),
    buildEdge("pb-e46", "pb-busbar-neg-main", "out-5", "pb-guindeau", "negative", BLACK, "power-negative", "25 mm²", 3),
    buildEdge("pb-e47", "pb-lynx-distributor", "out-5", "pb-fuse-bilge-auto", "input", RED, "power-positive", "2,5 mm²", 1),
    buildEdge("pb-e48", "pb-fuse-bilge-auto", "output", "pb-pompe-cale", "positive-auto", RED, "power-positive", "6 mm²", 3),
    buildEdge("pb-e49", "pb-busbar-neg-main", "out-6", "pb-pompe-cale", "negative", BLACK, "power-negative", "2,5 mm²", 4),
    buildEdge("pb-e50", "pb-lynx-distributor", "out-1", "pb-panel-confort", "input", RED, "power-positive", "16 mm²", 2),
    buildEdge("pb-e51", "pb-lynx-distributor", "out-2", "pb-panel-pont", "input", RED, "power-positive", "16 mm²", 2.5),
    buildEdge("pb-e52", "pb-busbar-neg-main", "out-7", "pb-busbar-neg-confort", "input", BLACK, "power-negative", "16 mm²", 2),
    buildEdge("pb-e53", "pb-busbar-neg-main", "out-8", "pb-busbar-neg-pont", "input", BLACK, "power-negative", "16 mm²", 2.5),

    // Tableau confort → consommateurs
    buildEdge("pb-e54", "pb-panel-confort", "out-1", "pb-frigo", "positive", RED, "power-positive", "1,5 mm²", 2),
    buildEdge("pb-e55", "pb-panel-confort", "out-2", "pb-wc", "positive", RED, "power-positive", "1,5 mm²", 2.5),
    buildEdge("pb-e56", "pb-panel-confort", "out-3", "pb-chauffe-eau", "positive", RED, "power-positive", "4 mm²", 3),
    buildEdge("pb-e57", "pb-panel-confort", "out-4", "pb-pompe-eau", "positive", RED, "power-positive", "2,5 mm²", 3.5),
    buildEdge("pb-e58", "pb-panel-confort", "out-5", "pb-switch-eclairage", "input", RED, "power-positive", "0,75 mm²", 4),
    buildEdge("pb-e59", "pb-switch-eclairage", "output", "pb-eclairage-led", "positive", RED, "power-positive", "0,75 mm²", 1),
    buildEdge("pb-e60", "pb-panel-confort", "out-6", "pb-switch-ruban", "input", RED, "power-positive", "0,75 mm²", 4.5),
    buildEdge("pb-e61", "pb-switch-ruban", "output", "pb-ruban-led", "positive", RED, "power-positive", "0,75 mm²", 1),
    buildEdge("pb-e62", "pb-panel-confort", "out-7", "pb-switch-plafonnier", "input", RED, "power-positive", "0,75 mm²", 5),
    buildEdge("pb-e63", "pb-switch-plafonnier", "output", "pb-plafonnier-led", "positive", RED, "power-positive", "0,75 mm²", 1),
    buildEdge("pb-e64", "pb-panel-confort", "out-8", "pb-usb", "positive", RED, "power-positive", "0,75 mm²", 5.5),
    buildEdge("pb-e65", "pb-panel-confort", "out-9", "pb-electronique-bord", "positive", RED, "power-positive", "1 mm²", 6),

    buildEdge("pb-e66", "pb-busbar-neg-confort", "out-1", "pb-frigo", "negative", BLACK, "power-negative", "1,5 mm²", 2),
    buildEdge("pb-e67", "pb-busbar-neg-confort", "out-2", "pb-wc", "negative", BLACK, "power-negative", "1,5 mm²", 2.5),
    buildEdge("pb-e68", "pb-busbar-neg-confort", "out-3", "pb-chauffe-eau", "negative", BLACK, "power-negative", "4 mm²", 3),
    buildEdge("pb-e69", "pb-busbar-neg-confort", "out-4", "pb-pompe-eau", "negative", BLACK, "power-negative", "2,5 mm²", 3.5),
    buildEdge("pb-e70", "pb-busbar-neg-confort", "out-5", "pb-eclairage-led", "negative", BLACK, "power-negative", "0,75 mm²", 4.5),
    buildEdge("pb-e71", "pb-busbar-neg-confort", "out-6", "pb-ruban-led", "negative", BLACK, "power-negative", "0,75 mm²", 5),
    buildEdge("pb-e72", "pb-busbar-neg-confort", "out-7", "pb-plafonnier-led", "negative", BLACK, "power-negative", "0,75 mm²", 5.5),
    buildEdge("pb-e73", "pb-busbar-neg-confort", "out-8", "pb-usb", "negative", BLACK, "power-negative", "0,75 mm²", 5.5),
    buildEdge("pb-e74", "pb-busbar-neg-confort", "out-9", "pb-electronique-bord", "negative", BLACK, "power-negative", "1 mm²", 6),

    // Tableau pont & sécurité → consommateurs
    buildEdge("pb-e75", "pb-panel-pont", "out-1", "pb-switch-nav", "input", RED, "power-positive", "1,5 mm²", 5),
    buildEdge("pb-e76", "pb-switch-nav", "output", "pb-feu-babord", "positive", RED, "power-positive", "1 mm²", 3),
    buildEdge("pb-e77", "pb-switch-nav", "output", "pb-feu-tribord", "positive", RED, "power-positive", "1 mm²", 3),
    buildEdge("pb-e78", "pb-switch-nav", "output", "pb-feu-mat", "positive", RED, "power-positive", "1 mm²", 4),
    buildEdge("pb-e79", "pb-panel-pont", "out-2", "pb-switch-mouillage", "input", RED, "power-positive", "1 mm²", 5),
    buildEdge("pb-e80", "pb-switch-mouillage", "output", "pb-feu-mouillage", "positive", RED, "power-positive", "1 mm²", 4),
    buildEdge("pb-e81", "pb-panel-pont", "out-3", "pb-switch-floodlight", "input", RED, "power-positive", "1,5 mm²", 5),
    buildEdge("pb-e82", "pb-switch-floodlight", "output", "pb-projecteur-pont", "positive", RED, "power-positive", "1,5 mm²", 4),
    buildEdge("pb-e83", "pb-panel-pont", "out-4", "pb-switch-marche", "input", RED, "power-positive", "0,75 mm²", 5),
    buildEdge("pb-e84", "pb-switch-marche", "output", "pb-eclairage-marche", "positive", RED, "power-positive", "0,75 mm²", 4),
    buildEdge("pb-e85", "pb-panel-pont", "out-5", "pb-switch-klaxon", "input", RED, "power-positive", "1,5 mm²", 5),
    buildEdge("pb-e86", "pb-switch-klaxon", "output", "pb-klaxon", "positive", RED, "power-positive", "1,5 mm²", 4),
    buildEdge("pb-e87", "pb-panel-pont", "out-6", "pb-pilote", "positive", RED, "power-positive", "1,5 mm²", 5),
    buildEdge("pb-e88", "pb-panel-pont", "out-7", "pb-switch-bilge-manual", "input", RED, "power-positive", "2,5 mm²", 5.5),
    buildEdge("pb-e89", "pb-switch-bilge-manual", "output", "pb-pompe-cale", "positive-manual", RED, "power-positive", "2,5 mm²", 5),

    buildEdge("pb-e90", "pb-busbar-neg-pont", "out-1", "pb-feu-babord", "negative", BLACK, "power-negative", "1 mm²", 3),
    buildEdge("pb-e91", "pb-busbar-neg-pont", "out-2", "pb-feu-tribord", "negative", BLACK, "power-negative", "1 mm²", 3),
    buildEdge("pb-e92", "pb-busbar-neg-pont", "out-3", "pb-feu-mat", "negative", BLACK, "power-negative", "1 mm²", 4),
    buildEdge("pb-e93", "pb-busbar-neg-pont", "out-4", "pb-feu-mouillage", "negative", BLACK, "power-negative", "1 mm²", 4),
    buildEdge("pb-e94", "pb-busbar-neg-pont", "out-5", "pb-projecteur-pont", "negative", BLACK, "power-negative", "1,5 mm²", 4),
    buildEdge("pb-e95", "pb-busbar-neg-pont", "out-6", "pb-eclairage-marche", "negative", BLACK, "power-negative", "0,75 mm²", 4),
    buildEdge("pb-e96", "pb-busbar-neg-pont", "out-7", "pb-klaxon", "negative", BLACK, "power-negative", "1,5 mm²", 4),
    buildEdge("pb-e97", "pb-busbar-neg-pont", "out-8", "pb-pilote", "negative", BLACK, "power-negative", "1,5 mm²", 5),
    buildEdge("pb-e98", "pb-busbar-neg-pont", "out-9", "pb-pompe-cale", "negative", BLACK, "power-negative", "2,5 mm²", 5),
  ];

  const zones: SchemaNode[] = [
    buildZone("pb-zone-solar", -20, -80, 700, 300, "Solaire", "#f59e0b"),
    buildZone("pb-zone-wind", -20, 300, 700, 120, "Éolien", "#0ea5e9"),
    buildZone("pb-zone-alt", -20, 460, 900, 320, "Alternateur / DC-DC", "#10b981"),
    buildZone("pb-zone-ac", 600, -340, 1460, 380, "Quai, groupe électrogène & 230V", "#7c3aed"),
    buildZone("pb-zone-lynx", 880, 340, 1320, 700, "Batterie & bus Lynx", "#6366f1"),
    buildZone("pb-zone-confort", 1900, 700, 900, 700, "Distribution & confort", "#14b8a6"),
    buildZone("pb-zone-pont", 1900, 1420, 900, 900, "Pont & sécurité", "#ec4899"),
  ];

  return { projectName: "Gabarit : le bateau FabSystem", nodes: [...zones, ...nodes], edges };
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
  {
    id: "victron-light-van",
    label: "Le Victron leger",
    description: "Une base coherente pour van autour d'une batterie LiFePO4 150Ah, d'un MPPT 75/15, d'un MultiPlus Compact 12/800, d'un SmartShunt et d'un Orion 18A optionnel.",
    build: buildVictronLightVanTemplate,
  },
  {
    id: "station-aferiy-p280",
    label: "AFERIY P280 dans un van",
    description: "Cas concret autour d'une AFERIY P280 : un XT90 pour le solaire, un XT90 pour la recharge véhicule / DC-DC, une sortie XT60 12V protégée et deux prises AC fixes à traiter avec sérieux.",
    build: buildAferiyP280Template,
  },
  {
    id: "bateau-premium",
    label: "Le bateau FabSystem",
    description: "Le système le plus complet du catalogue : solaire + éolien + alternateur/DC-DC + quai/groupe électrogène, batterie Lithium NG sur bus Lynx complet (Power In, Smart BMS, Distributor, Shunt), MultiPlus-II, Cerbo GX, et deux tableaux 12V (confort + pont/sécurité).",
    build: buildPremiumBoatTemplate,
  },
];

export function getSchemaTemplate(id: string): SchemaTemplate | undefined {
  return SCHEMA_TEMPLATES.find((t) => t.id === id);
}
