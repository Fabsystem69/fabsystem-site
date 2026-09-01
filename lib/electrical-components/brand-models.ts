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
  // Victron indique quatre connexions DC par rail (+ et -) pour le Lynx
  // Power In M8/M10 : https://www.victronenergy.com/media/pg/Lynx_Power_In/fr/introduction.html
  // Le busbar FabSystem représente un rail a la fois, donc le plafond est
  // applique individuellement au + ou au - selectionne dans le schema.
  { id: "victron-lynx-power-in-m8", brand: "Victron", model: "Lynx Power In M8 (4 connexions par rail)", componentType: "busbar", defaults: { maxConnectionPoints: 4, outputCount: 3, leftPoints: 0, topPoints: 0, rightPoints: 4, bottomPoints: 0 } },
  { id: "victron-lynx-power-in-m10", brand: "Victron", model: "Lynx Power In M10 (4 connexions par rail)", componentType: "busbar", defaults: { maxConnectionPoints: 4, outputCount: 3, leftPoints: 0, topPoints: 0, rightPoints: 4, bottomPoints: 0 } },

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
  // Retour utilisateur : "il y a bien une photo de batterie plomb mais elle
  // ne se retrouve pas dans la liste des items en Yuasa" — la photo posée
  // comme icône générique de la technologie "plomb" est en fait une vraie
  // photo produit Yuasa, jamais ajoutée comme modèle de marque à part.
  { id: "yuasa-marine-100ah", brand: "Yuasa", model: "Marine 12V/100Ah (C20)", componentType: "battery", defaults: { technology: "plomb", voltage: 12, capacityAh: 100 }, iconPro: "/schema-icons/pro/battery-plomb.jpg" },
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
  // Voc (tension circuit ouvert) relevées sur fiches techniques
  // constructeur — nécessaires au contrôle de montage série (retour
  // utilisateur : "il faut que tu ai les données Voc des panneaux et la
  // donnée max des MPPT"). Les entrées sans fiche fiable identifiable
  // (BougeRV 200W flexible ambigu, EcoWorthy 100W/200W rigide et 400W
  // bifacial génériques, Sunology "Move") ont été supprimées plutôt que
  // renseignées avec une valeur devinée.
  // Fiches panneau STC : Vmp, Imp, Voc, Isc et coefficient Voc sont
  // nécessaires au calcul réel des strings et des câbles PV.
  // Gamme Renogy actuelle : panneaux N-Type 16BB.
  // Sources :
  // https://eu.renogy.com/products/renogy-16bb-n-type-200-watt-24v-solar-panel
  // https://eu.renogy.com/products/renogy-16bb-n-type-175-watt-12v-solar-panel
  // https://www.renogy.com/products/renogy-400w-12v-solar-rv-kit
  { id: "renogy-100w-ntype", brand: "Renogy", model: "100W N-Type 16BB", componentType: "solar-panel", defaults: { powerW: 100, voltage: 19.97, operatingCurrentA: 5.01, shortCircuitCurrentA: 5.31, vocVoltage: 22.79 } },
  { id: "renogy-175w-ntype", brand: "Renogy", model: "175W N-Type 16BB", componentType: "solar-panel", defaults: { powerW: 175, voltage: 20.88, operatingCurrentA: 8.38, shortCircuitCurrentA: 8.88, vocVoltage: 24.48 }, iconPro: "/schema-icons/pro/brand/renogy-200w-rigid.webp" },
  { id: "renogy-200w-ntype", brand: "Renogy", model: "200W N-Type 16BB", componentType: "solar-panel", defaults: { powerW: 200, voltage: 31.03, operatingCurrentA: 6.46, shortCircuitCurrentA: 6.85, vocVoltage: 37.44 }, iconPro: "/schema-icons/pro/brand/renogy-200w-rigid.webp" },
  // https://eu.renogy.com/products/400w-n-type-bifacial-solar-panel
  { id: "renogy-400w-ntype-bifacial", brand: "Renogy", model: "400W N-Type bifacial", componentType: "solar-panel", defaults: { powerW: 400, voltage: 34, operatingCurrentA: 11.76, shortCircuitCurrentA: 13.06, vocVoltage: 39.42 }, iconPro: "/schema-icons/pro/brand/renogy-200w-rigid.webp" },
  { id: "renogy-200w-flexible", brand: "Renogy", model: "200W flexible", componentType: "solar-panel", defaults: { panelStyle: "flexible", powerW: 200, voltage: 20.1, operatingCurrentA: 10.02, shortCircuitCurrentA: 10.74, vocVoltage: 23.9 }, iconPro: "/schema-icons/pro/brand/renogy-175w-flexible.webp" },
  // Gamme Victron actuelle (fiche STC constructeur) :
  // https://www.victronenergy.com/upload/documents/Datasheet-BlueSolar-Monocrystalline-Panels-current-models-EN-.pdf
  { id: "victron-bluesolar-95w-mono", brand: "Victron", model: "BlueSolar 95W monocristallin (SPM040953003)", componentType: "solar-panel", defaults: { powerW: 95, voltage: 17.6, operatingCurrentA: 5.42, shortCircuitCurrentA: 5.7, vocVoltage: 20.4, vocTemperatureCoeffPctPerC: -0.35 }, iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  { id: "victron-bluesolar-130w-mono", brand: "Victron", model: "BlueSolar 130W monocristallin (SPM041303603)", componentType: "solar-panel", defaults: { powerW: 130, voltage: 21.1, operatingCurrentA: 6.18, shortCircuitCurrentA: 6.53, vocVoltage: 24.8, vocTemperatureCoeffPctPerC: -0.35 }, iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  { id: "victron-bluesolar-150w-mono", brand: "Victron", model: "BlueSolar 150W monocristallin (SPM041501200)", componentType: "solar-panel", defaults: { powerW: 150, voltage: 18.2, operatingCurrentA: 8.25, shortCircuitCurrentA: 8.69, vocVoltage: 22.3, vocTemperatureCoeffPctPerC: -0.35 }, iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  { id: "victron-bluesolar-190w-mono", brand: "Victron", model: "BlueSolar 190W monocristallin (SPM041903903)", componentType: "solar-panel", defaults: { powerW: 190, voltage: 21.8, operatingCurrentA: 8.71, shortCircuitCurrentA: 9.17, vocVoltage: 25.5, vocTemperatureCoeffPctPerC: -0.35 }, iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  { id: "victron-bluesolar-235w-mono", brand: "Victron", model: "BlueSolar 235W monocristallin (SPM042357203)", componentType: "solar-panel", defaults: { powerW: 235, voltage: 41.4, operatingCurrentA: 5.68, shortCircuitCurrentA: 6.02, vocVoltage: 49.6, vocTemperatureCoeffPctPerC: -0.35 }, iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  { id: "victron-bluesolar-285w-mono", brand: "Victron", model: "BlueSolar 285W monocristallin (SPM042855603)", componentType: "solar-panel", defaults: { powerW: 285, voltage: 33.4, operatingCurrentA: 8.63, shortCircuitCurrentA: 9.08, vocVoltage: 38.9, vocTemperatureCoeffPctPerC: -0.35 }, iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  { id: "victron-bluesolar-345w-mono", brand: "Victron", model: "BlueSolar 345W monocristallin (SPM043456803)", componentType: "solar-panel", defaults: { powerW: 345, voltage: 38.7, operatingCurrentA: 8.8, shortCircuitCurrentA: 9.27, vocVoltage: 45.2, vocTemperatureCoeffPctPerC: -0.35 }, iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  { id: "victron-bluesolar-365w-mono", brand: "Victron", model: "BlueSolar 365W monocristallin (SPM043657203)", componentType: "solar-panel", defaults: { powerW: 365, voltage: 41.4, operatingCurrentA: 8.83, shortCircuitCurrentA: 9.3, vocVoltage: 48.4, vocTemperatureCoeffPctPerC: -0.35 }, iconPro: "/schema-icons/pro/brand/victron-175w-rigid.webp" },
  // Fiches STC BougeRV :
  // https://www.bougerv.com/products/bougerv-400-watt-12v-24v-rigid-bifacial-10bb-mono-solar-panel
  // https://www.bougerv.com/products/200-watt-n-type-shade-power-rigid-solar-panel
  // https://www.bougerv.com/products/arch-pro-12v-24v-100w-flexible-solar-panel
  // https://www.bougerv.com/products/bougerv-12v-200-watt-arch-pro-solar-system-kit
  { id: "bougerv-400w-rigid", brand: "BougeRV", model: "400W rigide bifacial 10BB (ISE240)", componentType: "solar-panel", defaults: { powerW: 400, voltage: 31, operatingCurrentA: 12.9, shortCircuitCurrentA: 13.8, vocVoltage: 37.1 }, iconPro: "/schema-icons/pro/brand/bougerv-400w-rigid.jpeg" },
  // https://www.bougerv.com/products/bougerv-400-watt-16bb-mono-solar-panel
  { id: "bougerv-400w-ntype-bifacial", brand: "BougeRV", model: "400W N-Type bifacial 16BB (ISE240N)", componentType: "solar-panel", defaults: { powerW: 400, voltage: 33.16, operatingCurrentA: 12.36, shortCircuitCurrentA: 13.5, vocVoltage: 39.7, vocTemperatureCoeffPctPerC: -0.25 }, iconPro: "/schema-icons/pro/brand/bougerv-400w-rigid.jpeg" },
  // Pas de photo dédiée par modèle disponible pour la gamme BougeRV — retour
  // utilisateur : "utilise des photo bougerv rigide ou flexible selon le
  // modèle" — les deux seuls visuels du dossier (un rigide, un flexible)
  // réutilisés selon la construction réelle de chaque panneau plutôt qu'un
  // seul appliqué à tout.
  { id: "bougerv-200w-ntype-shadepower", brand: "BougeRV", model: "200W N-Type ShadePower rigide (SP005-BK)", componentType: "solar-panel", defaults: { powerW: 200, voltage: 31, operatingCurrentA: 6.45, shortCircuitCurrentA: 6.77, vocVoltage: 36.4, vocTemperatureCoeffPctPerC: -0.25 }, iconPro: "/schema-icons/pro/brand/bougerv-400w-rigid.jpeg" },
  { id: "bougerv-arch-pro-100w", brand: "BougeRV", model: "Arch Pro 100W flexible fibre de verre (SP003)", componentType: "solar-panel", defaults: { panelStyle: "flexible", powerW: 100, voltage: 32.4, operatingCurrentA: 3.1, shortCircuitCurrentA: 3.2, vocVoltage: 37.8, vocTemperatureCoeffPctPerC: -0.3 }, iconPro: "/schema-icons/pro/brand/bougerv-200w-flexible.webp" },
  { id: "bougerv-arch-pro-200w", brand: "BougeRV", model: "Arch Pro 200W flexible fibre de verre (SP004)", componentType: "solar-panel", defaults: { panelStyle: "flexible", powerW: 200, voltage: 31.1, operatingCurrentA: 6.43, shortCircuitCurrentA: 6.7, vocVoltage: 36.4, vocTemperatureCoeffPctPerC: -0.3 }, iconPro: "/schema-icons/pro/brand/bougerv-200w-flexible.webp" },
  // https://www.bougerv.com/products/bougerv-arch-100w-n-type-fiberglass-flexible-solar-panel
  { id: "bougerv-arch-2-100w", brand: "BougeRV", model: "Arch 2.0 100W N-Type flexible (ISE214N)", componentType: "solar-panel", defaults: { panelStyle: "flexible", powerW: 100, voltage: 25.2, operatingCurrentA: 3.97, shortCircuitCurrentA: 4.17, vocVoltage: 29.4, vocTemperatureCoeffPctPerC: -0.3 }, iconPro: "/schema-icons/pro/brand/bougerv-200w-flexible.webp" },
  // Gamme Yuma CIGS flexible — specs officielles fournies par l'utilisateur
  // (fiche "Spec Quick View" BougeRV, 5 SKU). Résout l'ambiguïté qui avait
  // fait supprimer l'ancienne entrée générique "200W flexible" (plusieurs
  // sous-modèles Yuma aux Voc différents non distingués). Adhésif/perforé
  // ne change que la fixation, pas l'électrique — mêmes Vmp/Voc/Isc pour les
  // deux 100W, distingués ici car ce sont des SKU réellement différents.
  { id: "bougerv-yuma-200w-adhesive", brand: "BougeRV", model: "Yuma 200W flexible (adhésif, ISE138)", componentType: "solar-panel", defaults: { panelStyle: "flexible", powerW: 200, voltage: 24, operatingCurrentA: 8.52, shortCircuitCurrentA: 9.48, vocVoltage: 30.4, vocTemperatureCoeffPctPerC: -0.28 }, iconPro: "/schema-icons/pro/brand/bougerv-200w-flexible.webp" },
  { id: "bougerv-yuma-200w-punched", brand: "BougeRV", model: "Yuma 200W flexible (perforé, ISE154)", componentType: "solar-panel", defaults: { panelStyle: "flexible", powerW: 200, voltage: 24, operatingCurrentA: 8.52, shortCircuitCurrentA: 9.48, vocVoltage: 30.4, vocTemperatureCoeffPctPerC: -0.28 }, iconPro: "/schema-icons/pro/brand/bougerv-200w-flexible.webp" },
  { id: "bougerv-yuma-100w-adhesive", brand: "BougeRV", model: "Yuma 100W flexible (adhésif, ISE160)", componentType: "solar-panel", defaults: { panelStyle: "flexible", powerW: 100, voltage: 24, operatingCurrentA: 4.21, shortCircuitCurrentA: 4.71, vocVoltage: 30.5, vocTemperatureCoeffPctPerC: -0.28 }, iconPro: "/schema-icons/pro/brand/bougerv-200w-flexible.webp" },
  { id: "bougerv-yuma-100w-adhesive-long", brand: "BougeRV", model: "Yuma 100W flexible (adhésif long, ISE137)", componentType: "solar-panel", defaults: { panelStyle: "flexible", powerW: 100, voltage: 24, operatingCurrentA: 4.21, shortCircuitCurrentA: 4.71, vocVoltage: 30.5, vocTemperatureCoeffPctPerC: -0.28 }, iconPro: "/schema-icons/pro/brand/bougerv-200w-flexible.webp" },
  { id: "bougerv-yuma-100w-punched", brand: "BougeRV", model: "Yuma 100W flexible (perforé, ISE152)", componentType: "solar-panel", defaults: { panelStyle: "flexible", powerW: 100, voltage: 24, operatingCurrentA: 4.21, shortCircuitCurrentA: 4.71, vocVoltage: 30.5, vocTemperatureCoeffPctPerC: -0.28 }, iconPro: "/schema-icons/pro/brand/bougerv-200w-flexible.webp" },
  // Gamme EcoWorthy actuellement referencee par le constructeur :
  // https://www.eco-worthy.com/collections/solar-panels
  // 195W : https://www.eco-worthy.com/products/eco-worthy-195w-n-type-18bb-bifacial-solar-panel-with-25-high-conversion-efficiency-ideal-for-rv-boat-roof-farm-home-off-grid-applications
  // 200W flexible : https://www.eco-worthy.com/products/eco-worthy-200w-flexible-hjt-solar-panels-18v-etfe-18bb
  // 590W : https://www.eco-worthy.com/products/eco-worthy-590w-solar-panels-n-type-bifacial-half-cut-solar-panel-monocrystalline-23-23-high-conversion-efficiency-for-homes-roof-top-rv-boat
  // Les bornes hautes de Isc et Voc du 590W sont retenues pour ne pas
  // sous-dimensionner une chaine dont la fiche publie une plage de valeurs.
  { id: "ecoworthy-195w-bifacial", brand: "EcoWorthy", model: "195W N-Type 18BB bifacial", componentType: "solar-panel", defaults: { powerW: 195, voltage: 20.2, operatingCurrentA: 9.65, shortCircuitCurrentA: 11.6, vocVoltage: 21.2, vocTemperatureCoeffPctPerC: -0.38 }, iconPro: "/schema-icons/pro/brand/ecoworthy-200w-rigid.webp" },
  { id: "ecoworthy-200w-flexible-hjt", brand: "EcoWorthy", model: "200W flexible HJT ETFE 18BB", componentType: "solar-panel", defaults: { powerW: 200, voltage: 25.1, operatingCurrentA: 7.97, shortCircuitCurrentA: 8.21, vocVoltage: 29.1 } },
  { id: "ecoworthy-590w-bifacial", brand: "EcoWorthy", model: "590W N-Type bifacial", componentType: "solar-panel", defaults: { powerW: 590, voltage: 43.2, operatingCurrentA: 13.36, shortCircuitCurrentA: 14.46, vocVoltage: 53.41 } },

  // MPPT — tension PV maximale, Isc PV maximale et puissance PV nominale
  // relevées dans les fiches constructeur. Les trois valeurs sont
  // indépendantes : le courant de charge batterie ne suffit pas à valider
  // l'entrée PV ni à calculer une section de câble solaire.
  // Sources :
  // https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_75-10_up_to_100-20/en/technical-specifications.html
  // https://www.victronenergy.com/upload/documents/Datasheet-SmartSolar-charge-controller-MPPT-100-30-%26-100-50-EN.pdf
  // https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_150-35__150-45/en/technical-specifications.html
  { id: "victron-smartsolar-75-10", brand: "Victron", model: "SmartSolar MPPT 75/10", componentType: "mppt", defaults: { amperage: 10, systemVoltage: 12, maxPvVoltage: 75, maxPvInputCurrentA: 10, maxPvPower12V: 145, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-75-15.png" },
  { id: "victron-smartsolar-75-15", brand: "Victron", model: "SmartSolar MPPT 75/15", componentType: "mppt", defaults: { amperage: 15, systemVoltage: 12, maxPvVoltage: 75, maxPvInputCurrentA: 15, maxPvPower12V: 220, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-75-15.png" },
  { id: "victron-smartsolar-100-15", brand: "Victron", model: "SmartSolar MPPT 100/15", componentType: "mppt", defaults: { amperage: 15, systemVoltage: 12, maxPvVoltage: 100, maxPvInputCurrentA: 15, maxPvPower12V: 220, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-75-15.png" },
  { id: "victron-bluesolar-100-15", brand: "Victron", model: "BlueSolar MPPT 100/15", componentType: "mppt", defaults: { amperage: 15, systemVoltage: 12, maxPvVoltage: 100, maxPvInputCurrentA: 15, maxPvPower12V: 220, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-bluesolar-100-15.webp" },
  { id: "victron-smartsolar-100-20", brand: "Victron", model: "SmartSolar MPPT 100/20", componentType: "mppt", defaults: { amperage: 20, systemVoltage: 12, maxPvVoltage: 100, maxPvInputCurrentA: 20, maxPvPower12V: 290, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-100-20.png" },
  { id: "victron-smartsolar-100-30", brand: "Victron", model: "SmartSolar MPPT 100/30", componentType: "mppt", defaults: { amperage: 30, systemVoltage: 12, maxPvVoltage: 100, maxPvInputCurrentA: 35, maxPvPower12V: 440, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-100-30.png" },
  { id: "victron-smartsolar-100-50", brand: "Victron", model: "SmartSolar MPPT 100/50", componentType: "mppt", defaults: { amperage: 50, systemVoltage: 12, maxPvVoltage: 100, maxPvInputCurrentA: 60, maxPvPower12V: 700, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-100-50.png" },
  { id: "victron-smartsolar-150-35", brand: "Victron", model: "SmartSolar MPPT 150/35", componentType: "mppt", defaults: { amperage: 35, systemVoltage: 12, maxPvVoltage: 150, maxPvInputCurrentA: 35, maxPvPower12V: 500, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-150-35.png" },
  { id: "victron-smartsolar-150-45", brand: "Victron", model: "SmartSolar MPPT 150/45", componentType: "mppt", defaults: { amperage: 45, systemVoltage: 12, maxPvVoltage: 150, maxPvInputCurrentA: 45, maxPvPower12V: 650, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartsolar-150-35.png" },
  // Gamme Rover actuellement referencee par Renogy. Sources :
  // https://www.renogy.com/collections/all-products/products/rover-li-20-amp-mppt-solar-charge-controller
  // https://www.renogy.com/products/rover-li-40-amp-mppt-solar-charge-controller
  // https://ca.renogy.com/collections/charge-controllers/products/rover-60-amp-mppt-solar-charge-controller
  // Le courant Isc PV n'est pas publie pour ces modeles : aucune valeur ne
  // doit etre deduite du courant de charge batterie.
  { id: "renogy-rover-20a", brand: "Renogy", model: "Rover 20A", componentType: "mppt", defaults: { amperage: 20, systemVoltage: 12, maxPvVoltage: 95, maxPvPower12V: 260 }, iconPro: "/schema-icons/pro/brand/renogy-rover-20a.webp" },
  { id: "renogy-rover-40a", brand: "Renogy", model: "Rover 40A", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12, maxPvVoltage: 100, maxPvInputCurrentA: 50, maxPvPower12V: 520 }, iconPro: "/schema-icons/pro/brand/renogy-rover-40a.webp" },
  // Seuil d'alarme surtension du manuel officiel (dommage permanent annoncé
  // à partir de 150V) — retenu plutôt que la tension nominale d'entrée pour
  // rester du côté sécurité de la vérification.
  { id: "renogy-rover-60a", brand: "Renogy", model: "Rover 60A", componentType: "mppt", defaults: { amperage: 60, systemVoltage: 12, maxPvVoltage: 140, maxPvPower12V: 800 }, iconPro: "/schema-icons/pro/brand/renogy-rover-60a.webp" },
  { id: "renogy-rover-elite-40a", brand: "Renogy", model: "Rover Elite 40A", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12, maxPvVoltage: 100, maxPvPower12V: 520 } },
  // Sources EcoWorthy :
  // https://www.eco-worthy.com/products/40a-mppt-oled-display-solar-charge-controller-regulator-12v-24v-autoswitch
  // https://www.eco-worthy.com/products/60a-12-24-36-48v-mppt-oled-display-solar-charge-controller-regulator
  // Le constructeur ne publie pas le courant PV admissible pour ces deux
  // references : la verification Isc reste donc volontairement en alerte
  // legere plutot que de supposer que le courant de charge est une limite PV.
  { id: "ecoworthy-mppt-40a", brand: "EcoWorthy", model: "MPPT OLED 40A 12/24V", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12, maxPvVoltage: 100, maxPvPower12V: 560 }, iconPro: "/schema-icons/pro/brand/ecoworthy-mppt-40a.webp" },
  { id: "ecoworthy-mppt-60a", brand: "EcoWorthy", model: "MPPT OLED 60A 12/24/36/48V", componentType: "mppt", defaults: { amperage: 60, systemVoltage: 12, maxPvVoltage: 150, maxPvPower12V: 780 }, iconPro: "/schema-icons/pro/brand/ecoworthy-mppt-40a.webp" },
  // BougeRV SunFlow MPPT, specifications constructeur communiquees depuis :
  // https://support.bougerv.com/mppt-2/mppt-3/
  // La protection PV intervient a 95 V (reprise a 90 V), donc 95 V est la
  // limite utilisee par l'alerte. La limite de courant PV n'est pas publiee:
  // ne pas la deduire du courant de charge batterie.
  { id: "bougerv-sunflow-mppt-30a", brand: "BougeRV", model: "SunFlow MPPT 30A (ISE217)", componentType: "mppt", defaults: { amperage: 30, systemVoltage: 12, maxPvVoltage: 95, maxPvPower12V: 450 } },
  { id: "bougerv-sunflow-mppt-40a", brand: "BougeRV", model: "SunFlow MPPT 40A (ISE218)", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12, maxPvVoltage: 95, maxPvPower12V: 600 } },
  { id: "bougerv-sunflow-mppt-60a", brand: "BougeRV", model: "SunFlow MPPT 60A (ISE219)", componentType: "mppt", defaults: { amperage: 60, systemVoltage: 12, maxPvVoltage: 95, maxPvPower12V: 900 } },
  // Marque chinoise très vendue (Amazon), gamme Tracer — même boîtier
  // décliné sur tout le calibrage, un seul visuel réutilisé sur les 4.
  // Les tensions 100 V a Tmin / 92 V a 25 C sont donnees par la fiche;
  // 92 V est retenu comme seuil de controle conservateur.
  // Source EPEVER : https://www.epsolarpv.com/upload/cert/file/1811/Tracer-AN-SMS-EL-V1.0.pdf
  // Les valeurs Isc PV ne sont pas publiees; elles ne sont donc pas deduites
  // du courant de charge pour ne pas produire de faux controles.
  { id: "epever-tracer-10a", brand: "EPEVER", model: "Tracer 1210AN 10A", componentType: "mppt", defaults: { amperage: 10, systemVoltage: 12, maxPvVoltage: 92, maxPvPower12V: 130 }, iconPro: "/schema-icons/pro/brand/epever-mppt.webp" },
  { id: "epever-tracer-20a", brand: "EPEVER", model: "Tracer 2210AN 20A", componentType: "mppt", defaults: { amperage: 20, systemVoltage: 12, maxPvVoltage: 92, maxPvPower12V: 260 }, iconPro: "/schema-icons/pro/brand/epever-mppt.webp" },
  { id: "epever-tracer-30a", brand: "EPEVER", model: "Tracer 3210AN 30A", componentType: "mppt", defaults: { amperage: 30, systemVoltage: 12, maxPvVoltage: 92, maxPvPower12V: 390 }, iconPro: "/schema-icons/pro/brand/epever-mppt.webp" },
  { id: "epever-tracer-40a", brand: "EPEVER", model: "Tracer 4210AN 40A", componentType: "mppt", defaults: { amperage: 40, systemVoltage: 12, maxPvVoltage: 92, maxPvPower12V: 520 }, iconPro: "/schema-icons/pro/brand/epever-mppt.webp" },
  // Gamme solaire Mastervolt actuelle :
  // https://www.mastervolt.com/products/solar-charge-controllers/
  // Les courants PV sont les limites Impp constructeur, distinctes du
  // courant de charge batterie et donc utilisees par le controle des strings.
  { id: "mastervolt-mppt-scm25", brand: "Mastervolt", model: "SCM25 MPPT", componentType: "mppt", defaults: { amperage: 25, systemVoltage: 12, maxPvVoltage: 75, maxPvInputCurrentA: 18, maxPvPower12V: 360 }, iconPro: "/schema-icons/pro/brand/mastervolt-mppt-scm25.jpg" },
  { id: "mastervolt-mppt-scm60", brand: "Mastervolt", model: "SCM60 MPPT-MB", componentType: "mppt", defaults: { amperage: 60, systemVoltage: 12, maxPvVoltage: 145, maxPvInputCurrentA: 50, maxPvPower12V: 900 }, iconPro: "/schema-icons/pro/brand/mastervolt-mppt-scm25.jpg" },

  // PWM (retour utilisateur : "chaque item détaillé pareil" — 0 modèle
  // jusqu'ici alors que le MPPT, son jumeau, en a 10). maxPvVoltage : les
  // fiches PWM annoncent une tension max côté 24V (le panneau) distincte de
  // la tension système — Victron/Mastervolt partagent le même firmware/
  // fiche (28V en 12V, 55V en 24V), valeur 24V retenue par défaut.
  { id: "victron-bluesolar-pwm-12-20", brand: "Victron", model: "BlueSolar PWM-Pro 12/24V-20A", componentType: "pwm", defaults: { amperage: 20, systemVoltage: 12, maxPvVoltage: 55, communicationPorts: "ve-direct" } , iconPro: "/schema-icons/pro/brand/victron-bluesolar-pwm-12-20.webp" },
  { id: "victron-bluesolar-pwm-12-30", brand: "Victron", model: "BlueSolar PWM-Pro 12/24V-30A", componentType: "pwm", defaults: { amperage: 30, systemVoltage: 12, maxPvVoltage: 55, communicationPorts: "ve-direct" } , iconPro: "/schema-icons/pro/brand/victron-bluesolar-pwm-12-30.webp" },
  // Gamme BougeRV SunFlow PWM actuellement documentee :
  // https://support.bougerv.com/pwm-2/sunflow-pwm-solar-charge-controller/
  { id: "bougerv-sunflow-pwm-10a", brand: "BougeRV", model: "SunFlow PWM 10A (ISE132)", componentType: "pwm", defaults: { amperage: 10, systemVoltage: 12, maxPvVoltage: 55, maxPvPower12V: 150 } },
  { id: "bougerv-sunflow-pwm-20a", brand: "BougeRV", model: "SunFlow PWM 20A (ISE135)", componentType: "pwm", defaults: { amperage: 20, systemVoltage: 12, maxPvVoltage: 55, maxPvPower12V: 300 } },
  { id: "bougerv-sunflow-pwm-30a", brand: "BougeRV", model: "SunFlow PWM 30A (ISE136)", componentType: "pwm", defaults: { amperage: 30, systemVoltage: 12, maxPvVoltage: 55, maxPvPower12V: 450 } },
  { id: "renogy-wanderer-10a", brand: "Renogy", model: "Wanderer 10A", componentType: "pwm", defaults: { amperage: 10, systemVoltage: 12, maxPvVoltage: 50 } , iconPro: "/schema-icons/pro/brand/renogy-wanderer-10a.webp" },
  { id: "renogy-wanderer-30a", brand: "Renogy", model: "Wanderer 30A", componentType: "pwm", defaults: { amperage: 30, systemVoltage: 12, maxPvVoltage: 25 } },
  { id: "renogy-adventurer-30a", brand: "Renogy", model: "Adventurer 30A", componentType: "pwm", defaults: { amperage: 30, systemVoltage: 12, maxPvVoltage: 50 } , iconPro: "/schema-icons/pro/brand/renogy-adventurer-30a.webp" },
  // Sources :
  // https://www.mastervolt.com/products/solar-charge-controllers/scm20-pwm/
  // https://www.mastervolt.com/products/solar-charge-controllers/scm40-pwm/
  { id: "mastervolt-pwm-scm20", brand: "Mastervolt", model: "SCM20 PWM 20A", componentType: "pwm", defaults: { amperage: 20, systemVoltage: 12, maxPvInputCurrentA: 20, maxPvPower12V: 360 }, iconPro: "/schema-icons/pro/brand/mastervolt-pwm-scm20.jpg" },
  { id: "mastervolt-pwm-scm40", brand: "Mastervolt", model: "SCM40 PWM 40A", componentType: "pwm", defaults: { amperage: 40, systemVoltage: 12, maxPvInputCurrentA: 40, maxPvPower12V: 720 }, iconPro: "/schema-icons/pro/brand/mastervolt-pwm-scm20.jpg" },

  // DC-DC
  { id: "victron-orion-tr-9a", brand: "Victron", model: "Orion-Tr 12/12-9A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 9 }, iconPro: "/schema-icons/pro/brand/victron-orion-tr-9a.png" },
  { id: "victron-orion-tr-18a", brand: "Victron", model: "Orion-Tr Smart 12/12-18A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 18 } , iconPro: "/schema-icons/pro/brand/victron-orion-tr-18a.webp" },
  // Photo précédente cassée (rendu quasi blanc, produit illisible) — retour
  // utilisateur : "l'autre est une image blanche".
  { id: "victron-orion-tr-30a", brand: "Victron", model: "Orion-Tr Smart 12/12-30A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 30 }, iconPro: "/schema-icons/pro/brand/victron-orion-tr-30a.jpg" },
  // Non isolé (masse commune, une seule borne −) — sérigraphie du boîtier
  // "IN / GND / OUT", à la différence de l'Orion-Tr Smart (isolé, IN/OUT
  // chacun avec son propre −).
  { id: "victron-orion-xs-12-12-50", brand: "Victron", model: "Orion XS 12/12-50A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 50, topology: "non-isolated", communicationPorts: "ve-direct" } , iconPro: "/schema-icons/pro/brand/victron-orion-xs-12-12-50.webp" },
  // Ajout catalogue Victron 2026 : 70A continu, 1 000W a 14,3V.
  { id: "victron-orion-xs-12-12-70", brand: "Victron", model: "Orion XS 12/12-70A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 70, topology: "non-isolated", communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-orion-xs-12-12-50.webp" },
  { id: "renogy-dcdc-20a-gen2", brand: "Renogy", model: "Chargeur DC-DC 12V/20A (2e gen.)", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 20, topology: "non-isolated" }, iconPro: "/schema-icons/pro/brand/renogy-dcc20s.webp" },
  // Gamme dual-input actuelle, avec MPPT integre :
  // https://www.renogy.com/products/dcc50s-12v-50a-dc-dc-on-board-battery-charger-with-mppt
  { id: "renogy-dcc30s", brand: "Renogy", model: "DC-DC dual-input MPPT 12V/30A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 30, topology: "non-isolated" }, iconPro: "/schema-icons/pro/brand/renogy-dcc30s.webp" },
  { id: "renogy-dcc50s", brand: "Renogy", model: "DC-DC dual-input MPPT 12V/50A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 50, topology: "non-isolated" } , iconPro: "/schema-icons/pro/brand/renogy-dcc50s.webp" },
  { id: "renogy-dcdc-mppt-40a", brand: "Renogy", model: "Chargeur DC-DC 12V/40A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 40, topology: "non-isolated" }, iconPro: "/schema-icons/pro/brand/renogy-dcc50s.webp" },
  // Convertisseur de recharge dédié aux stations AFERIY, et non chargeur
  // auxiliaire 12 V : il élève l'alimentation véhicule vers 48 V. Les deux
  // retours restent donc séparés (entrée véhicule / sortie station).
  // Source constructeur : entrée 12-33 V / 45 A max., sortie 47-49 V /
  // 15 A max., 500 W nominal et 580 W maximum.
  { id: "aferiy-dc060", brand: "AFERIY", model: "DC060 580W", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 48, amperage: 15, topology: "isolated" }, iconPro: "/schema-icons/pro/brand/aferiy-dc060.png" },
  { id: "fossibot-dcdc-50a", brand: "Fossibot", model: "Chargeur DC-DC 50A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 50 }, iconPro: "/schema-icons/pro/brand/fossibot-dcdc-50a.webp" },
  { id: "ecoworthy-dcdc-20a", brand: "EcoWorthy", model: "Chargeur DC-DC MPPT 20A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 20 } , iconPro: "/schema-icons/pro/brand/ecoworthy-dcdc-20a.webp" },
  { id: "ecoworthy-dcdc-40a", brand: "EcoWorthy", model: "Chargeur DC-DC MPPT 40A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 40 } , iconPro: "/schema-icons/pro/brand/ecoworthy-dcdc-40a.webp" },
  // La gamme Cristec DC PowerLine 2026 remplace l'ancienne reference 30 A.
  // https://www.cristec.fr/fr-catalogue-2026-hd/
  { id: "cristec-dc12-12-60pl", brand: "Cristec", model: "DC PowerLine 12/12V-60A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 60 } },
  { id: "cristec-dc12-24-30pl", brand: "Cristec", model: "DC PowerLine 12/24V-30A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 24, amperage: 30 } },
  { id: "cristec-dc12-36-15pl", brand: "Cristec", model: "DC PowerLine 12/36V-15A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 36, amperage: 15 } },
  { id: "cristec-dc12-48-10pl", brand: "Cristec", model: "DC PowerLine 12/48V-10A", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 48, amperage: 10 } },
  { id: "mastervolt-macplus-50a", brand: "Mastervolt", model: "MAC Plus 12/12-50 CZone", componentType: "dcdc", defaults: { voltageIn: 12, voltageOut: 12, amperage: 50 }, iconPro: "/schema-icons/pro/brand/mastervolt-macplus-50a.jpg" },

  // Chargeurs secteur
  // Blue Smart IP22/IP67 actuels: https://www.victronenergy.com/chargers%20/blue-smart-ip22-charger
  // https://www.victronenergy.com/chargers/blue-smart-ip67-charger-waterproof
  { id: "victron-blue-smart-ip22-12-15", brand: "Victron", model: "Blue Smart IP22 12/15", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 15 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip22-20a.webp" },
  { id: "victron-blue-smart-ip22-20a", brand: "Victron", model: "Blue Smart IP22 12/20", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 20 } , iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip22-20a.webp" },
  { id: "victron-blue-smart-ip22-30a", brand: "Victron", model: "Blue Smart IP22 12/30", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 30 } , iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip22-30a.webp" },
  { id: "victron-blue-smart-ip22-24-8", brand: "Victron", model: "Blue Smart IP22 24/8", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 8 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip22-20a.webp" },
  { id: "victron-blue-smart-ip22-24-12", brand: "Victron", model: "Blue Smart IP22 24/12", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 12 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip22-20a.webp" },
  { id: "victron-blue-smart-ip22-24-16", brand: "Victron", model: "Blue Smart IP22 24/16", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 16 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip22-20a.webp" },
  // IP67 : version totalement étanche (vs IP22, résistant aux éclaboussures
  // seulement) — même gamme Blue Smart, boîtier différent.
  { id: "victron-blue-smart-ip67-12-7", brand: "Victron", model: "Blue Smart IP67 12/7", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 7 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip67-12-7.webp" },
  { id: "victron-blue-smart-ip67-12-13", brand: "Victron", model: "Blue Smart IP67 12/13", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 13 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip67-12-7.webp" },
  { id: "victron-blue-smart-ip67-12-17", brand: "Victron", model: "Blue Smart IP67 12/17", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 17 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip67-12-25.webp" },
  { id: "victron-blue-smart-ip67-12-25", brand: "Victron", model: "Blue Smart IP67 12/25", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 25 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip67-12-25.webp" },
  { id: "victron-blue-smart-ip67-24-5", brand: "Victron", model: "Blue Smart IP67 24/5", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 5 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip67-12-7.webp" },
  { id: "victron-blue-smart-ip67-24-8", brand: "Victron", model: "Blue Smart IP67 24/8", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 8 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip67-12-25.webp" },
  { id: "victron-blue-smart-ip67-24-12", brand: "Victron", model: "Blue Smart IP67 24/12", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 12 }, iconPro: "/schema-icons/pro/brand/victron-blue-smart-ip67-12-25.webp" },
  { id: "renogy-onboard-charger-20a", brand: "Renogy", model: "12V 20A On-Board Charger", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 20 }, iconPro: "/schema-icons/pro/brand/renogy-onboard-charger-20a.webp" },
  // Marque française (La Rochelle), référence historique en électronique
  // de bord marine — gamme de chargeurs YPOWER.
  // YPOWER 6e generation: https://www.cristec.fr/chargeurs-de-batteries-ypower/
  { id: "cristec-ypower-12-16", brand: "Cristec", model: "YPOWER 12V/16A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 16 }, iconPro: "/schema-icons/pro/brand/cristec-ypower-12-20.webp" },
  { id: "cristec-ypower-12-25", brand: "Cristec", model: "YPOWER 12V/25A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 25 }, iconPro: "/schema-icons/pro/brand/cristec-ypower-12-20.webp" },
  { id: "cristec-ypower-12-40", brand: "Cristec", model: "YPOWER 12V/40A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 40 }, iconPro: "/schema-icons/pro/brand/cristec-ypower-12-30.webp" },
  { id: "cristec-ypower-12-60", brand: "Cristec", model: "YPOWER 12V/60A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 60 }, iconPro: "/schema-icons/pro/brand/cristec-ypower-12-30.webp" },
  { id: "cristec-ypower-24-12", brand: "Cristec", model: "YPOWER 24V/12A", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 12 }, iconPro: "/schema-icons/pro/brand/cristec-ypower-12-20.webp" },
  { id: "cristec-ypower-24-20", brand: "Cristec", model: "YPOWER 24V/20A", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 20 }, iconPro: "/schema-icons/pro/brand/cristec-ypower-12-20.webp" },
  { id: "cristec-ypower-24-30", brand: "Cristec", model: "YPOWER 24V/30A", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 30 }, iconPro: "/schema-icons/pro/brand/cristec-ypower-12-30.webp" },
  // Dolphin Premium actuelle: https://www.dolphin-charger.com/products/premium-series
  { id: "dolphin-premium-12-10", brand: "Dolphin", model: "Premium 12V/10A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 10 }, iconPro: "/schema-icons/pro/brand/dolphin-premium-60a.jpg" },
  { id: "dolphin-premium-12-15", brand: "Dolphin", model: "Premium 12V/15A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 15 }, iconPro: "/schema-icons/pro/brand/dolphin-premium-60a.jpg" },
  { id: "dolphin-premium-12-25", brand: "Dolphin", model: "Premium 12V/25A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 25 }, iconPro: "/schema-icons/pro/brand/dolphin-premium-60a.jpg" },
  { id: "dolphin-premium-12-40", brand: "Dolphin", model: "Premium 12V/40A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 40 }, iconPro: "/schema-icons/pro/brand/dolphin-premium-60a.jpg" },
  { id: "dolphin-premium-60a", brand: "Dolphin", model: "Premium 12V/60A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 60 }, iconPro: "/schema-icons/pro/brand/dolphin-premium-60a.jpg" },
  { id: "dolphin-premium-24-20", brand: "Dolphin", model: "Premium 24V/20A", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 20 }, iconPro: "/schema-icons/pro/brand/dolphin-premium-60a.jpg" },
  { id: "dolphin-premium-24-30", brand: "Dolphin", model: "Premium 24V/30A", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 30 }, iconPro: "/schema-icons/pro/brand/dolphin-premium-60a.jpg" },
  { id: "dolphin-prolite-25a", brand: "Dolphin", model: "ProLite 12V/25A (3 sorties)", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 25 }, iconPro: "/schema-icons/pro/brand/dolphin-prolite-25a.jpg" },
  // ChargeMaster Plus remplace progressivement l'ancien ChargeMaster.
  // https://www.mastervolt.com/products/chargemaster-plus/chargemaster-plus-12-50-3/
  { id: "mastervolt-chargemaster-plus-12-35", brand: "Mastervolt", model: "ChargeMaster Plus 12V/35A (3 sorties)", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 35 }, iconPro: "/schema-icons/pro/brand/mastervolt-chargemaster-25a.jpg" },
  { id: "mastervolt-chargemaster-plus-12-50", brand: "Mastervolt", model: "ChargeMaster Plus 12V/50A (3 sorties)", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 50 }, iconPro: "/schema-icons/pro/brand/mastervolt-chargemaster-25a.jpg" },
  { id: "mastervolt-chargemaster-plus-12-75", brand: "Mastervolt", model: "ChargeMaster Plus 12V/75A (3 sorties)", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 75 }, iconPro: "/schema-icons/pro/brand/mastervolt-chargemaster-25a.jpg" },
  { id: "mastervolt-chargemaster-plus-24-20", brand: "Mastervolt", model: "ChargeMaster Plus 24V/20A (3 sorties)", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 20 }, iconPro: "/schema-icons/pro/brand/mastervolt-chargemaster-25a.jpg" },
  { id: "mastervolt-chargemaster-plus-24-30", brand: "Mastervolt", model: "ChargeMaster Plus 24V/30A (3 sorties)", componentType: "ac-charger", defaults: { voltageDC: 24, chargeAmperage: 30 }, iconPro: "/schema-icons/pro/brand/mastervolt-chargemaster-25a.jpg" },
  { id: "mastervolt-easycharge-10a", brand: "Mastervolt", model: "EasyCharge 12V/10A (2 sorties)", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 10 }, iconPro: "/schema-icons/pro/brand/mastervolt-easycharge-10a.jpg" },
  { id: "mastervolt-easycharge-6a", brand: "Mastervolt", model: "EasyCharge 12V/6A", componentType: "ac-charger", defaults: { voltageDC: 12, chargeAmperage: 6 }, iconPro: "/schema-icons/pro/brand/mastervolt-easycharge-6a.jpg" },

  // Prise de quai (retour bêta, 3e testeur : "impossible d'ajouter une
  // prise P17" — connecteur caravane/camping bleu 16A/230V normalisé).
  { id: "p17-16a", brand: "Générique", model: "Prise P17 16A/230V", componentType: "shore-power", defaults: {}, iconPro: "/schema-icons/pro/brand/victron-p17-shore-power.webp" },
  // Le champ "Nom" de "Prise de quai" invite déjà explicitement le groupe
  // électrogène ("Réseau, borne de quai, groupe électrogène…") — un
  // générateur portable est électriquement une source secteur au même
  // titre qu'une vraie prise de quai.
  { id: "honda-eu32i-generator", brand: "Honda", model: "EU32i 3200W", componentType: "shore-power", defaults: {}, iconPro: "/schema-icons/pro/brand/honda-eu32i-generator.jpg" },
  { id: "philippi-lae-shore-power", brand: "Philippi", model: "Coffret de quai LAE 100/110", componentType: "shore-power", defaults: {}, iconPro: "/schema-icons/pro/brand/philippi-lae-shore-power.jpg" },
  // Interrupteur dédié WC (retour bêta : icône fournie) — même forme que
  // l'interrupteur générique, juste un visuel reconnaissable.
  { id: "interrupteur-toilette", brand: "Générique", model: "Interrupteur toilette", componentType: "switch", defaults: {}, iconPro: "/schema-icons/pro/brand/interrupteur-toilette.webp" },
  { id: "sterling-3way-switch-16a", brand: "Sterling", model: "Inverseur manuel 3 positions 16A", componentType: "switch", defaults: { poles: "3-positions", amperage: 16 }, iconPro: "/schema-icons/pro/brand/sterling-3way-switch-16a.jpg" },

  // Onduleurs purs
  // Phoenix VE.Direct : le nom produit est en VA, alors que `powerW` alimente
  // le moteur de dimensionnement. On retient donc la puissance continue en W
  // à 25 °C publiée par Victron, pas le nombre VA du nom commercial.
  // https://www.victronenergy.com/upload/documents/Datasheet-Inverter-VE.Direct-250VA-1600VA-EN.pdf
  { id: "victron-phoenix-250", brand: "Victron", model: "Phoenix Inverter VE.Direct 12/250 VA", componentType: "inverter", defaults: { powerW: 250, voltageDC: 12, communicationPorts: "ve-direct" } },
  { id: "victron-phoenix-375", brand: "Victron", model: "Phoenix Inverter VE.Direct 12/375 VA", componentType: "inverter", defaults: { powerW: 375, voltageDC: 12, communicationPorts: "ve-direct" } },
  { id: "victron-phoenix-500", brand: "Victron", model: "Phoenix Inverter VE.Direct 12/500 VA", componentType: "inverter", defaults: { powerW: 450, voltageDC: 12, communicationPorts: "ve-direct" } , iconPro: "/schema-icons/pro/brand/victron-phoenix-500.webp" },
  { id: "victron-phoenix-800", brand: "Victron", model: "Phoenix Inverter VE.Direct 12/800 VA", componentType: "inverter", defaults: { powerW: 800, voltageDC: 12, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-phoenix-800.png" },
  { id: "victron-phoenix-1200", brand: "Victron", model: "Phoenix Inverter VE.Direct 12/1200 VA", componentType: "inverter", defaults: { powerW: 1150, voltageDC: 12, communicationPorts: "ve-direct" } , iconPro: "/schema-icons/pro/brand/victron-phoenix-1200.webp" },
  { id: "victron-phoenix-1600", brand: "Victron", model: "Phoenix Inverter VE.Direct 12/1600 VA", componentType: "inverter", defaults: { powerW: 1450, voltageDC: 12, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-phoenix-1600.webp" },
  // Gamme Inverter Smart actuelle, distincte des Phoenix VE.Direct.
  // https://www.victronenergy.com/media/pg/Inverter_Smart/en/technical-specifications.html
  { id: "victron-inverter-smart-1600", brand: "Victron", model: "Inverter Smart 12/1600 VA", componentType: "inverter", defaults: { powerW: 1300, voltageDC: 12, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-phoenix-1600.webp" },
  { id: "victron-inverter-smart-2000", brand: "Victron", model: "Inverter Smart 12/2000 VA", componentType: "inverter", defaults: { powerW: 1600, voltageDC: 12, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-phoenix-1600.webp" },
  { id: "victron-inverter-smart-3000", brand: "Victron", model: "Inverter Smart 12/3000 VA", componentType: "inverter", defaults: { powerW: 2400, voltageDC: 12, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-phoenix-1600.webp" },
  { id: "renogy-inverter-1000w", brand: "Renogy", model: "1000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 1000, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/renogy-inverter-1000w.webp" },
  { id: "renogy-inverter-2000w", brand: "Renogy", model: "2000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 2000, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/renogy-inverter-2000w.webp" },
  // https://www.renogy.com/products/3000w-12v-pure-sine-wave-inverter
  { id: "renogy-inverter-3000w", brand: "Renogy", model: "3000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 3000, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/renogy-inverter-2000w.webp" },
  { id: "ecoworthy-inverter-1000w", brand: "EcoWorthy", model: "1000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 1000, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/ecoworthy-inverter-1000w.webp" },
  { id: "ecoworthy-inverter-2000w", brand: "EcoWorthy", model: "2000W Pure Sine Wave", componentType: "inverter", defaults: { powerW: 2000, voltageDC: 12 } , iconPro: "/schema-icons/pro/brand/ecoworthy-inverter-2000w.webp" },
  { id: "generique-inverter-2000w", brand: "Générique", model: "Onduleur 2000W 12V/230V", componentType: "inverter", defaults: { powerW: 2000, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/generique-inverter-2000w.webp" },
  { id: "mastervolt-ac-master-300w", brand: "Mastervolt", model: "AC Master 12V/300W", componentType: "inverter", defaults: { powerW: 300, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/mastervolt-ac-master-300w.jpg" },
  { id: "mastervolt-ac-master-500w", brand: "Mastervolt", model: "AC Master 12V/500W", componentType: "inverter", defaults: { powerW: 500, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/mastervolt-ac-master-300w.jpg" },
  { id: "mastervolt-ac-master-700w", brand: "Mastervolt", model: "AC Master 12V/700W", componentType: "inverter", defaults: { powerW: 700, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/mastervolt-ac-master-700w.jpg" },
  { id: "mastervolt-ac-master-1000w", brand: "Mastervolt", model: "AC Master 12V/1000W", componentType: "inverter", defaults: { powerW: 1000, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/mastervolt-ac-master-700w.jpg" },
  { id: "mastervolt-ac-master-1500w", brand: "Mastervolt", model: "AC Master 12V/1500W", componentType: "inverter", defaults: { powerW: 1500, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/mastervolt-ac-master-1500w.jpg" },
  { id: "mastervolt-ac-master-2000w", brand: "Mastervolt", model: "AC Master 12V/2000W", componentType: "inverter", defaults: { powerW: 2000, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/mastervolt-ac-master-1500w.jpg" },
  // https://www.mastervolt.com/products/ac-master-12v/ac-master-12-500-iec-230-v1/
  { id: "mastervolt-ac-master-2500w", brand: "Mastervolt", model: "AC Master 12V/2500W", componentType: "inverter", defaults: { powerW: 2500, voltageDC: 12 }, iconPro: "/schema-icons/pro/brand/mastervolt-ac-master-1500w.jpg" },

  // Convertisseurs-chargeurs
  // Puissance continue 230 V, pas la valeur apparente (VA) du nom MultiPlus.
  // https://www.victronenergy.com/upload/documents/Brochure-Self-Consumption-%26-Energy-Storage_EN_WEB_2026-02.pdf
  { id: "victron-multiplus-500-20", brand: "Victron", model: "MultiPlus 12/500 VA/20A", componentType: "inverter-charger", defaults: { powerW: 430, voltageDC: 12, chargeAmperage: 20, communicationPorts: "ve-bus" }, iconPro: "/schema-icons/pro/brand/victron-multiplus-500-20.webp" },
  { id: "victron-multiplus-800-35", brand: "Victron", model: "MultiPlus 12/800 VA/35A", componentType: "inverter-charger", defaults: { powerW: 700, voltageDC: 12, chargeAmperage: 35, communicationPorts: "ve-bus" }, iconPro: "/schema-icons/pro/brand/victron-multiplus-800-35.webp" },
  { id: "victron-multiplus-1200-50", brand: "Victron", model: "MultiPlus 12/1200 VA/50A", componentType: "inverter-charger", defaults: { powerW: 1000, voltageDC: 12, chargeAmperage: 50, communicationPorts: "ve-bus" }, iconPro: "/schema-icons/pro/brand/victron-multiplus-1200-50.webp" },
  { id: "victron-multiplus-1600-70", brand: "Victron", model: "MultiPlus 12/1600 VA/70A", componentType: "inverter-charger", defaults: { powerW: 1300, voltageDC: 12, chargeAmperage: 70, communicationPorts: "ve-bus" }, iconPro: "/schema-icons/pro/brand/victron-multiplus-1600-70.webp" },
  // Compact : même puissance que le 1600/70 ci-dessus, boîtier plus réduit
  // (encombrement moindre) — gamme distincte chez Victron, pas un doublon.
  { id: "victron-multiplus-compact-1600-70", brand: "Victron", model: "MultiPlus Compact 12/1600 VA/70A", componentType: "inverter-charger", defaults: { powerW: 1300, voltageDC: 12, chargeAmperage: 70, communicationPorts: "ve-bus" }, iconPro: "/schema-icons/pro/brand/victron-multiplus-compact-1600-70.webp" },
  // https://www.victronenergy.com/media/pg/MultiPlus_2kVA_230V/en/technical-data-2kva.html
  { id: "victron-multiplus-12-2000-80", brand: "Victron", model: "MultiPlus 12/2000 VA/80A", componentType: "inverter-charger", defaults: { powerW: 1600, voltageDC: 12, chargeAmperage: 80, communicationPorts: "ve-bus" }, iconPro: "/schema-icons/pro/brand/victron-multiplus-1600-70.webp" },
  { id: "victron-multiplus-ii-24-3000-70", brand: "Victron", model: "MultiPlus-II GX 24/3000 VA/70A", componentType: "inverter-charger", defaults: { powerW: 2400, voltageDC: 24, chargeAmperage: 70, communicationPorts: "ve-bus" }, iconPro: "/schema-icons/pro/brand/victron-multiplus-ii-24-3000-70.webp" },
  // Retour bêta (3e testeur) : "ne trouve pas comment ajouter un Multiplus
  // II 12/3000VA".
  { id: "victron-multiplus-ii-12-3000-120", brand: "Victron", model: "MultiPlus-II 12/3000 VA/120A-32", componentType: "inverter-charger", defaults: { powerW: 2400, voltageDC: 12, chargeAmperage: 120, communicationPorts: "ve-bus" }, iconPro: "/schema-icons/pro/brand/victron-multiplus-ii-12-3000-120.webp" },
  { id: "victron-multiplus-3000-120", brand: "Victron", model: "MultiPlus 12/3000 VA/120A", componentType: "inverter-charger", defaults: { powerW: 2400, voltageDC: 12, chargeAmperage: 120, communicationPorts: "ve-bus" }, iconPro: "/schema-icons/pro/brand/victron-multiplus-3000-120.png" },
  { id: "creabest-inverter-charger-2000w", brand: "Creabest", model: "Inverter Charger 2000W 12V-230V/80A", componentType: "inverter-charger", defaults: { powerW: 2000, voltageDC: 12, chargeAmperage: 80 }, iconPro: "/schema-icons/pro/brand/creabest-inverter-charger-2000w.webp" },
  { id: "mastervolt-combimaster-2000va", brand: "Mastervolt", model: "CombiMaster 12V/2000 VA/60A", componentType: "inverter-charger", defaults: { powerW: 1600, voltageDC: 12, chargeAmperage: 60 }, iconPro: "/schema-icons/pro/brand/mastervolt-combimaster-2000va.jpg" },
  { id: "mastervolt-masscombi-3000w", brand: "Mastervolt", model: "Mass Combi Ultra 12V/3000W/150A", componentType: "inverter-charger", defaults: { powerW: 3000, voltageDC: 12, chargeAmperage: 150 }, iconPro: "/schema-icons/pro/brand/mastervolt-masscombi-3000w.jpg" },

  // Stations "tout-en-1" — plusieurs marques concurrentes sur le même
  // segment produit, pas seulement Fossibot.
  { id: "fossibot-f1200", brand: "Fossibot", model: "F1200", componentType: "power-station", defaults: { powerW: 1200, capacityWh: 1024 }, iconPro: "/schema-icons/pro/brand/fossibot-f1200.webp" },
  { id: "fossibot-f2400", brand: "Fossibot", model: "F2400", componentType: "power-station", defaults: { powerW: 2400, capacityWh: 2048 }, iconPro: "/schema-icons/pro/brand/fossibot-f2400.webp" },
  // 2400W / 3014,4Wh lus directement sur l'écran du boîtier (visuel
  // fourni), pas une estimation.
  { id: "bluetti-elite-300", brand: "Bluetti", model: "Elite 300", componentType: "power-station", defaults: { powerW: 2400, capacityWh: 3014.4 }, iconPro: "/schema-icons/pro/brand/bluetti-elite-300.webp" },
  { id: "ecoflow-delta-3", brand: "EcoFlow", model: "Delta 3", componentType: "power-station", defaults: { powerW: 1600, capacityWh: 1024 }, iconPro: "/schema-icons/pro/brand/ecoflow-delta-3.webp" },
  { id: "aferiy-p280", brand: "AFERIY", model: "P280", componentType: "power-station", defaults: { powerW: 2800, capacityWh: 2048, connectorLayout: "dual-xt90-xt60" }, iconPro: "/schema-icons/pro/brand/aferiy-p280.webp" },

  // Shunt / monitoring — retour utilisateur : "ce que tu as maintenant en
  // item ce sont les écrans d'affichage et non le shunt en lui-même... dans
  // un kit BMV il y a le shunt + affichage". Les entrées "shunt" utilisaient
  // à tort la photo de l'écran ; le boîtier shunt est physiquement identique
  // sur toute la gamme BMV-700/702/712 (même pièce Victron), donc une seule
  // photo partagée. Les vraies photos d'écran ont été redéployées sur des
  // entrées "system-monitor" dédiées ci-dessous, reliées automatiquement au
  // shunt à la sélection (voir BMV_DISPLAY_SHUNT_IDS dans useSchemaStore.ts).
  { id: "victron-smartshunt-500a", brand: "Victron", model: "SmartShunt 500A", componentType: "shunt", defaults: { amperage: 500, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartshunt-500a.png" },
  { id: "victron-smartshunt-300a", brand: "Victron", model: "SmartShunt 300A", componentType: "shunt", defaults: { amperage: 300, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smartshunt-300a.webp" },
  { id: "victron-bmv-712", brand: "Victron", model: "BMV-712 Smart", componentType: "shunt", defaults: { amperage: 500, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-bmv-shunt.webp" },
  { id: "victron-bmv-702", brand: "Victron", model: "BMV-702", componentType: "shunt", defaults: { amperage: 500, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-bmv-shunt.webp" },
  { id: "victron-bmv-700", brand: "Victron", model: "BMV-700", componentType: "shunt", defaults: { amperage: 500, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-bmv-shunt.webp" },
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
  { id: "mastervolt-batterymate-1602", brand: "Mastervolt", model: "BatteryMate 1602-IG 160A 2 batteries", componentType: "battery-isolator", defaults: { outputCount: 2, amperage: 160 }, iconPro: "/schema-icons/pro/brand/mastervolt-batterymate-1602.jpg" },

  // Boîtes à fusibles génériques (retour bêta : photos fournies) — chaque
  // sortie positive protégée par son propre fusible, plus un bus négatif
  // intégré du même nombre de points ("layout: positive-negative" déjà
  // câblé sur le type "fuse-block" générique).
  { id: "fuse-block-6way", brand: "Générique", model: "Boîte à fusibles 6 circuits 12/24V", componentType: "fuse-block", defaults: { outputCount: 6, layout: "positive-negative" }, iconPro: "/schema-icons/pro/brand/fuse-block-6way.webp" },
  { id: "fuse-block-12way", brand: "Générique", model: "Boîte à fusibles 12 circuits 12/24V", componentType: "fuse-block", defaults: { outputCount: 12, layout: "positive-negative" }, iconPro: "/schema-icons/pro/brand/fuse-block-12way.webp" },

  // Lynx Distributor / Power In / Shunt VE.Can : regroupés dans leur propre
  // famille de composants dédiés (type "lynx-distributor" etc., voir
  // definitions.ts) plutôt qu'en modèles de marque d'un type générique —
  // retour utilisateur : "classe tous les Lynx ensemble dans la famille
  // Lynx" pour les retrouver groupés dans la bibliothèque.

  // Protection basse tension electronique, separee du coupe-batterie manuel.
  { id: "victron-smart-batteryprotect-65a", brand: "Victron", model: "Smart BatteryProtect 12/24V-65A", componentType: "battery-protect", defaults: { amperage: 65, communicationPorts: "ve-direct" } , iconPro: "/schema-icons/pro/brand/victron-smart-batteryprotect-65a.webp" },
  { id: "victron-smart-batteryprotect-100a", brand: "Victron", model: "Smart BatteryProtect 12/24V-100A", componentType: "battery-protect", defaults: { amperage: 100, communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-smart-batteryprotect-100a.png" },
  { id: "victron-smart-batteryprotect-220a", brand: "Victron", model: "Smart BatteryProtect 12/24V-220A", componentType: "battery-protect", defaults: { amperage: 220, communicationPorts: "ve-direct" } , iconPro: "/schema-icons/pro/brand/victron-smart-batteryprotect-220a.webp" },

  // Centrales GX : elles collectent et pilotent le système. Certaines ont
  // un écran intégré (CCGX/Ekrano), mais restent des centrales, pas de
  // simples afficheurs.
  { id: "victron-cerbo-gx", brand: "Victron", model: "Cerbo GX", componentType: "system-controller", defaults: { powerW: 4.8, communicationPorts: "ve-direct:3,ve-bus:2", displayOutput: "gx-touch" }, iconPro: "/schema-icons/pro/brand/victron-cerbo-gx.webp" },
  { id: "victron-cerbo-gx-mk2", brand: "Victron", model: "Cerbo GX MK2", componentType: "system-controller", defaults: { powerW: 5, communicationPorts: "ve-direct:3,ve-bus:2", displayOutput: "gx-touch" }, iconPro: "/schema-icons/pro/brand/victron-cerbo-gx-mk2.jpg" },
  { id: "victron-ccgx", brand: "Victron", model: "Color Control GX", componentType: "system-controller", defaults: { powerW: 5, communicationPorts: "ve-direct:2,ve-bus:2" }, iconPro: "/schema-icons/pro/brand/victron-ccgx.webp" },
  // Venus GX (retour utilisateur : "équivalent au Cerbo") — même rôle de
  // calculateur/hub sans écran, gamme antérieure au Cerbo (pas de WiFi/
  // Bluetooth intégré, davantage d'E/S filaires en façade).
  { id: "victron-venus-gx", brand: "Victron", model: "Venus GX", componentType: "system-controller", defaults: { powerW: 2.6, communicationPorts: "ve-direct,ve-bus", displayOutput: "gx-touch" }, iconPro: "/schema-icons/pro/brand/victron-venus-gx.png" },
  { id: "victron-gx-touch-70", brand: "Victron", model: "GX Touch 70", componentType: "system-monitor", defaults: { connection: "communication-only" }, iconPro: "/schema-icons/pro/brand/victron-gx-touch-70.webp" },
  // GX Touch 50 : même principe que le 70 ci-dessus (retour utilisateur) —
  // écran seul, sans aucune intelligence propre, toujours jumelé à un
  // Cerbo/Venus GX (voir GX_TOUCH_MODEL_IDS dans useSchemaStore.ts).
  { id: "victron-gx-touch-50", brand: "Victron", model: "GX Touch 50", componentType: "system-monitor", defaults: { connection: "communication-only" }, iconPro: "/schema-icons/pro/brand/victron-gx-touch-50.webp" },
  // Ekrano GX (retour utilisateur : "écran tout-en-1") — contrairement aux
  // GX Touch ci-dessus, combine l'écran ET le calculateur GX dans le même
  // boîtier : autonome, ne nécessite pas de Cerbo/Venus séparé.
  { id: "victron-ekrano-gx", brand: "Victron", model: "Ekrano GX", componentType: "system-controller", defaults: { powerW: 7.4, communicationPorts: "ve-direct:3,ve-bus:2" }, iconPro: "/schema-icons/pro/brand/victron-ekrano-gx.webp" },

  // Écran dédié d'un kit BMV (retour utilisateur, voir plus haut) — les
  // vraies photos d'écran, déplacées ici depuis les entrées "shunt". Le
  // 702 réutilise la photo du 712 (même boîtier, retour bêta : "beaucoup
  // ont un 702").
  { id: "victron-bmv-712-display", brand: "Victron", model: "BMV-712 Smart (écran)", componentType: "system-monitor", defaults: { communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-bmv-712.webp" },
  { id: "victron-bmv-702-display", brand: "Victron", model: "BMV-702 (écran)", componentType: "system-monitor", defaults: { communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-bmv-712.webp" },
  { id: "victron-bmv-700-display", brand: "Victron", model: "BMV-700 (écran)", componentType: "system-monitor", defaults: { communicationPorts: "ve-direct" }, iconPro: "/schema-icons/pro/brand/victron-bmv-700.webp" },

  // Connecteur Y MC4 (2 vers 1) : jonction de deux chaînes de panneaux
  // solaires en parallèle — même rôle qu'une "Épissure" générique, juste un
  // visuel reconnaissable pour ce cas d'usage précis.
  { id: "seatec-mc4-y-connector", brand: "Seatec", model: "Connecteur Y MC4 (2 vers 1)", componentType: "splice", defaults: {}, iconPro: "/schema-icons/pro/brand/seatec-mc4-y-connector.jpg" },

  // Isolateur galvanique (protège la coque contre la corrosion galvanique
  // via la terre du 230V de quai) — voir type "galvanic-isolator" dans
  // definitions.ts.
  { id: "sterling-zincsaver-ii", brand: "Sterling", model: "Zinc Saver II", componentType: "galvanic-isolator", defaults: {}, iconPro: "/schema-icons/pro/brand/sterling-zincsaver-ii.jpg" },

  // Éolienne (voir type "wind-turbine" dans definitions.ts).
  { id: "silentwind-pro-420w", brand: "Silent Wind", model: "Wind Generator Pro 12V/420W", componentType: "wind-turbine", defaults: { powerW: 420, voltage: 12 }, iconPro: "/schema-icons/pro/brand/silentwind-pro-420w.jpg" },

  // Pundmann Therm : chauffe-eau électriques à accumulation. Les puissances
  // sont celles des résistances, relevées sur les fiches constructeur :
  // https://www.pundmann.de/mediafiles/Manuals/Pundmann_Therm_Instructions.pdf
  { id: "pundmann-therm-3l-12v", brand: "Pundmann", model: "Therm 3L 12V/180W", componentType: "consumer", defaults: { presetType: "chauffe-eau-12v", supplyType: "12v", powerW: 180 }, iconPro: "/schema-icons/pro/brand/pundmann-therm-12v.jpg" },
  { id: "pundmann-therm-6l-12v", brand: "Pundmann", model: "Therm 6L 12V/200W", componentType: "consumer", defaults: { presetType: "chauffe-eau-12v", supplyType: "12v", powerW: 200 }, iconPro: "/schema-icons/pro/brand/pundmann-therm-12v.jpg" },
  { id: "pundmann-therm-9l-12v", brand: "Pundmann", model: "Therm 9L 12V/200W", componentType: "consumer", defaults: { presetType: "chauffe-eau-12v", supplyType: "12v", powerW: 200 }, iconPro: "/schema-icons/pro/brand/pundmann-therm-12v.jpg" },
  { id: "pundmann-therm-3l-230v", brand: "Pundmann", model: "Therm 3L 230V/250W", componentType: "consumer", defaults: { presetType: "chauffe-eau", supplyType: "230v", powerW: 0, power230VW: 250 }, iconPro: "/schema-icons/pro/brand/pundmann-therm-230v.jpg" },
  { id: "pundmann-therm-6l-230v", brand: "Pundmann", model: "Therm 6L 230V/500W", componentType: "consumer", defaults: { presetType: "chauffe-eau", supplyType: "230v", powerW: 0, power230VW: 500 }, iconPro: "/schema-icons/pro/brand/pundmann-therm-230v.jpg" },
  { id: "pundmann-therm-9l-230v", brand: "Pundmann", model: "Therm 9L 230V/500W", componentType: "consumer", defaults: { presetType: "chauffe-eau", supplyType: "230v", powerW: 0, power230VW: 500 }, iconPro: "/schema-icons/pro/brand/pundmann-therm-230v.jpg" },
  // La double résistance est utilisée alternativement selon Pundmann. La
  // puissance maximale d'un circuit est donc 500 W, pas 700 W. Les deux
  // résistances sont conservées séparément pour le calcul des réseaux DC/AC.
  { id: "pundmann-therm-6l-12v-230v", brand: "Pundmann", model: "Therm 6L double résistance 12V/200W + 230V/500W", componentType: "consumer", defaults: { presetType: "chauffe-eau-mixte-12-220", supplyType: "mixed", powerW: 200, power230VW: 500 }, iconPro: "/schema-icons/pro/brand/pundmann-therm-mixte.jpg" },
];

export function getBrandModelsForType(componentType: string): BrandModel[] {
  return BRAND_MODELS.filter((m) => m.componentType === componentType);
}

export function getBrandModel(id: string): BrandModel | undefined {
  return BRAND_MODELS.find((m) => m.id === id);
}

function normalizedBrand(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Un visuel est choisi par marque ET par famille de composant, pas par
// reference exacte. Ainsi les calibres d'une meme gamme restent clairement
// identifies sans devoir maintenir une image pour chaque reference. Les
// Les entrees Victron ou generiques retombent sur l'illustration de famille
// deja validee dans `newicon`; elle est plus coherente que de choisir une
// photo arbitraire parmi les references Victron.
export function getBrandFamilyIcon(componentType: string, brand?: string): string | undefined {
  const requested = brand ? normalizedBrand(brand) : "";
  if (!requested || requested === "generique" || requested === "victron") return undefined;

  return BRAND_MODELS.find(
    (model) => model.componentType === componentType && normalizedBrand(model.brand) === requested && model.iconPro,
  )?.iconPro;
}
