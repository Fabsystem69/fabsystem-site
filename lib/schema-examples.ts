import { getSchemaTemplate } from "@/features/schemas/templates";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

const BASE_URL = "https://www.fabsystem.fr";

export type SchemaExample = {
  slug: string;
  templateId: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  thumbnailSrc: string;
  thumbnailAlt: string;
  audience: string;
  level: string;
  context: string;
  flow: string[];
  highlights: string[];
  includes: string[];
  watchouts: string[];
};

export const FEATURED_SCHEMA_EXAMPLE_SLUG = "schema-vito-280ah-van";

export const SCHEMA_EXAMPLES: SchemaExample[] = [
  {
    slug: "schema-vito-280ah-van",
    templateId: "reference-v3-vito-280ah",
    title: "Schéma van lithium 280 Ah avec solaire et 230 V",
    metaTitle: "Schema van lithium 280 Ah : solaire, DC-DC, MultiPlus et supervision",
    metaDescription:
      "Exemple de schema electrique pour van avec batterie lithium 280 Ah, regulateur MPPT, DC-DC, MultiPlus, BatteryProtect et supervision, a ouvrir dans l'editeur FabSystem.",
    description:
      "Une base van aboutie mais encore lisible, avec une vraie batterie service lithium, une recharge solaire, une recharge alternateur, du 230 V et une supervision centralisee.",
    thumbnailSrc: "/schema-examples/schema-electrique-van-complet-card-v2.webp",
    thumbnailAlt: "Apercu d'un schema van lithium 280 Ah avec solaire et 230 V",
    audience: "Intermediaire a avance",
    level: "Complet et evolutif",
    context:
      "Vito Marco Polo ou van equivalent qui veut une installation serieuse avec lithium, MPPT, DC-DC, MultiPlus, protections et reseau 12 V / 230 V clair.",
    flow: ["Panneau solaire", "MPPT", "Batterie lithium 280 Ah", "Busbars et protections", "MultiPlus", "Supervision"],
    highlights: [
      "Voir comment plusieurs sources de charge se rejoignent proprement autour d'une batterie lithium principale.",
      "Comprendre la place du MultiPlus, du BatteryProtect, du shunt et des protections principales dans un van vraiment equipe.",
      "Partir d'une base lisible avant d'adapter les consommateurs, la capacite ou les longueurs de cable a votre implantation reelle.",
    ],
    includes: [
      "Une batterie lithium 280 Ah avec recharge solaire et recharge alternateur via DC-DC.",
      "Une distribution 12 V structuree autour de busbars, protections et supervision.",
      "Un reseau 230 V embarque via MultiPlus pour garder une architecture claire entre DC et AC.",
    ],
    watchouts: [
      "Les sections, fusibles et longueurs affichees ne sont valables que pour ce montage precis et doivent etre reverifies sur votre van.",
      "Le 230 V fixe et la logique de protection ne se recopient jamais sans verification du materiel exact et de l'implantation.",
      "Le schema reste une base de travail serieuse, pas une validation electrique finale de l'installation.",
    ],
  },
  {
    slug: "schema-solaire-12v-simple",
    templateId: "solaire-simple",
    title: "Schéma solaire 12V simple",
    metaTitle: "Schéma solaire 12V simple : panneaux, MPPT, batterie",
    metaDescription:
      "Schéma solaire 12V simple avec deux panneaux, un MPPT et une batterie. Fiche claire pour débuter, à ouvrir directement dans l'éditeur ou à imprimer en PDF.",
    description:
      "Le schéma le plus simple pour comprendre la chaîne solaire sans se perdre dans toute une distribution complète dès le départ.",
    thumbnailSrc: "/schema-examples/schema-solaire-12v-simple-card-v2.webp",
    thumbnailAlt: "Aperçu réduit du schéma solaire 12V simple",
    audience: "Débutant",
    level: "Très accessible",
    context: "Premier panneau solaire sur van, bateau ou petite installation autonome 12V.",
    flow: ["Panneaux solaires", "MPPT", "Fusible de sortie", "Batterie 12V", "Écran de contrôle"],
    highlights: [
      "Comprendre la logique panneaux vers régulateur puis batterie.",
      "Visualiser la protection côté sortie MPPT et le petit circuit de monitoring.",
      "Partir d'une base propre avant d'ajouter des consommateurs ou un tableau de distribution.",
    ],
    includes: [
      "Une lecture simple pour se repérer sans jargon inutile.",
      "Un excellent gabarit à ouvrir dans l'éditeur pour faire ses premiers essais.",
      "Un support pratique pour discuter d'un futur ajout de distribution 12V.",
    ],
    watchouts: [
      "Les sections et fusibles restent à confirmer selon la puissance réelle des panneaux et la distance.",
      "Le montage exact des panneaux en parallèle ou en série dépend du régulateur et des modules choisis.",
      "Ajoutez ensuite seulement la distribution 12V pour garder un schéma lisible.",
    ],
  },
  {
    slug: "schema-bateau-quai-chargeur",
    templateId: "quai-tranquille",
    title: "Schéma électrique bateau au quai",
    metaTitle: "Schéma électrique bateau au quai : chargeur, solaire et pompe",
    metaDescription:
      "Exemple de schéma électrique bateau avec alimentation de quai, chargeur secteur, appoint solaire et pompe de cale. Explications claires, impression PDF et ouverture dans l'éditeur.",
    description:
      "Une base pensée pour un bateau souvent au port, avec recharge secteur, appoint solaire et circuits 12V essentiels.",
    thumbnailSrc: "/schema-examples/schema-bateau-quai-chargeur-card-v2.webp",
    thumbnailAlt: "Aperçu réduit du schéma électrique bateau au quai",
    audience: "Débutant à intermédiaire",
    level: "Usage courant",
    context: "Bateau qui passe beaucoup de temps au quai, avec besoin de garder une installation fiable et lisible.",
    flow: ["Prise de quai", "Tableau 220V", "Chargeur secteur", "Batterie 12V", "Busbar + consommateurs", "Pompe de cale"],
    highlights: [
      "Voir comment le quai, le chargeur et le solaire cohabitent sur une même batterie.",
      "Comprendre pourquoi la pompe de cale automatique garde sa propre alimentation protégée.",
      "Repérer la séparation entre le 230V de quai et la distribution 12V du bord.",
    ],
    includes: [
      "Une base utile pour fiabiliser un bateau simple sans refaire tout le bord.",
      "Une lecture claire de la logique de charge et des circuits prioritaires.",
      "Un bon support pour préparer un diagnostic ou une remise au propre.",
    ],
    watchouts: [
      "Le 230V et les mises à la terre demandent une attention particulière : ne pas improviser.",
      "La pompe de cale doit rester prioritaire et indépendante des coupures du reste de l'installation.",
      "La corrosion, les cosses et les retours négatifs sont souvent aussi importants que le schéma lui-même.",
    ],
  },
  {
    slug: "schema-atelier-mobile-ducato",
    templateId: "reference-v3-atelier-ducato",
    title: "Schema atelier mobile ou van d'intervention",
    metaTitle: "Schema atelier mobile Ducato : implantation electrique complete",
    metaDescription:
      "Exemple de schema d'implantation electrique pour atelier mobile ou van d'intervention, avec zones reelles, distribution DC, solaire, quai et supervision.",
    description:
      "Une base pensee non seulement comme schema de principe, mais aussi comme aide a l'implantation reelle dans un utilitaire ou un atelier mobile.",
    thumbnailSrc: "/schema-examples/schema-station-electrique-van-card-v2.webp",
    thumbnailAlt: "Apercu d'un schema d'implantation pour atelier mobile ou van d'intervention",
    audience: "Intermediaire",
    level: "Implantation et lecture terrain",
    context: "Ducato, utilitaire ou atelier mobile avec besoin de reperer les zones techniques, les distances et les sous-ensembles dans un volume reel.",
    flow: ["Toit solaire", "Compartiment moteur", "Coeur DC", "Distribution 12 V", "Quai / AC", "Supervision"],
    highlights: [
      "Voir comment une implantation reelle modifie la lecture des longueurs de cable et des regroupements techniques.",
      "Comprendre pourquoi certaines zones doivent rester compactes pour eviter des allers-retours inutiles sur le schema.",
      "Utiliser cette base comme repere d'atelier, pas seulement comme schema abstrait.",
    ],
    includes: [
      "Une lecture par zones avec implantation plus physique des sous-ensembles.",
      "Un point de depart utile pour un vehicule d'intervention, un atelier mobile ou un grand fourgon technique.",
      "Une base pour discuter ensuite des vraies longueurs, des passages et des protections associees.",
    ],
    watchouts: [
      "Une implantation propre sur le papier ne remplace pas le releve reel des passages, des hauteurs et des distances.",
      "Les sections, protections et zones doivent rester coherentes avec le courant reel et le materiel installe.",
      "Ce schema aide a preparer une implantation, mais ne remplace pas un controle electrique final du vehicule.",
    ],
  },
  {
    slug: "schema-aferiy-p280-van",
    templateId: "reference-v3-aferiy-p280",
    title: "Schema van avec station AFERIY P280",
    metaTitle: "Schema van AFERIY P280 : solaire, quai, DC-DC et sorties AC",
    metaDescription:
      "Exemple de schema de van autour d'une AFERIY P280 avec solaire, recharge DC-DC, prise de quai, sortie XT60 12 V et prises AC, a ouvrir dans l'editeur FabSystem.",
    description:
      "Un exemple concret pour garder un van simple autour d'une station tout-en-un, sans reconstruire tout un systeme batterie, MPPT et convertisseur separes.",
    thumbnailSrc: "/schema-examples/schema-aferiy-p280-van-card-v2.webp",
    thumbnailAlt: "Apercu d'un schema AFERIY P280 pour van",
    audience: "Debutant motive a intermediaire",
    level: "Compact mais structure",
    context:
      "Van amenage qui veut rester simple: solaire, prise de quai, recharge vehicule optionnelle, petite distribution 12 V fixe et quelques usages AC.",
    flow: ["Panneau solaire", "Recharge DC-DC", "Prise de quai", "AFERIY P280", "XT60 12 V", "Prises AC"],
    highlights: [
      "Voir ce qu'une station tout-en-un simplifie reellement dans le schema et ce qu'elle laisse a gerer autour.",
      "Comprendre la separation entre les usages 12 V fixes, les protections et les sorties AC de la station.",
      "Partir d'un schema moderne et compact sans masquer les vraies limites de courant et de connectique.",
    ],
    includes: [
      "Une recharge solaire, une recharge vehicule via DC-DC et une prise de quai traitees comme trois chemins distincts.",
      "Un petit reseau 12 V fixe pour les usages quotidiens du van.",
      "Une base utile pour comparer station tout-en-un et architecture plus classique.",
    ],
    watchouts: [
      "La sortie XT60 12 V reste limitee et ne remplace pas une grosse distribution DC.",
      "Le 230 V fixe demande toujours une vraie logique de protection, neutre et terre.",
      "Les compatibilites de charge et les limites constructeur de la station doivent toujours etre reverifiees.",
    ],
  },
  {
    slug: "schema-camping-car-autonome-clim",
    templateId: "reference-v3-camping-car-ds300",
    title: "Schema camping-car autonome avec climatisation 12 V",
    metaTitle: "Schema camping-car autonome : lithium, solaire, 230 V et clim 12 V",
    metaDescription:
      "Exemple de schema electrique complet pour camping-car avec batterie lithium, solaire, DC-DC, MultiPlus et climatisation 12 V, a ouvrir dans l'editeur FabSystem.",
    description:
      "Un exemple de camping-car complet pour comprendre comment cohabitent lithium, solaire, recharge alternateur, 230 V et un depart fort courant pour la climatisation 12 V.",
    thumbnailSrc: "/articles/installation-electrique-van-guide.webp",
    thumbnailAlt: "Apercu d'un schema de camping-car autonome avec climatisation 12 V",
    audience: "Intermediaire a avance",
    level: "Systeme complet",
    context:
      "Camping-car equipe pour plus d'autonomie avec une vraie batterie service, des charges multiples, du 230 V et un besoin de gerer une climatisation 12 V separee.",
    flow: [
      "Solaire",
      "DC-DC",
      "Batterie lithium",
      "Busbars et protections",
      "MultiPlus",
      "Climatisation 12 V",
    ],
    highlights: [
      "Voir comment un depart climatisation 12 V puissant s'isole du reste de la distribution classique.",
      "Comprendre la cohabitation entre reseau 12 V quotidien, recharge multiple et 230 V embarque.",
      "Utiliser une base complete sans perdre la lecture des sous-ensembles techniques.",
    ],
    includes: [
      "Une batterie lithium, un MPPT, un DC-DC et un MultiPlus dans une architecture de camping-car aboutie.",
      "Un depart fort courant dedie a la climatisation 12 V avec protection en amont.",
      "Une lecture claire des zones techniques principales avant adaptation a votre propre implantation.",
    ],
    watchouts: [
      "Une climatisation 12 V change fortement les intensites, les sections et les protections a retenir.",
      "Le schema aide a structurer le systeme mais ne remplace pas un dimensionnement final avec vos vraies longueurs et puissances.",
      "Le 230 V et les gros courants DC doivent etre verifies avec une logique de securite complete avant cablage.",
    ],
  },
  {
    slug: "schema-voilier-autonome-12v-230v",
    templateId: "reference-v3-voilier-10m",
    title: "Schema voilier autonome avec 12 V et 230 V",
    metaTitle: "Schema voilier autonome : solaire, DC-DC, quai, MultiPlus et distribution",
    metaDescription:
      "Exemple de schema electrique pour voilier ou bateau autonome avec solaire, alternateur ou DC-DC, quai, distribution 12 V, supervision et 230 V embarque.",
    description:
      "Le schema bateau le plus complet de cette selection, pense pour un voilier ou un bateau de croisiere qui doit rester lisible malgre plusieurs sources de charge et plusieurs sous-ensembles.",
    thumbnailSrc: "/schema-examples/schema-bateau-complet-lynx-card-v2.webp",
    thumbnailAlt: "Apercu d'un schema de voilier autonome avec 12 V et 230 V",
    audience: "Intermediaire a avance",
    level: "Bateau autonome complet",
    context:
      "Voilier ou bateau de croisiere avec solaire, recharge moteur, quai, distribution 12 V et besoins AC embarques, sans perdre la lisibilite du schema.",
    flow: ["Solaire", "Alternateur / DC-DC", "Quai", "Coeur DC", "Distribution 12 V", "Monitoring et AC"],
    highlights: [
      "Voir comment plusieurs sources de charge cohabitent sur un bateau sans rendre le schema illisible.",
      "Comprendre la separation entre coeur DC, distribution, monitoring et partie quai / 230 V.",
      "Partir d'une base de refit plus realiste qu'un schema trop abstrait ou trop minimal.",
    ],
    includes: [
      "Une architecture bateau avec solaire, recharge moteur, quai et reseau 12 V structure.",
      "Un exemple utile pour un refit de voilier ou une remise au propre d'un bord existant.",
      "Une base a ouvrir dans l'editeur avant d'ajouter vos propres circuits, protections et longueurs.",
    ],
    watchouts: [
      "Sur un bateau, le traitement du 230 V, des terres et des retours negatifs ne s'improvise pas.",
      "La corrosion, la qualite des sertissages et la logique de distribution comptent autant que le schema lui-meme.",
      "Le schema reste une base de travail et doit etre adapte a vos distances, puissances et materiels reels.",
    ],
  },
];

