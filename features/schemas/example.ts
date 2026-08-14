import type { Node, Edge } from "@xyflow/react";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

// Types équivalents à SchemaNode/SchemaEdge (features/schemas/store/useSchemaStore.ts)
// sans importer le store, pour éviter une dépendance circulaire (le store
// importera ce module pour `loadExample`).
type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

function buildNode(id: string, type: string, x: number, y: number, data: { label: string } & Record<string, unknown>): SchemaNode {
  const def = getComponentDefinition(type);
  if (!def) throw new Error(`Composant inconnu dans l'exemple : ${type}`);
  return { id, type: "electrical", position: { x, y }, data: { componentType: type, ...data } };
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
): SchemaEdge {
  return { id, source, sourceHandle, target, targetHandle, type: "cable", data: { color, cableType, section, length } };
}

const RED = "#dc2626";
const BLACK = "#111827";
const GREEN = "#16a34a";
const GRAY = "#6b7280";
const LIME = "#84cc16";

// Longueurs moyennes plausibles par section (retour utilisateur : "sélectionne
// des moyennes plausibles" pour la liste de courses) — plus la section est
// grosse, plus le tronçon est court (lignes batterie/busbar courtes et
// épaisses vs branches consommateurs fines et plus longues jusqu'au poste).
const L_05 = 2; // 0,5 mm² — retours signalisation/LED
const L_075 = 2.5; // 0,75 mm² — petites branches consommateurs
const L_15 = 3; // 1,5 mm² — branches consommateurs courantes
const L_25 = 2; // 3G2,5 mm² — liaisons AC courtes tableau/prise
const L_6 = 1.5; // 6 mm² — lignes de charge (source → busbar)
const L_10 = 1.5; // 10 mm² — busbar → tableau fusibles / écran
const L_16 = 1; // 16 mm² — lignes batterie principale, tronçons courts

