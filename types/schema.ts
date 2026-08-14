// Modèle de données FabSystem Schéma V1 (docs/schema/CDC_FabSystem_Schema_V1.md §14-15).
// Les nodes/edges React Flow utilisent ces types via leur champ `data`.

export type ComponentCategory = "sources" | "charge" | "protection" | "distribution" | "mesure" | "conversion" | "consommateurs";

export type HandleKind = "positive" | "negative" | "neutral" | "earth";

export interface ComponentHandleDef {
  id: string;
  label: string;
  kind: HandleKind;
  /** Côté d'affichage sur le node — explicite plutôt que deviné depuis `id`,
   * pour supporter des composants à plusieurs bornes par côté (MPPT, DC-DC…)
   * ou des bornes réparties sur plus de deux côtés (platine de fusibles :
   * sorties à gauche/droite, entrée en haut). */
  side: "left" | "top" | "right" | "bottom";
  /**
   * Borne facultative (ex. port de communication VE.Direct) : son absence
   * de branchement ne doit jamais déclencher un signalement "à vérifier"
   * (voir lib/electrical-components/checks.ts).
   */
  optional?: boolean;
}

export interface ComponentDefinition {
  type: string;
  label: string;
  category: ComponentCategory;
  subtitle?: string;
  handles: ComponentHandleDef[];
  /**
   * Pour les composants à nombre de sorties variable (busbar, tableau de
   * distribution, platine de fusibles) : calcule les bornes réelles à partir
   * des données du node (ex. `outputCount`) plutôt que d'utiliser `handles`
   * tel quel. `handles` reste la valeur par défaut (aperçu bibliothèque).
   */
  getHandles?: (data: Record<string, unknown>) => ComponentHandleDef[];
  /**
   * Libellé affiché sur une borne (repère visible + info-bulle), calculé à
   * partir des données du node — ex. ajouter le calibre à chaque sortie
   * d'une platine de fusibles. Par défaut : `handle.label`.
   */
  getHandleLabel?: (data: Record<string, unknown>, handle: ComponentHandleDef) => string;
  defaultData: Record<string, string | number>;
  /** Champs éditables dans le panneau de propriétés, dans l'ordre d'affichage. */
  fields: PropertyFieldDef[];
  /**
   * Pour les composants dont la polarité des bornes dépend d'une propriété
   * (ex. busbar positif/négatif) plutôt que d'être fixe dans `handles` :
   * résout la vraie polarité à partir des données actuelles du node.
   */
  resolveHandleKind?: (data: Record<string, unknown>, handle: ComponentHandleDef) => HandleKind;
  /** Chemin public vers l'icône style "Simple" (schématique, épurée). */
  icon?: string;
  /** Chemin public vers l'icône style "Pro" (réaliste, générique). Retombe
   * sur `icon` tant qu'elle n'est pas fournie. */
  iconPro?: string;
  /**
   * Nom du champ de `data` dont la valeur choisit une icône plus précise
   * que l'icône générique du composant (ex. "technology" pour la batterie
   * AGM/LiFePO4, "presetType" pour le type d'appareil d'un consommateur).
   */
  iconVariantField?: string;
  /** Icônes par valeur du champ désigné par `iconVariantField`. */
  iconVariants?: Record<string, { icon?: string; iconPro?: string }>;
  /**
   * Pastille affichée directement sur la vignette (ex. le calibre d'un
   * fusible) — retour utilisateur : "je voudrais que l'intensité apparaisse".
   */
  badge?: { field: string; unit?: string };
}

export type IconStyle = "simple" | "pro";

export type PropertyFieldDef = {
  key: string;
  label: string;
  /** Texte d'aide court affiché sous le champ, pour un utilisateur débutant. */
  help?: string;
} & (
  | { type: "text" }
  | { type: "number"; unit?: string; min?: number; max?: number; step?: number }
  | { type: "select"; options: { value: string; label: string }[] }
);

export interface ElectricalNodeData extends Record<string, unknown> {
  componentType: string;
  label: string;
  [key: string]: unknown;
}

export interface CableEdgeData extends Record<string, unknown> {
  section?: string;
  color?: string;
  label?: string;
  /** Type logique du câble (puissance +/−, commande, bus de données…). */
  cableType?: string;
  /** Longueur du câble en mètres (facultatif) — sert au récapitulatif matériel. */
  length?: number;
}

export const CABLE_SECTIONS = [
  "0,5 mm²",
  "0,75 mm²",
  "1 mm²",
  "1,5 mm²",
  "2,5 mm²",
  "3G2,5 mm²",
  "4 mm²",
  "6 mm²",
  "10 mm²",
  "16 mm²",
  "25 mm²",
  "35 mm²",
  "50 mm²",
  "70 mm²",
] as const;
