"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProjectPickerStep } from "./ProjectPickerStep";
import { useProjectPicker } from "./useProjectPicker";
import { translateMpptToSolarInput, type MpptSolarForm } from "@/lib/outils-project-bridge";
import { writePendingImport } from "@/lib/client/pending-import-storage";
import { formatRetainedValueDisplay } from "@/lib/retained-value-labels";

type SolarOutput = {
  dailySolarEnergyWh: number;
  averageChargingCurrentA: number;
  theoreticalRechargeTimeHours: number;
  coverageRatio: number;
};
type RetainedValueLite = { key: string; value: unknown; status: "ACTIVE" | "OBSOLETE" };

// UI-13 §6, §16-18 — pont "MPPT/solaire" → moteur solar.production. Même
// flux que EnergyImportModal (bilan de consommation) : calcul déjà fait →
// clic → choix Project → aperçu (retain:false) → validation → import
// (retain:true) → jamais d'écrasement silencieux (comparaison à
// solar.dailyEnergy si déjà retenu).
export function SolarImportModal({
  form,
  onClose,
}: {
  form: MpptSolarForm;
  onClose: () => void;
}) {
  const picker = useProjectPicker();
  const [phase, setPhase] = useState<"pick" | "preview" | "done">("pick");
  const [previewOutput, setPreviewOutput] = useState<SolarOutput | null>(null);
  const [existingValue, setExistingValue] = useState<RetainedValueLite | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translated = translateMpptToSolarInput(form);

  const selectedProjectId = picker.state.step === "selected" ? picker.state.projectId : null;
  const selectedProjectName = picker.state.step === "selected" ? picker.state.projectName : null;

  useEffect(() => {
    picker.loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedProjectId || phase !== "pick") return;

    let cancelled = false;
    setLoadingPreview(true);
    setError(null);

    (async () => {
      try {
        const [runResponse, valuesResponse] = await Promise.all([
          fetch(`/api/projects/${selectedProjectId}/engines/solar.production/run`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ input: translated, retain: false }),
          }),
          fetch(`/api/projects/${selectedProjectId}/values`),
        ]);

        const runBody = (await runResponse.json().catch(() => null)) as
          | { output?: SolarOutput; error?: string }
          | null;
        if (cancelled) return;
        if (!runResponse.ok || !runBody?.output) {
          // solar.production dépend de energy.dailyConsumption et
          // battery.usefulCapacity déjà retenus dans le projet pour calculer
          // rechargeTime/coverage — message adapté plutôt que l'erreur brute
          // du moteur si ces valeurs manquent encore.
          setError(
            runBody?.error ||
              "Complétez d'abord « Mes besoins » et « Ma batterie » dans ce projet avant d'ajouter le solaire."
          );
          return;
        }

        const valuesBody = (await valuesResponse.json().catch(() => null)) as
          | { values?: RetainedValueLite[] }
          | null;
        if (cancelled) return;

        const existing =
          valuesBody?.values?.find((v) => v.key === "solar.dailyEnergy" && v.status === "ACTIVE") ?? null;

        setPreviewOutput(runBody.output);
        setExistingValue(existing);
        setPhase("preview");
      } catch {
        if (!cancelled) setError("Erreur réseau.");
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, phase]);

  async function confirmImport(projectId: string) {
    setImporting(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/engines/solar.production/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: translated, retain: true }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error || "L'import a échoué.");
        setImporting(false);
        return;
      }
      setPhase("done");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Ajouter à mon projet">
      {phase === "pick" ? (
        <>
          {picker.state.step === "unauthenticated" ? (
            <UnauthenticatedStep />
          ) : (
            <ProjectPickerStep
              state={picker.state}
              onSelect={picker.selectProject}
              onCreate={picker.createProject}
              returnToLabel="votre calcul MPPT/solaire"
            />
          )}
          {loadingPreview ? <p className="mt-3 text-sm text-neutral-500">Vérification en cours…</p> : null}
          {error ? <div className="mt-3"><Alert tone="danger">{error}</Alert></div> : null}
        </>
      ) : phase === "preview" && previewOutput ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Vous allez ajouter à : <strong className="text-neutral-950">{selectedProjectName}</strong>
          </p>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <p className="font-semibold text-neutral-900">Production solaire quotidienne</p>
            <p className="mt-1 text-lg font-semibold text-neutral-950">
              {previewOutput.dailySolarEnergyWh.toFixed(0)} Wh/j
              <span className="ml-2 text-sm font-normal text-neutral-500">
                ({previewOutput.averageChargingCurrentA.toFixed(1)} A moyen)
              </span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">Source : outil MPPT/solaire</p>
          </div>

          {existingValue ? (
            <Alert tone="warning" title="Une valeur existe déjà dans ce projet.">
              <div className="space-y-1 text-sm">
                <p>
                  Valeur actuelle :{" "}
                  <strong>{formatRetainedValueDisplay(existingValue.value, existingValue.key)}</strong>
                </p>
                <p>
                  Nouvelle valeur : <strong>{previewOutput.dailySolarEnergyWh.toFixed(0)} Wh</strong>
                </p>
              </div>
            </Alert>
          ) : null}

          {error ? <Alert tone="danger">{error}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="primary"
              disabled={importing}
              onClick={() => selectedProjectId && confirmImport(selectedProjectId)}
            >
              {importing ? "Import…" : existingValue ? "Remplacer" : "Ajouter au projet"}
            </Button>
            {existingValue ? (
              <Button type="button" variant="secondary" onClick={onClose}>
                Conserver l&apos;actuelle
              </Button>
            ) : null}
            <Button type="button" variant="tertiary" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      ) : phase === "done" ? (
        <div className="space-y-4">
          <Alert tone="success" title="Ajouté au projet">
            Votre production solaire a bien été retenue pour {selectedProjectName}.
          </Alert>
          <div className="flex flex-wrap gap-3">
            <Button href={`/mon-compte/projets/${selectedProjectId}`} variant="primary">
              Voir mon projet →
            </Button>
            <Button type="button" variant="tertiary" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Chargement…</p>
      )}
    </Modal>
  );

  function UnauthenticatedStep() {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-700">
          Connectez-vous pour ajouter ce résultat à un projet. Votre calcul est conservé, vous n&apos;aurez
          pas à le refaire.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            writePendingImport({ kind: "solar", sourceTool: "MPPT/solaire", data: form });
            window.location.href = "/connexion-client";
          }}
        >
          Se connecter →
        </Button>
      </div>
    );
  }
}