export const SCHEMA_EXAMPLE_COUNT = SCHEMA_EXAMPLES.length;
export const SCHEMA_EXAMPLE_SLUGS = SCHEMA_EXAMPLES.map((example) => example.slug);

export function getSchemaExampleBySlug(slug: string) {
  return SCHEMA_EXAMPLES.find((example) => example.slug === slug);
}

export function getSchemaExampleHref(slug: string) {
  return `/schemas-electriques/${slug}`;
}

export function getSchemaExampleAbsoluteUrl(slug: string) {
  return `${BASE_URL}${getSchemaExampleHref(slug)}`;
}

export function getSchemaExampleThumbnailSrc(slug: string) {
  return getSchemaExampleBySlug(slug)?.thumbnailSrc ?? null;
}

export function getSchemaExampleThumbnailAbsoluteUrl(slug: string) {
  const thumbnailSrc = getSchemaExampleThumbnailSrc(slug);
  return thumbnailSrc ? `${BASE_URL}${thumbnailSrc}` : null;
}

export function getSchemaEditorTemplateHref(templateId: string) {
  return `/outils/schema?template=${encodeURIComponent(templateId)}`;
}

export function getSchemaExampleTemplate(slug: string) {
  const example = getSchemaExampleBySlug(slug);
  if (!example) return null;
  return getSchemaTemplate(example.templateId) ?? null;
}

