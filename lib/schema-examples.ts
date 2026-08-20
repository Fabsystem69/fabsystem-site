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

export const FEATURED_SCHEMA_EXAMPLE_SLUG = "schema-aferiy-p280-van";

export const SCHEMA_EXAMPLES: SchemaExample[] = [
  {
    slug: "schema-victron-leger-van",
    templateId: "victron-light-van",
    title: "Schéma Victron léger pour van",
    metaTitle: "Schéma Victron léger van : MPPT 75/15, MultiPlus 800 et LiFePO4 150Ah",
    metaDescription:
      "Exemple de schéma Victron léger pour van avec batterie LiFePO4 150Ah, SmartSolar MPPT 75/15, MultiPlus Compact 12/800, SmartShunt et Orion 18A optionnel.",
    description:
      "Une base cohérente pour un van simple et évolutif, avec un vrai réseau 12V, un petit 230V propre et un monitoring Bluetooth sans surdimensionnement.",
    thumbnailSrc: "/articles/installation-electrique-van-victron-legere.jpg",
    thumbnailAlt: "Illustration d'une architecture Victron légère pour van",
    audience: "Débutant motivé à intermédiaire",
    level: "Complet mais raisonnable",
    context:
      "VW T5/T6 ou van équivalent qui veut rester lisible : frigo, pompe, USB, LED, prise de quai, solaire 200W et deux prises 230V pour petits chargeurs.",
    flow: ["Panneau 200W", "MPPT 75/15", "Batterie LiFePO4 150Ah", "SmartShunt + tableau 12V", "MultiPlus 12/800", "Orion 18A optionnel"],
    highlights: [
      "Voir comment une installation Victron légère reste sérieuse sans tomber dans un système trop lourd pour un usage classique.",
      "Repérer clairement la séparation entre la batterie service, la distribution 12V et le petit réseau 230V.",
      "Comprendre où placer le shunt, le fusible principal et les protections autour du MultiPlus.",
    ],
    includes: [
      "Un solaire 200W via SmartSolar MPPT 75/15.",
      "Une batterie LiFePO4 150Ah avec SmartShunt et distribution 12V dédiée.",
      "Une recharge secteur via MultiPlus Compact 12/800/35-16 et une recharge alternateur via Orion 18A en option.",
    ],
    watchouts: [
      "Le 230V fixe dans le mobilier demande toujours une vraie logique de protection et de mise en œuvre, même avec un MultiPlus.",
      "Les longueurs réelles de câble et le calibre du fusible principal doivent être recalculés pour votre implantation.",
      "Le monitoring du MultiPlus dans VictronConnect demande un VE.Bus Smart Dongle si vous voulez un suivi unifié dans l'application.",
    ],
  },
  {
    slug: "schema-electrique-van-complet",
    templateId: "van-complet",
    title: "Schéma électrique van complet 12V",
    metaTitle: "Schéma électrique van complet 12V : exemple à ouvrir ou imprimer",
    metaDescription:
      "Exemple de schéma électrique van 12V complet avec solaire, alternateur, chargeur et distribution. Fiche explicative, ouverture directe dans l'éditeur et impression PDF.",
    description:
      "Un point de départ déjà avancé pour visualiser une installation van avec plusieurs sources de charge et une distribution 12V plus structurée.",
    thumbnailSrc: "/schema-examples/schema-electrique-van-complet-card-v2.webp",
    thumbnailAlt: "Aperçu réduit du schéma électrique van complet 12V",
    audience: "Débutant motivé à niveau intermédiaire",
    level: "Avancé mais lisible",
    context: "Van ou fourgon déjà un peu équipé, avec plusieurs sources de charge à faire cohabiter.",
    flow: ["Panneaux solaires", "MPPT", "Batterie service", "Busbars & protections", "Convertisseur / chargeur", "Consommateurs 12V"],
    highlights: [
      "Voir comment plusieurs sources de charge se rejoignent autour de la batterie service.",
      "Comprendre où placer les protections principales avant la distribution.",
      "Repérer les sous-ensembles qui méritent ensuite un calcul de section ou de fusible dédié.",
    ],
    includes: [
      "Une base réaliste pour un van plus confortable qu'un montage minimal.",
      "Une lecture d'ensemble utile avant de personnaliser votre propre schéma.",
      "Un bon support si vous voulez ensuite affiner un circuit par circuit.",
    ],
    watchouts: [
      "À ne pas recopier tel quel sans recalculer les sections, les fusibles et les longueurs réelles.",
      "Le câblage principal dépend toujours du courant maxi, du fusible principal et du chemin réel.",
      "La masse, les coupes-batterie et la logique de charge doivent rester cohérents avec votre matériel exact.",
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
    slug: "schema-station-electrique-van",
    templateId: "station-electrique",
    title: "Schéma station électrique van",
    metaTitle: "Schéma station électrique van : solaire, quai, 220V et 12V",
    metaDescription:
      "Exemple de schéma pour station électrique de van avec entrée solaire, prise de quai, circuit 220V protégé et distribution 12V. Fiche commentée, ouverture dans l'éditeur et impression PDF.",
    description:
      "Un exemple utile si vous partez d'une station tout-en-un et voulez garder une distribution simple, propre et compréhensible.",
    thumbnailSrc: "/schema-examples/schema-station-electrique-van-card-v2.webp",
    thumbnailAlt: "Aperçu réduit du schéma station électrique pour van",
    audience: "Débutant à intermédiaire",
    level: "Moderne et compact",
    context: "Van aménagé autour d'une station électrique type EcoFlow, avec besoins 220V et 12V.",
    flow: ["Panneau solaire", "Prise de quai", "Station électrique", "Tableau 220V", "Fusible 12V", "Tableau de distribution"],
    highlights: [
      "Comprendre ce que la station simplifie vraiment dans le schéma.",
      "Voir comment séparer le circuit 220V protégé et le circuit 12V.",
      "Garder une distribution lisible sans recréer tout un système classique batterie + convertisseur.",
    ],
    includes: [
      "Une base concrète pour un van léger ou évolutif.",
      "Une bonne transition entre solution nomade et vraie distribution embarquée.",
      "Un schéma pratique à personnaliser si vous ajoutez frigo, éclairage et pompe à eau.",
    ],
    watchouts: [
      "Chaque station a ses limites d'entrée, de sortie et de recharge : vérifiez toujours la notice.",
      "Les circuits 12V en sortie méritent malgré tout des protections cohérentes et une distribution propre.",
      "Le schéma reste un point de départ pédagogique, pas un remplacement des données constructeur.",
    ],
  },
  {
    slug: "schema-aferiy-p280-van",
    templateId: "station-aferiy-p280",
    title: "Schéma AFERIY P280 pour van",
    metaTitle: "Schéma AFERIY P280 van : XT90 solaire, XT60 12V et prises AC",
    metaDescription:
      "Exemple de schéma de van autour d'une AFERIY P280 avec panneau 200W, recharge véhicule / DC-DC optionnelle, prise de quai, sortie XT60 12V, petit tableau 12V et deux prises AC.",
    description:
      "Un exemple concret pour organiser un van autour d'une AFERIY P280 sans repartir sur une architecture batterie + MPPT + convertisseur entièrement séparée.",
    thumbnailSrc: "/schema-examples/schema-aferiy-p280-van-card-v2.webp",
    thumbnailAlt: "Aperçu réduit du schéma AFERIY P280 pour van",
    audience: "Débutant motivé à intermédiaire",
    level: "Compact mais à lire avec méthode",
    context:
      "Van aménagé qui veut rester simple : solaire 200W, recharge véhicule optionnelle, prise de quai, petit réseau 12V fixe et deux prises AC traitées sérieusement.",
    flow: ["Panneau 200W", "Recharge DC-DC", "Prise de quai", "AFERIY P280", "XT60 12V", "2 prises AC"],
    highlights: [
      "Voir comment les deux entrées XT90, l'entrée secteur et la sortie XT60 structurent vraiment le schéma.",
      "Comprendre ce qu'une station tout-en-un simplifie, et ce qu'elle ne simplifie pas du tout.",
      "Séparer clairement le réseau 12V quotidien et le 230V fixe pour éviter les raccourcis dangereux.",
    ],
    includes: [
      "Un petit tableau 12V fixe pour frigo, pompe, USB et éclairage LED.",
      "Une recharge solaire, une recharge véhicule / DC-DC et une prise de quai traitées comme trois chemins distincts.",
      "Un support clair pour discuter ensuite des limites réelles du XT60 et du 230V fixe.",
    ],
    watchouts: [
      "La sortie XT60 12V / 25A reste limitée : elle ne remplace pas une grosse distribution 12V.",
      "Le 230V fixe mérite une vraie réflexion de protection et de logique neutre / terre, pas une simple recopie.",
      "Les schémas AFERIY et les compatibilités de charge doivent toujours être recoupés avec la documentation constructeur.",
    ],
  },
  {
    slug: "schema-bateau-complet-lynx",
    templateId: "bateau-premium",
    title: "Schéma bateau complet avec bus Lynx",
    metaTitle: "Schéma bateau complet : bus Lynx, MultiPlus-II, Cerbo GX",
    metaDescription:
      "Exemple de schéma électrique bateau complet avec solaire, éolien, alternateur/DC-DC et quai/groupe électrogène, batterie Lithium NG sur bus Lynx complet, MultiPlus-II, Cerbo GX et deux tableaux 12V distincts.",
    description:
      "Le schéma le plus complet du catalogue, pensé pour un bateau habité ou parti en grande croisière : quatre sources de charge, un vrai bus de distribution Lynx et deux tableaux 12V séparés pour garder de la lisibilité malgré la taille du système.",
    thumbnailSrc: "/schema-examples/schema-bateau-complet-lynx-card-v2.webp",
    thumbnailAlt: "Aperçu réduit du schéma bateau complet avec bus Lynx",
    audience: "Intermédiaire à avancé, bateau habité ou grande unité",
    level: "Système complet, à lire avec méthode",
    context:
      "Voilier ou bateau à moteur équipé pour la grande croisière ou l'habitation à l'année, avec plusieurs sources de charge à faire cohabiter et un vrai besoin de séparer confort et sécurité.",
    flow: [
      "Solaire + éolien + alternateur/DC-DC",
      "Quai / groupe électrogène",
      "Bus Lynx (Power In, Smart BMS, Distributor, Shunt)",
      "MultiPlus-II + Cerbo GX",
      "Tableau confort",
      "Tableau pont & sécurité",
    ],
    highlights: [
      "Voir comment quatre sources de charge différentes (solaire, éolien, alternateur/DC-DC, quai ou groupe) se rejoignent proprement sur un seul bus Lynx.",
      "Comprendre pourquoi certaines sources tapent directement sur la borne SYS+ du Lynx Smart BMS plutôt que de passer par les sorties du Lynx Distributor.",
      "Repérer la logique des deux tableaux 12V séparés (confort à l'intérieur, pont et sécurité), chacun avec son propre bus négatif.",
    ],
    includes: [
      "Un bus Lynx complet : Power In, Smart BMS, Distributor et Shunt, pensé pour une batterie Lithium NG.",
      "Un MultiPlus-II en onduleur-chargeur et un Cerbo GX pour la supervision de l'ensemble.",
      "Deux tableaux de distribution 12V distincts, l'un pour le confort (frigo, eau, éclairage), l'autre pour le pont et la sécurité (feux de navigation, guindeau, pompe de cale, pilote automatique).",
    ],
    watchouts: [
      "C'est un système volontairement dense : ne le prenez pas comme point de départ si votre besoin réel est plus simple, les autres exemples de cette page conviendront mieux.",
      "Le calibrage exact (fusibles, sections, capacité batterie) dépend de votre puissance installée réelle et doit être recalculé, pas recopié.",
      "L'inverseur de source quai/groupe électrogène et l'isolateur galvanique demandent une installation sérieuse : ce n'est pas un point à improviser sur un bateau.",
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
