// Couche 4.0 (MASTER-11) : hiérarchie d'erreurs commune aux futurs moteurs
// métier. Même forme que lib/http-errors.ts (message + code + details),
// mais volontairement découplée du HTTP : un moteur n'est pas une route API
// et ne doit pas connaître de statut HTTP.

export type EngineErrorOptions = {
  code?: string;
  details?: unknown;
  cause?: unknown;
};

export class EngineError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, options?: EngineErrorOptions) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = options?.code ?? "ENGINE_ERROR";
    this.details = options?.details;
  }
}

/** Entrée invalide fournie au moteur (donnée manquante, hors domaine...). */
export class ValidationError extends EngineError {
  constructor(message: string, options?: EngineErrorOptions) {
    super(message, { ...options, code: options?.code ?? "VALIDATION_ERROR" });
  }
}

/** Le moteur ou son environnement d'exécution est mal configuré (paramètre
 * requis absent du contexte, moteur non enregistré, etc.). */
export class ConfigurationError extends EngineError {
  constructor(message: string, options?: EngineErrorOptions) {
    super(message, { ...options, code: options?.code ?? "CONFIGURATION_ERROR" });
  }
}

/** Une donnée dont le moteur dépend est absente, obsolète ou incohérente. */
export class DependencyError extends EngineError {
  constructor(message: string, options?: EngineErrorOptions) {
    super(message, { ...options, code: options?.code ?? "DEPENDENCY_ERROR" });
  }
}

/** Le calcul lui-même a échoué (erreur interne au moteur). */
export class CalculationError extends EngineError {
  constructor(message: string, options?: EngineErrorOptions) {
    super(message, { ...options, code: options?.code ?? "CALCULATION_ERROR" });
  }
}

export function isEngineError(error: unknown): error is EngineError {
  return error instanceof EngineError;
}
