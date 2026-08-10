// Couche 4 (MASTER-11) : constantes numériques génériques partagées par
// tous les futurs moteurs. Aucune règle métier ici — uniquement des
// tolérances de calcul flottant réutilisables par n'importe quel moteur.

/**
 * Tolérance relative par défaut utilisée pour comparer deux grandeurs
 * calculées par des voies différentes mais censées être physiquement
 * équivalentes (ex. puissance déclarée vs courant × tension). Couvre
 * l'arrondi réaliste d'une saisie utilisateur, ce n'est jamais un seuil
 * métier/commercial.
 */
export const DEFAULT_FLOAT_TOLERANCE_RATIO = 0.01;
