import type { Node, Edge } from "@xyflow/react";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

// Types équivalents à SchemaNode/SchemaEdge (features/schemas/store/useSchemaStore.ts)
// sans importer le store, pour éviter une dépendance circulaire (le store
// importera ce module via features/schemas/templates.ts pour `loadTemplate`).
type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;

function buildNode(id: string, type: string, x: number, y: number, data: { label: string } & Record<string, unknown>): SchemaNode {
  const def = getComponentDefinition(type);
  if (!def) throw new Error(`Composant inconnu dans l'exemple : ${type}`);
  return { id, type: "electrical", position: { x, y }, data: { componentType: type, ...data } };
}

// Zone colorée (V2, retour utilisateur : "créer des carrés de couleur pour
// créer des zones de schéma") — pas de `ComponentDefinition`, donc pas de
// validation via getComponentDefinition contrairement à buildNode.
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
const GREEN = "#16a34a";
const PURPLE_230V = "#7c3aed";
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
// depuis une édition manuelle de l'utilisateur dans l'éditeur (2026-08-15,
// nouvelle réorganisation avec zones) : un busbar de charge intermédiaire
// protège chaque source (MPPT, DC-DC) par un disjoncteur avant la batterie
// aux, un disjoncteur protège aussi le Multiplus côté DC, chaque
// consommateur passe par son propre interrupteur avant le tableau fusibles,
// et l'alimentation de quai passe par le Multiplus (AC IN) → Tableau 220V →
// Prise 220V, avec les terres reliées à la caisse. Regroupé visuellement en
// six zones (Solaire, Alternateur et DC-DC, servitude principale,
// Consommateurs, écran de contrôle, 220V) — purement un repère visuel,
// aucun lien de rattachement automatique.
export function buildExampleSchema(): { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] } {
  const nodes: SchemaNode[] = [
    // Chaîne solaire
    buildNode("ex-solar", "solar-panel", 40, 100, { label: "Panneau solaire", powerW: 200, voltage: 0 }),
    buildNode("ex-mppt", "mppt", 200, 20, { label: "MPPT", amperage: 30, systemVoltage: 12 }),

    // Chaîne alternateur / DC-DC (batterie moteur)
    buildNode("ex-battery-moteur", "battery", 40, 360, { label: "Batterie moteur", voltage: 12, capacityAh: 100, technology: "plomb" }),
    buildNode("ex-alternator", "alternator", 40, 520, { label: "Alternateur", voltage: 12, amperage: 90 }),
    // Protection alternateur → batterie moteur (retour utilisateur : "rajoute
    // un fusible à l'alternateur pour éviter d'avoir le message") — sans
    // elle, `computeSchemaIssues` (lib/electrical-components/checks.ts)
    // signale l'alternateur comme source de charge non protégée avant la
    // batterie. ANL 100A : calibre usuel juste au-dessus du courant max de
    // l'alternateur (90A).
    buildNode("ex-fuse-alternator", "fuse", 140, 440, { label: "Fusible alternateur", fuseType: "anl", amperage: 100 }),
    buildNode("ex-fuse-dcdc", "fuse", 260, 320, { label: "Fusible DC-DC", fuseType: "midi", amperage: 30 }),
    buildNode("ex-dcdc", "dcdc", 300, 480, { label: "DC-DC", voltageIn: 12, voltageOut: 12, amperage: 20 }),

    // Busbar de charge intermédiaire : chaque source (MPPT, DC-DC) protégée
    // par son propre disjoncteur DC avant de rejoindre la batterie aux et le
    // fusible principal.
    buildNode("busbar_mst1t8m8_1", "busbar", 680, 100, { label: "Busbar", polarity: "positive", outputCount: 4 }),
    buildNode("circuit-breaker_mst1vjlz_5", "circuit-breaker", 380, 100, { label: "Disjoncteur DC", amperage: 16 }),
    buildNode("circuit-breaker_mst1vyr4_8", "circuit-breaker", 380, 340, { label: "Disjoncteur DC", amperage: 16, rotation: 180 }),

    // Batterie auxiliaire + protection + distribution
    buildNode("ex-battery-aux", "battery", 560, 240, {
      label: "Batterie aux 12V",
      voltage: 12,
      capacityAh: 100,
      technology: "lifepo4",
      rotation: 180,
      brandModelId: "victron-lithium-smart-100ah",
      brand: "Victron",
      model: "Lithium Smart 12,8V/100Ah",
    }),
    buildNode("ex-fuse-main", "fuse", 820, 100, { label: "Fusible principal", fuseType: "midi", amperage: 100, rotation: 0 }),
    buildNode("ex-switch", "battery-switch", 980, 20, { label: "Coupe-batterie", amperage: 0 }),
    buildNode("ex-busbar-pos", "busbar", 1120, 140, { label: "Busbar + 12V", polarity: "positive", outputCount: 4 }),
    buildNode("ex-panel", "fuse-block", 1380, 780, {
      label: "Tableau fusibles",
      outputCount: 4,
      ampPerOutput: 10,
      outAmp1: 15,
      outAmp2: 5,
      outAmp3: 15,
      outAmp4: 5,
    }),

    // Consommateurs (chacun via son propre interrupteur avant le tableau)
    buildNode("ex-frigo", "consumer", 1160, 860, { label: "Réfrigérateur à compression", presetType: "refrigerateur", powerW: 45 }),
    buildNode("ex-eclairage", "consumer", 1540, 720, { label: "Éclairage LED", presetType: "eclairage-led", powerW: 5 }),
    buildNode("ex-pompe", "consumer", 1540, 920, { label: "Pompe à eau", presetType: "pompe-eau", powerW: 60 }),
    buildNode("ex-usb", "consumer", 1180, 660, { label: "Prise USB / 12 V", presetType: "prise-usb-12v", powerW: 15 }),
    buildNode("switch_mst385ua_1", "switch", 1540, 620, { label: "Interrupteur", amperage: 0 }),
    buildNode("switch_mst38upg_3", "switch", 1200, 760, { label: "Interrupteur", amperage: 0 }),
    buildNode("switch_mst3cwzp_6", "switch", 1560, 820, { label: "Interrupteur", amperage: 0 }),
    buildNode("switch_mst3dhr3_8", "switch", 1320, 600, { label: "Interrupteur", amperage: 0, rotation: 180 }),

    // Convertisseur-chargeur (Multiplus), protégé côté + par un disjoncteur
    buildNode("ex-multiplus", "inverter-charger", 1700, 180, { label: "Convertisseur-chargeur", powerW: 1600, voltageDC: 12, chargeAmperage: 50 }),
    buildNode("circuit-breaker_mst1ysym_3", "circuit-breaker", 1580, 80, { label: "Disjoncteur DC", amperage: 16 }),

    // Écran de contrôle : agrège les liaisons VE.Direct (shunt, MPPT, Multiplus)
    buildNode("ex-fuse-monitor", "fuse", 520, 700, { label: "Fusible écran", fuseType: "lame", amperage: 2, rotation: 180 }),
    buildNode("ex-monitor", "system-monitor", 360, 800, { label: "Écran de contrôle", rotation: 90 }),

    // Retour négatif
    buildNode("ex-shunt", "shunt", 760, 280, { label: "Shunt", amperage: 0, rotation: 0 }),
    buildNode("ex-busbar-neg", "busbar", 700, 420, { label: "Busbar −", polarity: "negative", outputCount: 8, rotation: 90 }),

    // Alimentation de quai : réseau → Multiplus (AC IN) → Tableau 220V →
    // Prise 220V, avec les fils de terre du tableau et de la prise reliés à
    // la caisse.
    buildNode("shore-power_mst20n4n_13", "shore-power", 1680, 0, { label: "Prise de quai" }),
    buildNode("ac-panel_mst2019n_7", "ac-panel", 1700, 340, { label: "Tableau 220V", rotation: 0 }),
    buildNode("socket-220v_mst1zy3g_6", "socket-220v", 1880, 60, { label: "Prise 220V", powerW: 500, rotation: 270 }),
    buildNode("ground_mst20cj7_10", "ground", 1900, 380, { label: "Point de masse", rotation: 90 }),

    // Zones (V2, retour utilisateur) — purement visuel, l'utilisateur a
    // glissé les composants dedans lui-même, aucun lien automatique.
    buildZone("zone_msuidg31_1", -20, -60, 500, 260, "Solaire", "#f59e0b"),
    buildZone("zone_msuied65_2", -20, 300, 500, 300, "Alternateur et DCDC", "#10b981"),
    buildZone("zone_msupb7ur_2", 1580, -20, 460, 480, "220volt", "#8b5cf6"),
    buildZone("zone_msupmyh9_5", 530, 10, 680, 540, "servitude principale", "#3b82f6"),
    buildZone("zone_msups3pt_7", 1180, 560, 520, 440, "Consommateurs", "#14b8a6"),
    buildZone("zone_msupx3sa_8", 200, 680, 460, 260, "ecran controle", "#ec4899"),
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
    buildEdge("ex-e-alternator-pos", "ex-alternator", "positive", "ex-fuse-alternator", "input", RED, "power-positive", "25 mm²", 0.5),
    buildEdge("ex-e-alternator-fuse-out", "ex-fuse-alternator", "output", "ex-battery-moteur", "positive", RED, "power-positive", "25 mm²", 1),
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
    buildEdge("edge_msupj8cz_4", "busbar_mst1t8m8_1", "input", "ex-battery-aux", "positive", RED, "power-positive", "25 mm²", 0.5, { x: 540, y: 220 }),
    buildEdge("edge_mst1uw9e_4", "ex-fuse-main", "input", "busbar_mst1t8m8_1", "out-4", RED, "power-positive", "16 mm²", 0.5, { x: 800, y: 140 }),

    // Fusible principal → coupe-batterie → busbar+
    buildEdge("ex-e11", "ex-fuse-main", "output", "ex-switch", "input", RED, "power-positive", "16 mm²", 0.5),
    buildEdge("ex-e12", "ex-switch", "output", "ex-busbar-pos", "input", RED, "power-positive", "16 mm²", L_16),

    // Busbar+ → tableau fusibles → interrupteurs → consommateurs
    buildEdge("xy-edge__ex-busbar-posout-1-ex-panelinput", "ex-busbar-pos", "out-1", "ex-panel", "input", RED, "power-positive", "10 mm²", L_10),
    buildEdge("edge_mst38iyz_2", "switch_mst385ua_1", "input", "ex-panel", "out-2", RED, "power-positive", "0,75 mm²", L_075),
    buildEdge("xy-edge__switch_mst385ua_1output-ex-eclairagepositive", "switch_mst385ua_1", "output", "ex-eclairage", "positive", RED, "power-positive", "0,75 mm²", L_075),
    buildEdge("xy-edge__ex-panelout-3-switch_mst38upg_3output", "ex-panel", "out-3", "switch_mst38upg_3", "output", RED, "power-positive", "1,5 mm²", L_15),
    buildEdge("edge_mst39ppu_4", "switch_mst38upg_3", "input", "ex-frigo", "positive", RED, "power-positive", "1,5 mm²", 1),
    buildEdge("xy-edge__switch_mst3cwzp_6output-ex-panelout-1", "switch_mst3cwzp_6", "output", "ex-panel", "out-1", RED, "power-positive", "1,5 mm²", L_15),
    buildEdge("edge_mst3dauh_7", "switch_mst3cwzp_6", "input", "ex-pompe", "positive", RED, "power-positive", "1,5 mm²", L_15),
    buildEdge("edge_mst3ea3y_9", "switch_mst3dhr3_8", "input", "ex-panel", "out-4", RED, "power-positive", "0,75 mm²", L_075, { x: 1385, y: 710 }),
    buildEdge("xy-edge__switch_mst3dhr3_8output-ex-usbpositive", "switch_mst3dhr3_8", "output", "ex-usb", "positive", RED, "power-positive", "0,75 mm²", L_075, { x: 1265, y: 630 }),

    // Batterie aux (−) → shunt → busbar− → consommateurs
    buildEdge("ex-e18", "ex-battery-aux", "negative", "ex-shunt", "battery", BLACK, "power-negative", "25 mm²", 0.3),
    buildEdge("ex-e19", "ex-shunt", "system", "ex-busbar-neg", "input", BLACK, "power-negative", "16 mm²", L_16),
    buildEdge("ex-e20", "ex-busbar-neg", "out-3", "ex-frigo", "negative", BLACK, "power-negative", "1,5 mm²", L_15),
    buildEdge("ex-e21", "ex-busbar-neg", "out-4", "ex-eclairage", "negative", BLACK, "power-negative", "0,5 mm²", L_05, { x: 1040, y: 800 }),
    buildEdge("ex-e22", "ex-busbar-neg", "out-5", "ex-pompe", "negative", BLACK, "power-negative", "1,5 mm²", L_15, { x: 1100, y: 920 }),
    buildEdge("edge_msuin7pb_1", "ex-busbar-neg", "out-6", "ex-usb", "negative", BLACK, "power-negative", "0,5 mm²", L_05, { x: 940, y: 600 }),
    buildEdge("ex-e25", "ex-busbar-neg", "out-7", "ex-multiplus", "dc-negative", BLACK, "power-negative", "16 mm²", L_16),

    // Convertisseur-chargeur : + protégé par un disjoncteur depuis busbar+,
    // − direct depuis busbar−.
    buildEdge("edge_mst1z44g_4", "ex-multiplus", "dc-positive", "circuit-breaker_mst1ysym_3", "output", RED, "power-positive", "16 mm²", L_16, { x: 1660, y: 180 }),
    buildEdge("edge_mst1z7wk_5", "ex-busbar-pos", "out-4", "circuit-breaker_mst1ysym_3", "input", RED, "power-positive", "16 mm²", L_16, { x: 1480, y: 160 }),

    // Écran de contrôle : alimentation + liaisons VE.Direct (vert)
    buildEdge("edge_msuphid0_3", "ex-fuse-monitor", "input", "ex-busbar-pos", "out-2", RED, "power-positive"),
    buildEdge("edge_msupqwwm_6", "ex-monitor", "positive", "ex-fuse-monitor", "output", RED, "power-positive", "0,5 mm²", 2),
    buildEdge("ex-e30", "ex-busbar-neg", "out-8", "ex-monitor", "negative", BLACK, "power-negative", "0,75 mm²", L_075, { x: 680, y: 640 }),
    buildEdge("ex-e31", "ex-shunt", "ve-direct", "ex-monitor", "ve-direct", GREEN, "data-bus", undefined, 1.5),
    buildEdge("ex-e32", "ex-mppt", "ve-direct", "ex-monitor", "ve-direct", GREEN, "data-bus", undefined, 2),
    buildEdge("ex-e33", "ex-multiplus", "ve-direct", "ex-monitor", "ve-direct", GREEN, "data-bus", undefined, 1.5, { x: 1060, y: 980 }),

    // Quai → Multiplus (AC IN, passthrough) → Tableau 220V → Prise 220V
    buildEdge("edge_mst20ss9_14", "shore-power_mst20n4n_13", "ac", "ex-multiplus", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 5),
    buildEdge("edge_mst205lj_8", "ex-multiplus", "ac-out", "ac-panel_mst2019n_7", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", L_25),
    buildEdge("edge_mst2099i_9", "ac-panel_mst2019n_7", "ac-out", "socket-220v_mst1zy3g_6", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", L_25),

    // Les fils de terre (tableau, prise) → caisse
    buildEdge("edge_mst20hpo_12", "ac-panel_mst2019n_7", "earth", "ground_mst20cj7_10", "ground", LIME, "earth", "1,5 mm²", 0.5),
    buildEdge("edge_mst20fmn_11", "socket-220v_mst1zy3g_6", "earth", "ground_mst20cj7_10", "ground", LIME, "earth", "1,5 mm²", 0.5),
  ];

  return { projectName: "Exemple : installation van", nodes, edges };
}
