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
  { id: "victron-lithium-superpack-100ah", brand: "Victron", model: "Lithium SuperPack 12,8V/100Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 100 }, iconPro: "/schema-icons/pro/brand/victron-lithium-superpack-100ah.webp" },
  { id: "victron-lithium-superpack-ng-200ah", brand: "Victron", model: "Lithium SuperPack NG 12,8V/200Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 200 }, iconPro: "/schema-icons/pro/brand/victron-lithium-superpack-ng-200ah.webp" },
  { id: "victron-lithium-ng-300ah", brand: "Victron", model: "Lithium NG 12,8V/300Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 300 }, iconPro: "/schema-icons/pro/brand/victron-lithium-ng-300ah.webp" },
  { id: "victron-lithium-ng-24v-100ah", brand: "Victron", model: "Lithium NG 25,6V/100Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 24, capacityAh: 100 }, iconPro: "/schema-icons/pro/brand/victron-lithium-ng-24v-100ah.webp" },
  { id: "victron-agm-100ah", brand: "Victron", model: "AGM Super Cycle 12V/100Ah", componentType: "battery", defaults: { technology: "agm", voltage: 12, capacityAh: 100 }, iconPro: "/schema-icons/pro/brand/victron-agm-100ah.webp" },
  { id: "victron-gel-110ah", brand: "Victron", model: "GEL Deep Cycle 12V/110Ah", componentType: "battery", defaults: { technology: "gel", voltage: 12, capacityAh: 110 }, iconPro: "/schema-icons/pro/brand/victron-gel-110ah.webp" },
  { id: "victron-gel-220ah", brand: "Victron", model: "GEL Deep Cycle 12V/220Ah", componentType: "battery", defaults: { technology: "gel", voltage: 12, capacityAh: 220 }, iconPro: "/schema-icons/pro/brand/victron-gel-220ah.webp" },
  { id: "victron-lead-carbon-106ah", brand: "Victron", model: "Lead Carbon 12V/106Ah", componentType: "battery", defaults: { technology: "lead-carbon", voltage: 12, capacityAh: 106 }, iconPro: "/schema-icons/pro/brand/victron-lead-carbon-106ah.webp" },
  // Retour bêta (3e testeur) : "batterie lithium 280Ah type PowerQueen à ajouter".
  { id: "powerqueen-lifepo4-280ah", brand: "PowerQueen", model: "12,8V/280Ah LiFePO4", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 280 }, iconPro: "/schema-icons/pro/brand/powerqueen-lifepo4-280ah.webp" },
  { id: "powerqueen-lifepo4-320ah", brand: "PowerQueen", model: "12,8V/320Ah LiFePO4", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 320 }, iconPro: "/schema-icons/pro/brand/powerqueen-lifepo4-320ah.webp" },
  // Marque française (batteries LiFePO4 grand public).
  { id: "energie-mobile-lt12-100hd", brand: "Énergie Mobile", model: "LT12-100HD-BT 12V/100Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 100 }, iconPro: "/schema-icons/pro/brand/energie-mobile-lt12-100hd.webp" },
  { id: "energie-mobile-lt12-200hd", brand: "Énergie Mobile", model: "LT12-200HD-BT 12V/200Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 200 }, iconPro: "/schema-icons/pro/brand/energie-mobile-lt12-200hd.webp" },
  { id: "renogy-agm-100ah", brand: "Renogy", model: "Deep Cycle AGM 12V/100Ah", componentType: "battery", defaults: { technology: "agm", voltage: 12, capacityAh: 100 } },
  { id: "renogy-lifepo4-100ah", brand: "Renogy", model: "Core Mini 12,8V/100Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 100 }, iconPro: "/schema-icons/pro/brand/renogy-lifepo4-100ah.webp" },
  { id: "renogy-core-mini-200ah", brand: "Renogy", model: "Core Mini 12,8V/200Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 200 }, iconPro: "/schema-icons/pro/brand/renogy-core-mini-200ah.webp" },
  { id: "renogy-smart-lithium-200ah", brand: "Renogy", model: "Smart Lithium 12V/200Ah", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 200 } },
  // Marques grand public (Amazon), très vendues sur le segment van/bateau
  // débutant malgré une notoriété technique moindre que Victron/Renogy —
  // règle des 80/20 : ce sont elles que beaucoup d'utilisateurs ont déjà.
  { id: "ecoworthy-lifepo4-100ah", brand: "EcoWorthy", model: "12V 100Ah LiFePO4", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 100 }, iconPro: "/schema-icons/pro/brand/ecoworthy-lifepo4-200ah.webp" },
  { id: "ecoworthy-lifepo4-200ah", brand: "EcoWorthy", model: "12V 200Ah LiFePO4", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 200 }, iconPro: "/schema-icons/pro/brand/ecoworthy-lifepo4-200ah.webp" },
  { id: "creabest-lifepo4-100ah", brand: "Creabest", model: "12V 100Ah LiFePO4", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 100 } , iconPro: "/schema-icons/pro/brand/creabest-lifepo4-100ah.webp" },
  { id: "creabest-lifepo4-200ah", brand: "Creabest", model: "12V 200Ah LiFePO4", componentType: "battery", defaults: { technology: "lifepo4", voltage: 12, capacityAh: 200 } , iconPro: "/schema-icons/pro/brand/creabest-lifepo4-200ah.webp" },

  // Panneaux solaires (retour utilisateur : "l'item doit être trouvable
  // facilement, choisir le modèle/puissance de la même gamme" — jusqu'ici 0
  // modèle alors que ce sont des produits de marque bien réels, avec des
  // puissances standard du marché).
  { id: "renogy-100w-rigid", brand: "Renogy", model: "100W rigide monocristallin", componentType: "solar-panel", defaults: { powerW: 100, voltage: 0 } },
  { id: "renogy-200w-rigid", brand: "Renogy", model: "200W rigide monocristallin", componentType: "solar-panel", defaults: { powerW: 200, voltage: 0 } , iconPro: "/schema-icons/pro/brand/renogy-200w-rigid.webp" },
  { id: "renogy-175w-flexible", brand: "Renogy", model: "175W flexible", componentType: "solar-panel", defaults: { powerW: 175, voltage: 0 } , iconPro: "/schema-icons/pro/brand/renogy-175w-flexible.webp" },
  { id: "victron-175w-rigid", brand: "Victron", model: "BlueSolar 175W rigide", componentType: "solar-panel", defaults: { powerW: 175, voltage: 0 } , iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  // Retour bêta (3e testeur) : "panneau Victron 360W très utilisé, à ajouter".
  { id: "victron-365w-mono", brand: "Victron", model: "365W rigide monocristallin", componentType: "solar-panel", defaults: { powerW: 365, voltage: 0 }, iconPro: "/schema-icons/pro/brand/victron-365w-mono.webp" },
  // Un seul visuel disponible par marque pour la gamme panneaux (retour
  // utilisateur) — réutilisé sur toutes les puissances de la même marque
  // plutôt que de laisser certaines sans icône.
  { id: "victron-115w-rigid", brand: "Victron", model: "BlueSolar 115W rigide", componentType: "solar-panel", defaults: { powerW: 115, voltage: 0 }, iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  { id: "bougerv-200w-flexible", brand: "BougeRV", model: "200W flexible", componentType: "solar-panel", defaults: { powerW: 200, voltage: 0 } , iconPro: "/schema-icons/pro/brand/bougerv-200w-flexible.webp" },
  { id: "bougerv-400w-rigid", brand: "BougeRV", model: "400W rigide bifacial", componentType: "solar-panel", defaults: { powerW: 400, voltage: 0 } },
  { id: "ecoworthy-100w-rigid", brand: "EcoWorthy", model: "100W rigide monocristallin", componentType: "solar-panel", defaults: { powerW: 100, voltage: 0 }, iconPro: "/schema-icons/pro/brand/ecoworthy-200w-rigid.webp" },
  { id: "ecoworthy-200w-rigid", brand: "EcoWorthy", model: "200W rigide monocristallin", componentType: "solar-panel", defaults: { powerW: 200, voltage: 0 } , iconPro: "/schema-icons/pro/brand/ecoworthy-200w-rigid.webp" },
  { id: "ecoworthy-400w-rigid", brand: "EcoWorthy", model: "400W rigide bifacial", componentType: "solar-panel", defaults: { powerW: 400, voltage: 0 }, iconPro: "/schema-icons/pro/brand/ecoworthy-200w-rigid.webp" },
  // Marque française, panneaux solaires nomades/portables très répandus en
  // camping-car.
  { id: "sunology-100w-portable", brand: "Sunology", model: "Move 100W portable", componentType: "solar-panel", defaults: { powerW: 100, voltage: 0 }, iconPro: "/schema-icons/pro/brand/sunology-200w-portable.webp" },
  { id: "sunology-200w-portable", brand: "Sunology", model: "Move 200W portable", componentType: "solar-panel", defaults: { powerW: 200, voltage: 0 } , iconPro: "/schema-icons/pro/brand/sunology-200w-portable.webp" },

  // MPPT
  { id: "victron-bluesolar-100-15", brand: "Victron", model: "BlueSolar MPPT 100/15", componentType: "mppt", defaults: { amperage: 15, systemVoltage: 12 } , iconPro: "/schema-icons/pro/brand/victron-bluesolar-100-15.webp" },
  { id: "victron-smartsolar-75-15", brand: "Victron", model: "SmartSolar MPPT 75/15", componentType: "mppt", defaults: { amperage: 15, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-75-15.png" },
  { id: "victron-smartsolar-100-20", brand: "Victron", model: "SmartSolar MPPT 100/20", componentType: "mppt", defaults: { amperage: 20, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-100-20.png" },
  { id: "victron-smartsolar-100-30", brand: "Victron", model: "SmartSolar MPPT 100/30", componentType: "mppt", defaults: { amperage: 30, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-100-30.png" },
  { id: "victron-smartsolar-100-50", brand: "Victron", model: "SmartSolar MPPT 100/50", componentType: "mppt", defaults: { amperage: 50, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-100-50.png" },
  { id: "victron-smartsolar-150-35", brand: "Victron", model: "SmartSolar MPPT 150/35", componentType: "mppt", defaults: { amperage: 35, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-150-35.png" },
  { id: "renogy-rover-20a", brand: "Renogy", model: "Rover 20A", componentType: "mppt", defaults: { amperage: 20, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/renogy-rover-20a.webp" },
  { id: "renogy-rover-40a", brand: "Renogy", model: "Rover 40A", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/renogy-rover-40a.webp" },
  { id: "renogy-rover-60a", brand: "Renogy", model: "Rover 60A", componentType: "mppt", defaults: { amperage: 60, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/renogy-rover-60a.webp" },
  { id: "renogy-rover-elite-40a", brand: "Renogy", model: "Rover Elite 40A", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12 } },
  { id: "ecoworthy-mppt-20a", brand: "EcoWorthy", model: "MPPT 20A", componentType: "mppt", defaults: { amperage: 20, systemVoltage: 12 } , iconPro: "/schema-icons/pro/brand/ecoworthy-mppt-20a.webp" },
  { id: "ecoworthy-mppt-40a", brand: "EcoWorthy", model: "MPPT 40A", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12 } , iconPro: "/schema-icons/pro/brand/ecoworthy-mppt-40a.webp" },
  // Marque chinoise très vendue (Amazon), gamme Tracer — même boîtier
  // décliné sur tout le calibrage, un seul visuel réutilisé sur les 4.
  { id: "epever-tracer-10a", brand: "EPEVER", model: "Tracer 10A", componentType: "mppt", defaults: { amperage: 10, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/epever-mppt.webp" },
  { id: "epever-tracer-20a", brand: "EPEVER", model: "Tracer 20A", componentType: "mppt", defaults: { amperage: 20, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/epever-mppt.webp" },
  { id: "epever-tracer-30a", brand: "EPEVER", model: "Tracer 30A", componentType: "mppt", defaults: { amperage: 30, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/epever-mppt.webp" },
  { id: "epever-tracer-40a", brand: "EPEVER", model: "Tracer 40A", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12 }, iconPro: "/schema-icons/pro/brand/epever-mppt.webp" },

  // PWM (retour utilisateur : "chaque item détaillé pareil" — 0 modèle
  // jusqu'ici alors que le MPPT, son jumeau, en a 10).
  { id: "victron-bluesolar-pwm-12-20", brand: "Victron", model: "BlueSolar PWM-Pro 12/24V-20A", componentType: "pwm", defaults: { amperage: 20, systemVoltage: 12 } , iconPro: "/schema-icons/pro/brand/victron-bluesolar-pwm-12-20.webp" },
  { id: "victron-bluesolar-pwm-12-30", brand: "Victron", model: "BlueSolar PWM-Pro 12/24V-30A", componentType: "pwm", defaults: { amperage: 30, systemVoltage: 12 } , iconPro: "/schema-icons/pro/brand/victron-bluesolar-pwm-12-30.webp" },
  { id: "renogy-wanderer-10a", brand: "Renogy", model: "Wanderer 10A", componentType: "pwm", defaults: { amperage: 10, systemVoltage: 12 } , iconPro: "/schema-icons/pro/brand/renogy-wanderer-10a.webp" },
  { id: "renogy-wanderer-30a", brand: "Renogy", model: "Wanderer 30A", componentType: "pwm", defaults: { amperage: 30, systemVoltage: 12 } },
  { id: "renogy-adventurer-30a", brand: "Renogy", model: "Adventurer 30A", componentType: "pwm", defaults: { amperage: 30, systemVoltage: 12 } , iconPro: "/schema-icons/pro/brand/renogy-adventurer-30a.webp" },

  // DC-DC
  { id: "victron-orion-tr-9a", brand: "Victron", model: "Orion-Tr 12/12-9A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 9 }, iconPro: "/schema-icons/pro/brand/victron-orion-tr-9a.png" },
  { id: "victron-orion-tr-18a", brand: "Victron", model: "Orion-Tr Smart 12/12-18A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 18 } , iconPro: "/schema-icons/pro/brand/victron-orion-tr-18a.webp" },
  { id: "victron-orion-tr-30a", brand: "Victron", model: "Orion-Tr Smart 12/12-30A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 30 }, iconPro: "/schema-icons/pro/brand/victron-orion-tr-30a.png" },
  // Non isolé (masse commune, une seule borne −) — sérigraphie du boîtier
  // "IN / GND / OUT", à la différence de l'Orion-Tr Smart (isolé, IN/OUT
  // chacun avec son propre −).
  { id: "victron-orion-xs-12-12-30", brand: "Victron", model: "Orion XS 12/12-30A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 30, topology: "non-isolated" }, iconPro: "/schema-icons/pro/brand/victron-orion-xs-12-12-30.webp" },
  { id: "victron-orion-xs-12-12-50", brand: "Victron", model: "Orion XS 12/12-50A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 50, topology: "non-isolated" } , iconPro: "/schema-icons/pro/brand/victron-orion-xs-12-12-50.webp" },
  { id: "victron-orion-xs-12-24-17", brand: "Victron", model: "Orion XS 12/24-17A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 24, amperage: 17, topology: "non-isolated" } },
  { id: "renogy-dcc20s", brand: "Renogy", model: "DCC20S 20A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 20 }, iconPro: "/schema-icons/pro/brand/renogy-dcc20s.webp" },
  { id: "renogy-dcc30s", brand: "Renogy", model: "DCC30S 30A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 30 }, iconPro: "/schema-icons/pro/brand/renogy-dcc30s.webp" },
  { id: "renogy-dcc50s", brand: "Renogy", model: "DCC50S 50A (MPPT intégré)", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 50 } , iconPro: "/schema-icons/pro/brand/renogy-dcc50s.webp" },
  { id: "fossibot-dcdc-50a", brand: "Fossibot", model: "Chargeur DC-DC 50A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 50 }, iconPro: "/schema-icons/pro/brand/fossibot-dcdc-50a.webp" },
  { id: "ecoworthy-dcdc-20a", brand: "EcoWorthy", model: "Chargeur DC-DC MPPT 20A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 20 } , iconPro: "/schema-icons/pro/brand/ecoworthy-dcdc-20a.webp" },
  { id: "ecoworthy-dcdc-40a", brand: "EcoWorthy", model: "Chargeur DC-DC MPPT 40A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 40 } , iconPro: "/schema-icons/pro/brand/ecoworthy-dcdc-40a.webp" },
  { id: "cristec-dcdc-12-12-30", brand: "Cristec", model: "Convertisseur DC-DC 12/12V-30A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 30 } },

  // Chargeurs secteur
  { id: "victron-blue-smart-ip22-20a", brand: "Victron", model: "Blue Smart IP22 12/20", componentType: "ac-charger", defaults: { chargeAmperage: 20 } , iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip22-20a.webp" },
  { id: "victron-blue-smart-ip22-30a", brand: "Victron", model: "Blue Smart IP22 12/30", componentType: "ac-charger", defaults: { chargeAmperage: 30 } , iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip22-30a.webp" },
  // IP67 : version totalement étanche (vs IP22, résistant aux éclaboussures
  // seulement) — même gamme Blue Smart, boîtier différent.
  { id: "victron-blue-smart-ip67-12-7", brand: "Victron", model: "Blue Smart IP67 12/7", componentType: "ac-charger", defaults: { chargeAmperage: 7 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip67-12-7.webp" },
  { id: "victron-blue-smart-ip67-12-25", brand: "Victron", model: "Blue Smart IP67 12/25", componentType: "ac-charger", defaults: { chargeAmperage: 25 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip67-12-25.webp" },
  { id: "renogy-onboard-charger-20a", brand: "Renogy", model: "12V 20A On-Board Charger", componentType: "ac-charger", defaults: { chargeAmperage: 20 } },
  // Marque française (La Rochelle), référence historique en électronique
  // de bord marine — gamme de chargeurs YPOWER.
  { id: "cristec-ypower-12-20", brand: "Cristec", model: "YPOWER 12V/20A", componentType: "ac-charger", defaults: { chargeAmperage: 20 } , iconPro: "/schema-icons/pro/brand/cristec-ypower-12-20.webp" },
  { id: "cristec-ypower-12-30", brand: "Cristec", model: "YPOWER 12V/30A", componentType: "ac-charger", defaults: { chargeAmperage: 30 } , iconPro: "/schema-icons/pro/brand/cristec-ypower-12-30.webp" },
  { id: "cristec-ypower-24-15", brand: "Cristec", model: "YPOWER 24V/15A", componentType: "ac-charger", defaults: { chargeAmperage: 15 }, iconPro: "/schema-icons/pro/brand/cristec-ypower-24-15.webp" },

  // Prise de quai (retour bêta, 3e testeur : "impossible d'ajouter une
  // prise P17" — connecteur caravane/camping bleu 16A/230V normalisé).
  { id: "p17-16a", brand: "Générique", model: "Prise P17 16A/230V", componentType: "shore-power", defaults: {}, iconPro: "/schema-icons/pro/brand/victron-p17-shore-power.webp" },

  // Onduleurs purs
  { id: "victron-phoenix-500", brand: "Victron", model: "Phoenix Inverter 12/500", componentType: "inverter", defaults: { powerW: 500, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/victron-phoenix-500.webp" },
  { id: "victron-phoenix-800", brand: "Victron", model: "Phoenix Inverter 12/800", componentType: "inverter", defaults: { powerW: 800, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/victron-phoenix-800.png" },
  { id: "victron-phoenix-1200", brand: "Victron", model: "Phoenix Inverter 12/1200", componentType: "inverter", defaults: { powerW: 1200, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/victron-phoenix-1200.webp" },
  { id: "victron-phoenix-1600", brand: "Victron", model: "Phoenix Inverter Smart 12/1600", componentType: "inverter", defaults: { powerW: 1600, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/victron-phoenix-1600.webp" },
  { id: "renogy-inverter-1000w", brand: "Renogy", model: "1000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 1000, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/renogy-inverter-1000w.webp" },
  { id: "renogy-inverter-2000w", brand: "Renogy", model: "2000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 2000, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/renogy-inverter-2000w.webp" },
  { id: "ecoworthy-inverter-1000w", brand: "EcoWorthy", model: "1000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 1000, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/ecoworthy-inverter-1000w.webp" },
  { id: "ecoworthy-inverter-2000w", brand: "EcoWorthy", model: "2000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 2000, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/ecoworthy-inverter-2000w.webp" },

  // Convertisseurs-chargeurs
  { id: "victron-multiplus-500-20", brand: "Victron", model: "MultiPlus 12/500/20", componentType: "inverter-charger", defaults: { powerW: 500, voltageDC: 12, chargeAmperage: 20 }, iconPro: "/schema-icons/pro/brand/victron-multiplus-500-20.webp" },
  { id: "victron-multiplus-800-35", brand: "Victron", model: "Multi 12/800/35", componentType: "inverter-charger", defaults: { powerW: 800, voltageDC: 12, chargeAmperage: 35 }, iconPro: "/schema-icons/pro/brand/victron-multiplus-800-35.webp" },
  { id: "victron-multiplus-1200-50", brand: "Victron", model: "MultiPlus 12/1200/50", componentType: "inverter-charger", defaults: { powerW: 1200, voltageDC: 12, chargeAmperage: 50 }, iconPro: "/schema-icons/pro/brand/victron-multiplus-1200-50.webp" },
  { id: "victron-multiplus-1600-70", brand: "Victron", model: "MultiPlus 12/1600/70", componentType: "inverter-charger", defaults: { powerW: 1600, voltageDC: 12, chargeAmperage: 70 }, iconPro: "/schema-icons/pro/brand/victron-multiplus-1600-70.webp" },
  { id: "victron-multiplus-ii-24-3000-70", brand: "Victron", model: "MultiPlus-II GX 24/3000/70", componentType: "inverter-charger", defaults: { powerW: 3000, voltageDC: 24, chargeAmperage: 70 }, iconPro: "/schema-icons/pro/brand/victron-multiplus-ii-24-3000-70.webp" },
  // Retour bêta (3e testeur) : "ne trouve pas comment ajouter un Multiplus
  // II 12/3000VA".
  { id: "victron-multiplus-ii-12-3000-120", brand: "Victron", model: "MultiPlus-II 12/3000/120-32", componentType: "inverter-charger", defaults: { powerW: 3000, voltageDC: 12, chargeAmperage: 120 }, iconPro: "/schema-icons/pro/brand/victron-multiplus-ii-12-3000-120.webp" },
  { id: "victron-multiplus-3000-120", brand: "Victron", model: "MultiPlus 12/3000/120", componentType: "inverter-charger", defaults: { powerW: 3000, voltageDC: 12, chargeAmperage: 120 }, iconPro: "/schema-icons/pro/brand/victron-multiplus-3000-120.png" },
  { id: "creabest-inverter-charger-2000w", brand: "Creabest", model: "Inverter Charger 2000W 12V-230V/80A", componentType: "inverter-charger", defaults: { powerW: 2000, voltageDC: 12, chargeAmperage: 80 }, iconPro: "/schema-icons/pro/brand/creabest-inverter-charger-2000w.webp" },

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
  { id: "victron-bmv-712", brand: "Victron", model: "BMV-712 Smart", componentType: "shunt", defaults: { amperage: 500 }, iconPro: "/schema-icons/pro/brand/victron-bmv-712.webp" },
  { id: "renogy-rbm500", brand: "Renogy", model: "Battery Monitor RBM500", componentType: "shunt", defaults: { amperage: 500 }, iconPro: "/schema-icons/pro/brand/renogy-rbm500.webp" },

  // Combineur de batteries
  { id: "victron-cyrix-ct-120a", brand: "Victron", model: "Cyrix-Ct 12/24V-120A", componentType: "battery-combiner", defaults: { amperage: 120 }, iconPro: "/schema-icons/pro/brand/victron-cyrix-ct-120a.png" },
  { id: "victron-cyrix-li-ct-120a", brand: "Victron", model: "Cyrix-Li-ct 12/24V-120A", componentType: "battery-combiner", defaults: { amperage: 120 }, iconPro: "/schema-icons/pro/brand/victron-cyrix-li-ct-120a.png" },

  // Répartiteurs de charge (isolateurs à diodes, retour utilisateur :
  // "rajoute des composants si tu en estimes utile" — ce type n'avait
  // encore aucun modèle de marque).
  { id: "victron-argofet-100-2bat", brand: "Victron", model: "Argofet 100A 2 batteries", componentType: "battery-isolator", defaults: { outputCount: 2, amperage: 100 }, iconPro: "/schema-icons/pro/brand/victron-argofet-100-2bat.png" },
  { id: "victron-argofet-100-3bat", brand: "Victron", model: "Argofet 100A 3 batteries", componentType: "battery-isolator", defaults: { outputCount: 3, amperage: 100 }, iconPro: "/schema-icons/pro/brand/victron-argofet-100-3bat.png" },
  { id: "cristec-diodis-160-2bat", brand: "Cristec", model: "Diodis 160A 2 batteries", componentType: "battery-isolator", defaults: { outputCount: 2, amperage: 160 } , iconPro: "/schema-icons/pro/brand/cristec-diodis-160-2bat.webp" },
  { id: "cristec-diodis-160-3bat", brand: "Cristec", model: "Diodis 160A 3 batteries", componentType: "battery-isolator", defaults: { outputCount: 3, amperage: 160 } , iconPro: "/schema-icons/pro/brand/cristec-diodis-160-3bat.webp" },

  // Lynx Distributor / Power In / Shunt VE.Can : regroupés dans leur propre
  // famille de composants dédiés (type "lynx-distributor" etc., voir
  // definitions.ts) plutôt qu'en modèles de marque d'un type générique —
  // retour utilisateur : "classe tous les Lynx ensemble dans la famille
  // Lynx" pour les retrouver groupés dans la bibliothèque.

  // Coupure basse tension (BatteryProtect : déconnecte automatiquement une
  // charge sous un seuil de tension réglable — rattaché à "battery-switch",
  // même rôle de coupure en ligne, mêmes bornes IN/OUT).
  { id: "victron-smart-batteryprotect-65a", brand: "Victron", model: "Smart BatteryProtect 12/24V-65A", componentType: "battery-switch", defaults: { amperage: 65 } , iconPro: "/schema-icons/pro/brand/victron-smart-batteryprotect-65a.webp" },
  { id: "victron-smart-batteryprotect-100a", brand: "Victron", model: "Smart BatteryProtect 12/24V-100A", componentType: "battery-switch", defaults: { amperage: 100 }, iconPro: "/schema-icons/pro/brand/victron-smart-batteryprotect-100a.png" },
  { id: "victron-smart-batteryprotect-220a", brand: "Victron", model: "Smart BatteryProtect 12/24V-220A", componentType: "battery-switch", defaults: { amperage: 220 } , iconPro: "/schema-icons/pro/brand/victron-smart-batteryprotect-220a.webp" },

  // Écran/hub de contrôle (GX) — rattaché à "system-monitor" (même rôle :
  // agréger les liaisons VE.Direct/VE.Bus et donner une vue d'ensemble du
  // système).
  { id: "victron-cerbo-gx", brand: "Victron", model: "Cerbo GX", componentType: "system-monitor", defaults: {}, iconPro: "/schema-icons/pro/brand/victron-cerbo-gx.webp" },
  { id: "victron-ccgx", brand: "Victron", model: "Color Control GX", componentType: "system-monitor", defaults: {}, iconPro: "/schema-icons/pro/brand/victron-ccgx.webp" },
  { id: "victron-gx-touch-70", brand: "Victron", model: "GX Touch 70", componentType: "system-monitor", defaults: { connection: "communication-only" }, iconPro: "/schema-icons/pro/brand/victron-gx-touch-70.webp" },
];

export function getBrandModelsForType(componentType: string): BrandModel[] {
  return BRAND_MODELS.filter((m) => m.componentType === componentType);
}

export function getBrandModel(id: string): BrandModel | undefined {
  return BRAND_MODELS.find((m) => m.id === id);
}
