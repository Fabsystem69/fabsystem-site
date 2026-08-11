// Source unique des métadonnées des calculateurs publics de /outils.
// Avant UI-7, ces informations étaient dupliquées (avec un libellé
// légèrement différent) entre `app/outils/page.tsx` (cartes d'index) et
// `components/CalcSection.tsx` (en-têtes de section) — un seul tableau
// alimente désormais les deux.
export type OutilMeta = {
  id: "section-cable" | "bilan-conso" | "autonomie" | "mppt" | "awg";
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
    id: "bilan-conso",
    emoji: "🔋",
    title: "Bilan de consommation",
    description:
      "Listez vos appareils pour calculer la consommation journalière et la capacité batterie recommandée.",
    tag: "Essentiel",
  },
  {
    id: "autonomie",
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
