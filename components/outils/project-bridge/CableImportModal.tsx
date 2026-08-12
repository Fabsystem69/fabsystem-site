"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProjectPickerStep } from "./ProjectPickerStep";
import { useProjectPicker } from "./useProjectPicker";
import { translateSectionCableToCableInput, type SectionCableForm } from "@/lib/outils-project-bridge";
import { writePendingImport } from "@/lib/client/pending-import-storage";

type RetainedValueLite = { key: string; value: unknown; status: "ACTIVE" | "OBSOLETE" };
type CableComputation = { circuitId: string; retainedSectionMm2: number; computedVoltageDropPercentage: number };

function namespaceOf(key: string) {
  return key.split(".")[0];
}

// UI-13 §6, §17-19 — pont "Section de câble" → moteurs circuit.structure
// (si besoin) + cable.sizing. Contrairement à Bilan de consommation, ce
// pont a une dépendance réelle : cable.sizing exige un circuit déjà
// retenu, lui-même dépendant de energy.consumers déjà retenu (vérifié
// dans lib/engines/circuit-engine.ts). On ne peut donc pas toujours
// importer directement — voir les 3 issues possibles ci-dessous.
export function CableImportModal({
  form,
  onClose,
}: {
  form: SectionCableForm;
  onClose: () => void;
}) {
  const picker = useProjectPicker();
  const [phase, setPhase] = useState<
    "pick" | "loading-context" | "no-consumers" | "choose-circuit" | "create-circuit" | "preview" | "done"
  >("pick");
  const [circuits, setCircuits] = useState<{ id: string; name: string }[]>([]);
  const [consumerNames, setConsumerNames] = useState<string[]>([]);
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);
  const [newCircuitName, setNewCircuitName] = useState("");
  const [targetCircuitId, setTargetCircuitId] = useState<string | null>(null);
  const [targetCircuitName, setTargetCircuitName] = useState<string | null>(null);
  const [previewComputation, setPreviewComputation] = useState<CableComputation | null>(null);
  const [existingCable, setExistingCable] = useState<RetainedValueLite | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProjectId = picker.state.step === "selected" ? picker.state.projectId : null;
  const selectedProjectName = picker.state.step === "selected" ? picker.state.projectName : null;

  useEffect(() => {
    picker.loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Une fois le projet choisi : regarde ce qui est déjà retenu pour savoir
  // si on peut proposer directement un circuit existant, en créer un, ou
  // si rien n'est possible sans passer par le projet lui-même d'abord.
  useEffect(() => {
    if (!selectedProjectId || phase !== "pick") return;
    let cancelled = false;
    setPhase("loading-context");
    setError(null);

    (async () => {
      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/values`);
        const body = (await response.json().catch(() => null)) as { values?: RetainedValueLite[] } | null;
        if (cancelled) return;
        if (!response.ok || !body?.values) {
          setError("Impossible de lire ce projet.");
          setPhase("pick");
          return;
        }

        const activeCircuits = body.values
          .filter((v) => namespaceOf(v.key) === "circuit" && v.status === "ACTIVE")
          .map((v) => {
            const value = v.value as { name?: unknown } | null;
            const name = typeof value?.name === "string" ? value.name : v.key.slice("circuit.".length);
            return { id: v.key.slice("circuit.".length), name };
          });

        const energyConsumers = body.values.find((v) => v.key === "energy.consumers" && v.status === "ACTIVE");
        const names = Array.isArray(energyConsumers?.value)
          ? (energyConsumers!.value as Array<{ name?: unknown }>)
              .map((c) => (typeof c?.name === "string" ? c.name : null))
              .filter((n): n is string => Boolean(n))
          : [];

        setCircuits(activeCircuits);
        setConsumerNames(names);

        if (activeCircuits.length > 0) {
          setPhase("choose-circuit");
        } else if (names.length > 0) {
          setPhase("create-circuit");
        } else {
          setPhase("no-consumers");
        }
      } catch {
        if (!cancelled) {
          setError("Erreur réseau.");
          setPhase("pick");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, phase]);

  async function createCircuitThenPreview() {
    if (!selectedProjectId || !newCircuitName.trim() || selectedConsumers.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/engines/circuit.structure/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: { circuits: [{ name: newCircuitName.trim(), consumerNames: selectedConsumers }] },
          retain: true,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { output?: { circuits?: { id: string; name: string }[] }; error?: string }
        | null;
      if (!response.ok || !body?.output?.circuits?.length) {
        setError(body?.error || "La création du circuit a échoué.");
        setImporting(false);
        return;
      }
      const created = body.output.circuits[0];
      setTargetCircuitId(created.id);
      setTargetCircuitName(created.name);
      await runCablePreview(created.id);
    } catch {
      setError("Erreur réseau.");
      setImporting(false);
    }
  }

  async function runCablePreview(circuitId: string) {
    if (!selectedProjectId) return;
    setImporting(true);
    setError(null);
    try {
      const translated = translateSectionCableToCableInput(circuitId, form);
      const [runResponse, valuesResponse] = await Promise.all([
        fetch(`/api/projects/${selectedProjectId}/engines/cable.sizing/run`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input: translated, retain: false }),
        }),
        fetch(`/api/projects/${selectedProjectId}/values`),
      ]);
      const runBody = (await runResponse.json().catch(() => null)) as
        | { output?: { cables?: CableComputation[] }; error?: string }
        | null;
      if (!runResponse.ok || !runBody?.output?.cables?.length) {
        setError(runBody?.error || "Ce calcul n'a pas pu être vérifié pour ce circuit.");
        setImporting(false);
        return;
      }
      const valuesBody = (await valuesResponse.json().catch(() => null)) as
        | { values?: RetainedValueLite[] }
        | null;
      const existing = valuesBody?.values?.find(
        (v) => v.key === `cable.${circuitId}` && v.status === "ACTIVE"
      );

      setPreviewComputation(runBody.output.cables[0]);
      setExistingCable(existing ?? null);
      setPhase("preview");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setImporting(false);
    }
  }

  async function confirmImport() {
    if (!selectedProjectId || !targetCircuitId) return;
    setImporting(true);
    setError(null);
    try {
      const translated = translateSectionCableToCableInput(targetCircuitId, form);
      const response = await fetch(`/api/projects/${selectedProjectId}/engines/cable.sizing/run`, {
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
            <UnauthenticatedStep form={form} />
          ) : (
            <ProjectPickerStep
              state={picker.state}
              onSelect={picker.selectProject}
              onCreate={picker.createProject}
              returnToLabel="cette section de câble"
            />
          )}
          {error ? <div className="mt-3"><Alert tone="danger">{error}</Alert></div> : null}
        </>
      ) : phase === "loading-context" ? (
        <p className="text-sm text-neutral-500">Vérification de votre projet…</p>
      ) : phase === "no-consumers" ? (
        <div className="space-y-3">
          <Alert tone="info" title="Retenez d'abord votre consommation">
            Ce projet n&apos;a encore aucun appareil retenu (module Énergie). Un câble doit toujours être
            rattaché à un circuit, lui-même construit à partir des appareils déjà connus du projet.
          </Alert>
          <Button href={`/mon-compte/projets/${selectedProjectId}`} variant="primary">
            Ouvrir le projet →
          </Button>
        </div>
      ) : phase === "choose-circuit" ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">Pour quel circuit dimensionner ce câble ?</p>
          <div className="space-y-2">
            {circuits.map((circuit) => (
              <button
                key={circuit.id}
                type="button"
                onClick={() => {
                  setTargetCircuitId(circuit.id);
                  setTargetCircuitName(circuit.name);
                  runCablePreview(circuit.id);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-left text-sm transition-colors hover:border-neutral-400"
              >
                <span className="font-semibold text-neutral-950">{circuit.name}</span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPhase("create-circuit")}
            className="text-sm font-medium text-brand-700 underline underline-offset-4"
          >
            + Créer un nouveau circuit
          </button>
          {importing ? <p className="text-sm text-neutral-500">Vérification…</p> : null}
          {error ? <Alert tone="danger">{error}</Alert> : null}
        </div>
      ) : phase === "create-circuit" ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">
            Nommez le circuit et choisissez les appareils qu&apos;il regroupe.
          </p>
          <div>
            <label htmlFor="new-circuit-name" className="block text-sm font-semibold text-neutral-800">
              Nom du circuit
            </label>
            <input
              id="new-circuit-name"
              type="text"
              value={newCircuitName}
              onChange={(e) => setNewCircuitName(e.target.value)}
              placeholder="ex : Frigo"
              className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <fieldset>
            <legend className="text-sm font-semibold text-neutral-800">Appareils du circuit</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {consumerNames.map((name) => {
                const checked = selectedConsumers.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      setSelectedConsumers((current) =>
                        checked ? current.filter((n) => n !== name) : [...current, name]
                      )
                    }
                    aria-pressed={checked}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      checked
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="primary"
              disabled={!newCircuitName.trim() || selectedConsumers.length === 0 || importing}
              onClick={createCircuitThenPreview}
            >
              {importing ? "Création…" : "Créer et continuer →"}
            </Button>
            {circuits.length > 0 ? (
              <Button type="button" variant="tertiary" onClick={() => setPhase("choose-circuit")}>
                Retour
              </Button>
            ) : null}
          </div>
        </div>
      ) : phase === "preview" && previewComputation ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Vous allez ajouter à : <strong className="text-neutral-950">{selectedProjectName}</strong> —
            circuit <strong>{targetCircuitName}</strong>
          </p>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <p className="font-semibold text-neutral-900">Section retenue</p>
            <p className="mt-1 text-lg font-semibold text-neutral-950">
              {previewComputation.retainedSectionMm2} mm²
              <span className="ml-2 text-sm font-normal text-neutral-500">
                (chute {previewComputation.computedVoltageDropPercentage.toFixed(2)} %)
              </span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">Source : outil Section de câble</p>
          </div>

          {existingCable ? (
            <Alert tone="warning" title="Un câble est déjà retenu pour ce circuit.">
              Continuer remplacera la section précédemment retenue pour ce circuit.
            </Alert>
          ) : null}

          {error ? <Alert tone="danger">{error}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" disabled={importing} onClick={confirmImport}>
              {importing ? "Import…" : existingCable ? "Remplacer" : "Ajouter au projet"}
            </Button>
            <Button type="button" variant="tertiary" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      ) : phase === "done" ? (
        <div className="space-y-4">
          <Alert tone="success" title="Ajouté au projet">
            Le câble a bien été retenu pour {selectedProjectName}.
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

  function UnauthenticatedStep({ form }: { form: SectionCableForm }) {
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
            writePendingImport({ kind: "cable", sourceTool: "Section de câble", data: form });
            window.location.href = "/connexion-client";
          }}
        >
          Se connecter →
        </Button>
      </div>
    );
  }
}
