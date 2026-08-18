import type { ComponentDefinition, ComponentHandleDef, IconStyle } from "@/types/schema";
import { getBrandModel } from "@/lib/electrical-components/brand-models";

// Consommateurs courants à bord (CDC §13 : "peuvent techniquement utiliser
// le même node de base avec une apparence différente" — ici, un préréglage
// qui préremplit nom + puissance typique plutôt qu'un node dédié par type).
// Les puissances sont des ordres de grandeur usuels, à ajuster par
// l'utilisateur — jamais présentées comme une valeur certifiée.
export interface ConsumerPreset {
  value: string;
  label: string;
  typicalPowerW: number;
  icon?: string;
  iconPro?: string;
}

// Les 5 plus courants d'abord (retour utilisateur), puis les autres par
// ordre alphabétique de sujet, et "Au choix" toujours en dernier — renommé
// depuis "Générique" qui ne laissait pas deviner qu'il restait modifiable
// (nom + puissance libres une fois sélectionné).
export const CONSUMER_PRESETS: ConsumerPreset[] = [
  { value: "eclairage-led", label: "Éclairage LED", typicalPowerW: 5, iconPro: "/schema-icons/pro/eclairage-led.webp" },
  { value: "refrigerateur", label: "Réfrigérateur à compression", typicalPowerW: 45, iconPro: "/schema-icons/pro/refrigerateur.webp" },
  { value: "refrigerateur-trimix", label: "Réfrigérateur trimix (12V/230V/gaz)", typicalPowerW: 40, iconPro: "/schema-icons/pro/refrigerateur-trimix.webp" },
  { value: "pompe-eau", label: "Pompe à eau", typicalPowerW: 60, iconPro: "/schema-icons/pro/pompe-eau.webp" },
  // Retour utilisateur : "pompe immergée avec les deux possibilités" — deux
  // références réelles fournies plutôt qu'un seul préréglage générique.
  { value: "pompe-eau-immergee-25l", label: "Pompe à eau immergée 25L/min (type Reich Powerjet)", typicalPowerW: 60, iconPro: "/schema-icons/pro/pompe-eau-immergee-25l.jpg" },
  { value: "pompe-eau-immergee-10l", label: "Pompe à eau immergée 10L/min (type Comet)", typicalPowerW: 20, iconPro: "/schema-icons/pro/pompe-eau-immergee-10l.jpg" },
  { value: "prise-usb-12v", label: "Prise USB / 12 V", typicalPowerW: 15, iconPro: "/schema-icons/pro/prise-usb-12v.webp" },
  { value: "electronique-bord", label: "Électronique de bord (GPS, VHF…)", typicalPowerW: 20, iconPro: "/schema-icons/pro/electronique-bord.webp" },

  { value: "guindeau", label: "Guindeau", typicalPowerW: 800, iconPro: "/schema-icons/pro/guindeau.webp" },
  { value: "pilote-automatique", label: "Pilote automatique", typicalPowerW: 30, iconPro: "/schema-icons/pro/pilote-automatique.webp" },
  { value: "chargeur-telephone", label: "Chargeur téléphone / ordinateur", typicalPowerW: 25, iconPro: "/schema-icons/pro/chargeur-telephone.webp" },
  { value: "chauffe-eau", label: "Chauffe-eau 220V", typicalPowerW: 300, iconPro: "/schema-icons/pro/chauffe-eau.webp" },
  { value: "chauffe-eau-12v", label: "Chauffe-eau 12V (résistance)", typicalPowerW: 120, iconPro: "/schema-icons/pro/chauffe-eau-12v.jpeg" },
  { value: "convertisseur-12-19v", label: "Convertisseur 12V/19V (chargeur PC portable)", typicalPowerW: 90 },
  { value: "chauffage-appoint", label: "Chauffage d'appoint (soufflant 12V)", typicalPowerW: 150 },
  { value: "chauffage-diesel", label: "Chauffage diesel/air 12V (type Webasto, Eberspächer…)", typicalPowerW: 40, iconPro: "/schema-icons/pro/chauffage-diesel.webp" },
  // Truma Eezy : chauffage d'appoint électrique, résistance sur secteur
  // 230V + soufflerie sur 12V — distinct du chauffage diesel ci-dessus (pas
  // le même combustible ni la même alimentation).
  { value: "chauffage-truma", label: "Chauffage d'appoint 12V/230V (type Truma)", typicalPowerW: 900, iconPro: "/schema-icons/pro/chauffage-truma.webp" },
  { value: "climatisation", label: "Climatisation de toit", typicalPowerW: 1500, iconPro: "/schema-icons/pro/climatisation.webp" },
  { value: "ventilateur", label: "Ventilateur de toit", typicalPowerW: 15, iconPro: "/schema-icons/pro/ventilateur.webp" },
  { value: "prise-220v", label: "Prise 220V", typicalPowerW: 500 },

  { value: "generique", label: "Au choix", typicalPowerW: 0 },
];

export function getConsumerPreset(value: string): ConsumerPreset | undefined {
  return CONSUMER_PRESETS.find((p) => p.value === value);
}

// Construit les variantes d'icône du composant "Consommateur" à partir de
// CONSUMER_PRESETS, pour ne pas dupliquer les chemins à deux endroits.
function consumerIconVariants(): Record<string, { icon?: string; iconPro?: string }> {
  const variants: Record<string, { icon?: string; iconPro?: string }> = {};
  for (const preset of CONSUMER_PRESETS) {
    if (preset.icon || preset.iconPro) variants[preset.value] = { icon: preset.icon, iconPro: preset.iconPro };
  }
  return variants;
}

// Composants à nombre de sorties variable (busbar, tableau de distribution,
// platine de fusibles) — retour utilisateur : "possibilité de rajouter des
// points de sortie". Bornes générées à partir de `data.outputCount`, dans
// des bornes raisonnables pour rester lisible sur la vignette.
export const MIN_OUTPUTS = 1;
// Retour bêta : "limitée à 10 fusibles, j'ai 2 boîtes de 12" — plafond
// commun à tous les composants à sorties variables (busbar, tableau de
// distribution, platine de fusibles, répartiteur de charge).
export const MAX_OUTPUTS = 12;
export const DEFAULT_OUTPUTS = 4;

function clampOutputCount(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_OUTPUTS;
  return Math.min(MAX_OUTPUTS, Math.max(MIN_OUTPUTS, n));
}

// Sorties réparties sur les 4 côtés (entrée fixe à gauche, sorties en
// tourniquet droite → bas → haut) — retour utilisateur : "plus simple si on
// veut rajouter des sorties", pour ne jamais surcharger un seul côté quand
// le nombre de sorties augmente.
const OUTPUT_FILL_SIDES: ("right" | "bottom" | "top")[] = ["right", "bottom", "top"];

function variableOutputHandles(data: Record<string, unknown>): ComponentHandleDef[] {
  const count = clampOutputCount(data.outputCount ?? DEFAULT_OUTPUTS);
  const handles: ComponentHandleDef[] = [{ id: "input", label: "IN", kind: "positive", side: "left" }];
  for (let i = 1; i <= count; i++) {
    const side = OUTPUT_FILL_SIDES[(i - 1) % OUTPUT_FILL_SIDES.length];
    handles.push({ id: `out-${i}`, label: String(i), kind: "positive", side });
  }
  return handles;
}

// Busbar réel : une simple barre métallique, tous les points de connexion
// alignés sur la même face (retour utilisateur : "des points de jonction
// tout sur la même face pas sur les quatre côtés" et "pas besoin de IN sur
// un busbar" — contrairement à un tableau de distribution, une barre n'a
// pas d'entrée dédiée, chaque point est équivalent). Les ids `input`/
// `out-N` sont conservés pour ne pas casser les câbles déjà connectés sur
// des schémas existants ; seuls le côté et le libellé changent.
const BUSBAR_SIDE: "right" = "right";

function busbarHandles(data: Record<string, unknown>): ComponentHandleDef[] {
  const count = clampOutputCount(data.outputCount ?? DEFAULT_OUTPUTS);
  const handles: ComponentHandleDef[] = [{ id: "input", label: "1", kind: "positive", side: BUSBAR_SIDE }];
  for (let i = 1; i <= count; i++) {
    handles.push({ id: `out-${i}`, label: String(i + 1), kind: "positive", side: BUSBAR_SIDE });
  }
  return handles;
}

