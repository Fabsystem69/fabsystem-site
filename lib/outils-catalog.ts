// Source unique des métadonnées des calculateurs publics de /outils.
// Depuis UI-7.1, `id` correspond exactement au segment de route dédié
// (/outils/<id>) — un seul tableau alimente les cartes du hub, les liens
// internes (Home, Les Bases) et le contenu de chaque page calculateur.
export type OutilMeta = {
  id: "section-cable" | "bilan-consommation" | "autonomie-batterie" | "mppt" | "awg";
  emoji: string;
  title: string;
  description: string;
  tag: string;
};

export const OUTILS_CALCULATEURS: OutilMeta[] = [
  {
    id: "section-cable",
    emoji: "⚡",
    title: "Section de câble",
    description:
      "Dimensionnez vos câbles 12V/24V selon l'intensité, la longueur et la chute de tension admissible.",
    tag: "Le plus utilisé",
  },
  {
    id: "bilan-consommation",
    emoji: "🔋",
    title: "Bilan de consommation",
    description:
      "Listez vos appareils pour calculer la consommation journalière et la capacité batterie recommandée.",
    tag: "Essentiel",
  },
  {
    id: "autonomie-batterie",
    emoji: "⏱️",
    title: "Autonomie batterie",
    description:
      "Estimez combien de temps votre installation tient sur batterie selon votre consommation.",
    tag: "Avec solaire",
  },
  {
    id: "mppt",
    emoji: "☀️",
    title: "Régulateur MPPT",
    description:
      "Calculez la puissance MPPT nécessaire selon vos panneaux solaires et votre batterie.",
    tag: "Solaire",
  },
  {
    id: "awg",
    emoji: "📐",
    title: "AWG ↔ mm²",
    description:
      "Convertisseur AWG/mm² + sections recommandées par équipement bateau (guindeau, frigo, pilote…).",
    tag: "Référence",
  },
];

export function getOutilMeta(id: OutilMeta["id"]): OutilMeta {
  const meta = OUTILS_CALCULATEURS.find((o) => o.id === id);
  if (!meta) {
    throw new Error(`Unknown outil id: ${id}`);
  }
  return meta;
}
