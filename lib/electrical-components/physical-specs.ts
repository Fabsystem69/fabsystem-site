// Dimensions physiques des boîtiers (lot 0 de docs/18-EDITEUR-IMPLANTATION.md,
// implantation du cœur du système) — par modèle de marque (même `id` que
// brand-models.ts). Valeurs lues dans les manuels et fiches techniques Victron
// officiels (relevé du 2026-10-17), source + URL sur chaque entrée.
//
// Règles :
// - aucune valeur inventée : un modèle sans document officiel vérifié n'a pas
//   d'entrée — l'utilisateur saisit alors ses propres cotes (prioritaires sur
//   ce fichier, voir docs/18) ;
// - boîtiers : hauteur × largeur × profondeur telles que données par le
//   constructeur (h × w × d), appareil posé dans sa position de montage normale ;
// - pièces posées à plat (porte-fusibles, busbar, isolateurs galvaniques) :
//   `heightMm` × `widthMm` = emprise sur la platine, `depthMm` = saillie,
//   relevés sur les plans cotés Victron ;
// - batteries : les fiches donnent longueur × largeur × hauteur ; ici
//   `widthMm` = longueur, `depthMm` = largeur, `heightMm` = hauteur ;
// - `weightKg` absent quand le document ne le donne pas.

export interface PhysicalSpec {
  heightMm: number;
  widthMm: number;
  depthMm: number;
  weightKg?: number;
  source: string;
  sourceUrl: string;
  note?: string;
}

type Dims = [heightMm: number, widthMm: number, depthMm: number, weightKg?: number];

function spec(dims: Dims, doc: { source: string; sourceUrl: string }, note?: string): PhysicalSpec {
  const [heightMm, widthMm, depthMm, weightKg] = dims;
  return { heightMm, widthMm, depthMm, ...(weightKg !== undefined ? { weightKg } : {}), ...doc, ...(note ? { note } : {}) };
}

// Les fiches batteries donnent L × l × H : converties en h × w × d.
function battery(lengthMm: number, widthMm: number, heightMm: number, weightKg: number, doc: { source: string; sourceUrl: string }): PhysicalSpec {
  return spec([heightMm, lengthMm, widthMm, weightKg], doc);
}