const busbarPointCountField = {
  key: "outputCount",
  label: "Nombre de points de connexion",
  type: "number" as const,
  min: MIN_OUTPUTS,
  max: MAX_OUTPUTS,
  step: 1,
  help: `De ${MIN_OUTPUTS + 1} à ${MAX_OUTPUTS + 1} points au total. Réduire ce nombre supprime les câbles reliés aux points retirés.`,
};

// Disposition d'une vraie platine de fusibles (retour utilisateur : "4
// sorties de chaque côté et une entrée sur un autre côté", d'après la photo
// fournie) : sorties réparties à gauche et à droite, entrée séparée en haut.
function fuseBlockHandles(data: Record<string, unknown>): ComponentHandleDef[] {
  const count = clampOutputCount(data.outputCount ?? DEFAULT_OUTPUTS);
  const rightCount = Math.ceil(count / 2);
  const leftCount = count - rightCount;
  const handles: ComponentHandleDef[] = [{ id: "input", label: "IN", kind: "positive", side: "top" }];
  for (let i = 1; i <= rightCount; i++) {
    handles.push({ id: `out-${i}`, label: String(i), kind: "positive", side: "right" });
  }
  for (let i = 1; i <= leftCount; i++) {
    handles.push({ id: `out-${rightCount + i}`, label: String(rightCount + i), kind: "positive", side: "left" });
  }
  // Retour utilisateur : "platine fusible +/-" puis, en bêta, "la BaF
  // devrait aussi avoir les entrées/sorties des − dessus" — un retour
  // négatif par sortie positive (pas un simple bornier commun unique),
  // pour câbler chaque circuit en +/− directement sur la platine. Côté bas,
  // pour ne jamais se mélanger visuellement aux sorties positives.
  if (data.layout === "positive-negative") {
    for (let i = 1; i <= count; i++) {
      handles.push({ id: `out-${i}-neg`, label: `−${i}`, kind: "negative", side: "bottom" });
    }
  }
  return handles;
}

// Tableau de distribution (retour utilisateur : "deux versions : une avec
// entrée IN, c'est celle avec les fusibles, et une autre sans entrée IN, ce
// sont des interrupteurs donc une entrée 1 et une sortie 1, une entrée 2 et
// une sortie 2 etc.") — la variante "avec fusibles" reste un vrai bus
// (une entrée commune protégée alimente N sorties), tandis que la variante
// "interrupteurs" n'a pas d'entrée commune : chaque interrupteur est un
// circuit indépendant avec sa propre entrée et sa propre sortie, alignées
// à gauche/droite pour rester lisibles.
function distributionPanelHandles(data: Record<string, unknown>): ComponentHandleDef[] {
  if (data.layout === "with-fuses") return variableOutputHandles(data);

  const count = clampOutputCount(data.outputCount ?? DEFAULT_OUTPUTS);
  const handles: ComponentHandleDef[] = [];
  for (let i = 1; i <= count; i++) {
    handles.push({ id: `in-${i}`, label: `IN ${i}`, kind: "positive", side: "left" });
    handles.push({ id: `out-${i}`, label: `OUT ${i}`, kind: "positive", side: "right" });
  }
  return handles;
}

const outputCountField = {
  key: "outputCount",
  label: "Nombre de sorties",
  type: "number" as const,
  min: MIN_OUTPUTS,
  max: MAX_OUTPUTS,
  step: 1,
  help: `De ${MIN_OUTPUTS} à ${MAX_OUTPUTS}. Réduire ce nombre supprime les câbles reliés aux sorties retirées.`,
};

