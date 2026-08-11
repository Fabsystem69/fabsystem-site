"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { ProjectAssetType, ProjectVoltage } from "@/lib/generated/prisma/client";
import { PROJECT_ASSET_TYPE_LABELS, PROJECT_VOLTAGE_LABELS } from "@/lib/project-labels";

// Espace client V2 (UI-8) — création minimale (MASTER-06 §8-9) : nom,
// type, tension. "Je ne sais pas" (UNKNOWN) ne bloque jamais la création.
const ASSET_TYPES: ProjectAssetType[] = ["BOAT", "VAN", "MOTORHOME", "OTHER"];
const VOLTAGES: ProjectVoltage[] = ["V12", "V24", "UNKNOWN"];

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<ProjectAssetType>("BOAT");
  const [voltage, setVoltage] = useState<ProjectVoltage>("UNKNOWN");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Le nom du projet est obligatoire.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmedName, assetType, voltage }),
      });

      const data = (await response.json().catch(() => null)) as
        | { project?: { id: string }; error?: string }
        | null;

      if (!response.ok || !data?.project) {
        throw new Error(data?.error || "Impossible de créer ce projet.");
      }

      router.push(`/mon-compte/projets/${data.project.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inattendue.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="project-name" className="block text-sm font-semibold text-neutral-800">
          Nom du projet
        </label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="ex : Refit électrique Bayliner"
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-neutral-800">Type</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          {ASSET_TYPES.map((type) => (
            <label
              key={type}
              className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                assetType === type
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
              }`}
            >
              <input
                type="radio"
                name="assetType"
                value={type}
                checked={assetType === type}
                onChange={() => setAssetType(type)}
                className="sr-only"
              />
              {PROJECT_ASSET_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-neutral-800">Tension principale</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {VOLTAGES.map((v) => (
            <label
              key={v}
              className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                voltage === v
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
              }`}
            >
              <input
                type="radio"
                name="voltage"
                value={v}
                checked={voltage === v}
                onChange={() => setVoltage(v)}
                className="sr-only"
              />
              {PROJECT_VOLTAGE_LABELS[v]}
            </label>
          ))}
        </div>
      </fieldset>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Création..." : "Créer le projet"}
      </Button>
    </form>
  );
}
