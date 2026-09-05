import { ENGINE_LABELS, type RegisteredEngineId } from "@/lib/engine-payload";
import type { Project, ProjectRetainedValue } from "@/lib/generated/prisma/client";
import { moduleStatus } from "@/lib/project-module-status";
import { formatRetainedValueDisplay, getRetainedValueLabel } from "@/lib/retained-value-labels";

export type FollowUpStepStatus = "done" | "current" | "upcoming";

export const PROJECT_FOLLOW_UP_STEP_KEYS = [
  "cadrage",
  "materiel",
  "implantation",
  "cablage",
  "essais",
] as const;

export type ProjectFollowUpStepKey = (typeof PROJECT_FOLLOW_UP_STEP_KEYS)[number];

export type FollowUpStep = {
  key: ProjectFollowUpStepKey;
  title: string;
  objective: string;
  customerAction: string;
  fabsystemValidation: string;
  deliverable: string;
  status: FollowUpStepStatus;
};

export type PurchaseItem = {
  priority: "Indispensable" | "Option officielle";
  block: string;
  name: string;
  why: string;
  budgetCents: number;
  statusLabel: string;
  href: string;
};

export type ControlItem = {
  title: string;
  why: string;
  statusLabel: string;
};

export type BudgetLine = {
  block: string;
  budgetCents: number;
};

export type FollowUpDecision = {
  label: string;
  value: string;
};

export type FollowUpEngineSnapshot = {
  label: string;
  status: "Retenu" | "À recalculer" | "À compléter";
};

export type ProjectFollowUpDossier = {
  currentStepTitle: string;
  isStepOverridden: boolean;
  inferredStepTitle: string;
  readinessLabel: string;
  activeRetainedCount: number;
  obsoleteCount: number;
  retainedModuleCount: number;
  totalModuleCount: number;
  hasSchema: boolean;
  hasKit: boolean;
  kitName: string | null;
  steps: FollowUpStep[];
  purchases: PurchaseItem[];
  photoControls: ControlItem[];
  powerControls: ControlItem[];
  budgetLines: BudgetLine[];
  budgetBaseCents: number;
  budgetWithOptionsCents: number;
  decisionHighlights: FollowUpDecision[];
  engineSnapshots: FollowUpEngineSnapshot[];
  dossierChecklist: string[];
};

export type PublicLightKit = {
  purchases: PurchaseItem[];
  budgetBaseCents: number;
  budgetWithOptionsCents: number;
  schemaUrl: string;
  editorUrl: string;
  schemaLabel: string;
  baseSummary: string;
  optionSummary: string;
  printNote: string;
};

export type PublicP280LightKit = PublicLightKit;

const STEP_TEMPLATES = [
  {
    key: "cadrage",
    title: "1. Cadrage du projet",
    objective: "Valider l'architecture générale du van et le bon niveau de complexité.",
    customerAction: "Envoyer les besoins, les photos du van et le principe d'implantation.",
    fabsystemValidation: "Valider l'architecture, les protections et les grandes sections.",
    deliverable: "Photos du van, plan de banquette, besoins 12 V / 230 V / eau.",
  },
  {
    key: "materiel",
    title: "2. Commande du matériel",
    objective: "Commander une base cohérente sans doublons ni oubli bloquant.",
    customerAction: "Commander la base indispensable puis les options retenues ensemble.",
    fabsystemValidation: "Relire la liste d'achats et signaler les incompatibilités.",
    deliverable: "Paniers, captures d'écran ou liens avant paiement.",
  },
  {
    key: "implantation",
    title: "3. Implantation et préparation",
    objective: "Préparer les passages de câbles, les fixations et la logique du chantier.",
    customerAction: "Positionner la station, repérer les volumes et préparer les accès.",
    fabsystemValidation: "Contrôler l'implantation, la ventilation et le cheminement.",
    deliverable: "Photos de la banquette, du meuble et des passages de câbles.",
  },
  {
    key: "cablage",
    title: "4. Câblage contrôlé",
    objective: "Câbler proprement sans aller trop vite sur les points sensibles.",
    customerAction: "Poser les départs 12 V, le solaire, le réseau eau et le 230 V fixe.",
    fabsystemValidation: "Relire les photos, stopper les erreurs et valider avant branchement.",
    deliverable: "Photos des connexions, fusibles, platine, prises et faisceaux.",
  },
  {
    key: "essais",
    title: "5. Mise sous tension et essais",
    objective: "Faire les premiers tests dans le bon ordre et terminer sereinement.",
    customerAction: "Tester une fonction après l'autre : charge, frigo, pompe, USB, LED et prises.",
    fabsystemValidation: "Donner le feu vert, guider les essais et sécuriser la fin du chantier.",
    deliverable: "Retour de tests, vidéos courtes si besoin et photos finales.",
  },
] as const;

