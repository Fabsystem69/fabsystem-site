import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { isHttpError } from "@/lib/http-errors";
import { getProject } from "@/lib/services/project";
import { getProjectValues } from "@/lib/services/project-values";
import { listDependencies } from "@/lib/services/project-dependencies";
import { requireCustomerActor } from "@/lib/server/project-actor";
import {
  getProjectAssetTypeLabel,
  getProjectStatusLabel,
  getProjectVoltageLabel,
} from "@/lib/project-labels";
import {
  ArchiveProjectButton,
  CancelDeletionButton,
  DeleteProjectControls,
  RenameProjectForm,
} from "@/components/customer/dashboard/ProjectActions";
import { listRegisteredEngineIds } from "@/lib/engines/index";
import { ENERGY_CHAIN, CIRCUIT_CHAIN, ENGINE_LABELS } from "@/lib/engine-payload";
import { getRetainedValueLabel } from "@/lib/retained-value-labels";
import { EnergyModule } from "@/components/customer/dashboard/engines/EnergyModule";
import { BatteryModule } from "@/components/customer/dashboard/engines/BatteryModule";
import { AlternatorModule } from "@/components/customer/dashboard/engines/AlternatorModule";
import { SolarModule } from "@/components/customer/dashboard/engines/SolarModule";
import { ChargerModule } from "@/components/customer/dashboard/engines/ChargerModule";
import { EnergyBalanceModule } from "@/components/customer/dashboard/engines/EnergyBalanceModule";
import { CircuitModule } from "@/components/customer/dashboard/engines/CircuitModule";
import { CableModule } from "@/components/customer/dashboard/engines/CableModule";
import { ProtectionModule } from "@/components/customer/dashboard/engines/ProtectionModule";
import { DiagramModule } from "@/components/customer/dashboard/engines/DiagramModule";
import type { ProjectRetainedValue, ProjectValueDependency } from "@/lib/generated/prisma/client";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

// Espace client V2 (UI-9 FINAL) — Vue Project. La liste réelle des moteurs
// vient exclusivement du registre peuplé (lib/engines/index.ts) : aucune
// liste n'est recopiée à la main ici. L'état de chaque module (À compléter
// / Retenu / À recalculer) est dérivé des valeurs réellement retenues pour
// ce Project, jamais inventé. Ordre de la page imposé par la mission §6 :
// identité Projet → actions nécessaires → valeurs retenues → chaîne
// Énergie → chaîne Circuits → actions secondaires. Le bloc "Structure
// technique" (grille redondante avec les statuts déjà affichés dans les
// deux chaînes) a été supprimé (UI-9A avait relevé jusqu'à 3 répétitions
// de la même information).
function namespaceOf(idOrKey: string) {
  return idOrKey.split(".")[0];
}

function moduleStatus(engineId: string, retainedValues: ProjectRetainedValue[]) {
  const ns = namespaceOf(engineId);
  const related = retainedValues.filter((rv) => namespaceOf(rv.key) === ns);
  if (related.length === 0) return "À compléter";
  if (related.some((rv) => rv.status === "OBSOLETE")) return "À recalculer";
  return "Retenu";
}

