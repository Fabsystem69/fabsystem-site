"use client";

import { useState } from "react";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

export function ShareSchemaDialog({ projectId, projectName, onClose }: { projectId: string | null; projectName: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasUnlimitedConsumers = useSchemaStore((s) => s.hasUnlimitedConsumers);
  const openFreemiumLimitPopup = useSchemaStore((s) => s.openFreemiumLimitPopup);
  useEscapeToClose(onClose);

  async function createLink() {
    if (!projectId) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/schema/share`, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => null) as { url?: string; error?: string } | null;
      if (!response.ok || !body?.url) throw new Error(body?.error || "Impossible de créer le lien.");
      setUrl(body.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de créer le lien.");
    } finally { setBusy(false); }
  }

  async function copy() { if (url) await navigator.clipboard.writeText(url); }

  const shareFeature = url ? (
    <div className="mt-6"><input value={url} readOnly className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700" /><p className="mt-3 text-sm text-slate-500">Toute personne ayant ce lien peut consulter le schéma, sans le modifier.</p><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => window.open(url, "_blank", "noopener,noreferrer")} className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700">Aperçu</button><button type="button" onClick={copy} className="rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-white">Copier le lien</button></div></div>
  ) : (
    <div className="mt-6"><p className="text-sm text-slate-500">Le lien est révocable: le désactiver rend immédiatement l&apos;adresse inaccessible.</p><button type="button" disabled={busy} onClick={createLink} className="mt-5 w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Création du lien…" : "Créer un lien de partage"}</button>{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}</div>
  );

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose} role="dialog" aria-modal="true">
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold text-slate-900">Partager le schéma</h2><p className="mt-2 text-slate-500">Partagez « {projectName} » avec un lien unique en lecture seule.</p></div><button type="button" onClick={onClose} className="text-2xl text-slate-500" aria-label="Fermer">×</button></div>
      {!projectId ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-950">Enregistrement requis</p><p className="mt-1 text-sm text-amber-900">Enregistre d&apos;abord ce schéma dans un projet cloud. Une fois l&apos;enregistrement terminé, rouvre Partager pour créer le lien.</p><button type="button" onClick={onClose} className="mt-4 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900">Fermer et enregistrer</button></div>
      ) : hasUnlimitedConsumers ? (
        shareFeature
      ) : (
        <div className="relative mt-2">
          <div className="select-none blur-sm" aria-hidden="true">{shareFeature}</div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/45 px-3 text-center">
            <span className="text-lg" aria-hidden="true">🔒</span>
            <p className="text-xs font-semibold text-neutral-900">Partage de schéma réservé à Éditeur Plus</p>
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
        </div>
      )}
    </div>
  </div>;
}
