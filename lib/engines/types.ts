import type {
  Project,
  ProjectRetainedValue,
  ProjectValueDependency,
} from "@/lib/generated/prisma/client";

// Couche 4.0 (MASTER-11) : socle commun des futurs moteurs métier (Bilan,
// Batterie, Solaire, Section, Protection...). Ce fichier ne contient et ne
// doit jamais contenir de calcul, de formule ni de règle métier — seulement
// les formes que tous les moteurs partageront (MASTER-06 §32, MASTER-11
// §28 : un moteur métier commun doit pouvoir être appelé depuis plusieurs
// environnements sans être réécrit).

/**
 * Contexte d'exécution transmis à un moteur. Purement passif : un moteur
 * lit le Project et les données déjà persistées, il ne décide jamais seul
 * de ce qui doit être retenu (MASTER-06 §25-26, simulation ≠ décision).
 */
export type EngineContext = {
  readonly project: Project;
  readonly now: () => Date;
  getRetainedValue(key: string): Promise<ProjectRetainedValue | null>;
  getRetainedValues(): Promise<ProjectRetainedValue[]>;
  getDependencies(): Promise<ProjectValueDependency[]>;
};

/** Une valeur que le moteur propose de retenir. La distinction
 * value/simulatedValue reste portée jusqu'ici (MASTER-06 §25) : ce n'est
 * jamais au framework de décider qu'une simulation devient une décision. */
export type EngineRetainedValueProposal = {
  key: string;
  value: unknown;
  simulatedValue?: unknown;
  source?: string;
};

/** Une dépendance que le moteur déclare entre deux clés de valeurs
 * retenues (MASTER-06 §27-30). Aucune interprétation métier ici : c'est un
 * simple graphe. */
export type EngineDependencyProposal = {
  dependentKey: string;
  dependsOnKey: string;
};

export type EngineWarning = {
  code: string;
  message: string;
  details?: unknown;
};

/** Erreur non bloquante rapportée par le moteur (à distinguer d'une
 * EngineError levée, qui interrompt l'exécution — voir errors.ts). */
export type EngineResultError = {
  code: string;
  message: string;
  details?: unknown;
};

/**
 * Format de retour standard, partagé par tous les futurs moteurs.
 * `output` est le résultat métier propre au moteur : ce framework ne le
 * connaît jamais et ne le manipule pas.
 */
export type EngineResult<TOutput = unknown> = {
  output: TOutput;
  retainedValues?: EngineRetainedValueProposal[];
  dependencies?: EngineDependencyProposal[];
  warnings?: EngineWarning[];
  errors?: EngineResultError[];
  debug?: Record<string, unknown>;
};

/**
 * Contrat commun que tout futur moteur devra implémenter. `id` est un
 * identifiant stable (ex. "energy.battery"), utilisé par le Registry et
 * comme `source` par défaut des valeurs retenues qu'il propose.
 */
export interface BaseEngine<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  run(context: EngineContext, input: TInput): Promise<EngineResult<TOutput>> | EngineResult<TOutput>;
}