// Bibliothèque de composants (docs/schema/CDC_FabSystem_Schema_V1.md §8-13).
// Architecture centralisée (§45) : un seul rendu générique (ElectricalNode)
// piloté par ces définitions — ajouter un composant ne touche jamais au
// moteur du canvas.
export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    type: "battery",
    label: "Batterie",
    description: "Stocke l'énergie électrique du système.",
    category: "battery",
    subcategory: "batteries",
    subtitle: "Source d'énergie",
    icon: "/schema-icons/battery.svg",
    iconPro: "/schema-icons/pro/battery-lifepo.webp",
    iconVariantField: "technology",
    iconVariants: {
      agm: { iconPro: "/schema-icons/pro/battery-agm.webp" },
      lifepo4: { iconPro: "/schema-icons/pro/battery-lifepo.webp" },
    },
    badge: { field: "capacityAh", unit: "Ah" },
    // Retour utilisateur : "possible d'augmenter la taille de la vignette
    // des batteries" — composant central du schéma, mérite d'être plus
    // visible que la taille par défaut (2 bornes = taille minimale).
    minIconBoxSize: 64,
    handles: [
      { id: "positive", label: "+", kind: "positive", side: "right" },
      { id: "negative", label: "−", kind: "negative", side: "left" },
    ],
    defaultData: { voltage: 12, capacityAh: 100, technology: "lifepo4" },
    fields: [
      { key: "label", label: "Nom", type: "text", help: "Pour la retrouver facilement (ex. \"Batterie servitude\")." },
      {
        key: "technology",
        label: "Technologie",
        type: "select",
        help: "N'influence pas le dessin, juste une info pour vous.",
        options: [
          { value: "plomb", label: "Plomb" },
          { value: "agm", label: "AGM" },
          { value: "gel", label: "GEL" },
          { value: "lead-carbon", label: "Plomb-carbone" },
          { value: "lifepo4", label: "LiFePO4" },
        ],
      },
      { key: "voltage", label: "Tension", type: "number", unit: "V", help: "12 V pour la plupart des installations bateau/van." },
      { key: "capacityAh", label: "Capacité", type: "number", unit: "Ah" },
    ],
  },
  {
    type: "solar-panel",
    label: "Panneau solaire",
    description: "Capte l'énergie du soleil pour recharger les batteries.",
    category: "solar",
    subcategory: "panneaux",
    subtitle: "Production",
    icon: "/schema-icons/solar-panel.svg",
    iconPro: "/schema-icons/pro/solar-panel.webp",
    badge: { field: "powerW", unit: "W" },
    // Retour utilisateur : "rajouter les vignettes PV− et PV+ sur le
    // panneau solaire" — "PV" porte une info utile (photovoltaïque) au-delà
    // de la simple polarité, contrairement à un +/− générique.
    alwaysShowHandleLabels: true,
    handles: [
      { id: "negative", label: "PV−", kind: "negative", side: "left" },
      { id: "positive", label: "PV+", kind: "positive", side: "right" },
    ],
    defaultData: { powerW: 100, voltage: 0 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "powerW", label: "Puissance", type: "number", unit: "W", help: "Puissance crête indiquée sur l'étiquette du panneau — détermine la vitesse de charge et le calibre du régulateur (MPPT/PWM) à choisir." },
      { key: "voltage", label: "Tension", type: "number", unit: "V", help: "Facultatif : 0 si non connue." },
    ],
  },
  {
    type: "mppt",
    label: "Régulateur MPPT",
    description: "Régulateur solaire qui optimise le transfert d'énergie des panneaux vers la batterie.",
    category: "solar",
    subcategory: "regulateurs",
    subtitle: "Charge",
    icon: "/schema-icons/mppt.svg",
    iconPro: "/schema-icons/pro/mppt.webp",
    badge: { field: "amperage", unit: "A" },
    // Retour utilisateur : "augmente la taille des différents boîtiers MPPT,
    // chargeur, DC-DC etc" — même logique que la batterie, plus visible que
    // la taille minimale par défaut (2 bornes/côté).
    minIconBoxSize: 64,
    handles: [
      { id: "pv-negative", label: "PV−", kind: "negative", side: "left" },
      { id: "pv-positive", label: "PV+", kind: "positive", side: "left" },
      { id: "bat-negative", label: "BAT−", kind: "negative", side: "right" },
      { id: "bat-positive", label: "BAT+", kind: "positive", side: "right" },
      { id: "ve-direct", label: "Communication", kind: "neutral", side: "bottom", optional: true },
    ],
    defaultData: { amperage: 20, systemVoltage: 12 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A", help: "Choisi selon la puissance des panneaux branchés (W ÷ tension système ≈ ampérage requis), pas selon les besoins de consommation." },
      { key: "systemVoltage", label: "Tension système", type: "number", unit: "V", help: "La tension de votre batterie (12V le plus souvent) — pas celle des panneaux." },
    ],
  },
  {
    type: "pwm",
    label: "Régulateur PWM",
    description: "Régulateur solaire simple, moins efficace qu'un MPPT mais moins cher.",
    category: "solar",
    subcategory: "regulateurs",
    subtitle: "Charge",
    icon: "/schema-icons/mppt.svg",
    iconPro: "/schema-icons/pro/pwm.webp",
    badge: { field: "amperage", unit: "A" },
    minIconBoxSize: 64,
    handles: [
      { id: "pv-negative", label: "PV−", kind: "negative", side: "left" },
      { id: "pv-positive", label: "PV+", kind: "positive", side: "left" },
      { id: "bat-negative", label: "BAT−", kind: "negative", side: "right" },
      { id: "bat-positive", label: "BAT+", kind: "positive", side: "right" },
    ],
    defaultData: { amperage: 10, systemVoltage: 12 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A", help: "Choisi selon la puissance des panneaux branchés (W ÷ tension système ≈ ampérage requis), pas selon les besoins de consommation." },
      { key: "systemVoltage", label: "Tension système", type: "number", unit: "V", help: "La tension de votre batterie (12V le plus souvent) — pas celle des panneaux." },
    ],
  },
  {
    // Routeur de charge / dérivation (ex. Victron Smart BuckBoost + relais,
    // ou un routeur dédié) : détourne le surplus de production solaire une
    // fois la batterie pleine vers une charge résistive (dump load, ex.
    // ballon d'eau chaude) plutôt que de le perdre. Retour bêta : composant
    // manquant du catalogue.
    type: "solar-router",
    label: "Routeur de charge solaire",
    description: "Envoie le surplus de production solaire vers une charge dédiée (ballon d'eau chaude...) une fois la batterie pleine, au lieu de le perdre.",
    category: "solar",
    subcategory: "regulateurs",
    subtitle: "Dérivation",
    icon: "/schema-icons/mppt.svg",
    handles: [
      { id: "bat-negative", label: "BAT−", kind: "negative", side: "left" },
      { id: "bat-positive", label: "BAT+", kind: "positive", side: "left" },
      { id: "load-negative", label: "CHARGE−", kind: "negative", side: "right" },
      { id: "load-positive", label: "CHARGE+", kind: "positive", side: "right" },
    ],
    defaultData: { amperage: 20, systemVoltage: 12 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A" },
      { key: "systemVoltage", label: "Tension système", type: "number", unit: "V" },
    ],
  },
  {
    type: "dcdc",
    label: "Chargeur DC/DC",
    description: "Charge la batterie auxiliaire depuis l'alternateur du véhicule en roulant.",
    category: "charger",
    subcategory: "dcdc",
    subtitle: "Charge",
    icon: "/schema-icons/dcdc.svg",
    iconPro: "/schema-icons/pro/dcdc.webp",
    badge: { field: "amperage", unit: "A" },
    minIconBoxSize: 64,
    handles: [
      { id: "in-negative", label: "IN−", kind: "negative", side: "left" },
      { id: "in-positive", label: "IN+", kind: "positive", side: "left" },
      { id: "out-negative", label: "OUT−", kind: "negative", side: "right" },
      { id: "out-positive", label: "OUT+", kind: "positive", side: "right" },
    ],
    // Retour utilisateur : "je crois que les [Orion] XS ont une masse
    // commune donc uniquement 3 voies" — confirmé par la sérigraphie du
    // boîtier (IN / GND / OUT) : un convertisseur non isolé partage sa
    // masse entre l'entrée et la sortie (une seule borne −), contrairement
    // à un modèle isolé (type Orion-Tr Smart) qui a un − séparé de chaque
    // côté. Bascule les bornes selon `topology`, réglé par défaut sur les
    // modèles concernés via `BrandModel.defaults` (voir brand-models.ts).
    getHandles: (data) =>
      data.topology === "non-isolated"
        ? [
            { id: "in-positive", label: "IN+", kind: "positive", side: "left" as const },
            { id: "ground", label: "GND", kind: "negative", side: "bottom" as const },
            { id: "out-positive", label: "OUT+", kind: "positive", side: "right" as const },
          ]
        : [
            { id: "in-negative", label: "IN−", kind: "negative", side: "left" as const },
            { id: "in-positive", label: "IN+", kind: "positive", side: "left" as const },
            { id: "out-negative", label: "OUT−", kind: "negative", side: "right" as const },
            { id: "out-positive", label: "OUT+", kind: "positive", side: "right" as const },
          ],
    defaultData: { voltageIn: 12, voltageOut: 12, amperage: 20, topology: "isolated" },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "topology",
        label: "Isolation",
        type: "select",
        help: "Non isolé (masse commune) : une seule borne −, partagée entre l'entrée et la sortie — c'est le cas du Victron Orion XS par exemple. Isolé : entrée et sortie électriquement séparées, chacune avec son propre −.",
        options: [
          { value: "isolated", label: "Isolé" },
          { value: "non-isolated", label: "Non isolé (masse commune)" },
        ],
      },
      { key: "voltageIn", label: "Tension entrée", type: "number", unit: "V" },
      { key: "voltageOut", label: "Tension sortie", type: "number", unit: "V" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A" },
    ],
  },
  {
    type: "ac-charger",
    label: "Chargeur secteur",
    description: "Recharge les batteries sur secteur 230V (quai, groupe électrogène).",
    category: "charger",
    subcategory: "secteur",
    subtitle: "Charge",
    icon: "/schema-icons/ac-charger.svg",
    iconPro: "/schema-icons/pro/ac-charger.webp",
    badge: { field: "chargeAmperage", unit: "A" },
    minIconBoxSize: 64,
    handles: [
      { id: "ac-in", label: "230V IN", kind: "neutral", side: "left" },
      { id: "ac-out", label: "230V OUT", kind: "neutral", side: "left", optional: true },
      { id: "bat-negative", label: "BAT−", kind: "negative", side: "right" },
      { id: "bat-positive", label: "BAT+", kind: "positive", side: "right" },
      { id: "earth", label: "Terre", kind: "earth", side: "bottom" },
    ],
    defaultData: { chargeAmperage: 10 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "chargeAmperage", label: "Courant de charge", type: "number", unit: "A" },
    ],
  },
  {
    type: "alternator",
    label: "Alternateur",
    description: "Produit du courant pendant que le moteur tourne, source du chargeur DC/DC.",
    category: "charger",
    subcategory: "alternateur",
    subtitle: "Charge",
    icon: "/schema-icons/alternator.svg",
    iconPro: "/schema-icons/pro/alternator.webp",
    badge: { field: "amperage", unit: "A" },
    handles: [
      { id: "negative", label: "Masse", kind: "negative", side: "left" },
      { id: "positive", label: "B+", kind: "positive", side: "right" },
    ],
    defaultData: { voltage: 12, amperage: 0 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "voltage", label: "Tension", type: "number", unit: "V" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A", help: "Facultatif : 0 si non connu." },
    ],
  },
  {
    // Répartiteur de charge à diodes/FET (ex. Argo FET) : une seule entrée
    // depuis la source de charge alimente 2 ou 3 batteries isolées entre
    // elles, sans qu'un courant de l'une ne reflue vers l'autre. Seul le +
    // est représenté : les batteries partagent une masse commune, non
    // commutée par ce composant.
    type: "battery-isolator",
    label: "Répartiteur de charge",
    description: "Sépare deux batteries pour charger l'auxiliaire sans décharger celle du moteur.",
    category: "battery",
    subcategory: "repartiteurs",
    subtitle: "Isolateur multi-batteries",
    icon: "/schema-icons/dcdc.svg",
    iconPro: "/schema-icons/pro/battery-isolator.webp",
    handles: [
      { id: "input", label: "IN", kind: "positive", side: "left" },
      { id: "out-1", label: "1", kind: "positive", side: "right" },
      { id: "out-2", label: "2", kind: "positive", side: "right" },
    ],
    getHandles: variableOutputHandles,
    defaultData: { outputCount: 2, amperage: 100 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "outputCount",
        label: "Nombre de batteries isolées",
        type: "select",
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
        ],
        help: "Toutes les batteries partagent la même masse, non représentée ici.",
      },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A" },
    ],
  },
  {
    // Combineur de batteries (ex. Cyrix) : relais qui relie temporairement
    // deux banques de batteries pour les charger ensemble (au-dessus d'un
    // seuil de tension), puis les isole à nouveau — pas d'entrée/sortie
    // fixe, les deux bornes sont équivalentes.
    type: "battery-combiner",
    label: "Combineur de batteries",
    description: "Relie plusieurs batteries en un seul banc pour cumuler leur capacité.",
    category: "battery",
    subcategory: "repartiteurs",
    subtitle: "Relais de couplage",
    icon: "/schema-icons/battery-switch.svg",
    iconPro: "/schema-icons/pro/battery-combiner.webp",
    handles: [
      { id: "battery-a", label: "Batterie A", kind: "positive", side: "left" },
      { id: "battery-b", label: "Batterie B", kind: "positive", side: "right" },
    ],
    defaultData: { amperage: 120 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A", help: "Facultatif : 0 si non connu." },
    ],
  },
  {
    type: "shore-power",
    label: "Prise de quai",
    description: "Point de branchement au secteur 230V (quai, prise camping).",
    category: "charger",
    subcategory: "secteur",
    subtitle: "Source secteur",
    icon: "/schema-icons/ac-charger.svg",
    iconPro: "/schema-icons/pro/shore-power.webp",
    handles: [{ id: "ac", label: "230V", kind: "neutral", side: "right" }],
    defaultData: {},
    fields: [{ key: "label", label: "Nom", type: "text", help: "Réseau, borne de quai, groupe électrogène…" }],
  },
  {
    type: "fuse",
    label: "Fusible",
    description: "Protège un circuit en coupant le courant en cas de surintensité.",
    category: "wiring",
    subcategory: "protection",
    subtitle: "Protection",
    icon: "/schema-icons/fuse.svg",
    iconPro: "/schema-icons/pro/fuse.webp",
    badge: { field: "amperage", unit: "A" },
    handles: [
      { id: "input", label: "IN", kind: "positive", side: "left" },
      { id: "output", label: "OUT", kind: "positive", side: "right" },
    ],
    defaultData: { fuseType: "midi", amperage: 30 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "fuseType",
        label: "Type",
        type: "select",
        help: "Le format physique du porte-fusible (pas la valeur du calibre).",
        options: [
          { value: "mega", label: "MEGA" },
          { value: "midi", label: "MIDI" },
          { value: "anl", label: "ANL" },
          { value: "classe-t", label: "Classe T" },
          { value: "lame", label: "Lame" },
          { value: "generique", label: "Générique" },
        ],
      },
      { key: "amperage", label: "Calibre", type: "number", unit: "A", help: "L'ampérage inscrit sur le fusible." },
    ],
  },
  {
    type: "circuit-breaker",
    label: "Disjoncteur DC",
    description: "Coupe-circuit réarmable, protège comme un fusible sans devoir le remplacer.",
    category: "wiring",
    subcategory: "protection",
    subtitle: "Protection",
    icon: "/schema-icons/circuit-breaker.svg",
    iconPro: "/schema-icons/pro/circuit-breaker.webp",
    badge: { field: "amperage", unit: "A" },
    handles: [
      { id: "input", label: "IN", kind: "positive", side: "left" },
      { id: "output", label: "OUT", kind: "positive", side: "right" },
    ],
    // Retour bêta : "n'a qu'1 entrée/1 sortie, il en faudrait 2×2 (+ et −
    // des panneaux dessus)" — un disjoncteur bipolaire protège les deux
    // polarités à la fois, plutôt que le seul + habituel. Variante
    // facultative (par défaut inchangé, 1 entrée/1 sortie).
    getHandles: (data) =>
      data.poles === "bipolar"
        ? [
            { id: "input", label: "IN+", kind: "positive", side: "left" as const },
            { id: "input-negative", label: "IN−", kind: "negative", side: "left" as const },
            { id: "output", label: "OUT+", kind: "positive", side: "right" as const },
            { id: "output-negative", label: "OUT−", kind: "negative", side: "right" as const },
          ]
        : [
            { id: "input", label: "IN", kind: "positive", side: "left" as const },
            { id: "output", label: "OUT", kind: "positive", side: "right" as const },
          ],
    defaultData: { amperage: 16, poles: "simple" },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "poles",
        label: "Type",
        type: "select",
        help: "Bipolaire (2×2) : coupe le + et le − en même temps sur le même disjoncteur, ex. en sortie directe d'un panneau solaire.",
        options: [
          { value: "simple", label: "Simple (+ seul)" },
          { value: "bipolar", label: "Bipolaire (+ et −)" },
        ],
      },
      { key: "amperage", label: "Calibre", type: "number", unit: "A", help: "Doit être choisi selon la section du câble à protéger, pas selon l'appareil branché." },
    ],
  },
  {
    type: "battery-switch",
    label: "Coupe-batterie",
    description: "Coupe manuellement l'alimentation de la batterie.",
    category: "wiring",
    subcategory: "coupure",
    subtitle: "Protection",
    icon: "/schema-icons/battery-switch.svg",
    iconPro: "/schema-icons/pro/battery-switch.webp",
    handles: [
      { id: "input", label: "IN", kind: "positive", side: "left" },
      { id: "output", label: "OUT", kind: "positive", side: "right" },
    ],
    defaultData: { amperage: 0 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A", help: "Laissez 0 si vous ne connaissez pas la valeur." },
    ],
  },
  {
    // Mini BMS (retour bêta : icône fournie, "prend les spec pour câblage")
    // — carte de protection intégrée à un pack LiFePO4 DIY (ex. JBD/Daly
    // 4S). Spec de câblage réelle : seul le retour négatif est commuté par
    // les MOSFET de la carte (B− → P−), le + reste un simple bus direct
    // non commuté — à la différence du coupe-batterie ci-dessus qui coupe
    // le +. Pas de bornes +, contrairement à un shunt qui mesure sans
    // jamais couper.
    type: "mini-bms",
    label: "BMS (mini, intégré batterie)",
    description: "Protège une batterie LiFePO4 (surcharge, décharge profonde, court-circuit) en coupant le retour négatif — souvent la petite carte intégrée dans le boîtier de la batterie.",
    category: "wiring",
    subcategory: "coupure",
    subtitle: "Protection",
    icon: "/schema-icons/battery-switch.svg",
    iconPro: "/schema-icons/pro/mini-bms.webp",
    handles: [
      { id: "batt-negative", label: "B−", kind: "negative", side: "left" },
      { id: "sys-negative", label: "P−", kind: "negative", side: "right" },
    ],
    defaultData: { amperage: 100 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A", help: "100A courant sur les petits BMS DIY 4S." },
    ],
  },
  {
    type: "switch",
    label: "Interrupteur",
    description: "Interrupteur pour allumer ou éteindre un appareil.",
    category: "wiring",
    subcategory: "distribution",
    subtitle: "Commande",
    icon: "/schema-icons/switch.svg",
    iconPro: "/schema-icons/pro/switch.webp",
    handles: [
      { id: "input", label: "IN", kind: "positive", side: "left" },
      { id: "output", label: "OUT", kind: "positive", side: "right" },
    ],
    // Interrupteur inverseur (3 positions / bipolaire, ex. pompe de cale
    // manuel/auto/off) : un commun alimenté ("IN") peut être aiguillé vers
    // l'une de deux sorties — la 2ᵉ sortie n'apparaît que si choisie, pour
    // ne pas ajouter une borne inutile par défaut.
    getHandles: (data) =>
      data.poles === "3-positions"
        ? [
            { id: "input", label: "IN", kind: "positive", side: "left" as const },
            { id: "output", label: "OUT 1", kind: "positive", side: "right" as const },
            { id: "output-2", label: "OUT 2", kind: "positive", side: "right" as const },
          ]
        : [
            { id: "input", label: "IN", kind: "positive", side: "left" as const },
            { id: "output", label: "OUT", kind: "positive", side: "right" as const },
          ],
    defaultData: { amperage: 0, poles: "simple" },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "poles",
        label: "Type",
        type: "select",
        help: "3 positions (inverseur) : un commun peut être aiguillé vers l'une de deux sorties, ex. pompe manuel/auto.",
        options: [
          { value: "simple", label: "Simple (marche/arrêt)" },
          { value: "3-positions", label: "3 positions (inverseur)" },
        ],
      },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A", help: "Facultatif : 0 si non connu." },
    ],
  },
  {
    // Relais automobile classique (4/5 broches) : une bobine de commande
    // basse puissance (85/86) ferme un contact de puissance séparé
    // (30 → 87), permettant à un petit signal de commuter un gros courant
    // sans le faire transiter par l'interrupteur de commande.
    type: "relay",
    label: "Relais",
    description: "Petit contacteur commandé électriquement, pour piloter un gros courant depuis un petit signal.",
    category: "wiring",
    subcategory: "distribution",
    subtitle: "Commande",
    icon: "/schema-icons/switch.svg",
    iconPro: "/schema-icons/pro/relay.webp",
    handles: [
      { id: "coil-positive", label: "86 (bobine +)", kind: "positive", side: "top" },
      { id: "coil-negative", label: "85 (bobine −)", kind: "negative", side: "top" },
      { id: "input", label: "30 (commun)", kind: "positive", side: "left" },
      { id: "output", label: "87 (NO)", kind: "positive", side: "right" },
    ],
    getHandles: (data) =>
      data.contactType === "inverseur"
        ? [
            { id: "coil-positive", label: "86 (bobine +)", kind: "positive", side: "top" as const },
            { id: "coil-negative", label: "85 (bobine −)", kind: "negative", side: "top" as const },
            { id: "input", label: "30 (commun)", kind: "positive", side: "left" as const },
            { id: "output", label: "87 (NO)", kind: "positive", side: "right" as const },
            { id: "output-nc", label: "87a (NF)", kind: "positive", side: "right" as const },
          ]
        : [
            { id: "coil-positive", label: "86 (bobine +)", kind: "positive", side: "top" as const },
            { id: "coil-negative", label: "85 (bobine −)", kind: "negative", side: "top" as const },
            { id: "input", label: "30 (commun)", kind: "positive", side: "left" as const },
            { id: "output", label: "87 (NO)", kind: "positive", side: "right" as const },
          ],
    defaultData: { amperage: 30, contactType: "travail" },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "contactType",
        label: "Type de contact",
        type: "select",
        help: "Travail (NO) : fermé seulement quand la bobine est alimentée. Inverseur (NO+NF) : ajoute une sortie normalement fermée (87a).",
        options: [
          { value: "travail", label: "Travail (NO), 4 broches" },
          { value: "inverseur", label: "Inverseur (NO+NF), 5 broches" },
        ],
      },
      { key: "amperage", label: "Courant nominal du contact", type: "number", unit: "A", help: "Le courant que peut supporter le contact de puissance (30 → 87), pas la bobine." },
    ],
  },
  {
    type: "busbar",
    label: "Busbar",
    description: "Barre de connexion qui répartit le courant vers plusieurs circuits.",
    category: "wiring",
    subcategory: "distribution",
    subtitle: "Distribution",
    icon: "/schema-icons/busbar.svg",
    iconPro: "/schema-icons/pro/busbar-positive.webp",
    iconVariantField: "polarity",
    iconVariants: {
      positive: { iconPro: "/schema-icons/pro/busbar-positive.webp" },
      negative: { iconPro: "/schema-icons/pro/busbar-negative.webp" },
    },
    handles: [
      { id: "input", label: "1", kind: "positive", side: "right" },
      { id: "out-1", label: "2", kind: "positive", side: "right" },
      { id: "out-2", label: "3", kind: "positive", side: "right" },
      { id: "out-3", label: "4", kind: "positive", side: "right" },
      { id: "out-4", label: "5", kind: "positive", side: "right" },
    ],
    getHandles: busbarHandles,
    defaultData: { polarity: "positive", outputCount: DEFAULT_OUTPUTS },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "polarity",
        label: "Polarité",
        type: "select",
        help: "Change la couleur des bornes et des câbles reliés (rouge = positif, noir = négatif).",
        options: [
          { value: "positive", label: "Positif" },
          { value: "negative", label: "Négatif" },
        ],
      },
      busbarPointCountField,
    ],
    // La polarité d'un busbar n'est pas fixe : elle dépend de la propriété
    // choisie par l'utilisateur, pas du type de composant — toutes ses
    // bornes suivent donc la même polarité dynamique (retour utilisateur :
    // "le busbar ne change pas de couleur quand on change négatif/positif").
    resolveHandleKind: (data) => (data.polarity === "negative" ? "negative" : "positive"),
  },
  {
    // Point de jonction où plusieurs câbles de même polarité se rejoignent
    // (retour utilisateur : "créer aussi l'item épissure, juste un point où
    // un ou plusieurs câbles peuvent être reliés") — réutilise exactement la
    // même logique de bornes que le busbar (tout sur une seule face, pas de
    // borne "IN" dédiée), la différence n'est que sémantique/visuelle :
    // une épissure est une petite jonction, pas une vraie barre de
    // distribution.
    type: "splice",
    label: "Épissure",
    description: "Point de jonction où plusieurs câbles de même polarité se rejoignent.",
    category: "wiring",
    subcategory: "distribution",
    subtitle: "Jonction",
    icon: "/schema-icons/busbar.svg",
    handles: [
      { id: "input", label: "1", kind: "positive", side: "right" },
      { id: "out-1", label: "2", kind: "positive", side: "right" },
    ],
    getHandles: busbarHandles,
    defaultData: { polarity: "positive", outputCount: 1 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "polarity",
        label: "Polarité",
        type: "select",
        help: "Change la couleur des bornes et des câbles reliés (rouge = positif, noir = négatif).",
        options: [
          { value: "positive", label: "Positif" },
          { value: "negative", label: "Négatif" },
        ],
      },
      {
        key: "outputCount",
        label: "Nombre de câbles reliés",
        type: "number",
        min: MIN_OUTPUTS,
        max: MAX_OUTPUTS,
        step: 1,
        help: "Réduire ce nombre supprime les câbles reliés aux points retirés.",
      },
    ],
    resolveHandleKind: (data) => (data.polarity === "negative" ? "negative" : "positive"),
  },
  {
    type: "distribution-panel",
    label: "Tableau de distribution",
    description: "Tableau qui répartit et protège plusieurs circuits consommateurs.",
    category: "wiring",
    subcategory: "distribution",
    subtitle: "Distribution",
    icon: "/schema-icons/busbar.svg",
    iconPro: "/schema-icons/pro/distribution-panel.webp",
    // Deux photos produit fournies par l'utilisateur : le tableau à
    // interrupteurs seuls (par défaut) et une variante avec fusibles
    // intégrés en plus des interrupteurs — juste un choix d'apparence, la
    // "Platine de fusibles" reste le composant dédié pour la protection.
    iconVariantField: "layout",
    iconVariants: {
      "with-fuses": { iconPro: "/schema-icons/pro/distribution-panel-fusibles.webp" },
    },
    handles: [
      { id: "in-1", label: "IN 1", kind: "positive", side: "left" },
      { id: "out-1", label: "OUT 1", kind: "positive", side: "right" },
      { id: "in-2", label: "IN 2", kind: "positive", side: "left" },
      { id: "out-2", label: "OUT 2", kind: "positive", side: "right" },
    ],
    getHandles: distributionPanelHandles,
    defaultData: { outputCount: DEFAULT_OUTPUTS, layout: "switches" },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "layout",
        label: "Apparence",
        type: "select",
        help: "Interrupteurs : chaque circuit a sa propre entrée et sortie. Fusibles : une seule entrée commune protégée alimente toutes les sorties.",
        options: [
          { value: "switches", label: "Interrupteurs seuls" },
          { value: "with-fuses", label: "Interrupteurs + fusibles" },
        ],
      },
      outputCountField,
    ],
  },
  {
    type: "ac-panel",
    label: "Tableau 220V",
    description: "Tableau électrique 230V (disjoncteurs, différentiel).",
    category: "wiring",
    subcategory: "distribution",
    subtitle: "Distribution AC",
    icon: "/schema-icons/busbar.svg",
    iconPro: "/schema-icons/pro/ac-panel.webp",
    handles: [
      { id: "ac-in", label: "230V IN", kind: "neutral", side: "left" },
      { id: "ac-out", label: "230V OUT", kind: "neutral", side: "right" },
      { id: "earth", label: "Terre", kind: "earth", side: "bottom" },
    ],
    defaultData: {},
    fields: [{ key: "label", label: "Nom", type: "text" }],
  },
  {
    type: "fuse-block",
    label: "Platine de fusibles",
    description: "Platine qui regroupe plusieurs fusibles pour les circuits basse tension.",
    category: "wiring",
    subcategory: "protection",
    subtitle: "Protection",
    icon: "/schema-icons/busbar.svg",
    iconPro: "/schema-icons/pro/fuse-block.webp",
    handles: [
      { id: "input", label: "IN", kind: "positive", side: "top" },
      { id: "out-1", label: "1", kind: "positive", side: "right" },
      { id: "out-2", label: "2", kind: "positive", side: "right" },
      { id: "out-3", label: "3", kind: "positive", side: "left" },
      { id: "out-4", label: "4", kind: "positive", side: "left" },
    ],
    getHandles: fuseBlockHandles,
    // Retour utilisateur : "possibilité de modifier l'intensité de chaque
    // sortie" — chaque fusible de la platine a son propre calibre, stocké
    // sous `outAmp{N}` (voir ItemPropertiesPopup.FuseBlockOutputs, qui génère un
    // champ par sortie selon `outputCount`, plutôt qu'une liste statique).
    getHandleLabel: (data, handle) => {
      // Bornes négatives ("out-N-neg") : pas de fusible dessus, jamais de
      // calibre affiché — seules les sorties positives ("out-N") le sont.
      if (!handle.id.startsWith("out-") || handle.id.endsWith("-neg")) return handle.label;
      const amp = Number(data[`outAmp${handle.id.slice(4)}`]) || 0;
      return `${handle.label} · ${amp}A`;
    },
    defaultData: {
      outputCount: DEFAULT_OUTPUTS,
      // Retour bêta : "par défaut, ajouter le négatif sur la boîte à
      // fusibles" — les deux polarités disponibles dès l'ajout, plutôt que
      // de devoir aller chercher le réglage.
      layout: "positive-negative",
      ...Object.fromEntries(Array.from({ length: MAX_OUTPUTS }, (_, i) => [`outAmp${i + 1}`, 15])),
    },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      {
        key: "layout",
        label: "Retour négatif",
        type: "select",
        help: "Un retour négatif par sortie positive (pas de fusible dessus), pour câbler chaque circuit en +/− directement sur la platine.",
        options: [
          { value: "positive", label: "Positif seul" },
          { value: "positive-negative", label: "Positif + retours négatifs" },
        ],
      },
      outputCountField,
    ],
  },
  {
    // Famille Lynx (retour bêta : "classe tous les Lynx ensemble") — quatre
    // modules du même système de bus DC Victron, groupés sous la même
    // sous-catégorie plutôt qu'en modèles de marque de types génériques
    // différents, pour rester repérables ensemble dans la bibliothèque.
    // Lynx Power In : bus d'entrée avec fusible Classe T intégré en série
    // entre la batterie et le reste du bus Lynx — 1 entrée, 1 sortie, +
    // seul (calibre standard 400A).
    type: "lynx-power-in",
    label: "Lynx Power In",
    description: "Bus d'entrée Lynx avec fusible Classe T intégré, entre la batterie et le reste du bus Lynx.",
    category: "wiring",
    subcategory: "lynx",
    subtitle: "Entrée Lynx",
    icon: "/schema-icons/fuse.svg",
    iconPro: "/schema-icons/pro/brand/lynx-class-t-power-in-m10.webp",
    badge: { field: "amperage", unit: "A" },
    handles: [
      { id: "input", label: "IN", kind: "positive", side: "left" },
      { id: "output", label: "OUT", kind: "positive", side: "right" },
    ],
    defaultData: { amperage: 400 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Calibre du fusible Classe T", type: "number", unit: "A", help: "400A en standard sur le Lynx Power In." },
    ],
  },
  {
    // Lynx Distributor : bus positif fixe à 6 sorties, chacune protégée par
    // son propre fusible MEGA — le retour négatif se fait via un second bus
    // Lynx séparé, pas sur ce même produit (spec produit réelle : 6 sorties,
    // pas de nombre variable comme la platine de fusibles générique).
    type: "lynx-distributor",
    label: "Lynx Distributor",
    description: "Bus positif Lynx à 6 sorties, chacune protégée par un fusible MEGA.",
    category: "wiring",
    subcategory: "lynx",
    subtitle: "Distribution Lynx",
    icon: "/schema-icons/busbar.svg",
    iconPro: "/schema-icons/pro/brand/lynx-distributor-m10.webp",
    handles: [
      { id: "input", label: "IN", kind: "positive", side: "top" },
      { id: "out-1", label: "1", kind: "positive", side: "right" },
      { id: "out-2", label: "2", kind: "positive", side: "right" },
      { id: "out-3", label: "3", kind: "positive", side: "right" },
      { id: "out-4", label: "4", kind: "positive", side: "left" },
      { id: "out-5", label: "5", kind: "positive", side: "left" },
      { id: "out-6", label: "6", kind: "positive", side: "left" },
    ],
    getHandleLabel: (data, handle) => {
      if (!handle.id.startsWith("out-")) return handle.label;
      const amp = Number(data[`outAmp${handle.id.slice(4)}`]) || 0;
      return `${handle.label} · ${amp}A`;
    },
    defaultData: {
      outAmp1: 100,
      outAmp2: 100,
      outAmp3: 100,
      outAmp4: 100,
      outAmp5: 100,
      outAmp6: 100,
    },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "outAmp1", label: "Calibre sortie 1", type: "number", unit: "A" },
      { key: "outAmp2", label: "Calibre sortie 2", type: "number", unit: "A" },
      { key: "outAmp3", label: "Calibre sortie 3", type: "number", unit: "A" },
      { key: "outAmp4", label: "Calibre sortie 4", type: "number", unit: "A" },
      { key: "outAmp5", label: "Calibre sortie 5", type: "number", unit: "A" },
      { key: "outAmp6", label: "Calibre sortie 6", type: "number", unit: "A" },
    ],
  },
  {
    // Lynx Shunt VE.Can : shunt 1000A intégré au bus Lynx — mêmes bornes
    // que le shunt générique (Battery/System/Communication), rattaché ici à
    // la famille Lynx plutôt qu'à la mesure pour rester groupé visuellement.
    type: "lynx-shunt",
    label: "Lynx Shunt VE.Can",
    description: "Mesure le courant entre batterie et système, intégré au bus Lynx (jusqu'à 1000A).",
    category: "wiring",
    subcategory: "lynx",
    subtitle: "Mesure Lynx",
    icon: "/schema-icons/shunt.svg",
    iconPro: "/schema-icons/pro/brand/lynx-shunt-vecan-m10.webp",
    handles: [
      { id: "battery", label: "Battery", kind: "negative", side: "left" },
      { id: "system", label: "System", kind: "negative", side: "right" },
      { id: "ve-can", label: "Communication", kind: "neutral", side: "bottom", optional: true },
    ],
    defaultData: { amperage: 1000 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A" },
    ],
  },
  {
    // Lynx Smart BMS (retour bêta : icône fournie, produit manquant du
    // catalogue) — module de bus Lynx qui coupe batterie et système en cas
    // de défaut (surcharge/décharge/température), à la différence du Lynx
    // Distributor (bus passif) ou du Lynx Shunt (mesure seule). Bornes
    // physiques du boîtier : côté batterie (+/−) et côté système (+/−),
    // plus le port VE.Can — topologie interne de coupure non représentée,
    // seules les bornes externes réelles du produit le sont.
    type: "lynx-smart-bms",
    label: "Lynx Smart BMS",
    description: "Coupe automatiquement la batterie du système en cas de défaut (surcharge, décharge profonde, température) — placé entre la batterie et le reste du bus Lynx.",
    category: "wiring",
    subcategory: "lynx",
    subtitle: "Protection Lynx",
    icon: "/schema-icons/busbar.svg",
    iconPro: "/schema-icons/pro/lynx-smart-bms.webp",
    minIconBoxSize: 64,
    handles: [
      { id: "batt-negative", label: "BATT−", kind: "negative", side: "left" },
      { id: "batt-positive", label: "BATT+", kind: "positive", side: "left" },
      { id: "sys-negative", label: "SYS−", kind: "negative", side: "right" },
      { id: "sys-positive", label: "SYS+", kind: "positive", side: "right" },
      { id: "ve-can", label: "Communication", kind: "neutral", side: "bottom", optional: true },
    ],
    defaultData: { amperage: 500 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A", help: "Ex. 500A pour le Lynx Smart BMS 500." },
    ],
  },
  {
    type: "ground",
    label: "Point de masse",
    description: "Point de masse commun, référence électrique du système.",
    category: "wiring",
    subcategory: "masse",
    subtitle: "Châssis",
    icon: "/schema-icons/ground.svg",
    handles: [{ id: "ground", label: "Masse", kind: "negative", side: "left" }],
    defaultData: {},
    fields: [{ key: "label", label: "Nom", type: "text" }],
  },
  {
    // Pompe de cale : contrairement au consommateur générique (+/−), elle a
    // 3 connexions électriques réelles — une masse commune et deux
    // alimentations positives séparées (manuelle via interrupteur, auto via
    // flotteur intégré). La sortie d'évacuation (tuyau) n'est pas électrique
    // et n'apparaît donc pas comme borne.
    type: "bilge-pump",
    label: "Pompe de cale",
    description: "Pompe qui évacue l'eau accumulée dans la coque.",
    category: "consumers",
    icon: "/schema-icons/consumer.svg",
    iconPro: "/schema-icons/pro/pompe-cale.webp",
    handles: [
      { id: "negative", label: "Masse", kind: "negative", side: "left" },
      { id: "positive-manual", label: "+ Manuel", kind: "positive", side: "right" },
      { id: "positive-auto", label: "+ Auto", kind: "positive", side: "right" },
    ],
    defaultData: { powerW: 40 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "powerW", label: "Puissance", type: "number", unit: "W" },
    ],
  },
  {
    type: "socket-220v",
    label: "Prise 220V",
    description: "Prise secteur 230V pour brancher un appareil classique.",
    category: "consumers",
    subtitle: "Prise secteur",
    icon: "/schema-icons/consumer.svg",
    iconPro: "/schema-icons/pro/socket-220v.webp",
    handles: [
      { id: "ac-in", label: "230V", kind: "neutral", side: "left" },
      { id: "earth", label: "Terre", kind: "earth", side: "bottom" },
    ],
    defaultData: { powerW: 500 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "powerW", label: "Puissance", type: "number", unit: "W" },
    ],
  },
  {
    type: "shunt",
    label: "Shunt",
    description: "Mesure le courant qui entre et sort de la batterie, utilisé par un écran de contrôle.",
    category: "measurement",
    subcategory: "shunts",
    subtitle: "Mesure",
    icon: "/schema-icons/shunt.svg",
    iconPro: "/schema-icons/pro/shunt.webp",
    // Bug corrigé (retour utilisateur : "les points de connexion sont
    // rouges donc le câble devient automatiquement rouge") : un shunt se
    // câble en série sur le retour négatif (convention BMV/SmartShunt), pas
    // sur le +. Les deux bornes passantes sont donc "negative" (noir), pas
    // "positive" (rouge).
    handles: [
      { id: "battery", label: "Battery", kind: "negative", side: "left" },
      { id: "system", label: "System", kind: "negative", side: "right" },
      { id: "ve-direct", label: "Communication", kind: "neutral", side: "bottom", optional: true },
    ],
    defaultData: { amperage: 0 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "amperage", label: "Courant nominal", type: "number", unit: "A", help: "Facultatif : 0 si non connu." },
    ],
  },
  {
    type: "system-monitor",
    label: "Écran de contrôle",
    description: "Affiche l'état de charge et les mesures du système (ex. BMV).",
    category: "measurement",
    subcategory: "ecrans",
    subtitle: "Mesure",
    icon: "/schema-icons/shunt.svg",
    iconPro: "/schema-icons/pro/system-monitor.webp",
    handles: [
      { id: "positive", label: "+", kind: "positive", side: "right" },
      { id: "negative", label: "−", kind: "negative", side: "left" },
      { id: "ve-direct", label: "Communication", kind: "neutral", side: "bottom", optional: true },
    ],
    // Retour utilisateur : "le GX Touch 70 c'est juste un lien de
    // communication pour le relier, pas besoin d'autre câble dessus" — cet
    // écran se raccorde uniquement par un câble GX (données + alimentation
    // fournie par ce même câble), sans bornes +/− séparées à câbler,
    // contrairement à un écran de contrôle classique (ex. BMV, alimenté à
    // part). Bascule selon `connection`, réglé par défaut sur les modèles
    // concernés via `BrandModel.defaults`.
    getHandles: (data) =>
      data.connection === "communication-only"
        ? [{ id: "ve-direct", label: "Communication", kind: "neutral", side: "bottom" as const }]
        : [
            { id: "positive", label: "+", kind: "positive", side: "right" as const },
            { id: "negative", label: "−", kind: "negative", side: "left" as const },
            { id: "ve-direct", label: "Communication", kind: "neutral", side: "bottom" as const, optional: true },
          ],
    defaultData: { connection: "power" },
    fields: [{ key: "label", label: "Nom", type: "text" }],
  },
  {
    type: "inverter",
    label: "Convertisseur 12/230V",
    description: "Transforme le courant continu (12V/24V) en 230V pour les appareils secteur.",
    category: "converter",
    subtitle: "Conversion",
    icon: "/schema-icons/inverter.svg",
    iconPro: "/schema-icons/pro/inverter-pure.webp",
    minIconBoxSize: 64,
    handles: [
      { id: "dc-negative", label: "DC−", kind: "negative", side: "left" },
      { id: "dc-positive", label: "DC+", kind: "positive", side: "left" },
      { id: "ac-out", label: "230V", kind: "neutral", side: "right" },
      { id: "ve-direct", label: "Communication", kind: "neutral", side: "bottom", optional: true },
    ],
    defaultData: { powerW: 500, voltageDC: 12 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "powerW", label: "Puissance", type: "number", unit: "W" },
      { key: "voltageDC", label: "Tension DC", type: "number", unit: "V" },
    ],
  },
  {
    // Station électrique portable "tout-en-1" (retour utilisateur : "si
    // c'est un nouveau produit c'est station électrique (batterie, mppt,
    // convertisseur 220, affichage) tout intégré" — type dédié plutôt que
    // rattaché à inverter-charger comme fait dans un premier temps : à la
    // différence d'un Multiplus, elle contient AUSSI son propre régulateur
    // solaire et sa batterie, elle a donc une entrée PV directe en plus des
    // bornes AC. L'écran n'a pas de borne : intégré au boîtier, jamais câblé
    // à part. Sortie DC 12V ajoutée (retour utilisateur : gabarit avec un
    // circuit 12V alimenté depuis la station) — la plupart de ces stations
    // ont un port 12V/10A en façade en plus des prises 230V.
    type: "power-station",
    label: "Station électrique tout-en-1",
    description: "Batterie portable tout-en-un avec ses propres sorties intégrées.",
    category: "battery",
    subcategory: "stations",
    subtitle: "Batterie + MPPT + onduleur intégrés",
    icon: "/schema-icons/inverter.svg",
    iconPro: "/schema-icons/pro/inverter.webp",
    badge: { field: "capacityWh", unit: "Wh" },
    // Retour utilisateur : "agrandi l'icône de batterie tout en 1" — 84 est
    // le plafond de `boxSize` (voir ElectricalNode.tsx), donc la taille
    // maximale possible plutôt que la taille "standard" des autres boîtiers.
    minIconBoxSize: 84,
    getHandles: (data) => {
      if (data.connectorLayout === "dual-xt90-xt60") {
        return [
          { id: "xt90-1-negative", label: "XT90 #1 −", kind: "negative", side: "left" as const },
          { id: "xt90-1-positive", label: "XT90 #1 +", kind: "positive", side: "left" as const },
          { id: "xt90-2-negative", label: "XT90 #2 −", kind: "negative", side: "left" as const },
          { id: "xt90-2-positive", label: "XT90 #2 +", kind: "positive", side: "left" as const },
          { id: "ac-in", label: "AC IN", kind: "neutral", side: "top" as const },
          { id: "ac-out", label: "AC OUT", kind: "neutral", side: "right" as const },
          { id: "xt60-negative", label: "XT60 −", kind: "negative", side: "bottom" as const },
          { id: "xt60-positive", label: "XT60 +", kind: "positive", side: "bottom" as const },
        ];
      }
      return [
        { id: "pv-negative", label: "PV−", kind: "negative", side: "left" as const },
        { id: "pv-positive", label: "PV+", kind: "positive", side: "left" as const },
        { id: "ac-in", label: "AC IN", kind: "neutral", side: "top" as const },
        { id: "ac-out", label: "AC OUT", kind: "neutral", side: "right" as const },
        { id: "dc-negative", label: "DC 12V−", kind: "negative", side: "bottom" as const },
        { id: "dc-positive", label: "DC 12V+", kind: "positive", side: "bottom" as const },
      ];
    },
    handles: [
      { id: "pv-negative", label: "PV−", kind: "negative", side: "left" },
      { id: "pv-positive", label: "PV+", kind: "positive", side: "left" },
      { id: "ac-in", label: "AC IN", kind: "neutral", side: "top" },
      { id: "ac-out", label: "AC OUT", kind: "neutral", side: "right" },
      { id: "dc-negative", label: "DC 12V−", kind: "negative", side: "bottom" },
      { id: "dc-positive", label: "DC 12V+", kind: "positive", side: "bottom" },
    ],
    defaultData: { powerW: 1200, capacityWh: 1024 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "powerW", label: "Puissance onduleur", type: "number", unit: "W" },
      { key: "capacityWh", label: "Capacité batterie", type: "number", unit: "Wh", help: "Souvent indiquée en Wh (pas en Ah) sur ce type de produit." },
    ],
  },
  {
    type: "inverter-charger",
    label: "Chargeur-convertisseur tout-en-1",
    description: "Combine onduleur et chargeur secteur en un seul appareil (ex. Multiplus).",
    category: "charger",
    subcategory: "tout-en-1",
    subtitle: "Type Multiplus",
    // CDC §12 : "Convertisseur-chargeur — option V1 si le développement
    // reste raisonnable" — type Victron Multiplus (onduleur + chargeur
    // secteur bidirectionnel dans le même boîtier). Rangé dans la famille
    // Chargeur (pas Convertisseur) — retour utilisateur : "les deux
    // convertisseurs ça se comprend pas, met juste le convertisseur 12/230
    // tout seul, et l'autre dans la partie chargeur" — ce boîtier charge la
    // batterie depuis le secteur autant qu'il convertit, contrairement au
    // simple onduleur ("inverter") qui ne fait que convertir.
    icon: "/schema-icons/inverter.svg",
    iconPro: "/schema-icons/pro/inverter.webp",
    badge: { field: "chargeAmperage", unit: "A" },
    minIconBoxSize: 64,
    handles: [
      { id: "dc-negative", label: "DC−", kind: "negative", side: "left" },
      { id: "dc-positive", label: "DC+", kind: "positive", side: "left" },
      { id: "ac-in", label: "AC IN", kind: "neutral", side: "top" },
      { id: "ac-out", label: "AC OUT", kind: "neutral", side: "right" },
      { id: "ve-direct", label: "Communication", kind: "neutral", side: "bottom", optional: true },
    ],
    defaultData: { powerW: 1600, voltageDC: 12, chargeAmperage: 70 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "powerW", label: "Puissance", type: "number", unit: "W" },
      { key: "voltageDC", label: "Tension DC", type: "number", unit: "V" },
      { key: "chargeAmperage", label: "Courant de charge", type: "number", unit: "A", help: "Quand alimenté en 230V (quai, groupe)." },
    ],
  },
  {
    // EasySolar (retour bêta : icône fournie) — combine dans un seul
    // boîtier un chargeur-convertisseur type Multiplus et un régulateur
    // MPPT solaire. Pas un nouveau rôle électrique, juste la réunion des
    // bornes déjà utilisées séparément par "inverter-charger" (DC, AC IN/
    // OUT) et "mppt" (PV+/PV−) sur un seul composant, pour éviter d'avoir à
    // dessiner deux boîtiers reliés en interne pour un seul vrai appareil.
    type: "easysolar",
    label: "EasySolar (onduleur-chargeur + MPPT intégré)",
    description: "Combine onduleur-chargeur (type Multiplus) et régulateur MPPT solaire dans un seul boîtier.",
    category: "charger",
    subcategory: "tout-en-1",
    subtitle: "Type EasySolar",
    icon: "/schema-icons/inverter.svg",
    iconPro: "/schema-icons/pro/easysolar.webp",
    minIconBoxSize: 64,
    handles: [
      { id: "dc-negative", label: "DC−", kind: "negative", side: "left" },
      { id: "dc-positive", label: "DC+", kind: "positive", side: "left" },
      { id: "pv-negative", label: "PV−", kind: "negative", side: "left" },
      { id: "pv-positive", label: "PV+", kind: "positive", side: "left" },
      { id: "ac-in", label: "AC IN", kind: "neutral", side: "top" },
      { id: "ac-out", label: "AC OUT", kind: "neutral", side: "right" },
      { id: "ve-direct", label: "Communication", kind: "neutral", side: "bottom", optional: true },
    ],
    defaultData: { powerW: 1600, voltageDC: 12, chargeAmperage: 70, mpptAmperage: 50, systemVoltage: 12 },
    fields: [
      { key: "label", label: "Nom", type: "text" },
      { key: "powerW", label: "Puissance onduleur", type: "number", unit: "W" },
      { key: "voltageDC", label: "Tension DC", type: "number", unit: "V" },
      { key: "chargeAmperage", label: "Courant de charge secteur", type: "number", unit: "A", help: "Quand alimenté en 230V (quai, groupe)." },
      { key: "mpptAmperage", label: "Courant MPPT", type: "number", unit: "A", help: "Choisi selon la puissance des panneaux branchés." },
    ],
  },
  {
    type: "consumer",
    label: "Consommateur",
    description: "Appareil qui consomme de l'énergie (éclairage, frigo, pompe...).",
    category: "consumers",
    subtitle: "Générique",
    icon: "/schema-icons/consumer.svg",
    iconPro: "/schema-icons/pro/consumer.webp",
    iconVariantField: "presetType",
    iconVariants: consumerIconVariants(),
    handles: [
      { id: "positive", label: "+", kind: "positive", side: "right" },
      { id: "negative", label: "−", kind: "negative", side: "left" },
    ],
    defaultData: { presetType: "generique", powerW: 0 },
    fields: [
      {
        key: "presetType",
        label: "Type d'appareil",
        type: "select",
        help: "Préremplit le nom et une puissance typique, modifiables ensuite.",
        options: CONSUMER_PRESETS.map((p) => ({ value: p.value, label: p.label })),
      },
      { key: "label", label: "Nom", type: "text" },
      { key: "powerW", label: "Puissance", type: "number", unit: "W" },
    ],
  },
];

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return COMPONENT_DEFINITIONS.find((def) => def.type === type);
}

