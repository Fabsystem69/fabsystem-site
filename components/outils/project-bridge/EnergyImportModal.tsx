"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProjectPickerStep } from "./ProjectPickerStep";
import { useProjectPicker } from "./useProjectPicker";
import {
  translateBilanConsoToEnergyInput,
  type BilanConsoAppareil,
} from "@/lib/outils-project-bridge";
import { writePendingImport } from "@/lib/client/pending-import-storage";
import { formatRetainedValueDisplay } from "@/lib/retained-value-labels";

type EnergyOutput = { totalPowerW: number; dailyWh: number; dailyAh: number; maxCurrentA: number };
type RetainedValueLite = { key: string; value: unknown; status: "ACTIVE" | "OBSOLETE" };

// UI-13 §6, §16-18 — pont "Bilan de consommation" → moteur energy.
// consumption. Suit le flux obligatoire de la mission : calcul déjà fait
// → clic → choix Project → aperçu (calcul réel en preview, retain:false)
// → validation → import (retain:true) → jamais d'écrasement silencieux
// (§19 : comparaison si energy.dailyConsumption existe déjà).
export function EnergyImportModal({
  appareils,
  onClose,
}: {
  appareils: BilanConsoAppareil[];
  onClose: () => void;
}) {
  const picker = useProjectPicker();
  const [phase, setPhase] = useState<"pick" | "preview" | "done">("pick");
  const [previewOutput, setPreviewOutput] = useState<EnergyOutput | null>(null);
  const [existingValue, setExistingValue] = useState<RetainedValueLite | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translated = translateBilanConsoToEnergyInput(appareils);

  const selectedProjectId = picker.state.step === "selected" ? picker.state.projectId : null;
  const selectedProjectName = picker.state.step === "selected" ? picker.state.projectName : null;

  // Charge la liste des projets dès l'ouverture de la modale.
  useEffect(() => {
    picker.loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dès qu'un projet est sélectionné (ou créé), on passe directement à
  // l'aperçu — pas d'étape intermédiaire inutile.
  useEffect(() => {
    if (!selectedProjectId || phase !== "pick") return;

    let cancelled = false;
    setLoadingPreview(true);
    setError(null);

    (async () => {
      try {
        const [runResponse, valuesResponse] = await Promise.all([
          fetch(`/api/projects/${selectedProjectId}/engines/energy.consumption/run`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ input: translated, retain: false }),
          }),
          fetch(`/api/projects/${selectedProjectId}/values`),
        ]);

        const runBody = (await runResponse.json().catch(() => null)) as
          | { output?: EnergyOutput; error?: string }
          | null;
        if (cancelled) return;
        if (!runResponse.ok || !runBody?.output) {
          setError(runBody?.error || "Ce calcul n'a pas pu être vérifié pour ce projet.");
          return;
        }

        const valuesBody = (await valuesResponse.json().catch(() => null)) as
          | { values?: RetainedValueLite[] }
          | null;
        if (cancelled) return;

        const existing =
          valuesBody?.values?.find(
            (v) => v.key === "energy.dailyConsumption" && v.status === "ACTIVE"
          ) ?? null;

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
      const response = await fetch(`/api/projects/${projectId}/engines/energy.consumption/run`, {
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
              returnToLabel="votre bilan de consommation"
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
            <p className="font-semibold text-neutral-900">Consommation quotidienne</p>
            <p className="mt-1 text-lg font-semibold text-neutral-950">
              {previewOutput.dailyWh.toFixed(0)} Wh/j
              <span className="ml-2 text-sm font-normal text-neutral-500">
                ({previewOutput.dailyAh.toFixed(1)} Ah)
              </span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">Source : outil Bilan de consommation</p>
          </div>

          {existingValue ? (
            <Alert tone="warning" title="Une valeur existe déjà dans ce projet.">
              <div className="space-y-1 text-sm">
                <p>
                  Valeur actuelle :{" "}
                  <strong>{formatRetainedValueDisplay(existingValue.value, existingValue.key)}</strong>
                </p>
                <p>
                  Nouvelle valeur : <strong>{previewOutput.dailyWh.toFixed(0)} Wh</strong>
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
            Votre consommation a bien été retenue pour {selectedProjectName}.
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
            writePendingImport({ kind: "energy", sourceTool: "Bilan de consommation", data: appareils });
            window.location.href = "/connexion-client";
          }}
        >
          Se connecter →
        </Button>
      </div>
    );
  }
}
