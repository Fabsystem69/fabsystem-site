"use client";

import { useEffect, useState } from "react";
import {
  createProjectSchemaVersionApi,
  listProjectSchemaVersionsApi,
  restoreProjectSchemaVersionApi,
  type ProjectSchemaVersionSummary,
} from "@/features/schemas/projectSchemaApi";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

export function VersionHistoryDialog({ projectId, onClose, onRestored }: { projectId: string; onClose: () => void; onRestored: () => void }) {
  const [versions, setVersions] = useState<ProjectSchemaVersionSummary[]>([]);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const hasUnlimitedConsumers = useSchemaStore((s) => s.hasUnlimitedConsumers);
  const openFreemiumLimitPopup = useSchemaStore((s) => s.openFreemiumLimitPopup);

  async function load() {
    setStatus("loading");
    const result = await listProjectSchemaVersionsApi(projectId);
    if (!result.ok) {
      setStatus("error");
      setMessage("Impossible de charger l'historique.");
      return;
    }
    setVersions(result.versions);
    setStatus("idle");
  }

  useEffect(() => {
    let cancelled = false;
    void listProjectSchemaVersionsApi(projectId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setStatus("error");
        setMessage("Impossible de charger l'historique.");
        return;
      }
      setVersions(result.versions);
      setStatus("idle");
    });
    return () => { cancelled = true; };
  }, [projectId]);

  async function createVersion() {
    setStatus("saving");
    setMessage(null);
    const result = await createProjectSchemaVersionApi(projectId, label);
    if (!result.ok) {
      setStatus("error");
      setMessage("La version n'a pas pu être créée.");
      return;
    }
    setLabel("");
    setVersions((current) => [result.version, ...current]);
    setStatus("idle");
  }

  async function restore(version: ProjectSchemaVersionSummary) {
    if (!window.confirm(`Restaurer la version ${version.versionNumber} ? L'état actuel sera sauvegardé avant la restauration.`)) return;
    setStatus("saving");
    setMessage(null);
    const result = await restoreProjectSchemaVersionApi(projectId, version.id);
    if (!result.ok) {
      setStatus("error");
      setMessage("La restauration n'a pas pu être effectuée.");
      return;
    }
    onRestored();
    await load();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="schema-history-title" onMouseDown={onClose}>
      <section className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Projet partagé</p><h2 id="schema-history-title" className="mt-1 text-2xl font-semibold text-slate-950">Historique des versions</h2><p className="mt-1 text-sm text-slate-600">Créez un repère avant une étape importante. Restaurer conserve toujours l&apos;état actuel.</p></div><button type="button" onClick={onClose} className="rounded-lg px-2 text-2xl text-slate-500 hover:bg-slate-100" aria-label="Fermer">×</button></div>
        <div className="relative mt-5">
          <div className={hasUnlimitedConsumers ? undefined : "select-none blur-sm"} aria-hidden={hasUnlimitedConsumers ? undefined : true}>
            <div className="flex gap-2"><input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={120} placeholder="Ex. Avant validation client" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" /><button type="button" onClick={() => void createVersion()} disabled={status === "saving" || status === "loading"} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">Créer une version</button></div>
            {message ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
            <div className="mt-5 max-h-72 divide-y overflow-y-auto rounded-xl border border-slate-200">
              {status === "loading" ? <p className="p-4 text-sm text-slate-500">Chargement…</p> : null}
              {status !== "loading" && versions.length === 0 ? <p className="p-4 text-sm text-slate-500">Aucune version pour l&apos;instant.</p> : null}
              {versions.map((version) => <div key={version.id} className="flex items-center justify-between gap-3 p-3"><div><p className="font-semibold text-slate-900">Version {version.versionNumber}{version.label ? ` · ${version.label}` : ""}</p><p className="text-xs text-slate-500">{version.authorType === "ADMIN" ? "FabSystem" : "Client"} · {new Date(version.createdAt).toLocaleString("fr-FR")}</p></div><button type="button" onClick={() => void restore(version)} disabled={status === "saving"} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Restaurer</button></div>)}
            </div>
          </div>
          {!hasUnlimitedConsumers ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/45 px-3 text-center">
              <span className="text-lg" aria-hidden="true">🔒</span>
              <p className="text-xs font-semibold text-neutral-900">Historique des versions réservé à Éditeur Plus</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openFreemiumLimitPopup();
                }}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                Débloquer →
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
