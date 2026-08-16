import { getSchemaTemplate } from "@/features/schemas/templates";

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
