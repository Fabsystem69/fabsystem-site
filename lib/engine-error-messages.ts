import type { EngineError } from "@/lib/engines/errors";
import { getRetainedValueLabel } from "@/lib/retained-value-labels";

// UI-9 FINAL §4 : couche de présentation des erreurs moteur, en français,
// orientée action, sans jamais exposer de clé technique ni de vocabulaire
// d'implémentation (Engine/payload/dependency). Ne modifie et ne
// réécrit aucun moteur — les codes internes (`error.code`) restent la
// source de vérité pour la logique, cette fonction ne fait que choisir un
// texte à afficher à partir d'eux.

function hasKeyDetail(details: unknown): details is { key: string } {
  return (
    typeof details === "object" &&
    details !== null &&
    typeof (details as { key?: unknown }).key === "string"
  );
}

/** Traduit une EngineError en un message humain, actionnable, sans jargon.
 * Utilise `error.code` (jamais le message anglais brut) pour choisir la
 * formulation, et la clé technique éventuelle (`details.key`) uniquement
 * pour retrouver un libellé humain via getRetainedValueLabel — jamais
 * affichée telle quelle. */
export function translateEngineError(error: EngineError): string {
  const code = error.code;
  const label = hasKeyDetail(error.details) ? getRetainedValueLabel(error.details.key) : null;

  if (error.name === "DependencyError") {
    if (label) {
      if (code.includes("MISSING")) {
        return `Complétez et retenez d'abord « ${label} » avant de lancer ce calcul.`;
      }
      if (code.includes("OBSOLETE")) {
        return `« ${label} » a changé et doit être recalculé avant de lancer ce calcul.`;
      }
      return `« ${label} » ne peut pas être utilisé tel quel pour ce calcul. Recalculez-le d'abord.`;
    }
    return "Une information nécessaire à ce calcul n'est pas encore disponible dans votre projet. Complétez d'abord le module correspondant.";
  }

  if (error.name === "ValidationError") {
    return "Certaines valeurs saisies ne sont pas valides pour ce calcul. Vérifiez les champs du formulaire.";
  }

  if (error.name === "CalculationError") {
    return "Ce calcul n'a pas pu aboutir avec les données actuelles.";
  }

  return "Une erreur technique est survenue. Réessayez dans quelques instants.";
}

type EngineResultErrorLike = { code: string; message: string; details?: unknown };

function hasName(details: unknown): details is { name: string; target?: string } {
  return (
    typeof details === "object" && details !== null && typeof (details as { name?: unknown }).name === "string"
  );
}

/** Traduit une erreur non bloquante remontée par un moteur (EngineResult.errors)
 * — jamais un objet JSON brut affiché, jamais le message anglais original. */
export function translateEngineResultError(error: EngineResultErrorLike): string {
  if (error.code === "CONSUMER_CALCULATION_IMPOSSIBLE" && hasName(error.details)) {
    const { name, target } = error.details;
    if (target === "powerW") {
      return `Puissance non calculable pour : ${name} (tension inconnue)`;
    }
    if (target === "currentA") {
      return `Courant non calculable pour : ${name} (tension inconnue)`;
    }
    return `Donnée non calculable pour : ${name}`;
  }

  if (hasName(error.details)) {
    return `Donnée manquante ou invalide pour : ${error.details.name}`;
  }

  return "Une donnée nécessaire au calcul est incomplète.";
}