// Cause de l'obsolescence (mission §9) : dérivée exclusivement des
// dépendances déjà déclarées (ProjectValueDependency, réutilisées telles
// quelles) — aucune nouvelle logique métier. Si aucune dépendance connue
// n'explique le changement, un message générique reste acceptable.
function obsolescenceCause(key: string, dependencies: ProjectValueDependency[]) {
  const dependsOn = dependencies.filter((edge) => edge.dependentKey === key).map((edge) => edge.dependsOnKey);

  if (dependsOn.length === 0) {
    return "Une donnée utilisée par ce calcul a changé.";
  }

  const labels = [...new Set(dependsOn.map((depKey) => getRetainedValueLabel(depKey)))];
  return `« ${labels.join(" », « ")} » a changé : ce calcul doit être relancé.`;
}

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
  const [retainedValues, dependencies] = await Promise.all([
    getProjectValues(project.id),
    listDependencies(project.id),
  ]);

  const engineIds = listRegisteredEngineIds();

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

  return (
    <div className="space-y-8">
      {/* 1. Identité Projet */}
      <div>
        <Link
          href="/mon-compte/projets"
          className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
        >
          ← Mes projets
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">{project.name}</h1>
          <Badge tone={isDeleteScheduled ? "danger" : isArchived ? "neutral" : "success"}>
            {getProjectStatusLabel(project.status)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {getProjectAssetTypeLabel(project.assetType)} · {getProjectVoltageLabel(project.voltage)}
        </p>

        {isDeleteScheduled && project.deleteScheduledAt ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Suppression programmée le {formatDate(project.deleteScheduledAt)}
            </p>
            <p className="mt-1 text-sm text-red-800">
              Vous pouvez annuler cette suppression tant que l&apos;échéance n&apos;est pas
              atteinte.
            </p>
            <div className="mt-3">
              <CancelDeletionButton projectId={project.id} />
            </div>
          </div>
        ) : null}
      </div>

      {/* 2. Actions nécessaires */}
      <ActionsToDoSection engineIds={engineIds} retainedValues={retainedValues} />

      {/* Explication unique Calculer / Utiliser pour mon projet (mission
          §7) : une seule fois pour toute la page, jamais répétée module
          par module. */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        Dans chaque module ci-dessous : <strong>Calculer</strong> affiche un résultat sans rien
        enregistrer — vous pouvez essayer plusieurs valeurs. <strong>Utiliser pour mon projet</strong>{" "}
        enregistre ce résultat comme la décision retenue pour votre projet.
      </div>

      {/* 3. Valeurs retenues importantes */}
      {retainedValues.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm font-semibold text-neutral-950">Votre projet est prêt.</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Aucune information n&apos;est encore retenue dans ce projet. Complétez le premier
            module ci-dessous (Énergie) pour commencer.
          </p>
        </Card>
      ) : (
        <section>
          <h2 className="text-base font-semibold text-neutral-950">Informations retenues</h2>
          <div className="mt-3 space-y-2">
            {retainedValues.map((rv) => (
              <div key={rv.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-800">
                    {getRetainedValueLabel(rv.key, rv.value)}
                  </span>
                  <Badge tone={rv.status === "OBSOLETE" ? "warning" : "success"}>
                    {rv.status === "OBSOLETE" ? "À recalculer" : "Retenu"}
                  </Badge>
                </div>
                {rv.status === "OBSOLETE" ? (
                  <p className="mt-1.5 text-xs text-orange-800">
                    {obsolescenceCause(rv.key, dependencies)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Chaîne Énergie */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Chaîne Énergie</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Énergie → Batterie → Alternateur → Solaire → Chargeur → Bilan énergétique.
          </p>
        </div>
        {ENERGY_CHAIN.map((engineId) => (
          <details key={engineId} open={engineId === "energy.consumption"}>
            <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
              {ENGINE_LABELS[engineId]} — {moduleStatus(engineId, retainedValues)}
            </summary>
            <div className="mt-3">
              {engineId === "energy.consumption" ? <EnergyModule projectId={project.id} /> : null}
              {engineId === "battery.sizing" ? (
                <BatteryModule projectId={project.id} defaultVoltageV={defaultVoltageV} />
              ) : null}
              {engineId === "alternator.charging" ? <AlternatorModule projectId={project.id} /> : null}
              {engineId === "solar.production" ? <SolarModule projectId={project.id} /> : null}
              {engineId === "charger.recharging" ? <ChargerModule projectId={project.id} /> : null}
              {engineId === "energyBalance.global" ? (
                <EnergyBalanceModule projectId={project.id} />
              ) : null}
            </div>
          </details>
        ))}
      </section>

      {/* 5. Chaîne Circuits */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Chaîne Circuit</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Circuit → Câble → Protection → Schéma.
          </p>
        </div>
        {CIRCUIT_CHAIN.map((engineId) => (
          <details key={engineId} open={engineId === "circuit.structure"}>
            <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
              {ENGINE_LABELS[engineId]} — {moduleStatus(engineId, retainedValues)}
            </summary>
            <div className="mt-3">
              {engineId === "circuit.structure" ? (
                <CircuitModule projectId={project.id} consumerNames={consumerNames} />
              ) : null}
              {engineId === "cable.sizing" ? (
                <CableModule projectId={project.id} circuits={circuitsForChain} />
              ) : null}
              {engineId === "protection.selection" ? (
                <ProtectionModule projectId={project.id} circuits={circuitsForChain} />
              ) : null}
              {engineId === "diagram.model" ? (
                <DiagramModule projectId={project.id} circuits={circuitsForChain} />
              ) : null}
            </div>
          </details>
        ))}
      </section>

      {/* 6. Actions Project secondaires */}
      {!isDeleteScheduled ? (
        <section className="border-t border-neutral-200 pt-6">
          <h2 className="text-sm font-semibold text-neutral-700">Gérer ce projet</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <RenameProjectForm projectId={project.id} currentName={project.name} />
            {!isArchived ? <ArchiveProjectButton projectId={project.id} /> : null}
            <DeleteProjectControls projectId={project.id} />
          </div>
        </section>
      ) : null}

      {retainedValues.length === 0 ? (
        <div>
          <Button href="/outils" variant="secondary">
            Utiliser les calculateurs FabSystem →
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// Synthèse neutre des actions déterministes à faire (mission §7/§8 UI-8
// FINAL, reconduite en UI-9 FINAL) : ni score, ni pourcentage, ni
// recommandation attribuée à Fabien (aucune n'a été écrite ici) —
// uniquement des constats factuels dérivés de l'état réel des valeurs
// retenues.
function ActionsToDoSection({
  engineIds,
  retainedValues,
}: {
  engineIds: string[];
  retainedValues: ProjectRetainedValue[];
}) {
  const obsoleteCount = retainedValues.filter((rv) => rv.status === "OBSOLETE").length;
  const uncompletedCount = engineIds.filter(
    (engineId) => moduleStatus(engineId, retainedValues) === "À compléter"
  ).length;

  if (obsoleteCount === 0 && uncompletedCount === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-base font-semibold text-neutral-950">À faire maintenant</h2>
      <div className="mt-3 space-y-2">
        {obsoleteCount > 0 ? (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
            {obsoleteCount} valeur{obsoleteCount > 1 ? "s" : ""} retenue{obsoleteCount > 1 ? "s" : ""}{" "}
            {obsoleteCount > 1 ? "ne correspondent" : "ne correspond"} plus aux données modifiées et{" "}
            {obsoleteCount > 1 ? "doivent" : "doit"} être recalculée{obsoleteCount > 1 ? "s" : ""}.
          </div>
        ) : null}
        {uncompletedCount > 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
            {uncompletedCount} module{uncompletedCount > 1 ? "s" : ""} technique
            {uncompletedCount > 1 ? "s" : ""} {uncompletedCount > 1 ? "restent" : "reste"} à compléter.
          </div>
        ) : null}
      </div>
    </section>
  );
}
