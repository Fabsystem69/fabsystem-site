import type { Project, ProjectRetainedValue, ProjectValueDependency } from "@/lib/generated/prisma/client";
import { listDependencies } from "@/lib/services/project-dependencies";
import { getProjectValue, getProjectValues } from "@/lib/services/project-values";
import type { EngineContext } from "@/lib/engines/types";

// Couche 4.0 : construction du EngineContext à partir d'un Project déjà
// résolu (ownership déjà vérifié en amont, cf. EngineRunner). Réutilise
// tel quel le socle Project de la Phase 3 — aucune nouvelle logique de
// lecture des valeurs/dépendances n'est créée ici.

export type EngineContextDeps = {
  now?: () => Date;
  getRetainedValue?: (projectId: string, key: string) => Promise<ProjectRetainedValue | null>;
  getRetainedValues?: (projectId: string) => Promise<ProjectRetainedValue[]>;
  getDependencies?: (projectId: string) => Promise<ProjectValueDependency[]>;
};

export function createEngineContext(project: Project, deps?: EngineContextDeps): EngineContext {
  const now = deps?.now ?? (() => new Date());
  const readValue = deps?.getRetainedValue ?? getProjectValue;
  const readValues = deps?.getRetainedValues ?? getProjectValues;
  const readDependencies = deps?.getDependencies ?? listDependencies;

  return {
    project,
    now,
    getRetainedValue: (key: string) => readValue(project.id, key),
    getRetainedValues: () => readValues(project.id),
    getDependencies: () => readDependencies(project.id),
  };
}
