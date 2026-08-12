"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getProjectAssetTypeLabel, getProjectVoltageLabel } from "@/lib/project-labels";
import type { ProjectAssetType, ProjectVoltage } from "@/lib/generated/prisma/client";
import type { PickerState, ProjectSummary } from "./useProjectPicker";

const ASSET_TYPES: ProjectAssetType[] = ["BOAT", "VAN", "MOTORHOME", "OTHER"];
const VOLTAGES: ProjectVoltage[] = ["V12", "V24", "UNKNOWN"];

// UI-13 — étape "choix du Project" du pont Outils→Project (mission §14) :
// même liste/mêmes enums que components/customer/dashboard/
// CreateProjectForm.tsx, réutilisés ici en mini-formulaire plutôt que de
// rediriger vers une page séparée (le calcul en attente resterait sinon
// affiché nulle part pendant la redirection).
export function ProjectPickerStep({
  state,
  onSelect,
  onCreate,
  returnToLabel,
}: {
  state: PickerState;
  onSelect: (project: ProjectSummary) => void;
  onCreate: (input: { name: string; assetType: ProjectAssetType; voltage: ProjectVoltage }) => void;
  returnToLabel: string;
}) {
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<ProjectAssetType>("BOAT");
  const [voltage, setVoltage] = useState<ProjectVoltage>("UNKNOWN");

  if (state.step === "loading" || state.step === "idle") {
    return <p className="text-sm text-neutral-500">Chargement de vos projets…</p>;
  }

  if (state.step === "unauthenticated") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-700">
          Connectez-vous pour ajouter « {returnToLabel} » à un projet. Votre calcul est conservé, vous
          n&apos;aurez pas à le refaire.
        </p>
      </div>
    );
  }

  if (state.step === "error") {
    return <Alert tone="danger">{state.message}</Alert>;
  }

  if (state.step === "quota-reached") {
    return (
      <div className="space-y-3">
        <Alert tone="warning">
          Vous avez déjà 3 projets, la limite d&apos;un compte standard. Archivez ou supprimez un
          projet existant pour en créer un nouveau.
        </Alert>
        <Button href="/mon-compte/projets" variant="secondary">
          Gérer mes projets →
        </Button>
      </div>
    );
  }

  if (state.step === "pick") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-700">Ajouter à quel projet ?</p>
        <div className="space-y-2">
          {state.projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelect(project)}
              className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-left text-sm transition-colors hover:border-neutral-400"
            >
              <span>
                <span className="font-semibold text-neutral-950">{project.name}</span>
                <span className="ml-2 text-neutral-500">
                  {getProjectAssetTypeLabel(project.assetType)} · {getProjectVoltageLabel(project.voltage)}
                </span>
              </span>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // state.step === "create"
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate({ name: name.trim(), assetType, voltage });
      }}
      className="space-y-4"
    >
      <p className="text-sm text-neutral-700">
        Vous n&apos;avez pas encore de projet. Créez-en un pour y ajouter « {returnToLabel} ».
      </p>
      <div>
        <label htmlFor="picker-project-name" className="block text-sm font-semibold text-neutral-800">
          Nom du projet
        </label>
        <input
          id="picker-project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="ex : Refit électrique Bayliner"
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-neutral-700">
          Type
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as ProjectAssetType)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
          >
            {ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {getProjectAssetTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-neutral-700">
          Tension
          <select
            value={voltage}
            onChange={(e) => setVoltage(e.target.value as ProjectVoltage)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
          >
            {VOLTAGES.map((v) => (
              <option key={v} value={v}>
                {getProjectVoltageLabel(v)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button type="submit" variant="primary" disabled={!name.trim()}>
        Créer le projet →
      </Button>
    </form>
  );
}
