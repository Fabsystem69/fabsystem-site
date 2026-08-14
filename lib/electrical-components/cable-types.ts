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
  { value: "other", label: "Autre", color: "#6b7280" },
];

export function getCableType(value: string | undefined): CableType | undefined {
  return CABLE_TYPES.find((t) => t.value === value);
}
