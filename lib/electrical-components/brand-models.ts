// Catalogue de modèles de marque (V2 — chantier retenu après l'audit
// concurrentiel Wireframe : leur bibliothèque de ~600 composants inclut des
// modèles réels Victron/Renogy/etc. verrouillés en payant). Choix produit
// assumé, différent du leur : pas de nouveau type de composant par modèle,
// pas de bibliothèque à rallonge — un modèle est une variante d'un type
// générique déjà existant, choisie dans le panneau propriétés, qui
// pré-remplit les valeurs réelles du datasheet. Premier lot volontairement
// resserré (Victron + Renogy, ~28 références) : les modèles les plus
// vendus par catégorie, pas l'exhaustivité du catalogue constructeur.
//
// Ne couvre que les types de composant dont au moins un champ numérique
// change réellement selon le modèle (un écran de contrôle n'a qu'un champ
// "Nom" : le choix de marque n'y apporterait qu'un renommage, pas une vraie
// valeur ajoutée).

export interface BrandModel {
  id: string;
  brand: string;
  model: string;
  componentType: string;
  /** Valeurs de champs à pré-remplir (clés = `field.key` de la définition du composant). */
  defaults: Record<string, unknown>;
  /**
   * Icône spécifique à ce modèle exact (retour utilisateur : bibliothèque
   * de rendus Victron, "pour agrémenter la bibliothèque existante quand on
   * choisit un modèle précis avoir l'icône") — n'existe que pour les
   * modèles où une correspondance exacte a été trouvée dans les visuels
   * fournis ; les autres retombent sur l'icône générique du type de
   * composant (voir `getNodeIcon`, lib/electrical-components/definitions.ts).
   */
  iconPro?: string;
}

