import type { Node, Edge } from "@xyflow/react";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { optimizeBusbarHandleLayout } from "@/lib/schema-editor/busbar-layout";
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
  // Un gabarit est posé sans coudes forcés : après un réagencement, React
  // Flow construit des trajets courts et lisibles au lieu de conserver des
  // détours prévus pour une ancienne implantation.
  void bendPoint;
  return { id, source, sourceHandle, target, targetHandle, type: "cable", data: { color, cableType, section, length } };
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
const L_35 = 2; // 35 mm² — départ direct d'un consommateur 12 V puissant
const L_50 = 3; // 50 mm² — alimentation forte protégée depuis le busbar

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
    buildNode("ex-solar", "solar-panel", 80, 150, {
      label: "Panneau solaire Renogy 200W",
      powerW: 200,
      voltage: 31.03,
      operatingCurrentA: 6.46,
      shortCircuitCurrentA: 6.85,
      vocVoltage: 37.44,
      brandModelId: "renogy-200w-ntype",
      brand: "Renogy",
      model: "200W N-Type 16BB",
    }),
    // Protection avant le MPPT (retour utilisateur : "le disjoncteur manque
    // entre le panneau solaire et le MPPT → risque électrique si intervention
    // sur le MPPT en plein soleil"). Coupure de sécurité entre les mains de
    // l'utilisateur, à la différence d'un fusible qu'il faudrait remplacer.
    buildNode("ex-breaker-solar", "circuit-breaker", 250, 120, { label: "Disjoncteur solaire", amperage: 16 }),
    buildNode("ex-mppt", "mppt", 390, 130, { label: "SmartSolar MPPT 100/30", amperage: 30, systemVoltage: 12, maxPvVoltage: 100, maxPvInputCurrentA: 35, maxPvPower12V: 440, brandModelId: "victron-smartsolar-100-30", brand: "Victron", model: "SmartSolar MPPT 100/30", communicationPorts: "ve-direct" }),

    // Chaîne alternateur / DC-DC (batterie moteur)
    buildNode("ex-battery-moteur", "battery", 100, 490, { label: "Batterie moteur Yuasa 100Ah", voltage: 12, capacityAh: 100, technology: "plomb", brandModelId: "yuasa-marine-100ah", brand: "Yuasa", model: "Marine 12V/100Ah (C20)" }),
    buildNode("ex-alternator", "alternator", 100, 650, { label: "Alternateur", voltage: 12, amperage: 90 }),
    // Protection alternateur → batterie moteur (retour utilisateur : "rajoute
    // un fusible à l'alternateur pour éviter d'avoir le message") — sans
    // elle, `computeSchemaIssues` (lib/electrical-components/checks.ts)
    // signale l'alternateur comme source de charge non protégée avant la
    // batterie. ANL 100A : calibre usuel juste au-dessus du courant max de
    // l'alternateur (90A).
    buildNode("ex-fuse-alternator", "fuse", 260, 570, { label: "Fusible alternateur", fuseType: "anl", amperage: 100 }),
    buildNode("ex-fuse-dcdc", "fuse", 260, 430, { label: "Fusible DC-DC", fuseType: "midi", amperage: 30 }),
    buildNode("ex-dcdc", "dcdc", 390, 490, { label: "Renogy DC-DC 20A", voltageIn: 12, voltageOut: 12, amperage: 20, topology: "non-isolated", brandModelId: "renogy-dcdc-20a-gen2", brand: "Renogy", model: "Chargeur DC-DC 12V/20A (2e gen.)" }),

    // Busbar de charge intermédiaire : chaque source (MPPT, DC-DC) protégée
    // par son propre disjoncteur DC avant de rejoindre la batterie aux et le
    // fusible principal.
    buildNode("busbar_mst1t8m8_1", "busbar", 940, 230, { label: "Busbar de charge", polarity: "positive", outputCount: 4 }),
    buildNode("circuit-breaker_mst1vjlz_5", "circuit-breaker", 530, 150, { label: "Disjoncteur MPPT", amperage: 16 }),
    buildNode("circuit-breaker_mst1vyr4_8", "circuit-breaker", 530, 500, { label: "Disjoncteur DC-DC", amperage: 16, rotation: 180 }),

    // Batterie auxiliaire + protection + distribution
    buildNode("ex-battery-aux", "battery", 970, 430, {
      label: "Batterie aux 12V",
      voltage: 12,
      capacityAh: 100,
      technology: "lifepo4",
      rotation: 180,
      brandModelId: "victron-lithium-smart-100ah",
      brand: "Victron",
      model: "Lithium Smart 12,8V/100Ah",
    }),
    buildNode("ex-fuse-main", "fuse", 1140, 230, { label: "Fusible principal", fuseType: "midi", amperage: 100, rotation: 0 }),
    buildNode("ex-switch", "battery-switch", 1210, 230, { label: "Coupe-batterie", amperage: 0 }),
    buildNode("ex-busbar-pos", "busbar", 1220, 400, { label: "Busbar + 12V", polarity: "positive", outputCount: 4 }),
    buildNode("ex-panel", "fuse-block", 1580, 600, {
      label: "Tableau fusibles",
      outputCount: 4,
      ampPerOutput: 10,
      outAmp1: 15,
      outAmp2: 5,
      outAmp3: 15,
      outAmp4: 5,
    }),

    // Consommateurs (chacun via son propre interrupteur avant le tableau)
    buildNode("ex-frigo", "consumer", 1840, 820, { label: "Réfrigérateur à compression", presetType: "refrigerateur", powerW: 45 }),
    buildNode("ex-eclairage", "consumer", 1900, 670, { label: "Éclairage LED", presetType: "eclairage-led", powerW: 5 }),
    buildNode("ex-pompe", "consumer", 1900, 960, { label: "Pompe à eau", presetType: "pompe-eau", powerW: 60 }),
    buildNode("ex-usb", "consumer", 1630, 820, { label: "Prise USB / 12 V", presetType: "prise-usb-12v", powerW: 15 }),
    buildNode("switch_mst385ua_1", "switch", 1810, 690, { label: "Interrupteur", amperage: 0 }),
    buildNode("switch_mst38upg_3", "switch", 1740, 880, { label: "Interrupteur", amperage: 0 }),
    buildNode("switch_mst3cwzp_6", "switch", 1810, 980, { label: "Interrupteur", amperage: 0 }),
    buildNode("switch_mst3dhr3_8", "switch", 1730, 760, { label: "Interrupteur", amperage: 0, rotation: 180 }),

    // Convertisseur-chargeur (Multiplus), protégé côté + par un disjoncteur
    buildNode("ex-multiplus", "inverter-charger", 1730, 180, { label: "Convertisseur-chargeur", powerW: 1600, voltageDC: 12, chargeAmperage: 50 }),
    buildNode("circuit-breaker_mst1ysym_3", "circuit-breaker", 1550, 280, { label: "Disjoncteur DC", amperage: 16 }),

    // Écran de contrôle : agrège les liaisons VE.Direct (shunt, MPPT, Multiplus)
    buildNode("ex-fuse-monitor", "fuse", 930, 880, { label: "Fusible écran", fuseType: "lame", amperage: 2, rotation: 180 }),
    buildNode("ex-monitor", "system-monitor", 1060, 900, { label: "Écran de contrôle", rotation: 90 }),

    // Retour négatif
    buildNode("ex-shunt", "shunt", 900, 500, { label: "Shunt", amperage: 0, rotation: 0 }),
    buildNode("ex-busbar-neg", "busbar", 1050, 530, { label: "Busbar −", polarity: "negative", outputCount: 7, rotation: 90 }),
    buildNode("ex-busbar-consumer-neg", "busbar", 1740, 600, { label: "Busbar − distribution", polarity: "negative", outputCount: 4, rotation: 90 }),

    // Alimentation de quai : réseau → Multiplus (AC IN) → Tableau 220V →
    // Prise 220V, avec les fils de terre du tableau et de la prise reliés à
    // la caisse.
    buildNode("shore-power_mst20n4n_13", "shore-power", 1580, 140, { label: "Prise de quai P17 16A", brandModelId: "p17-16a", brand: "Générique", model: "Prise P17 16A" }),
    buildNode("ac-panel_mst2019n_7", "ac-panel", 1870, 160, { label: "Tableau 220V", rotation: 0 }),
    buildNode("socket-220v_mst1zy3g_6", "socket-220v", 1870, 310, { label: "Prise 220V", powerW: 500, rotation: 270 }),
    buildNode("ground_mst20cj7_10", "ground", 1700, 320, { label: "Point de masse", rotation: 90 }),

    // Climatisation 12 V : départ de forte intensité indépendant du tableau
    // de fusibles standard, protégé à l'amont puis coupé en sous-tension.
    buildNode("ex-fuse-climate", "fuse", 250, 960, { label: "Fusible climatisation", fuseType: "anl", amperage: 150 }),
    buildNode("ex-climate-protect", "battery-protect", 400, 960, {
      label: "BatteryProtect climatisation",
      amperage: 220,
      brandModelId: "victron-smart-batteryprotect-220a",
      brand: "Victron",
      model: "Smart BatteryProtect 12/24V-220A",
      communicationPorts: "ve-direct",
    }),
    buildNode("ex-climate", "consumer", 80, 920, { label: "Climatisation de toit 12 V", presetType: "climatisation", powerW: 1500 }),

    // Zones (V2, retour utilisateur) — purement visuel, l'utilisateur a
    // glissé les composants dedans lui-même, aucun lien automatique.
    buildZone("zone_msuidg31_1", 30, 60, 560, 250, "Solaire", "#f59e0b"),
    buildZone("zone_msuied65_2", 30, 380, 620, 400, "Charge alternateur / DC-DC", "#10b981"),
    buildZone("zone_msupmyh9_5", 760, 140, 620, 540, "Coeur DC", "#3b82f6"),
    buildZone("zone_msupb7ur_2", 1500, 80, 580, 340, "230 V / quai", "#8b5cf6"),
    buildZone("zone_msups3pt_7", 1490, 500, 600, 560, "Distribution 12 V", "#14b8a6"),
    buildZone("zone_msupx3sa_8", 760, 820, 620, 260, "Monitoring", "#ec4899"),
    buildZone("zone-climate", 30, 850, 620, 350, "Climatisation 12 V", "#0ea5e9"),
  ];

  const edges: SchemaEdge[] = [
    // Solaire → disjoncteur → MPPT
    buildEdge("ex-e1", "ex-solar", "positive", "ex-breaker-solar", "input", RED, "power-positive", "6 mm²", 0.5),
    buildEdge("ex-e1b", "ex-breaker-solar", "output", "ex-mppt", "pv-positive", RED, "power-positive", "6 mm²", L_6),
    buildEdge("ex-e2", "ex-solar", "negative", "ex-mppt", "pv-negative", BLACK, "power-negative", "6 mm²", L_6),

    // Batterie moteur → Fusible → DC-DC
    buildEdge("xy-edge__ex-battery-moteurpositive-ex-fuse-dcdcinput", "ex-battery-moteur", "positive", "ex-fuse-dcdc", "input", RED, "power-positive", "6 mm²", L_6),
    buildEdge("ex-e4", "ex-fuse-dcdc", "output", "ex-dcdc", "in-positive", RED, "power-positive", "6 mm²", L_6),
    buildEdge("ex-e5", "ex-battery-moteur", "negative", "ex-dcdc", "ground", BLACK, "power-negative", "6 mm²", L_6),

    // Alternateur → batterie moteur (charge au démarrage/en navigation) —
    // 25 mm² minimum (retour utilisateur).
    buildEdge("ex-e-alternator-pos", "ex-alternator", "positive", "ex-fuse-alternator", "input", RED, "power-positive", "25 mm²", 0.5),
    buildEdge("ex-e-alternator-fuse-out", "ex-fuse-alternator", "output", "ex-battery-moteur", "positive", RED, "power-positive", "25 mm²", 1),
    buildEdge("ex-e-alternator-neg", "ex-alternator", "negative", "ex-battery-moteur", "negative", BLACK, "power-negative", "25 mm²", L_10),

    // MPPT et DC-DC : retour (−) vers busbar−, sortie (+) protégée par un
    // disjoncteur avant de rejoindre le busbar de charge intermédiaire.
    buildEdge("ex-e8", "ex-mppt", "bat-negative", "ex-busbar-neg", "out-1", BLACK, "power-negative", "6 mm²", L_6),
    buildEdge("ex-e9", "ex-dcdc", "ground", "ex-busbar-neg", "out-2", BLACK, "power-negative", "6 mm²", L_6),
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

    // Batterie aux (−) → shunt → busbar−. La distribution 12 V reçoit un
    // seul retour négatif vers son busbar local : les quatre consommateurs
    // restent ainsi entièrement dans leur zone, comme le tableau fusibles.
    buildEdge("ex-e18", "ex-battery-aux", "negative", "ex-shunt", "battery", BLACK, "power-negative", "25 mm²", 0.3),
    buildEdge("ex-e19", "ex-shunt", "system", "ex-busbar-neg", "input", BLACK, "power-negative", "16 mm²", L_16),
    buildEdge("ex-e20", "ex-busbar-consumer-neg", "out-1", "ex-frigo", "negative", BLACK, "power-negative", "1,5 mm²", L_15),
    buildEdge("ex-e21", "ex-busbar-consumer-neg", "out-2", "ex-eclairage", "negative", BLACK, "power-negative", "0,5 mm²", L_05),
    buildEdge("ex-e22", "ex-busbar-consumer-neg", "out-3", "ex-pompe", "negative", BLACK, "power-negative", "1,5 mm²", L_15),
    buildEdge("edge_msuin7pb_1", "ex-busbar-consumer-neg", "out-4", "ex-usb", "negative", BLACK, "power-negative", "0,5 mm²", L_05),
    buildEdge("edge-distribution-negative-feed", "ex-busbar-neg", "out-3", "ex-busbar-consumer-neg", "input", BLACK, "power-negative", "10 mm²", L_10),
    buildEdge("ex-e25", "ex-busbar-neg", "out-4", "ex-multiplus", "dc-negative", BLACK, "power-negative", "16 mm²", L_16),

    // Convertisseur-chargeur : + protégé par un disjoncteur depuis busbar+,
    // − direct depuis busbar−.
    buildEdge("edge_mst1z44g_4", "ex-multiplus", "dc-positive", "circuit-breaker_mst1ysym_3", "output", RED, "power-positive", "16 mm²", L_16, { x: 1660, y: 180 }),
    buildEdge("edge_mst1z7wk_5", "ex-busbar-pos", "out-4", "circuit-breaker_mst1ysym_3", "input", RED, "power-positive", "16 mm²", L_16, { x: 1480, y: 160 }),

    // Départ climatisation : le BatteryProtect n'est pas une protection
    // contre les surintensités, d'où le fusible ANL 150 A obligatoire avant
    // lui. 1 500 W sous 12 V représente environ 125 A.
    buildEdge("edge-climate-fuse", "ex-busbar-pos", "out-3", "ex-fuse-climate", "input", RED, "power-positive", "50 mm²", L_50),
    buildEdge("edge-climate-protect-in", "ex-fuse-climate", "output", "ex-climate-protect", "input", RED, "power-positive", "50 mm²", 1),
    buildEdge("edge-climate-positive", "ex-climate-protect", "output", "ex-climate", "positive", RED, "power-positive", "35 mm²", L_35),
    buildEdge("edge-climate-negative", "ex-climate", "negative", "ex-busbar-neg", "out-6", BLACK, "power-negative", "35 mm²", L_35),
    buildEdge("edge-climate-protect-ground", "ex-climate-protect", "negative", "ex-busbar-neg", "out-7", BLACK, "power-negative", "0,5 mm²", 1),

    // Écran de contrôle : alimentation + liaisons VE.Direct (vert)
    buildEdge("edge_msuphid0_3", "ex-fuse-monitor", "input", "ex-busbar-pos", "out-2", RED, "power-positive", "0,5 mm²", 1),
    buildEdge("edge_msupqwwm_6", "ex-monitor", "positive", "ex-fuse-monitor", "output", RED, "power-positive", "0,5 mm²", 2),
    buildEdge("ex-e30", "ex-busbar-neg", "out-5", "ex-monitor", "negative", BLACK, "power-negative", "0,75 mm²", L_075),
    buildEdge("ex-e31", "ex-shunt", "ve-direct", "ex-monitor", "ve-direct", GREEN, "data-bus", undefined, 1.5),
    buildEdge("ex-e32", "ex-mppt", "ve-direct", "ex-monitor", "ve-direct", GREEN, "data-bus", undefined, 2),
    buildEdge("ex-e33", "ex-multiplus", "ve-direct", "ex-monitor", "ve-direct", GREEN, "data-bus", undefined, 1.5),

    // Quai → Multiplus (AC IN, passthrough) → Tableau 220V → Prise 220V
    buildEdge("edge_mst20ss9_14", "shore-power_mst20n4n_13", "ac", "ex-multiplus", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", 5),
    buildEdge("edge_mst205lj_8", "ex-multiplus", "ac-out", "ac-panel_mst2019n_7", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", L_25),
    buildEdge("edge_mst2099i_9", "ac-panel_mst2019n_7", "ac-out", "socket-220v_mst1zy3g_6", "ac-in", PURPLE_230V, "ac-230v", "3G2,5 mm²", L_25),

    // Les fils de terre (tableau, prise) → caisse
    buildEdge("edge_mst20hpo_12", "ac-panel_mst2019n_7", "earth", "ground_mst20cj7_10", "ground", LIME, "earth", "1,5 mm²", 0.5),
    buildEdge("edge_mst20fmn_11", "socket-220v_mst1zy3g_6", "earth", "ground_mst20cj7_10", "ground", LIME, "earth", "1,5 mm²", 0.5),
  ];

  const busbarUpdates = new Map(
    optimizeBusbarHandleLayout(nodes, edges).map((update) => [update.nodeId, update]),
  );
  const optimizedNodes = nodes.map((node) => {
    const update = busbarUpdates.get(node.id);
    if (!update) return node;
    return {
      ...node,
      data: {
        ...node.data,
        busbarHandleSides: update.handleSides,
        ...update.faceCounts,
      },
    };
  });

  return { projectName: "Camping-car 7 m - lithium, solaire, DC-DC et clim 12 V", nodes: optimizedNodes, edges };
}
