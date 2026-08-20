// Source unique des métadonnées des calculateurs publics de /outils.
// Depuis UI-7.1, `id` correspond exactement au segment de route dédié
// (/outils/<id>) — un seul tableau alimente les cartes du hub, les liens
// internes (Home, Les Bases) et le contenu de chaque page calculateur.
export type OutilMeta = {
  id:
    | "section-cable"
    | "bilan-consommation"
    | "mppt"
    | "schema"
    | "soc-batterie"
    | "charge-secteur"
    | "fusible"
    | "onduleur"
    | "dcdc-alternateur"
    | "batterie";
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
  // Fusionné avec l'ancien "AWG ↔ mm²" (retour utilisateur : "je pense
  // qu'on peux fusionner mm awg aussi avec") + vérification d'ampacité
  // ajoutée (gap confirmé après audit Wireframe : l'ancienne version ne
  // vérifiait que la chute de tension, jamais le risque de surchauffe).
  {
    id: "section-cable",
    image: "/outils/section-cable.webp",
    title: "Section de câble",
    description: "Dimensionnez vos câbles 12/24/48V selon l'ampacité et la chute de tension, avec l'équivalent AWG.",
    tag: "Le plus utilisé",
    cta: "Calculer",
  },
  {
    id: "bilan-consommation",
    image: "/outils/bilan-consommation.webp",
    title: "Bilan de consommation",
    description: "Listez vos appareils, votre banque de batteries et vos sources de charge pour estimer votre autonomie.",
    tag: "Essentiel",
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
    description: "Estimez le temps de charge depuis une borne secteur 230V et vérifiez la compatibilité du chargeur.",
    tag: "Nouveau",
    cta: "Calculer",
  },
  // Retour utilisateur : "créer les outils manquant" — 3 gaps identifiés en
  // auditant le concurrent Wireframe (usewireframe.com/calculators).
  // `image` : pas de photo dédiée disponible pour l'instant (même
  // convention que les autres — jamais un placeholder posé en dur), à
  // fournir avant que ces cartes soient vraiment prêtes à l'affichage.
  {
    id: "fusible",
    image: "/outils/fusible.webp",
    title: "Calibre de fusible",
    description: "Trouvez le calibre et le format (Lame, MIDI, MEGA, ANL, Classe T) adapté à votre circuit.",
    tag: "Nouveau",
    cta: "Calculer",
  },
  {
    id: "onduleur",
    image: "/outils/onduleur.webp",
    title: "Dimensionnement onduleur",
    description: "Calculez la puissance d'onduleur nécessaire selon vos appareils 230V et leurs appels de démarrage.",
    tag: "Nouveau",
    cta: "Calculer",
  },
  {
    id: "dcdc-alternateur",
    image: "/outils/dcdc-alternateur.webp",
    title: "Chargeur DC-DC / alternateur",
    description: "Dimensionnez votre chargeur batterie à batterie selon l'alternateur et la batterie servitude.",
    tag: "Nouveau",
    cta: "Calculer",
  },
  // Gap confirmé après audit comparatif Wireframe ("Battery Bank
  // Calculator") : aucun outil du site ne dimensionnait une banque de
  // plusieurs batteries (câblage série/parallèle, câbles, fusible
  // principal) — image réutilisée de l'ancien outil "Autonomie batterie",
  // fusionné dans bilan-consommation (redirection /outils/autonomie-
  // batterie → /outils/bilan-consommation, voir next.config.ts).
  {
    id: "batterie",
    image: "/outils/autonomie-batterie.webp",
    title: "Banque de batteries",
    description: "Dimensionnez votre banque de batteries : nombre d'unités, câblage série/parallèle et protections.",
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