const DOC = {
  phoenixVeDirect: {
    source: "Manuel Victron Phoenix Inverter VE.Direct (HW15), caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Inverter_VE.Direct_230V_-_HW15/en/technical-specifications.html",
  },
  inverterSmart: {
    source: "Manuel Victron Inverter Smart, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Inverter_Smart/106668-Inverter_VE_Direct__Smart_and_SUN-pdf-en.pdf",
  },
  multiplus500_1200: {
    source: "Manuel Victron MultiPlus 500 VA – 1200 VA, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Manual-MultiPlus-500VA-1200VA-EN-NL-FR-DE-ES-IT.pdf",
  },
  multiplus1600: {
    source: "Manuel Victron MultiPlus 1600 VA, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Manual-MultiPlus-1600VA-EN-NL-FR-DE-ES-IT.pdf",
  },
  multiplusCompact: {
    source: "Manuel Victron MultiPlus Compact 800 / 1200 / 1600 VA, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Manual-MultiPlus-Compact-800-1200-1600-EN-NL-FR-DE-ES.pdf",
  },
  multiplus2k: {
    source: "Manuel Victron MultiPlus 2 kVA 230 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/MultiPlus_2kVA_230V/en/technical-data-2kva.html",
  },
  multiplus3k: {
    source: "Manuel Victron MultiPlus 3k 230 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Manual-MultiPlus-3k-230V-16A-50A-(firmware-xxxx4xx)-EN-NL-FR-DE-ES-SE.pdf",
  },
  multiplusII: {
    source: "Manuel Victron MultiPlus-II 230 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/upload/documents/MultiPlus-II_230V/32424-MultiPlus-II___Quattro-II-pdf-en.pdf",
  },
  multiplusII4k: {
    source: "Manuel Victron MultiPlus-II 4k – 10k 230 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/MultiPlus-II_4k_4k5_6k5_10k_230V/en/technical-specifications-mp-ii-k-230v.html",
  },
  multiplusIIGx: {
    source: "Manuel Victron MultiPlus-II GX 230 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/MultiPlus-II_GX/en/technical-specifications-mp-ii-gx-230v.html",
  },
  mppt75_100_20: {
    source: "Manuel Victron SmartSolar MPPT 75/10 à 100/20, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_75-10_up_to_100-20/en/technical-specifications.html",
  },
  blueSolar75_100_20: {
    source: "Manuel Victron BlueSolar MPPT 75/10 à 100/20, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Manual_BlueSolar_MPPT_75-10_up_to_100-20/en/technical-specifications.html",
  },
  mppt100_30_50: {
    source: "Manuel Victron SmartSolar MPPT 100/30 & 100/50, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Manual_SmartSolar_MPPT_100-30__100-50/29694-MPPT_solar_charger_manual-pdf-en.pdf",
  },
  mppt150_35_45: {
    source: "Fiche technique Victron SmartSolar MPPT 150/35 & 150/45",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-SmartSolar-charge-controller-MPPT-150-35-%26-150-45-EN.pdf",
  },
  pwmPro: {
    source: "Fiche technique Victron BlueSolar PWM-Pro",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-BlueSolar-PWM-Pro-Charge-Controllers-EN.pdf",
  },
  orionTr: {
    source: "Fiche technique Victron Orion-Tr DC-DC isolés 100 / 250 / 400 W",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-Orion-Tr-DC-DC-converters-isolated-100-250-400W-EN.pdf",
  },
  orionTrSmartNonIsolated: {
    source: "Manuel Victron Orion-Tr Smart DC-DC (non isolé), caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Orion-Tr_Smart_DC-DC_Charger_-_Non-Isolated/en/index-en.html",
  },
  orionXs: {
    source: "Fiche technique Victron Orion XS DC-DC",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-Orion-XS-DC-DC-battery-charger-EN.pdf",
  },
  ip22: {
    source: "Manuel Victron Blue Smart IP22 230 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Blue_Smart_IP22_Charger_230V_manual/en/technical-specifications---bsc---psc.html",
  },
  ip67: {
    source: "Manuel Victron Blue Smart IP67 230 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Blue_Smart_IP67_Charger_230V_manual/en/technical-specifications---bsc---psc.html",
  },
  smartShunt: {
    source: "Manuel Victron SmartShunt, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/SmartShunt/en/technical-data.html",
  },
  bmvDrawing: {
    source: "Plan coté Victron BMV-7xx (afficheur)",
    sourceUrl: "https://www.victronenergy.com/upload/documents/BMV-7xx.pdf",
  },
  bmvShunt: {
    source: "Plan coté Victron Shunt 500A/50mV (SHU500050100)",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Shunt-500A50mV.pdf",
  },
  cyrixCt: {
    source: "Fiche technique Victron Cyrix-ct 120 A / 230 A",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-Cyrix-ct-120A-230A-EN.pdf",
  },
  cyrixLi: {
    source: "Fiche technique Victron Cyrix Li-ion 120 A",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-Cyrix-Li-ion-120-A-EN.pdf",
  },
  argofet: {
    source: "Fiche technique Victron Argo FET (copie revendeur du document Victron)",
    sourceUrl: "https://cdn.shopify.com/s/files/1/0749/6587/7039/files/Datasheet-Argo-Fet-Battery-Isolators-with-alternator-energize-input-EN.pdf",
  },
  batteryProtect: {
    source: "Manuel Victron Smart BatteryProtect 12/24 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Smart_BatteryProtect_12V_24V/en/technical-specifications.html",
  },
  gx: {
    source: "Manuel Victron GX (Ekrano / Cerbo / Nucleo), caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Cerbo_GX/140558-Ekrano_GX__Cerbo_GX__Nucleo_GX_Manual-pdf-en.pdf",
  },
  ccgx: {
    source: "Fiche technique Victron Color Control GX",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-Color-Control-GX-EN.pdf",
  },
  venusGx: {
    source: "Fiche technique Victron Venus GX",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-Venus-GX-EN.pdf",
  },
  lynxPowerIn: {
    source: "Manuel Victron Lynx Power In M8 et M10, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Lynx_Power_In/en/technical-specifications-lynx-power-in.html",
  },
  lithiumSmart: {
    source: "Manuel Victron Lithium Battery Smart, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Lithium_Battery_Smart/en/technical-data.html",
  },
  lithiumNg12: {
    source: "Manuel Victron Lithium NG 12,8 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Lithium_NG_battery_12,8_V/en/technical-data.html",
  },
  lithiumNg24: {
    source: "Manuel Victron Lithium NG 25,6 V, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Lithium_NG_battery_25,6_V/en/technical-data.html",
  },
  superPackNg: {
    source: "Manuel Victron Lithium SuperPack NG, caractéristiques techniques",
    sourceUrl: "https://www.victronenergy.com/media/pg/Lithium_SuperPack_NG/en/technical-data.html",
  },
  gelAgm: {
    source: "Fiche technique Victron GEL et AGM Deep Cycle",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-GEL-and-AGM-Batteries-EN.pdf",
  },
  agmSuperCycle: {
    source: "Fiche technique Victron AGM Super Cycle",
    sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-AGM-Super-Cycle-battery-EN.pdf",
  },
};

