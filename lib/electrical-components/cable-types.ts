// Types de câble (docs/schema/08-PROJET-SCHEMA-AVANCE.md §8 : "type de
// connexion lorsque défini"). Un câble n'est pas forcément un conducteur de
// puissance +/− : circuit de commande, bus de données (NMEA2000, VE.Direct,
// CAN…) ont leur propre couleur logique, indépendante de la polarité de la
// borne d'origine. La couleur reste modifiable librement ensuite (§21 du
// CDC V1 : "aucune signification normative automatique").
export interface CableType {
  value: string;
  label: string;
  color: string;
}

export const CABLE_TYPES: CableType[] = [
  { value: "power-positive", label: "Puissance +", color: "#dc2626" },
  { value: "power-negative", label: "Puissance −", color: "#111827" },
  { value: "control", label: "Commande / contrôle", color: "#2563eb" },
  { value: "data-bus", label: "Bus de données (NMEA2000, VE.Direct, CAN…)", color: "#16a34a" },
  { value: "earth", label: "Terre (PE) — vert/jaune", color: "#84cc16" },
  // V2, retour utilisateur : les câbles secteur (3G2,5, 3G1,5…) atterrissaient
  // dans "Autre" en gris, trop proche visuellement du noir de "Puissance −".
  // Catégorie et couleur dédiées, distinctes des deux. Violet plutôt
  // qu'orange (retour utilisateur : "l'orange porte à confusion" — trop
  // proche du jaune/orange déjà utilisé ailleurs comme couleur d'alerte).
  { value: "ac-230v", label: "Câblage 230V (secteur / quai)", color: "#7c3aed" },
  // Retour utilisateur : "Neutre et Phase unitairement comme la Terre" — même
  // logique que "earth" ci-dessus (couleur normalisée NF C 15-100), pour
  // câbler un conducteur unique à part d'un toron 3G. Réutilisées aussi par
  // CableEdge.tsx pour dessiner les 3 conducteurs d'un câble 3G2,5/3G1,5
  // (voir THREE_CONDUCTOR_SECTIONS).
  { value: "phase", label: "Phase — marron", color: "#8b4513" },
  { value: "neutral", label: "Neutre — bleu", color: "#0ea5e9" },
  { value: "other", label: "Autre", color: "#6b7280" },
];

export function getCableType(value: string | undefined): CableType | undefined {
  return CABLE_TYPES.find((t) => t.value === value);
}