// --- Données dérivées du vrai gabarit (jamais tapées à la main) ---------
//
// Contrairement au reste de `SchemaExample` (texte éditorial), ce qui suit
// est recalculé à chaque appel à partir de `template.build()` : la liste des
// composants et le tableau de câblage restent donc toujours synchronisés
// avec le vrai gabarit de `features/schemas/templates.ts`, même s'il évolue
// plus tard. Voir `lib/electrical-components/checks.ts` et `auto-size.ts`
// pour le même style de parcours nodes/edges déjà utilisé ailleurs dans le
// projet.

export interface SchemaExampleComponentSummary {
  key: string;
  /** Libellé affiché : "Marque Modèle" si connu, sinon le type générique. */
  label: string;
  /** Libellé du type de composant (ex. "MPPT", "Batterie"). */
  typeLabel: string;
  brand?: string;
  model?: string;
  count: number;
}

// Un node de gabarit est un vrai composant électrique dès lors que ce n'est
// pas une zone de regroupement purement visuelle (voir `buildZone` dans
// templates.ts, toujours `componentType: "zone"`).
function isRealComponentNode(data: ElectricalNodeData | undefined): data is ElectricalNodeData {
  return Boolean(data) && data!.componentType !== "zone";
}

export function getSchemaExampleComponents(slug: string): SchemaExampleComponentSummary[] {
  const template = getSchemaExampleTemplate(slug);
  if (!template) return [];

  const { nodes } = template.build();
  const grouped = new Map<string, SchemaExampleComponentSummary>();

  for (const node of nodes) {
    const data = node.data as ElectricalNodeData | undefined;
    if (!isRealComponentNode(data)) continue;

    const def = getComponentDefinition(data.componentType);
    const typeLabel = def?.label ?? data.componentType;
    const brand = typeof data.brand === "string" && data.brand.trim() ? data.brand.trim() : undefined;
    const model = typeof data.model === "string" && data.model.trim() ? data.model.trim() : undefined;
    const hasKnownBrand = Boolean(data.brandModelId) || Boolean(brand && model);

    const label = hasKnownBrand && brand && model ? `${brand} ${model}` : typeLabel;
    const key = hasKnownBrand && brand && model ? `brand:${data.componentType}:${brand}:${model}` : `generic:${data.componentType}`;

    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(key, { key, label, typeLabel, brand, model, count: 1 });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label, "fr");
  });
}