const PURCHASES: PurchaseItem[] = [
  {
    priority: "Indispensable",
    block: "Énergie",
    name: "Station AFERIY P280",
    why: "Le cœur du système : 2048 Wh, 2800 W, 12 V via XT60 et charge via XT90.",
    budgetCents: 85900,
    statusLabel: "À acheter",
    href: "https://fr.aferiy.com/products/aferiy-p280-station-denergie-portable-2800w-2048wh",
  },
  {
    priority: "Indispensable",
    block: "Solaire",
    name: "Panneau flexible 200 W ETFE",
    why: "Recharge utile sans compliquer le montage.",
    budgetCents: 12999,
    statusLabel: "À acheter",
    href: "https://fr.eco-worthy.com/collections/components/products/panneau-solaire-mono-flexible-200w",
  },
  {
    priority: "Indispensable",
    block: "Solaire",
    name: "Kit entrée solaire",
    why: "Adaptateur, rallonge, passe-toit et collage pour relier proprement le panneau à la P280.",
    budgetCents: 11888,
    statusLabel: "À acheter",
    href: "https://fr.aferiy.com/products/aferiy-cable-dextension-pour-panneau-solaire",
  },
  {
    priority: "Indispensable",
    block: "12 V",
    name: "Platine 12 V + fusible principal",
    why: "Distribuer proprement frigo, pompe, USB et éclairage.",
    budgetCents: 20738,
    statusLabel: "À acheter",
    href: "https://www.svb-marine.fr/fr/blue-sea-panneau-weatherdeck-4376-etanche-etanche-avec-fusibles-6circuits.html",
  },
  {
    priority: "Indispensable",
    block: "12 V",
    name: "Kit câblage 12 V complet",
    why: "Sections 6 / 4 / 2,5 / 1,5 mm² pour le tableau, le frigo, la pompe, l'USB et les LED.",
    budgetCents: 6670,
    statusLabel: "À acheter",
    href: "https://www.h2r-equipements.com/420-cables-electriques-camping-car",
  },
  {
    priority: "Indispensable",
    block: "Froid",
    name: "Dometic NRX 50E",
    why: "Frigo à compression fiable et adapté au gabarit du van.",
    budgetCents: 49900,
    statusLabel: "À acheter",
    href: "https://www.cabesto.com/fr/refrigerateur-nrx-50e-dometic-nu-0021887.html",
  },
  {
    priority: "Indispensable",
    block: "Eau",
    name: "Pompe Shurflo 10 L/min",
    why: "Bon compromis pour alimenter évier + douchette arrière.",
    budgetCents: 9990,
    statusLabel: "À acheter",
    href: "https://www.top-accessoires.com/eau-salle-de-bain-toilettes-pompe-shurflo-10l-mn-12v-30-psi/2421.html",
  },
  {
    priority: "Indispensable",
    block: "Eau",
    name: "Kit réseau eau",
    why: "Filtre, vase, tuyaux et raccords pour un circuit propre et durable.",
    budgetCents: 8580,
    statusLabel: "À acheter",
    href: "https://www.h2r-equipements.com/1627-raccord-cannele-filete-de-plomberie-en-camping-car-et-van",
  },
  {
    priority: "Indispensable",
    block: "Eau",
    name: "Robinet + douchette arrière",
    why: "Finaliser les deux points d'usage eau sans bricolage de dernière minute.",
    budgetCents: 8900,
    statusLabel: "À acheter",
    href: "https://www.mon-camping-car.com/categorie-prise-de-douche-exterieur-1.html",
  },
  {
    priority: "Indispensable",
    block: "230 V",
    name: "Kit 230 V fixe complet",
    why: "Prise quai, coffret, différentiel, disjoncteur, câble 3G2,5 et deux prises intérieures.",
    budgetCents: 20595,
    statusLabel: "À acheter",
    href: "https://www.h2r-equipements.com/socle-et-prise-electrique-carrosserie-van-et-camping-car/406-haba-socle-male-p17-a-encastrer-blanc.html",
  },
  {
    priority: "Indispensable",
    block: "Confort",
    name: "USB + éclairage LED",
    why: "Petits usages du quotidien, faciles à oublier et pourtant essentiels.",
    budgetCents: 5900,
    statusLabel: "À acheter",
    href: "https://www.reimo.com/fr/accessoires-camping-car/electricite-camping-car-batterie-camping-car/prise-12v-allume-cigare-adaptateur-allume-cigare-camping-car/67610/double-prise-de-charge-usb-12v/24v",
  },
  {
    priority: "Indispensable",
    block: "Pose",
    name: "Consommables électriques et de pose",
    why: "Cosses, XT60, XT90, gaines, colliers, fusibles, presse-étoupes et visserie.",
    budgetCents: 7000,
    statusLabel: "À acheter",
    href: "https://www.e44.com/connectique/connecteurs/fiche-xt60-femelle-souder-cable-awg12-XT60-FEMELLE.html",
  },
  {
    priority: "Option officielle",
    block: "Recharge alternateur",
    name: "AFERIY DC060",
    why: "La solution officielle la plus simple à défendre avec la P280 pour recharger en roulant.",
    budgetCents: 17900,
    statusLabel: "Option officielle",
    href: "https://fr.aferiy.com/products/aferiy-dc060-dc-dc-battery-charger",
  },
  {
    priority: "Option officielle",
    block: "Recharge alternateur",
    name: "Kit recharge voiture AFERIY",
    why: "Câble XT90 officiel + protections pour une logique cohérente avec la P280.",
    budgetCents: 10299,
    statusLabel: "Option officielle",
    href: "https://fr.aferiy.com/products/aferiy-xt90-acc-cable-de-recharge-pour-voiture",
  },
];

