import { getSchemaTemplate } from "@/features/schemas/templates";

const BASE_URL = "https://www.fabsystem.fr";

export type SchemaExample = {
  slug: string;
  templateId: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  audience: string;
  level: string;
  context: string;
  flow: string[];
  highlights: string[];
  includes: string[];
  watchouts: string[];
};

export const SCHEMA_EXAMPLES: SchemaExample[] = [
  {
    slug: "schema-electrique-van-complet",
    templateId: "van-complet",
    title: "Schéma électrique van complet 12V",
    metaTitle: "Schéma électrique van complet 12V : exemple à ouvrir ou imprimer",
    metaDescription:
      "Exemple de schéma électrique van 12V complet avec solaire, alternateur, chargeur et distribution. Fiche explicative, ouverture directe dans l'éditeur et impression PDF.",
    description:
      "Un point de départ déjà avancé pour visualiser une installation van avec plusieurs sources de charge et une distribution 12V plus structurée.",
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
];

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

export function getSchemaEditorTemplateHref(templateId: string) {
  return `/outils/schema?template=${encodeURIComponent(templateId)}`;
}

export function getSchemaExampleTemplate(slug: string) {
  const example = getSchemaExampleBySlug(slug);
  if (!example) return null;
  return getSchemaTemplate(example.templateId) ?? null;
}
