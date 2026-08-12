import type { Metadata } from "next";
import type { ReactElement } from "react";
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
import {
  ENGINE_DESCRIPTIONS,
  ENGINE_FAMILIES,
  ENGINE_LABELS,
  ENGINE_PRIMARY_VALUE_KEY,
} from "@/lib/engine-payload";
import { getRetainedValueLabel, formatRetainedValueDisplay } from "@/lib/retained-value-labels";
import { EngineModuleShell } from "@/components/customer/dashboard/engines/EngineModuleShell";
import {
  EnergyIcon,
  BatteryIcon,
  AlternatorIcon,
  SolarIcon,
  ChargerIcon,
  BalanceIcon,
  CircuitIcon,
  CableIcon,
  ProtectionIcon,
  DiagramIcon,
  DistributionIcon,
} from "@/components/customer/dashboard/engines/icons";
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
import type { RegisteredEngineId } from "@/lib/engine-payload";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

// Espace client V2 (UI-9 FINAL, refonte visuelle UI-12). La liste réelle des
// moteurs vient exclusivement du registre peuplé (lib/engines/index.ts) :
// aucune liste n'est recopiée à la main ici. L'état de chaque module (À
// compléter / Retenu / À recalculer) est dérivé des valeurs réellement
// retenues pour ce Project, jamais inventé. Ordre de la page imposé par la
// mission UI-8 FINAL §6, repris par UI-12 §5 : identité Projet → actions
// nécessaires → valeurs retenues → famille Énergie → famille Distribution →
// actions secondaires. UI-12 ajoute uniquement de la composition visuelle
// (EngineModuleShell, icônes, regroupement en familles) — aucune règle
// métier n'est ajoutée ni modifiée dans ce fichier.
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

// UI-12 §5 — icône sobre par moteur, purement décorative (mission §6).
const ENGINE_ICONS: Record<RegisteredEngineId, (props: { className?: string }) => ReactElement> = {
  "energy.consumption": EnergyIcon,
  "battery.sizing": BatteryIcon,
  "alternator.charging": AlternatorIcon,
  "solar.production": SolarIcon,
  "charger.recharging": ChargerIcon,
  "energyBalance.global": BalanceIcon,
  "circuit.structure": CircuitIcon,
  "cable.sizing": CableIcon,
  "protection.selection": ProtectionIcon,
  "diagram.model": DiagramIcon,
};

// UI-12 §6 — "résultat important quand disponible" dans l'en-tête de carte
// repliée. Pour les moteurs à clé fixe (chaîne Énergie), on lit la valeur
// déjà retenue si elle existe. Pour la chaîne Distribution (clés
// dynamiques circuit.<id>/cable.<id>/...), on affiche un simple comptage.
function resultPreviewFor(
  engineId: RegisteredEngineId,
  retainedValues: ProjectRetainedValue[]
): string | null {
  const primaryKey = ENGINE_PRIMARY_VALUE_KEY[engineId];
  if (primaryKey) {
    const rv = retainedValues.find((v) => v.key === primaryKey && v.status === "ACTIVE");
    if (!rv) return null;
    const display = formatRetainedValueDisplay(rv.value, rv.key);
    return display ? `${getRetainedValueLabel(rv.key, rv.value)} : ${display}` : null;
  }

  const ns = namespaceOf(engineId);
  const count = retainedValues.filter((rv) => namespaceOf(rv.key) === ns && rv.status === "ACTIVE").length;
  if (count === 0) return null;
  return `${count} ${ENGINE_LABELS[engineId].toLowerCase()}${count > 1 ? "s" : ""} retenu${count > 1 ? "s" : ""}`;
}