export const BRAND_MODELS: BrandModel[] = [
  // Batteries
  { id: "victron-lithium-smart-100ah", brand: "Victron", model: "Lithium Smart 12,8V/100Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 100 }, iconPro: "/schema-icons/pro/brand/victron-lithium-smart-100ah.png" },
  { id: "victron-lithium-smart-200ah", brand: "Victron", model: "Lithium Smart 12,8V/200Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 200 }, iconPro: "/schema-icons/pro/brand/victron-lithium-smart-200ah.png" },
  { id: "renogy-agm-100ah", brand: "Renogy", model: "Deep Cycle AGM 12V/100Ah", componentType: "battery", defaults: { technology: "agm", voltage: 12, capacityAh: 100 } },
  { id: "renogy-lifepo4-100ah", brand: "Renogy", model: "Core Mini 12,8V/100Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 100 }, iconPro: "/schema-icons/pro/brand/renogy-lifepo4-100ah.webp" },
  { id: "renogy-core-mini-200ah", brand: "Renogy", model: "Core Mini 12,8V/200Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 200 }, iconPro: "/schema-icons/pro/brand/renogy-core-mini-200ah.webp" },
  { id: "renogy-smart-lithium-200ah", brand: "Renogy", model: "Smart Lithium 12V/200Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 200 } },

  // MPPT
  // Pas d'iconPro ici : le visuel fourni pour ce modèle était corrompu
  // (retour utilisateur) — retombe sur l'icône générique MPPT en attendant
  // un visuel correct.
  { id: "victron-bluesolar-100-15", brand: "Victron", model: "BlueSolar MPPT 100/15", componentType: "mppt", defaults: { amperage: 15, systemVoltage: 12 } },
  { id: "victron-smartsolar-75-15", brand: "Victron", model: "SmartSolar MPPT 75/15", componentType: "mppt", defaults: { amperage: 15, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-75-15.png" },
  { id: "victron-smartsolar-100-20", brand: "Victron", model: "SmartSolar MPPT 100/20", componentType: "mppt", defaults: { amperage: 20, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-100-20.png" },
  { id: "victron-smartsolar-100-30", brand: "Victron", model: "SmartSolar MPPT 100/30", componentType: "mppt", defaults: { amperage: 30, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-100-30.png" },
  { id: "victron-smartsolar-100-50", brand: "Victron", model: "SmartSolar MPPT 100/50", componentType: "mppt", defaults: { amperage: 50, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-100-50.png" },
  { id: "victron-smartsolar-150-35", brand: "Victron", model: "SmartSolar MPPT 150/35", componentType: "mppt", defaults: { amperage: 35, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-150-35.png" },
  { id: "renogy-rover-20a", brand: "Renogy", model: "Rover 20A", componentType: "mppt", defaults: { amperage: 20, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/renogy-rover-20a.webp" },
  { id: "renogy-rover-40a", brand: "Renogy", model: "Rover 40A", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12 } },
  { id: "renogy-rover-60a", brand: "Renogy", model: "Rover 60A", componentType: "mppt", defaults: { amperage: 60, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/renogy-rover-60a.webp" },
  { id: "renogy-rover-elite-40a", brand: "Renogy", model: "Rover Elite 40A", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12 } },

  // DC-DC
  { id: "victron-orion-tr-9a", brand: "Victron", model: "Orion-Tr 12/12-9A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 9 }, iconPro: "/schema-icons/pro/brand/victron-orion-tr-9a.png" },
  { id: "victron-orion-tr-18a", brand: "Victron", model: "Orion-Tr Smart 12/12-18A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 18 } },
  { id: "victron-orion-tr-30a", brand: "Victron", model: "Orion-Tr Smart 12/12-30A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 30 }, iconPro: "/schema-icons/pro/brand/victron-orion-tr-30a.png" },
  { id: "renogy-dcc20s", brand: "Renogy", model: "DCC20S 20A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 20 }, iconPro: "/schema-icons/pro/brand/renogy-dcc20s.webp" },
  { id: "renogy-dcc30s", brand: "Renogy", model: "DCC30S 30A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 30 }, iconPro: "/schema-icons/pro/brand/renogy-dcc30s.webp" },
  { id: "renogy-dcc50s", brand: "Renogy", model: "DCC50S 50A (MPPT intégré)", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 50 } },
  { id: "fossibot-dcdc-50a", brand: "Fossibot", model: "Chargeur DC-DC 50A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 50 }, iconPro: "/schema-icons/pro/brand/fossibot-dcdc-50a.webp" },

  // Chargeurs secteur
  { id: "victron-blue-smart-ip22-20a", brand: "Victron", model: "Blue Smart IP22 12/20", componentType: "ac-charger", defaults: { chargeAmperage: 20 } },
  { id: "victron-blue-smart-ip22-30a", brand: "Victron", model: "Blue Smart IP22 12/30", componentType: "ac-charger", defaults: { chargeAmperage: 30 } },
  { id: "renogy-onboard-charger-20a", brand: "Renogy", model: "12V 20A On-Board Charger", componentType: "ac-charger", defaults: { chargeAmperage: 20 } },

  // Onduleurs purs
  { id: "victron-phoenix-500", brand: "Victron", model: "Phoenix Inverter 12/500", componentType: "inverter", defaults: { powerW: 500, voltageDC: 12 } },
  { id: "victron-phoenix-800", brand: "Victron", model: "Phoenix Inverter 12/800", componentType: "inverter", defaults: { powerW: 800, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/victron-phoenix-800.png" },
  { id: "victron-phoenix-1200", brand: "Victron", model: "Phoenix Inverter 12/1200", componentType: "inverter", defaults: { powerW: 1200, voltageDC: 12 } },
  { id: "renogy-inverter-1000w", brand: "Renogy", model: "1000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 1000, voltageDC: 12 } },
  { id: "renogy-inverter-2000w", brand: "Renogy", model: "2000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 2000, voltageDC: 12 } },

  // Convertisseurs-chargeurs
  { id: "victron-multiplus-1600-70", brand: "Victron", model: "MultiPlus 12/1600/70", componentType: "inverter-charger", defaults: { powerW: 1600, voltageDC: 12, chargeAmperage: 70 }, iconPro: "/schema-icons/pro/brand/victron-multiplus-1600-70.png" },
  { id: "victron-multiplus-3000-120", brand: "Victron", model: "MultiPlus 12/3000/120", componentType: "inverter-charger", defaults: { powerW: 3000, voltageDC: 12, chargeAmperage: 120 }, iconPro: "/schema-icons/pro/brand/victron-multiplus-3000-120.png" },

  // Stations "tout-en-1" — plusieurs marques concurrentes sur le même
  // segment produit, pas seulement Fossibot.
  { id: "fossibot-f1200", brand: "Fossibot", model: "F1200", componentType: "power-station", defaults: { powerW: 1200, capacityWh: 1024 }, iconPro: "/schema-icons/pro/brand/fossibot-f1200.webp" },
  { id: "fossibot-f2400", brand: "Fossibot", model: "F2400", componentType: "power-station", defaults: { powerW: 2400, capacityWh: 2048 }, iconPro: "/schema-icons/pro/brand/fossibot-f2400.webp" },
  // 2400W / 3014,4Wh lus directement sur l'écran du boîtier (visuel
  // fourni), pas une estimation.
  { id: "bluetti-elite-300", brand: "Bluetti", model: "Elite 300", componentType: "power-station", defaults: { powerW: 2400, capacityWh: 3014.4 }, iconPro: "/schema-icons/pro/brand/bluetti-elite-300.webp" },
  { id: "ecoflow-delta-3", brand: "EcoFlow", model: "Delta 3", componentType: "power-station", defaults: { powerW: 1600, capacityWh: 1024 }, iconPro: "/schema-icons/pro/brand/ecoflow-delta-3.webp" },
  { id: "aferiy-p280", brand: "AFERIY", model: "P280", componentType: "power-station", defaults: { powerW: 2800, capacityWh: 2048, connectorLayout: "dual-xt90-xt60" }, iconPro: "/schema-icons/pro/brand/aferiy-p280.webp" },

  // Shunt / monitoring
  { id: "victron-smartshunt-500a", brand: "Victron", model: "SmartShunt 500A", componentType: "shunt", defaults: { amperage: 500 }, iconPro: "/schema-icons/pro/brand/victron-smartshunt-500a.png" },
  { id: "victron-bmv-712", brand: "Victron", model: "BMV-712 Smart", componentType: "shunt", defaults: { amperage: 500 }, iconPro: "/schema-icons/pro/brand/victron-bmv-712.png" },
  { id: "renogy-rbm500", brand: "Renogy", model: "Battery Monitor RBM500", componentType: "shunt", defaults: { amperage: 500 }, iconPro: "/schema-icons/pro/brand/renogy-rbm500.webp" },

  // Combineur de batteries
  { id: "victron-cyrix-ct-120a", brand: "Victron", model: "Cyrix-Ct 12/24V-120A", componentType: "battery-combiner", defaults: { amperage: 120 }, iconPro: "/schema-icons/pro/brand/victron-cyrix-ct-120a.png" },
  { id: "victron-cyrix-li-ct-120a", brand: "Victron", model: "Cyrix-Li-ct 12/24V-120A", componentType: "battery-combiner", defaults: { amperage: 120 }, iconPro: "/schema-icons/pro/brand/victron-cyrix-li-ct-120a.png" },

  // Répartiteurs de charge (isolateurs à diodes, retour utilisateur :
  // "rajoute des composants si tu en estimes utile" — ce type n'avait
  // encore aucun modèle de marque).
  { id: "victron-argofet-100-2bat", brand: "Victron", model: "Argofet 100A 2 batteries", componentType: "battery-isolator", defaults: { outputCount: 2, amperage: 100 }, iconPro: "/schema-icons/pro/brand/victron-argofet-100-2bat.png" },
  { id: "victron-argofet-100-3bat", brand: "Victron", model: "Argofet 100A 3 batteries", componentType: "battery-isolator", defaults: { outputCount: 3, amperage: 100 }, iconPro: "/schema-icons/pro/brand/victron-argofet-100-3bat.png" },

  // Coupure basse tension (BatteryProtect : déconnecte automatiquement une
  // charge sous un seuil de tension réglable — rattaché à "battery-switch",
  // même rôle de coupure en ligne, mêmes bornes IN/OUT).
  { id: "victron-smart-batteryprotect-100a", brand: "Victron", model: "Smart BatteryProtect 12/24V-100A", componentType: "battery-switch", defaults: { amperage: 100 }, iconPro: "/schema-icons/pro/brand/victron-smart-batteryprotect-100a.png" },

  // Écran/hub de contrôle (GX) — rattaché à "system-monitor" (même rôle :
  // agréger les liaisons VE.Direct/VE.Bus et donner une vue d'ensemble du
  // système).
  { id: "victron-cerbo-gx", brand: "Victron", model: "Cerbo GX", componentType: "system-monitor", defaults: {}, iconPro: "/schema-icons/pro/brand/victron-cerbo-gx.png" },
];

export function getBrandModelsForType(componentType: string): BrandModel[] {
  return BRAND_MODELS.filter((m) => m.componentType === componentType);
}

export function getBrandModel(id: string): BrandModel | undefined {
  return BRAND_MODELS.find((m) => m.id === id);
}