const DECISION_KEYS = [
  "energy.dailyConsumption",
  "battery.usefulEnergy",
  "battery.nominalCapacity",
  "battery.autonomy",
  "alternator.rechargeableEnergy",
  "solar.dailyEnergy",
  "charger.rechargeableEnergy",
  "energyBalance.autonomy",
] as const;

function inferCurrentStepIndex(retainedValues: ProjectRetainedValue[], hasSchema: boolean) {
  const namespaces = new Set(retainedValues.map((value) => value.key.split(".")[0]));
  const hasSizing = namespaces.has("energy") || namespaces.has("battery");
  const hasRecharge = namespaces.has("alternator") || namespaces.has("solar") || namespaces.has("charger");
  const hasDistribution =
    namespaces.has("circuit") || namespaces.has("cable") || namespaces.has("protection");
  const hasDiagram = namespaces.has("diagram") || hasSchema;

  if (hasDistribution || hasDiagram) return 3;
  if (hasSizing || hasRecharge) return 2;
  if (retainedValues.length > 0) return 1;
  return 0;
}

function readinessLabel(hasSchema: boolean, obsoleteCount: number, retainedModuleCount: number) {
  if (obsoleteCount > 0) {
    return "À recalculer";
  }
  if (hasSchema && retainedModuleCount >= 4) {
    return "Dossier solide";
  }
  if (retainedModuleCount > 0) {
    return "En construction";
  }
  return "À lancer";
}

