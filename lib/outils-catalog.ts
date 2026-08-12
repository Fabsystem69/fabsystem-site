// Source unique des métadonnées des calculateurs publics de /outils.
// Depuis UI-7.1, `id` correspond exactement au segment de route dédié
// (/outils/<id>) — un seul tableau alimente les cartes du hub, les liens
// internes (Home, Les Bases) et le contenu de chaque page calculateur.
export type OutilMeta = {
  id: "section-cable" | "bilan-consommation" | "autonomie-batterie" | "mppt" | "awg";
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
    image: "/outils/section-cable.png",
    title: "Section de câble",
    description: "Dimensionnez vos câbles 12/24 V selon l'intensité, la longueur et la chute de tension.",
    tag: "Le plus utilisé",
    cta: "Calculer",
  },
  {
    id: "bilan-consommation",
    image: "/outils/bilan-consommation.png",
    title: "Bilan de consommation",
    description: "Listez vos appareils et estimez votre consommation quotidienne.",
    tag: "Essentiel",
    cta: "Ouvrir",
  },
  {
    id: "autonomie-batterie",
    image: "/outils/autonomie-batterie.png",
    title: "Autonomie batterie",
    description: "Estimez combien de temps votre installation peut fonctionner sur batterie.",
    tag: "Avec solaire",
    cta: "Ouvrir",
  },
  {
    id: "mppt",
    image: "/outils/mppt.png",
    title: "Régulateur MPPT",
    description: "Dimensionnez la puissance MPPT adaptée à vos panneaux et à votre batterie.",
    tag: "Solaire",
    cta: "Ouvrir",
  },
  {
    id: "awg",
    image: "/outils/awg.png",
    title: "AWG ↔ mm²",
    description: "Convertissez rapidement les sections de câble entre standards AWG et métrique.",
    tag: "Référence",
    cta: "Convertir",
  },
];

// Sixième carte de la page /outils (correctif final §3, §6) : Schéma
// électrique n'est pas un calculateur réel aujourd'hui — jamais dans
// OUTILS_CALCULATEURS (qui alimente aussi le bandeau Accès rapide et les
// routes réelles), pour ne jamais générer de lien ou d'accès rapide vers
// une fonctionnalité qui n'existe pas.
export const OUTIL_A_VENIR = {
  image: "/outils/schema-bientot-disponible.png",
  title: "Schéma électrique",
  description: "Construisez et visualisez l'architecture électrique de votre installation.",
  badge: "Bientôt disponible",
} as const;

export function getOutilMeta(id: OutilMeta["id"]): OutilMeta {
  const meta = OUTILS_CALCULATEURS.find((o) => o.id === id);
  if (!meta) {
    throw new Error(`Unknown outil id: ${id}`);
  }
  return meta;
}
