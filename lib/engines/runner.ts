import type { Project } from "@/lib/generated/prisma/client";
import type { OwnershipActor } from "@/lib/ownership";
import { getProject } from "@/lib/services/project";
import { declareDependency, markDependentsObsolete } from "@/lib/services/project-dependencies";
import { getProjectValues, retainValue } from "@/lib/services/project-values";
import { createEngineContext, type EngineContextDeps } from "@/lib/engines/context";
import { CalculationError, isEngineError } from "@/lib/engines/errors";
import type { BaseEngine, EngineResult } from "@/lib/engines/types";
import { hasValueChanged } from "@/lib/engines/value-diff";

// Couche 4.0 (MASTER-11) : EngineRunner. Prépare le contexte, exécute un
// moteur, persiste ce que le moteur propose explicitement, puis propage
// l'obsolescence des dépendances (Phase 4.5.2) — sans jamais connaître le
// contenu du calcul. La distinction simulation/décision (MASTER-06 §25-26)
// reste entièrement portée par le moteur : le runner ne persiste que ce qui
// est explicitement présent dans `result.retainedValues` / `result.dependencies`,
// jamais une interprétation de sa propre initiative. De même, il ne propage
// une obsolescence que pour une valeur métier réellement modifiée — jamais
// une invalidation globale (MASTER-06 §30).

export type EngineRunnerDeps = {
  getProject?: (actor: OwnershipActor, projectId: string) => Promise<Project>;
  retainValue?: typeof retainValue;
  declareDependency?: typeof declareDependency;
  getProjectValues?: typeof getProjectValues;
  markDependentsObsolete?: typeof markDependentsObsolete;
  now?: () => Date;
};

export function createEngineRunner(deps?: EngineRunnerDeps) {
  const resolveProject = deps?.getProject ?? getProject;
  const persistValue = deps?.retainValue ?? retainValue;
  const persistDependency = deps?.declareDependency ?? declareDependency;
  const readExistingValues = deps?.getProjectValues ?? getProjectValues;
  const propagateObsolescence = deps?.markDependentsObsolete ?? markDependentsObsolete;
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

      const retainedValueProposals = result.retainedValues ?? [];

      // Une seule lecture groupée de l'état actuel, avant toute écriture
      // (jamais une lecture par proposition) : reste compatible avec
      // plusieurs centaines de valeurs retenues sans lecture redondante.
      const existingByKey =
        retainedValueProposals.length > 0
          ? new Map((await readExistingValues(project.id)).map((value) => [value.key, value]))
          : new Map<string, Awaited<ReturnType<typeof readExistingValues>>[number]>();

      const changedKeys: string[] = [];
      const seenChangedKeys = new Set<string>();

      for (const proposal of retainedValueProposals) {
        const existing = existingByKey.get(proposal.key) ?? null;
        // Seule la valeur métier réellement retenue est comparée — jamais
        // un horodatage, un statut ou la source (MASTER-06 §28-30).
        const changed = !existing || hasValueChanged(existing.value, proposal.value);

        await persistValue({
          projectId: project.id,
          key: proposal.key,
          value: proposal.value,
          simulatedValue: proposal.simulatedValue,
          source: proposal.source ?? engine.id,
        });

        if (changed && !seenChangedKeys.has(proposal.key)) {
          seenChangedKeys.add(proposal.key);
          changedKeys.push(proposal.key);
        }
      }

      for (const dependency of result.dependencies ?? []) {
        await persistDependency({
          projectId: project.id,
          dependentKey: dependency.dependentKey,
          dependsOnKey: dependency.dependsOnKey,
        });
      }

      // Propage l'obsolescence uniquement pour les clés réellement
      // modifiées, une seule fois chacune : le moteur de dépendances de la
      // Phase 3 (réutilisé tel quel) détermine seul quels dépendants
      // marquer, ce runner ne fait qu'identifier ce qui a changé.
      //
      // Cas particulier : un moteur peut proposer plusieurs clés liées
      // entre elles par une dépendance interne (ex. energy.maxCurrent
      // dépend de energy.dailyConsumption, toutes deux proposées par le
      // même Energy Engine). Sur un premier calcul, chaque clé est neuve
      // donc "changée" : propager naïvement marquerait obsolète une valeur
      // que ce même run vient tout juste de calculer avec les données
      // actuelles — ce n'est jamais une valeur "À recalculer", elle est à
      // jour par construction. Une clé obsolétée par cette propagation
      // n'est donc restaurée que si elle fait elle-même partie des
      // propositions de ce run (jamais pour une clé d'un autre moteur :
      // la propagation inter-moteurs reste intacte).
      const proposalByKey = new Map(retainedValueProposals.map((p) => [p.key, p]));

      for (const key of changedKeys) {
        const obsoletedKeys = await propagateObsolescence(project.id, key);

        for (const obsoletedKey of obsoletedKeys) {
          const freshProposal = proposalByKey.get(obsoletedKey);
          if (!freshProposal) {
            continue;
          }

          await persistValue({
            projectId: project.id,
            key: freshProposal.key,
            value: freshProposal.value,
            simulatedValue: freshProposal.simulatedValue,
            source: freshProposal.source ?? engine.id,
          });
        }
      }

      return result;
    },
  };
}
