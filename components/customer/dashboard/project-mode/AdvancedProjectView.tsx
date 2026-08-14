import Link from "next/link";
import { VoltaGuide } from "@/components/volta/VoltaGuide";
import { VOLTA_MESSAGES } from "@/lib/volta/messages";
import type { ReactElement } from "react";
import { moduleStatus } from "@/lib/project-module-status";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
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
import type { Project } from "@/lib/generated/prisma/client";
import { ModeSwitch } from "./ModeSwitch";

// UI-13 — vue "Mode avancé" (mission §2) : extraite telle quelle de
// app/mon-compte/projets/[projectId]/page.tsx (refonte visuelle UI-12,
// inchangée ici). ProjectModeGate (composant client) décide d'afficher
// cette vue ou GuidedProjectFlow — même Project, mêmes données, aucune
// logique dupliquée entre les deux modes (mission §2 : "Le basculement
// entre Guided/Advanced ne doit pas créer deux Projects différents").
function namespaceOf(idOrKey: string) {
  return idOrKey.split(".")[0];
}

function obsolescenceCause(key: string, dependencies: ProjectValueDependency[]) {
  const dependsOn = dependencies.filter((edge) => edge.dependentKey === key).map((edge) => edge.dependsOnKey);

  if (dependsOn.length === 0) {
    return "Une donnée utilisée par ce calcul a changé.";
  }

  const labels = [...new Set(dependsOn.map((depKey) => getRetainedValueLabel(depKey)))];
  return `« ${labels.join(" », « ")} » a changé : ce calcul doit être relancé.`;
}

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

export function AdvancedProjectView({
  project,
  retainedValues,
  dependencies,
  engineIds,
  defaultVoltageV,
  consumerNames,
  circuitsForChain,
  isDeleteScheduled,
  isArchived,
  obsoleteCount,
  uncompletedCount,
  nextAction,
  onSwitchMode,
}: {
  project: Project;
  retainedValues: ProjectRetainedValue[];
  dependencies: ProjectValueDependency[];
  engineIds: RegisteredEngineId[];
  defaultVoltageV: number | null;
  consumerNames: string[];
  circuitsForChain: { id: string; name: string }[];
  isDeleteScheduled: boolean;
  isArchived: boolean;
  obsoleteCount: number;
  uncompletedCount: number;
  nextAction: string;
  onSwitchMode?: (mode: "guided" | "advanced") => void;
}) {
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
            {!isDeleteScheduled ? (
              <ModeSwitch projectId={project.id} current="advanced" onSwitch={onSwitchMode} />
            ) : null}
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

      {/* Éditeur de schéma électrique (retour utilisateur : "il manque
          enregistrer lié au compte client") — point d'entrée symétrique au
          bouton "Enregistrer dans mon projet" côté éditeur
          (components/schema-editor/SaveToProjectMenu.tsx). N'affecte aucune
          valeur retenue/moteur : le schéma vit dans son propre modèle
          Prisma (ProjectSchema), sauvegardé séparément. */}
      {!isDeleteScheduled ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-base font-semibold text-neutral-950">Schéma électrique</h2>
            <p className="mt-1 text-sm text-neutral-600">Dessinez et sauvegardez le schéma de câblage de ce projet.</p>
          </div>
          <Button href={`/outils/schema?projectId=${project.id}`}>Ouvrir l&apos;éditeur de schéma</Button>
        </Card>
      ) : null}

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

      {/* Explication unique Calculer / Utiliser pour mon projet — présence
          Volta principale de cet écran (UI-14 §17 : max une par écran en
          mode avancé, l'obsolescence ci-dessus reste en texte simple). */}
      <VoltaGuide variant="info" pose="neutre">
        {VOLTA_MESSAGES.calculateVsRetain}
      </VoltaGuide>

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