const COMPACT_NOTE = "Le manuel donne une valeur commune aux Compact 800, 1200 et 1600 VA.";
const IP22_NOTE = "Même boîtier pour tous les Blue Smart IP22 (1 sortie).";
const BMV_DISPLAY_NOTE = "Afficheur encastré : façade 68,7 × 68,7 mm, corps Ø 52 mm, 25,8 mm derrière la façade.";
const BMV_SHUNT_NOTE = "Shunt 500 A/50 mV : 2 trous Ø 6,5 mm, entraxe 101,8 mm ; boulons M10.";

const PHYSICAL_SPECS: Record<string, PhysicalSpec> = {
  // ─── Phoenix Inverter VE.Direct (valeurs des modèles 12 V) ───────────
  "victron-phoenix-250": spec([86, 165, 260, 2.7], DOC.phoenixVeDirect),
  "victron-phoenix-375": spec([86, 165, 260, 3], DOC.phoenixVeDirect),
  "victron-phoenix-500": spec([86, 172, 275, 3.5], DOC.phoenixVeDirect),
  "victron-phoenix-800": spec([95, 231, 334, 5.5], DOC.phoenixVeDirect),
  "victron-phoenix-1200": spec([117, 231, 374, 7.2], DOC.phoenixVeDirect),
  "victron-phoenix-1600": spec([117, 231, 395, 8.9], DOC.phoenixVeDirect),

  // ─── Inverter Smart ──────────────────────────────────────────────────
  "victron-inverter-smart-1600": spec([485, 219, 125, 12], DOC.inverterSmart),
  "victron-inverter-smart-2000": spec([485, 219, 125, 13], DOC.inverterSmart),
  "victron-inverter-smart-3000": spec([533, 285, 150, 19], DOC.inverterSmart),

  // ─── MultiPlus / MultiPlus-II ────────────────────────────────────────
  "victron-multiplus-500-20": spec([311, 182, 100, 4.4], DOC.multiplus500_1200),
  "victron-multiplus-800-35": spec([360, 240, 100, 6.4], DOC.multiplus500_1200),
  "victron-multiplus-1200-50": spec([406, 250, 100, 8.2], DOC.multiplus500_1200),
  "victron-multiplus-1600-70": spec([465, 270, 120, 10], DOC.multiplus1600),
  "victron-multiplus-compact-800-35": spec([375, 214, 110, 10], DOC.multiplusCompact, COMPACT_NOTE),
  "victron-multiplus-compact-1200-50": spec([375, 214, 110, 10], DOC.multiplusCompact, COMPACT_NOTE),
  "victron-multiplus-compact-1600-70": spec([375, 214, 110, 10], DOC.multiplusCompact, COMPACT_NOTE),
  "victron-multiplus-12-2000-80": spec([506, 236, 147, 15.5], DOC.multiplus2k),
  "victron-multiplus-3000-120": spec([364, 295, 221, 19], DOC.multiplus3k),
  "victron-multiplus-ii-12-3000-120": spec([546, 275, 147, 20], DOC.multiplusII),
  "victron-multiplus-ii-12-4000-160": spec([576, 276, 164, 22], DOC.multiplusII4k),
  "victron-multiplus-ii-24-3000-70": spec([506, 275, 147, 20], DOC.multiplusIIGx),

  // ─── Régulateurs solaires ────────────────────────────────────────────
  "victron-smartsolar-75-10": spec([100, 113, 40, 0.5], DOC.mppt75_100_20),
  "victron-smartsolar-75-15": spec([100, 113, 40, 0.5], DOC.mppt75_100_20),
  "victron-smartsolar-100-15": spec([100, 113, 50, 0.6], DOC.mppt75_100_20),
  "victron-bluesolar-100-15": spec([100, 113, 50, 0.6], DOC.blueSolar75_100_20),
  "victron-smartsolar-100-20": spec([100, 131, 60, 0.65], DOC.mppt75_100_20),
  "victron-smartsolar-100-30": spec([130, 186, 70, 1.3], DOC.mppt100_30_50),
  "victron-smartsolar-100-50": spec([130, 186, 70, 1.3], DOC.mppt100_30_50),
  "victron-smartsolar-150-35": spec([130, 186, 70, 1.25], DOC.mppt150_35_45),
  "victron-smartsolar-150-45": spec([130, 186, 70, 1.25], DOC.mppt150_35_45),
  "victron-bluesolar-pwm-12-20": spec([160, 82, 48, 0.3], DOC.pwmPro),
  "victron-bluesolar-pwm-12-30": spec([200, 100, 57, 0.5], DOC.pwmPro),

  // ─── Chargeurs DC-DC ─────────────────────────────────────────────────
  "victron-orion-tr-9a": spec([100, 113, 47, 0.42], DOC.orionTr),
  "victron-orion-tr-18a": spec([130, 186, 70, 1.3], DOC.orionTr),
  "victron-orion-tr-18a-standard": spec([130, 186, 70, 1.3], DOC.orionTr),
  "victron-orion-tr-30a": spec([130, 186, 80, 1.8], DOC.orionTr),
  "victron-orion-tr-30a-standard": spec([130, 186, 80, 1.8], DOC.orionTr),
  "victron-orion-tr-smart-30a-non-isolated": spec([130, 186, 80, 1.8], DOC.orionTrSmartNonIsolated),
  "victron-orion-xs-12-12-50": spec([137.3, 123.1, 40, 0.33], DOC.orionXs),
  "victron-orion-xs-12-12-70": spec([137.3, 123.1, 40, 0.34], DOC.orionXs),

  // ─── Chargeurs secteur ───────────────────────────────────────────────
  "victron-blue-smart-ip22-12-15": spec([235, 108, 65, 1.3], DOC.ip22, IP22_NOTE),
  "victron-blue-smart-ip22-20a": spec([235, 108, 65, 1.3], DOC.ip22, IP22_NOTE),
  "victron-blue-smart-ip22-30a": spec([235, 108, 65, 1.3], DOC.ip22, IP22_NOTE),
  "victron-blue-smart-ip22-24-8": spec([235, 108, 65, 1.3], DOC.ip22, IP22_NOTE),
  "victron-blue-smart-ip22-24-12": spec([235, 108, 65, 1.3], DOC.ip22, IP22_NOTE),
  "victron-blue-smart-ip22-24-16": spec([235, 108, 65, 1.3], DOC.ip22, IP22_NOTE),
  "victron-blue-smart-ip67-12-7": spec([85, 211, 60, 1.8], DOC.ip67),
  "victron-blue-smart-ip67-12-13": spec([85, 211, 60, 1.8], DOC.ip67),
  "victron-blue-smart-ip67-12-17": spec([99, 219, 65, 2.4], DOC.ip67),
  "victron-blue-smart-ip67-12-25": spec([99, 219, 65, 2.4], DOC.ip67),
  "victron-blue-smart-ip67-24-5": spec([85, 211, 60, 1.8], DOC.ip67),
  "victron-blue-smart-ip67-24-8": spec([99, 219, 65, 2.4], DOC.ip67),
  "victron-blue-smart-ip67-24-12": spec([99, 219, 65, 2.4], DOC.ip67),

  // ─── Mesure, couplage, protection ────────────────────────────────────
  "victron-smartshunt-300a": spec([44, 120, 44], DOC.smartShunt),
  "victron-smartshunt-500a": spec([46, 120, 54], DOC.smartShunt),
  "victron-bmv-712-display": spec([68.7, 68.7, 30.6], DOC.bmvDrawing, BMV_DISPLAY_NOTE),
  "victron-bmv-702-display": spec([68.7, 68.7, 30.6], DOC.bmvDrawing, BMV_DISPLAY_NOTE),
  "victron-bmv-700-display": spec([68.7, 68.7, 30.6], DOC.bmvDrawing, BMV_DISPLAY_NOTE),
  // Shunt livré avec les BMV-7xx (fiche BMV : « Shunt (included) 500A / 50mV »).
  "victron-bmv-712": spec([25.6, 121, 35], DOC.bmvShunt, BMV_SHUNT_NOTE),
  "victron-bmv-702": spec([25.6, 121, 35], DOC.bmvShunt, BMV_SHUNT_NOTE),
  "victron-bmv-700": spec([25.6, 121, 35], DOC.bmvShunt, BMV_SHUNT_NOTE),
  "victron-cyrix-ct-120a": spec([46, 46, 80, 0.11], DOC.cyrixCt),
  "victron-cyrix-ct-230a": spec([65, 100, 50, 0.27], DOC.cyrixCt),
  "victron-cyrix-li-ct-120a": spec([46, 46, 80, 0.11], DOC.cyrixLi),
  "victron-argofet-100-2bat": spec([65, 120, 200, 1.4], DOC.argofet),
  "victron-argofet-100-3bat": spec([65, 120, 200, 1.4], DOC.argofet),
  "victron-smart-batteryprotect-65a": spec([40, 48, 106, 0.2], DOC.batteryProtect),
  "victron-smart-batteryprotect-100a": spec([59, 42, 115, 0.5], DOC.batteryProtect),
  "victron-smart-batteryprotect-220a": spec([62, 123, 120, 0.8], DOC.batteryProtect),
  "victron-battery-switch-275a": spec(
    [69.5, 69.5, 76.3],
    {
      source: "Plan coté Victron Battery switch on/off 275A (VBS127010010)",
      sourceUrl: "https://www.victronenergy.com/upload/documents/BatterySwitch-on-off-275A.pdf",
    },
    "Profondeur manette comprise (corps seul : 43,5 mm). Fixation : 4 trous Ø 5 mm, entraxe 55 × 55 mm.",
  ),
  "victron-fuse-holder-mega": spec(
    [37, 126, 43.4],
    { source: "Plan coté Victron Fuse holder for MEGA-fuse (CIP000100001)", sourceUrl: "https://www.victronenergy.com/upload/documents/Fuse-holder-for-MEGA-fuse.pdf" },
    "Longueur pattes de fixation comprises ; entraxe des fixations 108 mm.",
  ),
  // Même boîtier que le porte-fusible MEGA (confirmé par FabSystem, 2026-10-17) :
  // aucun plan Victron publié pour la version ANL.
  "victron-fuse-holder-anl": spec(
    [37, 126, 43.4],
    { source: "Plan coté Victron Fuse holder for MEGA-fuse (même boîtier, confirmé par FabSystem)", sourceUrl: "https://www.victronenergy.com/upload/documents/Fuse-holder-for-MEGA-fuse.pdf" },
    "Cotes du porte-fusible MEGA, même boîtier ; entraxe des fixations 108 mm.",
  ),
  "victron-fuse-holder-mega-6way": spec(
    [88, 181.5, 50.9],
    { source: "Plan coté Victron Fuse holder 6-way for MEGA-fuse (CIP050060000)", sourceUrl: "https://www.victronenergy.com/upload/documents/Fuse-holder-6-way-for-MEGA-fuse.pdf" },
    "Fixation : 4 trous Ø 6,2 mm, entraxe 160 × 61 mm.",
  ),
  "victron-fuse-holder-midi": spec(
    [29.36, 51.36, 25.12],
    { source: "Plan coté Victron Fuse holder for MIDI-fuse (CIP000050001)", sourceUrl: "https://www.victronenergy.com/upload/documents/Fuse-holder-for-MIDI-fuse.pdf" },
  ),
  "victron-busbar-250a-6p": spec(
    [70, 237, 48, 0.43],
    { source: "Fiche technique Victron Busbar 250 A 4P et 6P avec couvercle", sourceUrl: "https://www.victronenergy.com/upload/documents/Datasheet-Busbar-250-A-4P-and-6P-with-cover-EN.pdf" },
    "Couvercle compris (fiche : 48 × 237 × 70 mm h × l × p, posée à plat).",
  ),
  "victron-vdi-16": spec(
    [120, 200, 55],
    { source: "Plan coté Victron Galvanic Isolator VDI-16 (GDI000016000)", sourceUrl: "https://www.victronenergy.com/upload/documents/Galvanic-Isolator-VDI-16.pdf" },
    "Saillie goujons M6 compris (corps : 37 mm). Fixation : 4 encoches, entraxe 161,5 × 111,5 mm.",
  ),
  "victron-vdi-32": spec(
    [163, 224, 63],
    { source: "Plan coté Victron Galvanic Isolator VDI-32 (GDI000032000)", sourceUrl: "https://www.victronenergy.com/upload/documents/Galvanic-Isolator-VDI-32.pdf" },
    "Largeur goujons M6 latéraux compris (corps : 200 mm). Fixation : 4 encoches, entraxe 161,5 × 154,5 mm.",
  ),
  "victron-vdi-64": spec(
    [163, 324, 63],
    { source: "Plan coté Victron Galvanic Isolator VDI-64 (GDI000064000)", sourceUrl: "https://www.victronenergy.com/upload/documents/Galvanic-Isolator-VDI-64.pdf" },
    "Largeur goujons M6 latéraux compris (corps : 300 mm). Fixation : 4 encoches, entraxe 261,5 × 154,5 mm.",
  ),
  "victron-lynx-power-in-m8": spec([290, 170, 80, 2.1], DOC.lynxPowerIn),
  "victron-lynx-power-in-m10": spec([290, 170, 80, 2.1], DOC.lynxPowerIn),

  // ─── Supervision ─────────────────────────────────────────────────────
  "victron-cerbo-gx": spec([78, 154, 48], DOC.gx),
  "victron-cerbo-gx-mk2": spec([78, 154, 48], DOC.gx),
  "victron-ccgx": spec([130, 120, 28], DOC.ccgx),
  "victron-venus-gx": spec([45, 143, 96], DOC.venusGx),
  "victron-gx-touch-50": spec([87, 128, 12.4], DOC.gx),
  "victron-gx-touch-70": spec([113, 176, 13.5], DOC.gx),

  // ─── Batteries ───────────────────────────────────────────────────────
  "victron-lithium-smart-100ah": spec([197, 321, 152, 14], DOC.lithiumSmart),
  "victron-lithium-smart-200ah": spec([237, 321, 152, 20], DOC.lithiumSmart),
  "victron-lithium-ng-300ah": spec([206, 447, 205, 29], DOC.lithiumNg12, "Poids estimé par Victron."),
  "victron-lithium-ng-24v-100ah": spec([235, 341, 160, 19], DOC.lithiumNg24, "Poids estimé par Victron."),
  "victron-lithium-superpack-ng-200ah": battery(466, 198, 173, 20.5, DOC.superPackNg),
  "victron-agm-100ah": battery(260, 168, 215, 26, DOC.agmSuperCycle),
  "victron-gel-110ah": battery(330, 171, 220, 33, DOC.gelAgm),
  "victron-gel-220ah": battery(522, 238, 240, 66, DOC.gelAgm),
};

export function getPhysicalSpec(brandModelId: unknown): PhysicalSpec | null {
  return typeof brandModelId === "string" ? (PHYSICAL_SPECS[brandModelId] ?? null) : null;
}

export function listPhysicalSpecIds(): string[] {
  return Object.keys(PHYSICAL_SPECS);
}