// Bornes réelles d'un node : `def.getHandles(data)` pour les composants à
// sorties variables, sinon `def.handles` tel quel.
export function getEffectiveHandles(def: ComponentDefinition, data: Record<string, unknown>) {
  return def.getHandles ? def.getHandles(data) : def.handles;
}

// Libellé réel d'une borne (peut dépendre des données du node — ex. calibre
// par sortie d'une platine de fusibles).
export function getHandleLabel(def: ComponentDefinition, data: Record<string, unknown>, handle: ComponentHandleDef): string {
  return def.getHandleLabel ? def.getHandleLabel(data, handle) : handle.label;
}

// Retombe sur l'icône "Simple" tant que la version "Pro" (réaliste,
// retour utilisateur : "avoir les deux choix d'icône soit débutant soit
// pro") n'a pas été fournie pour ce composant.
export function getComponentIcon(def: ComponentDefinition, style: IconStyle): string | undefined {
  if (style === "pro") return def.iconPro ?? def.icon;
  return def.icon;
}

// Certains composants affichent une icône plus précise que leur icône
// générique selon une propriété (ex. "réfrigérateur" pour un consommateur,
// "AGM" vs "LiFePO4" pour une batterie) — voir `iconVariantField`. Priorité
// au visuel du modèle de marque exact quand il en a un (retour
// utilisateur : bibliothèque de rendus Victron, "agrémenter la
// bibliothèque existante quand on choisit un modèle précis avoir l'icône")
// — sinon (marque sans correspondance visuelle, ou générique) on retombe
// sur la logique par variante existante.
export function getNodeIcon(def: ComponentDefinition, data: Record<string, unknown>, style: IconStyle): string | undefined {
  if (style === "pro" && typeof data.brandModelId === "string") {
    const brandIcon = getBrandModel(data.brandModelId)?.iconPro;
    if (brandIcon) return brandIcon;
  }
  if (def.iconVariantField) {
    const key = data[def.iconVariantField];
    if (typeof key === "string") {
      const variant = def.iconVariants?.[key];
      const variantIcon = style === "pro" ? (variant?.iconPro ?? variant?.icon) : variant?.icon;
      if (variantIcon) return variantIcon;
    }
  }
  return getComponentIcon(def, style);
}

export const CATEGORY_LABELS: Record<string, string> = {
  solar: "Solaire",
  battery: "Batterie",
  charger: "Chargeur",
  converter: "Convertisseur",
  wiring: "Protection & câblage",
  measurement: "Mesure",
  consumers: "Appareils",
};

// Sous-familles au sein d'une catégorie (regroupement visuel dans la
// bibliothèque uniquement, voir `ComponentDefinition.subcategory`) — retour
// utilisateur : "créer même des sous-familles". Les composants sans
// `subcategory` restent affichés hors groupe, en tête de leur catégorie.
export const SUBCATEGORY_LABELS: Record<string, string> = {
  panneaux: "Panneaux",
  regulateurs: "Régulateurs",
  batteries: "Batteries",
  repartiteurs: "Répartiteurs & combineurs",
  stations: "Stations tout-en-1",
  dcdc: "DC/DC",
  secteur: "Secteur",
  alternateur: "Alternateur",
  "tout-en-1": "Tout-en-1",
  protection: "Protection",
  distribution: "Distribution",
  lynx: "Lynx",
  masse: "Masse",
  shunts: "Shunts",
  ecrans: "Écrans de contrôle",
  coupure: "Coupe-batterie & BatteryProtect",
};