function renderEngineModule(
  engineId: RegisteredEngineId,
  projectId: string,
  defaultVoltageV: number | null,
  consumerNames: string[],
  circuitsForChain: { id: string; name: string }[]
) {
  switch (engineId) {
    case "energy.consumption":
      return <EnergyModule projectId={projectId} />;
    case "battery.sizing":
      return <BatteryModule projectId={projectId} defaultVoltageV={defaultVoltageV} />;
    case "alternator.charging":
      return <AlternatorModule projectId={projectId} />;
    case "solar.production":
      return <SolarModule projectId={projectId} />;
    case "charger.recharging":
      return <ChargerModule projectId={projectId} />;
    case "energyBalance.global":
      return <EnergyBalanceModule projectId={projectId} />;
    case "circuit.structure":
      return <CircuitModule projectId={projectId} consumerNames={consumerNames} />;
    case "cable.sizing":
      return <CableModule projectId={projectId} circuits={circuitsForChain} />;
    case "protection.selection":
      return <ProtectionModule projectId={projectId} circuits={circuitsForChain} />;
    case "diagram.model":
      return <DiagramModule projectId={projectId} circuits={circuitsForChain} />;
    default:
      return null;
  }
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

  // Prochaine action logique (mission §5) : dérivée exclusivement de
  // l'état réel déjà calculé ci-dessus — jamais un score, jamais une
  // recommandation attribuée à Fabien.
  const nextAction =
    obsoleteCount > 0
      ? "Recalculer les valeurs devenues obsolètes."
      : firstIncompleteEngineId
        ? `Compléter le module « ${ENGINE_LABELS[firstIncompleteEngineId]} ».`
        : "Tous les modules sont à jour.";

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

        <Card className="mt-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
                  {project.name}
                </h1>
                <Badge tone={isDeleteScheduled ? "danger" : isArchived ? "neutral" : "success"}>
                  {getProjectStatusLabel(project.status)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {getProjectAssetTypeLabel(project.assetType)} · {getProjectVoltageLabel(project.voltage)}
              </p>
            </div>
          </div>

          {!isDeleteScheduled ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-3">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
              <p className="text-sm text-neutral-700">
                <span className="font-medium text-neutral-900">Prochaine action : </span>
                {nextAction}
              </p>
            </div>
          ) : null}

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
        </Card>
      </div>

      {/* 2. Actions nécessaires */}
      {obsoleteCount > 0 || uncompletedCount > 0 ? (
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
      ) : null}

      {/* Explication unique Calculer / Utiliser pour mon projet (mission
          §8) : compacte, une seule fois pour toute la page, jamais répétée
          module par module. L'icône ronde marque volontairement un
          emplacement compatible avec une future apparition discrète de
          Volta (UI-13) — aucune mascotte n'est ajoutée dans cette phase. */}
      <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-neutral-400"
          aria-hidden="true"
        >
          i
        </span>
        <p className="text-sm text-neutral-700">
          <strong className="font-medium text-neutral-900">Calculer</strong> essaie une valeur sans
          rien enregistrer.{" "}
          <strong className="font-medium text-neutral-900">Utiliser pour mon projet</strong> retient
          ce résultat comme décision.
        </p>
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
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {retainedValues.map((rv) => {
              const display = formatRetainedValueDisplay(rv.value, rv.key);
              return (
                <div key={rv.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-neutral-800">
                      {getRetainedValueLabel(rv.key, rv.value)}
                    </span>
                    <Badge tone={rv.status === "OBSOLETE" ? "warning" : "success"}>
                      {rv.status === "OBSOLETE" ? "À recalculer" : "Retenu"}
                    </Badge>
                  </div>
                  {display ? (
                    <p className="mt-1 text-lg font-semibold text-neutral-950">{display}</p>
                  ) : null}
                  {rv.status === "OBSOLETE" ? (
                    <p className="mt-1.5 text-xs text-orange-800">
                      {obsolescenceCause(rv.key, dependencies)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4-5. Familles de moteurs (Énergie, Distribution) */}
      {ENGINE_FAMILIES.map((family) => {
        const completedCount = family.engineIds.filter(
          (engineId) => moduleStatus(engineId, retainedValues) === "Retenu"
        ).length;

        return (
          <section key={family.id} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
                {family.id === "energie" ? (
                  <EnergyIcon className="h-4 w-4" />
                ) : (
                  <DistributionIcon className="h-4 w-4" />
                )}
              </span>
              <div>
                <h2 className="text-base font-semibold text-neutral-950">{family.label}</h2>
                <p className="text-xs text-neutral-500">
                  {completedCount}/{family.engineIds.length} module{family.engineIds.length > 1 ? "s" : ""} retenu
                  {completedCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {family.engineIds.map((engineId, index) => {
                const Icon = ENGINE_ICONS[engineId];
                return (
                  <EngineModuleShell
                    key={engineId}
                    icon={<Icon className="h-5 w-5" />}
                    title={ENGINE_LABELS[engineId]}
                    description={ENGINE_DESCRIPTIONS[engineId]}
                    status={moduleStatus(engineId, retainedValues)}
                    resultPreview={resultPreviewFor(engineId, retainedValues)}
                    defaultOpen={index === 0}
                  >
                    {renderEngineModule(
                      engineId,
                      project.id,
                      defaultVoltageV,
                      consumerNames,
                      circuitsForChain
                    )}
                  </EngineModuleShell>
                );
              })}
            </div>
          </section>
        );
      })}

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