function buildDecisionHighlights(retainedValues: ProjectRetainedValue[]) {
  const activeValues = retainedValues.filter((value) => value.status === "ACTIVE");
  const highlighted = DECISION_KEYS.map((key) => activeValues.find((value) => value.key === key))
    .filter((value): value is ProjectRetainedValue => Boolean(value))
    .map((value) => ({
      label: getRetainedValueLabel(value.key, value.value),
      value: formatRetainedValueDisplay(value.value, value.key) ?? "Valeur retenue",
    }));

  if (highlighted.length > 0) {
    return highlighted.slice(0, 6);
  }

  return activeValues
    .slice(0, 6)
    .map((value) => ({
      label: getRetainedValueLabel(value.key, value.value),
      value: formatRetainedValueDisplay(value.value, value.key) ?? "Donnée disponible",
    }));
}

export type AssignedKit = {
  name: string;
  items: Array<{ priority: string; block: string; name: string; why: string; budgetCents: number; href: string }>;
  photoControls: string[];
  powerControls: string[];
  checklist: string[];
};

function buildDossierFromKit(kit: AssignedKit) {
  const purchases: PurchaseItem[] = kit.items.map((item) => ({
    priority: item.priority === "Option officielle" ? "Option officielle" : "Indispensable",
    block: item.block,
    name: item.name,
    why: item.why,
    budgetCents: item.budgetCents,
    statusLabel: item.priority === "Option officielle" ? "Option officielle" : "À acheter",
    href: item.href,
  }));

  const budgetByBlock = new Map<string, number>();
  for (const item of kit.items) {
    budgetByBlock.set(item.block, (budgetByBlock.get(item.block) ?? 0) + item.budgetCents);
  }
  const budgetLines: BudgetLine[] = Array.from(budgetByBlock.entries()).map(([block, budgetCents]) => ({
    block,
    budgetCents,
  }));

  const budgetBaseCents = kit.items
    .filter((item) => item.priority !== "Option officielle")
    .reduce((sum, item) => sum + item.budgetCents, 0);
  const budgetWithOptionsCents = kit.items.reduce((sum, item) => sum + item.budgetCents, 0);

  const toControlItems = (lines: string[], statusLabel: string): ControlItem[] =>
    lines.map((title) => ({ title, why: "", statusLabel }));

  return {
    purchases,
    photoControls: toControlItems(kit.photoControls, "À envoyer"),
    powerControls: toControlItems(kit.powerControls, "À faire"),
    budgetLines,
    budgetBaseCents,
    budgetWithOptionsCents,
    dossierChecklist: [...kit.checklist],
  };
}

export function buildProjectFollowUpDossier(input: {
  project: Project;
  retainedValues: ProjectRetainedValue[];
  engineIds: RegisteredEngineId[];
  hasSchema: boolean;
  // Override manuel FabSystem (Project.followUpStepOverride) : quand
  // renseigne, remplace l'index deduit automatiquement. Sert quand le
  // client a communique une info hors editeur (mail, appel) et que
  // l'auto-detection base sur les ProjectRetainedValue ne peut pas le
  // savoir seule.
  stepOverride?: string | null;
  // Kit assigne (Project.kitId, lib/services/kit.ts) : remplace les listes
  // d'achat/budget/controles hardcodees d'un seul kit (AFERIY P280) qui
  // s'appliquaient a tort a tous les projets — bug corrige ici. Absent =
  // aucun kit assigne, ces sections restent vides (jamais un fallback sur
  // les anciennes constantes).
  kit?: AssignedKit | null;
}): ProjectFollowUpDossier {
  const inferredStepIndex = inferCurrentStepIndex(input.retainedValues, input.hasSchema);
  const overrideIndex = input.stepOverride
    ? STEP_TEMPLATES.findIndex((step) => step.key === input.stepOverride)
    : -1;
  const isStepOverridden = overrideIndex >= 0;
  const currentStepIndex = isStepOverridden ? overrideIndex : inferredStepIndex;
  const obsoleteCount = input.retainedValues.filter((value) => value.status === "OBSOLETE").length;
  const retainedModuleCount = input.engineIds.filter(
    (engineId) => moduleStatus(engineId, input.retainedValues) === "Retenu"
  ).length;

  const steps: FollowUpStep[] = STEP_TEMPLATES.map((step, index) => {
    const status: FollowUpStepStatus =
      index < currentStepIndex
        ? "done"
        : index === currentStepIndex
          ? "current"
          : "upcoming";

    return { ...step, status };
  });

  const engineSnapshots: FollowUpEngineSnapshot[] = input.engineIds.map((engineId) => {
    const status = moduleStatus(engineId, input.retainedValues);
    return {
      label: ENGINE_LABELS[engineId],
      status:
        status === "Retenu"
          ? "Retenu"
          : status === "À recalculer"
            ? "À recalculer"
            : "À compléter",
    };
  });

  const kitDossier = input.kit
    ? buildDossierFromKit(input.kit)
    : {
        purchases: [] as PurchaseItem[],
        photoControls: [] as ControlItem[],
        powerControls: [] as ControlItem[],
        budgetLines: [] as BudgetLine[],
        budgetBaseCents: 0,
        budgetWithOptionsCents: 0,
        dossierChecklist: [] as string[],
      };

  return {
    currentStepTitle: steps[currentStepIndex]?.title ?? STEP_TEMPLATES[0].title,
    isStepOverridden,
    inferredStepTitle: STEP_TEMPLATES[inferredStepIndex]?.title ?? STEP_TEMPLATES[0].title,
    readinessLabel: readinessLabel(input.hasSchema, obsoleteCount, retainedModuleCount),
    activeRetainedCount: input.retainedValues.filter((value) => value.status === "ACTIVE").length,
    obsoleteCount,
    retainedModuleCount,
    totalModuleCount: input.engineIds.length,
    hasSchema: input.hasSchema,
    hasKit: Boolean(input.kit),
    kitName: input.kit?.name ?? null,
    steps,
    ...kitDossier,
    decisionHighlights: buildDecisionHighlights(input.retainedValues),
    engineSnapshots,
  };
}

