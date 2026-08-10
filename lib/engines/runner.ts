import type { Project } from "@/lib/generated/prisma/client";
import type { OwnershipActor } from "@/lib/ownership";
import { getProject } from "@/lib/services/project";
import { declareDependency } from "@/lib/services/project-dependencies";
import { retainValue } from "@/lib/services/project-values";
import { createEngineContext, type EngineContextDeps } from "@/lib/engines/context";
import { CalculationError, isEngineError } from "@/lib/engines/errors";
import type { BaseEngine, EngineResult } from "@/lib/engines/types";

// Couche 4.0 (MASTER-11) : EngineRunner. Prépare le contexte, exécute un
// moteur, persiste ce que le moteur propose explicitement — sans jamais
// connaître le contenu du calcul. La distinction simulation/décision
// (MASTER-06 §25-26) reste entièrement portée par le moteur : le runner ne
// persiste que ce qui est explicitement présent dans `result.retainedValues`
// / `result.dependencies`, jamais une interprétation de sa propre initiative.

export type EngineRunnerDeps = {
  getProject?: (actor: OwnershipActor, projectId: string) => Promise<Project>;
  retainValue?: typeof retainValue;
  declareDependency?: typeof declareDependency;
  now?: () => Date;
};

export function createEngineRunner(deps?: EngineRunnerDeps) {
  const resolveProject = deps?.getProject ?? getProject;
  const persistValue = deps?.retainValue ?? retainValue;
  const persistDependency = deps?.declareDependency ?? declareDependency;
  const contextDeps: EngineContextDeps = deps?.now ? { now: deps.now } : {};

  return {
    async run<TInput, TOutput>(
      actor: OwnershipActor,
      projectId: string,
      engine: BaseEngine<TInput, TOutput>,
      input: TInput
    ): Promise<EngineResult<TOutput>> {
      // Ownership vérifié par le service Project existant (Phase 3) :
      // aucune nouvelle logique d'autorisation n'est créée ici.
      const project = await resolveProject(actor, projectId);
      const context = createEngineContext(project, contextDeps);

      let result: EngineResult<TOutput>;

      try {
        result = await engine.run(context, input);
      } catch (error) {
        if (isEngineError(error)) {
          throw error;
        }

        throw new CalculationError(`Engine "${engine.id}" failed during execution`, {
          cause: error,
        });
      }

      for (const proposal of result.retainedValues ?? []) {
        await persistValue({
          projectId: project.id,
          key: proposal.key,
          value: proposal.value,
          simulatedValue: proposal.simulatedValue,
          source: proposal.source ?? engine.id,
        });
      }

      for (const dependency of result.dependencies ?? []) {
        await persistDependency({
          projectId: project.id,
          dependentKey: dependency.dependentKey,
          dependsOnKey: dependency.dependsOnKey,
        });
      }

      return result;
    },
  };
}
