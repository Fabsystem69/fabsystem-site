"use client";

import { useEffect, useMemo } from "react";
import { DISCOVERY_SHEET_VERSION } from "@/lib/crm/discovery-sheet-spec";
import { MAX_NOTE_IMAGES } from "@/lib/crm/notes-contract";

export type ProjectOption = { id: string; label: string; sublabel: string | null };

const fieldClass =
  "h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-white outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-60";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

// Saisie : dossier (obligatoire, jamais devine), date, photos des pages.
export function SheetInputForm({
  projects,
  projectId,
  locked,
  exchangeDate,
  files,
  analyzing,
  canAnalyze,
  onProjectChange,
  onDateChange,
  onFilesChange,
  onAnalyze,
}: {
  projects: ProjectOption[];
  projectId: string;
  locked: boolean;
  exchangeDate: string;
  files: File[];
  analyzing: boolean;
  canAnalyze: boolean;
  onProjectChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
}) {
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  const addFiles = (incoming: File[]) => onFilesChange([...files, ...incoming].slice(0, MAX_NOTE_IMAGES));

  return (
    <section className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
      <label className={labelClass}>
        Dossier concerné (obligatoire)
        <select className={fieldClass} value={projectId} disabled={locked} onChange={(event) => onProjectChange(event.target.value)}>
          <option value="">— Choisir un dossier —</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.label}
              {project.sublabel ? ` — ${project.sublabel}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Date de l&apos;échange
        <input type="date" className={fieldClass} value={exchangeDate} onChange={(event) => onDateChange(event.target.value)} />
      </label>

      <div className="grid gap-2">
        <label htmlFor="sheet-photos" className={labelClass}>
          Photos de la fiche remplie (max {MAX_NOTE_IMAGES}, non conservées)
        </label>
        <p className="text-xs text-neutral-400">
          Une photo bien éclairée par page de la fiche (version {DISCOVERY_SHEET_VERSION}).
        </p>
        <input
          id="sheet-photos"
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          disabled={files.length >= MAX_NOTE_IMAGES}
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
          className="min-h-11 text-sm text-neutral-300"
        />
        {previews.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {previews.map((preview, index) => (
              <li key={preview.url} className="grid gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.url} alt={`Page ${index + 1} de la fiche`} className="aspect-[3/4] w-full rounded-lg border border-neutral-700 object-cover" />
                <button
                  type="button"
                  onClick={() => onFilesChange(files.filter((file) => file !== preview.file))}
                  aria-label={`Supprimer la photo ${index + 1}`}
                  className="h-11 rounded-lg border border-neutral-700 text-xs text-red-300 hover:bg-red-950/40 focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onAnalyze}
        disabled={!canAnalyze || analyzing}
        className="h-12 rounded-lg bg-brand-400 px-4 text-sm font-bold text-neutral-900 hover:bg-brand-300 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
      >
        {analyzing ? "Analyse en cours…" : "Analyser"}
      </button>
      <p className="text-xs text-neutral-500">Rien n&apos;est enregistré avant votre validation. Aucun message n&apos;est envoyé au client.</p>
    </section>
  );
}