export interface SchemaExampleWiringRow {
  id: string;
  fromLabel: string;
  toLabel: string;
  section: string;
  length: number | null;
  polarity: "positif" | "négatif";
}

const MAX_WIRING_ROWS = 12;

function parseSectionMm2(section: string): number {
  const matches = section.match(/\d+(?:[.,]\d+)?/g);
  const raw = matches?.[matches.length - 1];
  if (!raw) return 0;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) ? value : 0;
}

function nodeLabel(nodes: { id: string; data: ElectricalNodeData }[], nodeId: string): string {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return nodeId;
  const def = getComponentDefinition(node.data.componentType);
  return String(node.data.label ?? def?.label ?? node.data.componentType);
}

// Câbles de puissance (+ et −) les plus significatifs du gabarit : triés par
// section décroissante (les câbles principaux batterie/protection/sources
// ont les plus grosses sections) et limités à `MAX_WIRING_ROWS` pour rester
// lisibles — un gabarit complet comme "bateau-premium" a une centaine de
// câbles, la majorité étant du petit consommateur peu utile en tableau.
export function getSchemaExampleWiring(slug: string): SchemaExampleWiringRow[] {
  const template = getSchemaExampleTemplate(slug);
  if (!template) return [];

  const { nodes, edges } = template.build();
  const typedNodes = nodes as { id: string; data: ElectricalNodeData }[];

  const rows: (SchemaExampleWiringRow & { sortSection: number })[] = [];
  const seen = new Set<string>();

  for (const edge of edges) {
    const data = edge.data as CableEdgeData | undefined;
    const cableType = data?.cableType;
    const section = data?.section;
    if (!data || !section) continue;
    if (cableType !== "power-positive" && cableType !== "power-negative") continue;

    const fromLabel = nodeLabel(typedNodes, edge.source);
    const toLabel = nodeLabel(typedNodes, edge.target);
    const dedupeKey = `${fromLabel}→${toLabel}:${section}:${cableType}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    rows.push({
      id: edge.id,
      fromLabel,
      toLabel,
      section,
      length: typeof data.length === "number" ? data.length : null,
      polarity: cableType === "power-positive" ? "positif" : "négatif",
      sortSection: parseSectionMm2(section),
    });
  }

  return rows
    .sort((a, b) => b.sortSection - a.sortSection)
    .slice(0, MAX_WIRING_ROWS)
    .map((row) => ({
      id: row.id,
      fromLabel: row.fromLabel,
      toLabel: row.toLabel,
      section: row.section,
      length: row.length,
      polarity: row.polarity,
    }));
}