// Schéma de démonstration van (CDC §56 "Voir un exemple") — repris tel quel
// depuis une édition manuelle de l'utilisateur dans l'éditeur (2026-08-14) :
// un busbar de charge intermédiaire protège chaque source (MPPT, DC-DC) par
// un disjoncteur avant la batterie aux, un disjoncteur protège aussi le
// Multiplus côté DC, chaque consommateur passe par son propre interrupteur
// avant le tableau fusibles, et l'alimentation de quai passe par le
// Multiplus (AC IN) → Tableau 220V → Prise 220V, avec les terres reliées à
// la caisse.
export function buildExampleSchema(): { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const nodes: SchemaNode[] = [
    // Chaîne solaire
    buildNode("ex-solar", "solar-panel", 40, 100, { label: "Panneau solaire", powerW: 200, voltage: 0 }),
    buildNode("ex-mppt", "mppt", 260, 20, { label: "MPPT", amperage: 30, systemVoltage: 12 }),

    // Chaîne alternateur / DC-DC (batterie moteur)
    buildNode("ex-battery-moteur", "battery", 40, 360, { label: "Batterie moteur", voltage: 12, capacityAh: 100, technology: "plomb" }),
    buildNode("ex-alternator", "alternator", 40, 520, { label: "Alternateur", voltage: 12, amperage: 90 }),
    buildNode("ex-fuse-dcdc", "fuse", 320, 260, { label: "Fusible DC-DC", fuseType: "midi", amperage: 30 }),
    buildNode("ex-dcdc", "dcdc", 440, 260, { label: "DC-DC", voltageIn: 12, voltageOut: 12, amperage: 20 }),

    // Busbar de charge intermédiaire : chaque source (MPPT, DC-DC) protégée
    // par son propre disjoncteur DC avant de rejoindre la batterie aux et le
    // fusible principal.
    buildNode("busbar_mst1t8m8_1", "busbar", 540, 100, { label: "Busbar", polarity: "positive", outputCount: 4 }),
    buildNode("circuit-breaker_mst1vjlz_5", "circuit-breaker", 420, 60, { label: "Disjoncteur DC", amperage: 16 }),
    buildNode("circuit-breaker_mst1vyr4_8", "circuit-breaker", 520, 200, { label: "Disjoncteur DC", amperage: 16 }),

    // Batterie auxiliaire + protection + distribution
    buildNode("ex-battery-aux", "battery", 600, 360, { label: "Batterie aux 12V", voltage: 12, capacityAh: 100, technology: "lifepo4" }),
    buildNode("ex-fuse-main", "fuse", 860, 140, { label: "Fusible principal", fuseType: "midi", amperage: 100 }),
    buildNode("ex-switch", "battery-switch", 1040, 140, { label: "Coupe-batterie", amperage: 0 }),
    buildNode("ex-busbar-pos", "busbar", 1220, 140, { label: "Busbar + 12V", polarity: "positive", outputCount: 4 }),
    buildNode("ex-panel", "fuse-block", 1220, 320, { label: "Tableau fusibles", outputCount: 4, ampPerOutput: 10 }),

    // Consommateurs (chacun via son propre interrupteur avant le tableau)
    buildNode("ex-frigo", "consumer", 880, 320, { label: "Réfrigérateur à compression", presetType: "refrigerateur", powerW: 45 }),
    buildNode("ex-eclairage", "consumer", 1360, 440, { label: "Éclairage LED", presetType: "eclairage-led", powerW: 5 }),
    buildNode("ex-pompe", "consumer", 920, 440, { label: "Pompe à eau", presetType: "pompe-eau", powerW: 60 }),
    buildNode("ex-usb", "consumer", 1080, 600, { label: "Prise USB / 12 V", presetType: "prise-usb-12v", powerW: 15 }),
    buildNode("switch_mst385ua_1", "switch", 1360, 320, { label: "Interrupteur", amperage: 0 }),
    buildNode("switch_mst38upg_3", "switch", 1080, 280, { label: "Interrupteur", amperage: 0 }),
    buildNode("switch_mst3cwzp_6", "switch", 1220, 500, { label: "Interrupteur", amperage: 0 }),
    buildNode("switch_mst3dhr3_8", "switch", 1140, 400, { label: "Interrupteur", amperage: 0, rotation: 90 }),

    // Convertisseur-chargeur (Multiplus), protégé côté + par un disjoncteur
    buildNode("ex-multiplus", "inverter-charger", 1680, 380, { label: "Convertisseur-chargeur", powerW: 1600, voltageDC: 12, chargeAmperage: 50 }),
    buildNode("circuit-breaker_mst1ysym_3", "circuit-breaker", 1560, 160, { label: "Disjoncteur DC", amperage: 16 }),

    // Écran de contrôle : agrège les liaisons VE.Direct (shunt, MPPT, Multiplus)
    buildNode("ex-fuse-monitor", "fuse", 1780, 420, { label: "Fusible écran", fuseType: "lame", amperage: 2 }),
    buildNode("ex-monitor", "system-monitor", 1780, 500, { label: "Écran de contrôle" }),

    // Retour négatif
    buildNode("ex-shunt", "shunt", 680, 700, { label: "Shunt", amperage: 0 }),
    buildNode("ex-busbar-neg", "busbar", 1200, 840, { label: "Busbar −", polarity: "negative", outputCount: 8 }),

    // Alimentation de quai : réseau → Multiplus (AC IN) → Tableau 220V →
    // Prise 220V, avec les fils de terre du tableau et de la prise reliés à
    // la caisse.
    buildNode("shore-power_mst20n4n_13", "shore-power", 1660, -120, { label: "Prise de quai" }),
    buildNode("ac-panel_mst2019n_7", "ac-panel", 2000, 40, { label: "Tableau 220V" }),
    buildNode("socket-220v_mst1zy3g_6", "socket-220v", 2200, 40, { label: "Prise 220V", powerW: 500 }),
    buildNode("ground_mst20cj7_10", "ground", 2100, 220, { label: "Point de masse" }),
  ];

  const edges: SchemaEdge[] = [
    // Solaire → MPPT
    buildEdge("ex-e1", "ex-solar", "positive", "ex-mppt", "pv-positive", RED, "power-positive", "6 mm²", L_6),
    buildEdge("ex-e2", "ex-solar", "negative", "ex-mppt", "pv-negative", BLACK, "power-negative", "6 mm²", L_6),

    // Batterie moteur → Fusible → DC-DC
    buildEdge("xy-edge__ex-battery-moteurpositive-ex-fuse-dcdcinput", "ex-battery-moteur", "positive", "ex-fuse-dcdc", "input", RED, "power-positive", "6 mm²", L_6),
    buildEdge("ex-e4", "ex-fuse-dcdc", "output", "ex-dcdc", "in-positive", RED, "power-positive", "6 mm²", L_6),
    buildEdge("ex-e5", "ex-battery-moteur", "negative", "ex-dcdc", "in-negative", BLACK, "power-negative", "6 mm²", L_6),

    // Alternateur → batterie moteur (charge au démarrage/en navigation) —
    // 25 mm² minimum (retour utilisateur).
    buildEdge("ex-e-alternator-pos", "ex-alternator", "positive", "ex-battery-moteur", "positive", RED, "power-positive", "25 mm²", L_10),
    buildEdge("ex-e-alternator-neg", "ex-alternator", "negative", "ex-battery-moteur", "negative", BLACK, "power-negative", "25 mm²", L_10),

    // MPPT et DC-DC : retour (−) vers busbar−, sortie (+) protégée par un
    // disjoncteur avant de rejoindre le busbar de charge intermédiaire.
    buildEdge("ex-e8", "ex-mppt", "bat-negative", "ex-busbar-neg", "out-1", BLACK, "power-negative", "6 mm²", L_6),
    buildEdge("ex-e9", "ex-dcdc", "out-negative", "ex-busbar-neg", "out-2", BLACK, "power-negative", "6 mm²", L_6),
    buildEdge("edge_mst1vt1f_6", "ex-mppt", "bat-positive", "circuit-breaker_mst1vjlz_5", "input", RED, "power-positive", "6 mm²", 0.3),
    buildEdge("edge_mst1vuy1_7", "circuit-breaker_mst1vjlz_5", "output", "busbar_mst1t8m8_1", "out-3", RED, "power-positive", "6 mm²", L_6),
    buildEdge("edge_mst1w7mi_1", "ex-dcdc", "out-positive", "circuit-breaker_mst1vyr4_8", "output", RED, "power-positive", "6 mm²", L_6),
    buildEdge("edge_mst1wg0b_2", "circuit-breaker_mst1vyr4_8", "input", "busbar_mst1t8m8_1", "out-2", RED, "power-positive", "6 mm²", L_6),

    // Busbar de charge : batterie aux (25 mm² minimum, retour utilisateur) + fusible principal
    buildEdge("edge_mst1uj3t_3", "ex-battery-aux", "positive", "busbar_mst1t8m8_1", "out-1", RED, "power-positive", "25 mm²", L_16),
    buildEdge("edge_mst1uw9e_4", "ex-fuse-main", "input", "busbar_mst1t8m8_1", "out-4", RED, "power-positive", "16 mm²", L_16),

    // Fusible principal → coupe-batterie → busbar+
    buildEdge("ex-e11", "ex-fuse-main", "output", "ex-switch", "input", RED, "power-positive", "16 mm²", L_16),
    buildEdge("ex-e12", "ex-switch", "output", "ex-busbar-pos", "input", RED, "power-positive", "16 mm²", L_16),

    // Busbar+ → tableau fusibles → interrupteurs → consommateurs
    buildEdge("xy-edge__ex-busbar-posout-1-ex-panelinput", "ex-busbar-pos", "out-1", "ex-panel", "input", RED, "power-positive", "10 mm²", L_10),
    buildEdge("edge_mst38iyz_2", "switch_mst385ua_1", "input", "ex-panel", "out-2", RED, "power-positive", "0,75 mm²", L_075),
    buildEdge("xy-edge__switch_mst385ua_1output-ex-eclairagepositive", "switch_mst385ua_1", "output", "ex-eclairage", "positive", RED, "power-positive", "0,75 mm²", L_075),
    buildEdge("xy-edge__ex-panelout-3-switch_mst38upg_3output", "ex-panel", "out-3", "switch_mst38upg_3", "output", RED, "power-positive", "1,5 mm²", L_15),
    buildEdge("edge_mst39ppu_4", "switch_mst38upg_3", "input", "ex-frigo", "positive", RED, "power-positive", "1,5 mm²", 1),
    buildEdge("xy-edge__switch_mst3cwzp_6output-ex-panelout-1", "switch_mst3cwzp_6", "output", "ex-panel", "out-1", RED, "power-positive", "1,5 mm²", L_15),
    buildEdge("edge_mst3dauh_7", "switch_mst3cwzp_6", "input", "ex-pompe", "positive", RED, "power-positive", "1,5 mm²", L_15),
    buildEdge("edge_mst3ea3y_9", "switch_mst3dhr3_8", "input", "ex-panel", "out-4", RED, "power-positive", "0,75 mm²", L_075),
    buildEdge("xy-edge__switch_mst3dhr3_8output-ex-usbpositive", "switch_mst3dhr3_8", "output", "ex-usb", "positive", RED, "power-positive", "0,75 mm²", L_075),

    // Batterie aux (−) → shunt → busbar− → consommateurs
    buildEdge("ex-e18", "ex-battery-aux", "negative", "ex-shunt", "battery", BLACK, "power-negative", "25 mm²", 0.3),
    buildEdge("ex-e19", "ex-shunt", "system", "ex-busbar-neg", "input", BLACK, "power-negative", "16 mm²", L_16),
    buildEdge("ex-e20", "ex-busbar-neg", "out-3", "ex-frigo", "negative", BLACK, "power-negative", "1,5 mm²", L_15),
    buildEdge("ex-e21", "ex-busbar-neg", "out-4", "ex-eclairage", "negative", BLACK, "power-negative", "0,5 mm²", L_05),
    buildEdge("ex-e22", "ex-busbar-neg", "out-5", "ex-pompe", "negative", BLACK, "power-negative", "1,5 mm²", L_15),
    buildEdge("ex-e23", "ex-busbar-neg", "out-6", "ex-usb", "negative", BLACK, "power-negative", "0,5 mm²", L_05),
    buildEdge("ex-e25", "ex-busbar-neg", "out-7", "ex-multiplus", "dc-negative", BLACK, "power-negative", "16 mm²", L_16),

    // Convertisseur-chargeur : + protégé par un disjoncteur depuis busbar+,
    // − direct depuis busbar−.
    buildEdge("edge_mst1z44g_4", "ex-multiplus", "dc-positive", "circuit-breaker_mst1ysym_3", "output", RED, "power-positive", "16 mm²", L_16),
    buildEdge("edge_mst1z7wk_5", "ex-busbar-pos", "out-4", "circuit-breaker_mst1ysym_3", "input", RED, "power-positive", "16 mm²", L_16),

    // Écran de contrôle : alimentation + liaisons VE.Direct (vert)
    buildEdge("ex-e29", "ex-busbar-pos", "out-3", "ex-fuse-monitor", "input", RED, "power-positive", "0,75 mm²", L_075),
    buildEdge("ex-e29b", "ex-fuse-monitor", "output", "ex-monitor", "positive", RED, "power-positive", "0,75 mm²", 0.2),
    buildEdge("ex-e30", "ex-busbar-neg", "out-8", "ex-monitor", "negative", BLACK, "power-negative", "0,75 mm²", L_075),
    buildEdge("ex-e31", "ex-shunt", "ve-direct", "ex-monitor", "ve-direct", GREEN, "data-bus", undefined, 1.5),
    buildEdge("ex-e32", "ex-mppt", "ve-direct", "ex-monitor", "ve-direct", GREEN, "data-bus", undefined, 2),
    buildEdge("ex-e33", "ex-multiplus", "ve-direct", "ex-monitor", "ve-direct", GREEN, "data-bus", undefined, 1.5),

    // Quai → Multiplus (AC IN, passthrough) → Tableau 220V → Prise 220V
    buildEdge("edge_mst20ss9_14", "shore-power_mst20n4n_13", "ac", "ex-multiplus", "ac-in", GRAY, "other", "3G2,5 mm²", 5),
    buildEdge("edge_mst205lj_8", "ex-multiplus", "ac-out", "ac-panel_mst2019n_7", "ac-in", GRAY, "other", "3G2,5 mm²", L_25),
    buildEdge("edge_mst2099i_9", "ac-panel_mst2019n_7", "ac-out", "socket-220v_mst1zy3g_6", "ac-in", GRAY, "other", "3G2,5 mm²", L_25),

    // Les fils de terre (tableau, prise) → caisse
    buildEdge("edge_mst20hpo_12", "ac-panel_mst2019n_7", "earth", "ground_mst20cj7_10", "ground", LIME, "earth", "1,5 mm²", 0.5),
    buildEdge("edge_mst20fmn_11", "socket-220v_mst1zy3g_6", "earth", "ground_mst20cj7_10", "ground", LIME, "earth", "1,5 mm²", 0.5),
  ];

  return { projectName: "Exemple : installation van", nodes, edges };
}
