"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ProjectRetainedValue, ProjectValueDependency, Project } from "@/lib/generated/prisma/client";
import type { RegisteredEngineId } from "@/lib/engine-payload";
import { moduleStatus } from "@/lib/project-module-status";
import { getProjectAssetTypeLabel, getProjectVoltageLabel } from "@/lib/project-labels";
import { getRetainedValueLabel, formatRetainedValueDisplay } from "@/lib/retained-value-labels";
import {
  readGuidedFlowState,
  writeGuidedFlowState,
  type GuidedFlowState,
  type RechargeMethod,
} from "@/lib/client/guided-flow-storage";
import { ModeSwitch } from "../project-mode/ModeSwitch";
import { GuidedStepShell } from "./GuidedStepShell";
import {
  EnergyIcon,
  BatteryIcon,
  AlternatorIcon,
  SolarIcon,
  ChargerIcon,
  DistributionIcon,
  DiagramIcon,
} from "@/components/customer/dashboard/engines/icons";
import { EnergyModule } from "@/components/customer/dashboard/engines/EnergyModule";
import { BatteryModule } from "@/components/customer/dashboard/engines/BatteryModule";
import { AlternatorModule } from "@/components/customer/dashboard/engines/AlternatorModule";
import { SolarModule } from "@/components/customer/dashboard/engines/SolarModule";
import { ChargerModule } from "@/components/customer/dashboard/engines/ChargerModule";
import { CircuitModule } from "@/components/customer/dashboard/engines/CircuitModule";
import { CableModule } from "@/components/customer/dashboard/engines/CableModule";
import { ProtectionModule } from "@/components/customer/dashboard/engines/ProtectionModule";
import { DiagramModule } from "@/components/customer/dashboard/engines/DiagramModule";

const STEP_IDS = ["installation", "besoins", "batterie", "recharge", "distribution", "schema"] as const;
type StepId = (typeof STEP_IDS)[number];

const STEP_LABELS: Record<StepId, string> = {
  installation: "Mon installation",
  besoins: "Mes besoins",
  batterie: "Ma batterie",
  recharge: "Ma recharge",
  distribution: "Ma distribution",
  schema: "Mon schéma",
};

const RECHARGE_OPTIONS: { id: RechargeMethod; label: string }[] = [
  { id: "alternator", label: "Alternateur (moteur)" },
  { id: "solar", label: "Solaire" },
  { id: "charger", label: "Prise 230 V / quai" },
];