export function getPublicP280LightKit(): PublicP280LightKit {
  return {
    purchases: PURCHASES,
    budgetBaseCents: 249060,
    budgetWithOptionsCents: 277259,
    schemaUrl: "/schemas-electriques/schema-aferiy-p280-van",
    editorUrl: "/outils/schema?template=reference-v3-aferiy-p280",
    schemaLabel: "AFERIY P280 van",
    baseSummary: "Montage P280 + solaire + 12 V + 230 V fixe.",
    optionSummary: "Version propre avec DC060 et kit officiel AFERIY.",
    printNote:
      "Version light issue du guide P280 : liste d'achats, schéma conseillé et liens utiles. Pour un suivi complet dans le cloud, utilisez la version Suivi projet dans l'espace client FabSystem.",
  };
}

const VICTRON_LIGHT_PURCHASES: PurchaseItem[] = [
  {
    priority: "Indispensable",
    block: "Énergie",
    name: "Batterie LiFePO4 150 Ah",
    why: "Base service simple et crédible pour le frigo, l'eau, l'USB, les LED et le petit 230 V.",
    budgetCents: 34999,
    statusLabel: "À acheter",
    href: "https://fr.eco-worthy.com/products/batterie-lithium-lifepo4-12v-150ah-avec-bluetooth-protection-basse-temperature",
  },
  {
    priority: "Indispensable",
    block: "Énergie",
    name: "MultiPlus Compact 12/800/35-16",
    why: "Garde un vrai 230 V embarqué sans partir sur un convertisseur trop lourd pour ce cas d'usage.",
    budgetCents: 47700,
    statusLabel: "À acheter",
    href: "https://www.laboutiquesolaire.com/victron-energy-convertisseurs-chargeurs-multiplus-compact/1044-victron-energy-convertisseur-chargeur-multiplus-compact-12-800-35-16-8719076053029.html",
  },
  {
    priority: "Indispensable",
    block: "Solaire",
    name: "Solaire 200 W + MPPT + pose",
    why: "Panneau souple, SmartSolar 75/15 et accessoires de pose pour garder une recharge simple et lisible.",
    budgetCents: 26386,
    statusLabel: "À acheter",
    href: "https://www.idealo.fr/prix/6019083/victron-smartsolar-mppt-75-15.html",
  },
  {
    priority: "Indispensable",
    block: "Suivi",
    name: "SmartShunt 300A + coupe-batterie 275A",
    why: "Pour couper proprement le système et suivre la batterie service sans estimation approximative.",
    budgetCents: 11106,
    statusLabel: "À acheter",
    href: "https://ledenicheur.fr/product.php?p=14880979",
  },
  {
    priority: "Indispensable",
    block: "12 V",
    name: "WeatherDeck + protection principale + USB + LED",
    why: "Le cœur de la distribution 12 V avec les usages du quotidien déjà prévus.",
    budgetCents: 24520,
    statusLabel: "À acheter",
    href: "https://skysat.fr/en/products/blue-sea-weatherdeck-waterproof-circuit-breaker-panel-6-positions",
  },
  {
    priority: "Indispensable",
    block: "Câblage",
    name: "Câbles et consommables",
    why: "Sections principales, départs secondaires, cosses, gaines et consommables de pose.",
    budgetCents: 31000,
    statusLabel: "À acheter",
    href: "https://www.h2r-equipements.com/420-cables-electriques-camping-car",
  },
  {
    priority: "Indispensable",
    block: "Froid",
    name: "Dometic NRX 50E",
    why: "Le frigo à compression qui sert de repère de consommation dans ce montage.",
    budgetCents: 49900,
    statusLabel: "À acheter",
    href: "https://www.cabesto.com/fr/refrigerateur-nrx-50e-dometic-nu-0021887.html",
  },
  {
    priority: "Indispensable",
    block: "Eau",
    name: "Kit eau complet",
    why: "Pompe, filtre, vase, douchette, tuyaux et raccords pour un circuit propre dès le départ.",
    budgetCents: 32668,
    statusLabel: "À acheter",
    href: "https://www.mon-camping-car.com/prise-douche-exterieure-blanche.html",
  },
  {
    priority: "Indispensable",
    block: "230 V",
    name: "Kit quai + protections + prises fixes",
    why: "Pour garder un petit réseau 230 V sérieux, lisible et réellement protégé.",
    budgetCents: 17446,
    statusLabel: "À acheter",
    href: "https://www.h2r-equipements.com/socle-et-prise-electrique-carrosserie-van-et-camping-car/5737-haba-socle-cee-p17-a-encastrer.html",
  },
  {
    priority: "Option officielle",
    block: "Recharge roulage",
    name: "Orion-Tr Smart 12/12-18A",
    why: "Solution propre si la recharge alternateur fait partie du besoin réel.",
    budgetCents: 12896,
    statusLabel: "Option",
    href: "https://www.idealo.fr/prix/202091650/victron-orion-tr-dc-dc-12-12-18-220-w.html",
  },
  {
    priority: "Option officielle",
    block: "Recharge roulage",
    name: "Câblage et protections Orion",
    why: "Compléter l'Orion avec des liaisons 16 mm² et des protections cohérentes.",
    budgetCents: 7500,
    statusLabel: "Option",
    href: "https://www.h2r-equipements.com/420-cables-electriques-camping-car",
  },
  {
    priority: "Option officielle",
    block: "Suivi",
    name: "VE.Bus Smart Dongle",
    why: "Ajoute le suivi du MultiPlus dans VictronConnect si vous voulez une lecture plus unifiée.",
    budgetCents: 9127,
    statusLabel: "Option",
    href: "https://ledenicheur.fr/product.php?p=13245432",
  },
];

export function getPublicVictronLightKit(): PublicLightKit {
  return {
    purchases: VICTRON_LIGHT_PURCHASES,
    budgetBaseCents: 275725,
    budgetWithOptionsCents: 305248,
    schemaUrl: "/schemas-electriques/schema-vito-280ah-van",
    editorUrl: "/outils/schema?template=reference-v3-vito-280ah",
    schemaLabel: "Victron leger van",
    baseSummary: "Montage Victron leger avec solaire 200 W, vrai 12 V et petit 230 V fixe.",
    optionSummary: "Version avec recharge alternateur Orion et suivi MultiPlus.",
    printNote:
      "Version light issue du guide Victron leger : liste d'achats, schéma conseillé et liens utiles. Pour un suivi complet dans le cloud, utilisez la version Suivi projet dans l'espace client FabSystem.",
  };
}
