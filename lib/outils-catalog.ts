// Source unique des métadonnées des calculateurs publics de /outils.
// Depuis UI-7.1, `id` correspond exactement au segment de route dédié
// (/outils/<id>) — un seul tableau alimente les cartes du hub, les liens
// internes (Home, Les Bases) et le contenu de chaque page calculateur.
export type OutilMeta = {
  id:
    | "section-cable"
    | "bilan-consommation"
    | "autonomie-batterie"
    | "mppt"
    | "awg"
    | "schema"
    | "soc-batterie"
    | "charge-secteur";
  /** Illustration technique réelle (UI-10 correctif final §4 : "composante
   * principale de l'identité SaaS de cette page") — jamais un emoji, une
   * icône générique ou un placeholder. */
  image: string;
  title: string;
  description: string;
  tag: string;
  /** Libellé de CTA propre à chaque outil (§6 du correctif final), plutôt
   * qu'un "Ouvrir" générique partout. */
  cta: string;
};

export const OUTILS_CALCULATEURS: OutilMeta[] = [
  {
    id: "section-cable",
    image: "/outils/section-cable.webp",
    title: "Section de câble",
    description: "Dimensionnez vos câbles 12/24 V selon l'intensité, la longueur et la chute de tension.",
    tag: "Le plus utilisé",
    cta: "Calculer",
  },
  {
    id: "bilan-consommation",
    image: "/outils/bilan-consommation.webp",
    title: "Bilan de consommation",
    description: "Listez vos appareils et estimez votre consommation quotidienne.",
    tag: "Essentiel",
    cta: "Ouvrir",
  },
  {
    id: "autonomie-batterie",
    image: "/outils/autonomie-batterie.webp",
    title: "Autonomie batterie",
    description: "Estimez combien de temps votre installation peut fonctionner sur batterie.",
    tag: "Avec solaire",
    cta: "Ouvrir",
  },
  {
    id: "mppt",
    image: "/outils/mppt.webp",
    title: "Régulateur MPPT",
    description: "Dimensionnez la puissance MPPT adaptée à vos panneaux et à votre batterie.",
    tag: "Solaire",
    cta: "Ouvrir",
  },
  {
    id: "awg",
    image: "/outils/awg.webp",
    title: "AWG ↔ mm²",
    description: "Convertissez rapidement les sections de câble entre standards AWG et métrique.",
    tag: "Référence",
    cta: "Convertir",
  },
  {
    id: "schema",
    image: "/outils/schema.webp",
    title: "Schéma électrique",
    description: "Construisez et visualisez l'architecture électrique de votre installation.",
    tag: "Éditeur",
    cta: "Ouvrir l'éditeur",
  },
  {
    id: "soc-batterie",
    image: "/outils/soc-batterie.webp",
    title: "État de charge batterie",
    description: "Estimez le % de charge de votre batterie à partir de la tension mesurée.",
    tag: "Nouveau",
    cta: "Estimer",
  },
  {
    id: "charge-secteur",
    image: "/outils/charge-secteur.webp",
    title: "Chargeur secteur",
    description: "Dimensionnez votre chargeur secteur et vérifiez la compatibilité avec la borne 230V.",
    tag: "Nouveau",
    cta: "Calculer",
  },
];

export function getOutilMeta(id: OutilMeta["id"]): OutilMeta {
  const meta = OUTILS_CALCULATEURS.find((o) => o.id === id);
  if (!meta) {
    throw new Error(`Unknown outil id: ${id}`);
  }
  return meta;
}