// UI-13 §2, §4-12 — parcours guidé par grandes étapes. Chaque étape
// habille un ou plusieurs des composants moteur déjà réels (EnergyModule,
// BatteryModule...), inchangés — aucune formule dupliquée (mission §27).
// La conditionnalité (§8 : "si l'utilisateur ne sélectionne pas solaire,
// ne pas lui faire remplir MPPT") se joue à l'intérieur de l'étape
// "Ma recharge"/"Ma distribution", pas en ajoutant/retirant des étapes —
// la progression reste prévisible ("Étape X sur 6").
export function GuidedProjectFlow({
  project,
  retainedValues,
  dependencies,
  defaultVoltageV,
  consumerNames,
  circuitsForChain,
  obsoleteCount,
  uncompletedCount,
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
  onSwitchMode: (mode: "guided" | "advanced") => void;
}) {
  const [flow, setFlow] = useState<GuidedFlowState | null>(null);

  useEffect(() => {
    setFlow(readGuidedFlowState(project.id));
  }, [project.id]);

  // Précédent/Suivant ne change que l'état affiché (pas de navigation de
  // page) : sans ceci, un utilisateur qui a scrollé vers le bas sur une
  // étape haute (ex. après avoir rempli un formulaire) atterrit au milieu
  // — voire hors du contenu visible — de l'étape suivante, souvent plus
  // courte. Ça se manifestait comme "la page bug, il faut rafraîchir" :
  // le rafraîchissement remet simplement le scroll à zéro. Placé avant le
  // `if (!flow) return null` ci-dessous pour respecter les Rules of Hooks
  // (un hook ne peut pas suivre un retour conditionnel).
  useEffect(() => {
    if (!flow) return;
    window.scrollTo(0, 0);
  }, [flow?.stepId]);

  function updateFlow(patch: Partial<GuidedFlowState>) {
    setFlow((current) => {
      const next = { ...(current ?? readGuidedFlowState(project.id)), ...patch };
      writeGuidedFlowState(project.id, next);
      return next;
    });
  }

  if (!flow) return null;

  const currentIndex = Math.max(0, STEP_IDS.indexOf(flow.stepId as StepId));
  const currentStepId = STEP_IDS[currentIndex] ?? "installation";

  function goTo(index: number) {
    const clamped = Math.min(Math.max(index, 0), STEP_IDS.length - 1);
    updateFlow({ stepId: STEP_IDS[clamped] });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/mon-compte/projets"
          className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
        >
          ← Mes projets
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">{project.name}</h1>
            <p className="mt-1 text-sm text-neutral-600">
              {getProjectAssetTypeLabel(project.assetType)} · {getProjectVoltageLabel(project.voltage)}
            </p>
          </div>
          <ModeSwitch projectId={project.id} current="guided" onSwitch={onSwitchMode} />
        </div>
      </div>

      {/* Progression honnête (mission §11) : pas de pourcentage, des
          faits dérivés des données réelles déjà calculées côté serveur. */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
        <span className="font-medium text-neutral-900">
          Étape {currentIndex + 1} sur {STEP_IDS.length} — {STEP_LABELS[currentStepId]}
        </span>
        <span className="text-neutral-600">
          {obsoleteCount > 0
            ? `${obsoleteCount} élément${obsoleteCount > 1 ? "s" : ""} à recalculer`
            : uncompletedCount > 0
              ? `${uncompletedCount} élément${uncompletedCount > 1 ? "s" : ""} restent à renseigner`
              : "Tout est à jour"}
        </span>
      </div>

      {currentStepId === "installation" ? (
        <InstallationStep project={project} />
      ) : currentStepId === "besoins" ? (
        <BesoinsStep projectId={project.id} retainedValues={retainedValues} />
      ) : currentStepId === "batterie" ? (
        <BatterieStep
          projectId={project.id}
          defaultVoltageV={defaultVoltageV}
          retainedValues={retainedValues}
          flow={flow}
          onAnswer={(answer) => updateFlow({ hasExistingBattery: answer })}
        />
      ) : currentStepId === "recharge" ? (
        <RechargeStep
          projectId={project.id}
          retainedValues={retainedValues}
          flow={flow}
          onToggleMethod={(method) =>
            updateFlow({
              rechargeMethods: flow.rechargeMethods.includes(method)
                ? flow.rechargeMethods.filter((m) => m !== method)
                : [...flow.rechargeMethods, method],
              rechargeUnknown: false,
            })
          }
          onUnknown={() => updateFlow({ rechargeUnknown: true, rechargeMethods: [] })}
        />
      ) : currentStepId === "distribution" ? (
        <DistributionStep
          projectId={project.id}
          consumerNames={consumerNames}
          circuitsForChain={circuitsForChain}
          retainedValues={retainedValues}
        />
      ) : (
        <SchemaStep
          projectId={project.id}
          circuitsForChain={circuitsForChain}
          retainedValues={retainedValues}
          dependencies={dependencies}
        />
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)}>
          ← Précédent
        </Button>
        {currentIndex < STEP_IDS.length - 1 ? (
          <Button type="button" variant="primary" onClick={() => goTo(currentIndex + 1)}>
            Suivant →
          </Button>
        ) : (
          <Button href={`/mon-compte/projets/${project.id}`} variant="primary">
            Terminer
          </Button>
        )}
      </div>
    </div>
  );
}

function InstallationStep({ project }: { project: Project }) {
  return (
    <GuidedStepShell
      icon={<EnergyIcon className="h-5 w-5" />}
      title="Votre installation"
      helper="Ces informations ont été renseignées à la création du projet."
    >
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-neutral-500">Type</dt>
          <dd className="text-sm font-semibold text-neutral-950">
            {getProjectAssetTypeLabel(project.assetType)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Tension</dt>
          <dd className="text-sm font-semibold text-neutral-950">
            {getProjectVoltageLabel(project.voltage)}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-neutral-500">
        Passez en mode avancé pour renommer le projet ou modifier ces informations.
      </p>
    </GuidedStepShell>
  );
}

function BesoinsStep({
  projectId,
  retainedValues,
}: {
  projectId: string;
  retainedValues: ProjectRetainedValue[];
}) {
  const status = moduleStatus("energy.consumption", retainedValues);
  return (
    <GuidedStepShell
      icon={<EnergyIcon className="h-5 w-5" />}
      title="Quels appareils utilisez-vous ?"
      helper="Ajoutez vos appareils avec leur puissance et leur durée d'utilisation quotidienne — FabSystem calcule votre consommation."
    >
      <div className="mb-3">
        <Badge tone={status === "Retenu" ? "success" : status === "À recalculer" ? "warning" : "neutral"}>
          {status}
        </Badge>
      </div>
      <EnergyModule projectId={projectId} />
      <p className="mt-4 text-xs text-neutral-500">
        Besoin d&apos;une liste détaillée avec export PDF ?{" "}
        <a
          href="/outils/bilan-consommation"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
        >
          Ouvrir le calculateur Bilan de consommation
        </a>{" "}
        — pensez à revenir ici pour utiliser le résultat.
      </p>
    </GuidedStepShell>
  );
}

function BatterieStep({
  projectId,
  defaultVoltageV,
  retainedValues,
  flow,
  onAnswer,
}: {
  projectId: string;
  defaultVoltageV: number | null;
  retainedValues: ProjectRetainedValue[];
  flow: GuidedFlowState;
  onAnswer: (answer: "yes" | "no" | "unknown") => void;
}) {
  const status = moduleStatus("battery.sizing", retainedValues);
  const energyRetained = moduleStatus("energy.consumption", retainedValues) === "Retenu";

  return (
    <GuidedStepShell
      icon={<BatteryIcon className="h-5 w-5" />}
      title="Avez-vous déjà une batterie ?"
      helper="Si vous ne savez pas encore, FabSystem peut estimer une capacité à partir de votre consommation."
    >
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["yes", "Oui"],
            ["no", "Non"],
            ["unknown", "Je ne sais pas"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onAnswer(value)}
            aria-pressed={flow.hasExistingBattery === value}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              flow.hasExistingBattery === value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {flow.hasExistingBattery ? (
        <div className="mt-5 border-t border-neutral-200 pt-5">
          {!energyRetained ? (
            <p className="text-sm text-neutral-600">
              Complétez d&apos;abord l&apos;étape « Mes besoins » : le calcul de batterie se base sur
              votre consommation retenue.
            </p>
          ) : (
            <>
              <div className="mb-3">
                <Badge tone={status === "Retenu" ? "success" : status === "À recalculer" ? "warning" : "neutral"}>
                  {status}
                </Badge>
              </div>
              <BatteryModule projectId={projectId} defaultVoltageV={defaultVoltageV} />
            </>
          )}
        </div>
      ) : null}
    </GuidedStepShell>
  );
}

function RechargeStep({
  projectId,
  retainedValues,
  flow,
  onToggleMethod,
  onUnknown,
}: {
  projectId: string;
  retainedValues: ProjectRetainedValue[];
  flow: GuidedFlowState;
  onToggleMethod: (method: RechargeMethod) => void;
  onUnknown: () => void;
}) {
  return (
    <GuidedStepShell
      icon={<AlternatorIcon className="h-5 w-5" />}
      title="Comment rechargez-vous ou souhaitez-vous recharger votre batterie ?"
      helper="Sélectionnez uniquement ce qui vous concerne — les autres questions ne s'afficheront pas."
    >
      <div className="flex flex-wrap gap-2">
        {RECHARGE_OPTIONS.map((option) => {
          const checked = flow.rechargeMethods.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggleMethod(option.id)}
              aria-pressed={checked}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                checked
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
              }`}
            >
              {option.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onUnknown}
          aria-pressed={flow.rechargeUnknown}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            flow.rechargeUnknown
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
          }`}
        >
          Je ne sais pas encore
        </button>
      </div>

      {flow.rechargeMethods.length > 0 ? (
        <div className="mt-6 space-y-6 border-t border-neutral-200 pt-6">
          {flow.rechargeMethods.includes("alternator") ? (
            <RechargeSubModule
              icon={<AlternatorIcon className="h-4 w-4" />}
              title="Alternateur"
              status={moduleStatus("alternator.charging", retainedValues)}
            >
              <AlternatorModule projectId={projectId} />
            </RechargeSubModule>
          ) : null}
          {flow.rechargeMethods.includes("solar") ? (
            <RechargeSubModule
              icon={<SolarIcon className="h-4 w-4" />}
              title="Solaire"
              status={moduleStatus("solar.production", retainedValues)}
            >
              <SolarModule projectId={projectId} />
            </RechargeSubModule>
          ) : null}
          {flow.rechargeMethods.includes("charger") ? (
            <RechargeSubModule
              icon={<ChargerIcon className="h-4 w-4" />}
              title="Prise 230 V / quai"
              status={moduleStatus("charger.recharging", retainedValues)}
            >
              <ChargerModule projectId={projectId} />
            </RechargeSubModule>
          ) : null}
        </div>
      ) : null}
    </GuidedStepShell>
  );
}

function RechargeSubModule({
  icon,
  title,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-neutral-950">{title}</h3>
        <Badge tone={status === "Retenu" ? "success" : status === "À recalculer" ? "warning" : "neutral"}>
          {status}
        </Badge>
      </div>
      {children}
    </div>
  );
}

function DistributionStep({
  projectId,
  consumerNames,
  circuitsForChain,
  retainedValues,
}: {
  projectId: string;
  consumerNames: string[];
  circuitsForChain: { id: string; name: string }[];
  retainedValues: ProjectRetainedValue[];
}) {
  const circuitStatus = moduleStatus("circuit.structure", retainedValues);

  return (
    <GuidedStepShell
      icon={<DistributionIcon className="h-5 w-5" />}
      title="Quels équipements devez-vous alimenter ?"
      helper="Regroupez vos appareils en circuits — FabSystem dimensionne ensuite le câble et la protection de chacun."
    >
      <div className="space-y-6">
        <RechargeSubModule icon={<DistributionIcon className="h-4 w-4" />} title="Circuits" status={circuitStatus}>
          <CircuitModule projectId={projectId} consumerNames={consumerNames} />
        </RechargeSubModule>

        {circuitsForChain.length > 0 ? (
          <>
            <RechargeSubModule
              icon={<DistributionIcon className="h-4 w-4" />}
              title="Câbles"
              status={moduleStatus("cable.sizing", retainedValues)}
            >
              <CableModule projectId={projectId} circuits={circuitsForChain} />
              <p className="mt-3 text-xs text-neutral-500">
                Besoin de tester d&apos;autres hypothèses rapidement ?{" "}
                <a
                  href="/outils/section-cable"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
                >
                  Ouvrir le calculateur Section de câble
                </a>{" "}
                — le résultat pourra être ajouté à ce projet depuis l&apos;outil.
              </p>
            </RechargeSubModule>
            <RechargeSubModule
              icon={<DistributionIcon className="h-4 w-4" />}
              title="Protections"
              status={moduleStatus("protection.selection", retainedValues)}
            >
              <ProtectionModule projectId={projectId} circuits={circuitsForChain} />
            </RechargeSubModule>
          </>
        ) : (
          <p className="text-sm text-neutral-600">
            Retenez au moins un circuit ci-dessus pour dimensionner ses câbles et protections.
          </p>
        )}
      </div>
    </GuidedStepShell>
  );
}

function SchemaStep({
  projectId,
  circuitsForChain,
  retainedValues,
  dependencies,
}: {
  projectId: string;
  circuitsForChain: { id: string; name: string }[];
  retainedValues: ProjectRetainedValue[];
  dependencies: ProjectValueDependency[];
}) {
  return (
    <GuidedStepShell
      icon={<DiagramIcon className="h-5 w-5" />}
      title="Synthèse de votre projet"
      helper="Ce que FabSystem a retenu jusqu'ici."
    >
      {retainedValues.length === 0 ? (
        <p className="text-sm text-neutral-600">Rien n&apos;est encore retenu dans ce projet.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {retainedValues.map((rv) => {
            const display = formatRetainedValueDisplay(rv.value, rv.key);
            const dependsOn = dependencies
              .filter((edge) => edge.dependentKey === rv.key)
              .map((edge) => getRetainedValueLabel(edge.dependsOnKey));
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
                {display ? <p className="mt-1 text-lg font-semibold text-neutral-950">{display}</p> : null}
                {rv.status === "OBSOLETE" && dependsOn.length > 0 ? (
                  <p className="mt-1.5 text-xs text-orange-800">
                    « {dependsOn.join(" », « ")} » a changé : ce calcul doit être relancé.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {circuitsForChain.length > 0 ? (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <RechargeSubModule
            icon={<DiagramIcon className="h-4 w-4" />}
            title="Schéma"
            status={moduleStatus("diagram.model", retainedValues)}
          >
            <DiagramModule projectId={projectId} circuits={circuitsForChain} />
          </RechargeSubModule>
        </div>
      ) : null}
    </GuidedStepShell>
  );
}
