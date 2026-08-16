import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isHttpError } from "@/lib/http-errors";
import { getProject } from "@/lib/services/project";
import { getProjectValues } from "@/lib/services/project-values";
import { listDependencies } from "@/lib/services/project-dependencies";
import { getProjectSchema } from "@/lib/services/project-schema";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { listRegisteredEngineIds } from "@/lib/engines/index";
import { ENGINE_LABELS } from "@/lib/engine-payload";
import type { RegisteredEngineId } from "@/lib/engine-payload";
import { ProjectModeGate } from "@/components/customer/dashboard/project-mode/ProjectModeGate";
import { moduleStatus } from "@/lib/project-module-status";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

// Espace client V2 (UI-9 FINAL, refonte visuelle UI-12, mode Guidé/Avancé
// UI-13). Ce fichier ne fait que : vérifier l'ownership, lire les
// données réelles du Project (aucune règle métier ici), calculer les
// quelques dérivés déjà utilisés avant UI-13 (statut par moteur,
// prochaine action), puis déléguer tout l'affichage à ProjectModeGate
// (composant client qui décide Mode Guidé vs Mode Avancé — même Project,
// mêmes données, voir components/customer/dashboard/project-mode/
// ProjectModeGate.tsx). La logique de statut/obsolescence reste ici,
// partagée par les deux modes.

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const project = await getProject(actor, projectId);
    return { title: project.name, robots: { index: false, follow: false } };
  } catch {
    return { title: "Projet", robots: { index: false, follow: false } };
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params;
  const actor = await requireCustomerActor();

  let project;
  try {
    project = await getProject(actor, projectId);
  } catch (error) {
    if (isHttpError(error) && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    throw error;
  }

  // Ownership déjà vérifié par getProject ci-dessus : project.id est donc
  // sûr à utiliser pour lire les valeurs retenues et leurs dépendances.
  const [retainedValues, dependencies, schema] = await Promise.all([
    getProjectValues(project.id),
    listDependencies(project.id),
    getProjectSchema(actor, project.id),
  ]);

  const engineIds = listRegisteredEngineIds() as RegisteredEngineId[];

  const defaultVoltageV =
    project.voltage === "V12" ? 12 : project.voltage === "V24" ? 24 : null;

  const energyConsumersValue = retainedValues.find((rv) => rv.key === "energy.consumers");
  const consumerNames = Array.isArray(energyConsumersValue?.value)
    ? (energyConsumersValue.value as Array<{ name?: unknown }>)
        .map((consumer) => (typeof consumer?.name === "string" ? consumer.name : null))
        .filter((name): name is string => Boolean(name))
    : [];

  const circuitsForChain = retainedValues
    .filter((rv) => rv.key.startsWith("circuit.") && rv.status === "ACTIVE")
    .map((rv) => {
      const id = rv.key.slice("circuit.".length);
      const value = rv.value as { name?: unknown } | null;
      const name = typeof value?.name === "string" ? value.name : id;
      return { id, name };
    });

  const isDeleteScheduled = project.status === "DELETE_SCHEDULED";
  const isArchived = project.status === "ARCHIVED";

  const obsoleteCount = retainedValues.filter((rv) => rv.status === "OBSOLETE").length;
  const firstIncompleteEngineId = engineIds.find(
    (engineId) => moduleStatus(engineId, retainedValues) === "À compléter"
  );
  const uncompletedCount = engineIds.filter(
    (engineId) => moduleStatus(engineId, retainedValues) === "À compléter"
  ).length;

  const nextAction =
    obsoleteCount > 0
      ? "Recalculer les valeurs devenues obsolètes."
      : firstIncompleteEngineId
        ? `Compléter le module « ${ENGINE_LABELS[firstIncompleteEngineId]} ».`
        : "Tous les modules sont à jour.";

  return (
    <ProjectModeGate
      project={project}
      retainedValues={retainedValues}
      dependencies={dependencies}
      engineIds={engineIds}
      defaultVoltageV={defaultVoltageV}
      consumerNames={consumerNames}
      circuitsForChain={circuitsForChain}
      isDeleteScheduled={isDeleteScheduled}
      isArchived={isArchived}
      obsoleteCount={obsoleteCount}
      uncompletedCount={uncompletedCount}
      nextAction={nextAction}
      schemaThumbnail={schema?.thumbnail ?? null}
      hasSchema={Boolean(schema)}
    />
  );
}
