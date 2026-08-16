// Modèle de données FabSystem Schéma V1 (docs/schema/CDC_FabSystem_Schema_V1.md §14-15).
// Les nodes/edges React Flow utilisent ces types via leur champ `data`.

// Familles pensées type de produit plutôt que rôle électrique (retour
// utilisateur : "pense débutant néophyte... réfléchi en type solaire,
// convertisseur, chargeur, batterie") — un débutant qui ne sait pas encore
// ce qu'est un "MPPT" reconnaît "Solaire" comme famille de rayon plutôt que
// l'ancien découpage par rôle (source/charge/distribution).
export type ComponentCategory = "solar" | "battery" | "charger" | "converter" | "wiring" | "measurement" | "consumers";

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
  /** Sous-famille au sein de la catégorie, pour regrouper visuellement dans
   * la bibliothèque (ex. "Batteries" vs "Répartiteurs" dans la famille
   * Batterie) — purement d'affichage, pas de logique dessus. */
  subcategory?: string;
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
  /**
   * Force l'affichage des étiquettes de bornes même avec seulement 2 bornes
   * (par défaut masquées : "+/− déjà clair par la couleur") — pour les
   * composants où le libellé porte une info au-delà de la simple polarité,
   * ex. "PV−"/"PV+" sur un panneau solaire (retour utilisateur).
   */
  alwaysShowHandleLabels?: boolean;
  /**
   * Taille minimale (px) de la vignette icône, quand le calcul automatique
   * (basé sur le nombre de bornes par côté) donnerait une taille trop
   * discrète pour l'importance visuelle du composant — retour utilisateur :
   * "possible d'augmenter la taille de la vignette des batteries". N'agrandit
   * jamais au-delà du plafond déjà en place pour les gros composants
   * (busbar…), juste un plancher plus haut que la taille par défaut.
   */
  minIconBoxSize?: number;
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
  /** Point de coude choisi à la main, en coordonnées absolues de canvas
   * (retour utilisateur : "déplacer le câble pour mieux agencer le
   * schéma"). Plusieurs approches "relatives au tracé auto" ont été
   * essayées avant celle-ci (décalage x/y, fraction le long du tracé via
   * `getSmoothStepPath({ stepPosition })`…) et abandonnées, chacune ayant
   * son propre lot de bugs (vignette décrochée du câble, axe unique,
   * glisser qui ne fonctionne plus après le premier). Fonctionnement
   * actuel, suivant le retour explicite "la vignette câble devrait avoir
   * les mêmes propriétés qu'une vignette item" : ce point est matérialisé
   * par un vrai nœud React Flow (`CableWaypointNode`, ajouté uniquement à
   * la liste de rendu — jamais dans les nœuds persistés du schéma) qui se
   * déplace avec le même mécanisme natif, éprouvé, que n'importe quel
   * composant. Comme pour un composant, il ne suit pas automatiquement les
   * nœuds connectés si on les déplace ensuite — l'utilisateur le réajuste
   * au besoin, exactement comme il repositionnerait un élément du schéma.
   * `undefined` = routage automatique (comportement inchangé). */
  bendPoint?: { x: number; y: number };
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
