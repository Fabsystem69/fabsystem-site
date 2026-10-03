"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { applySheetImportAction } from "@/app/dashboard/crm/notes/fiche-actions";
import { resizeImageToBase64 } from "@/lib/crm/resize-image";
import type { SheetProposal } from "@/lib/crm/sheet-import-contract";
import { SheetInputForm, type ProjectOption } from "./SheetInputForm";
import { SheetReviewPanel } from "./SheetReviewPanel";
import { buildSheetCommit, reviewFromProposal, type SheetReviewState } from "./sheet-review-state";
import { useSheetDraft } from "./useSheetDraft";

type ExtractResponse = { proposal?: SheetProposal; projectLabel?: string; submissionKey?: string; error?: string };
type Done = { status: "applied" | "already_applied"; writtenFields: string[]; devicesCreated: number; actionCount: number; targetHref: string };

const parisToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const ANALYZE_ERROR = "Analyse impossible. Vos photos sont conservées, réessayez.";

export function SheetImportFlow({
  projects,
  initialProjectId = null,
  locked = false,
}: {
  projects: ProjectOption[];
  initialProjectId?: string | null;
  locked?: boolean;
}) {
  const [projectId, setProjectId] = useState(initialProjectId ?? "");
  const [exchangeDate, setExchangeDate] = useState(parisToday);
  const [files, setFiles] = useState<File[]>([]);
  const [review, setReview] = useState<SheetReviewState | null>(null);
  const [submissionKey, setSubmissionKey] = useState<string | null>(null);
  const [projectLabel, setProjectLabel] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [saving, startSaving] = useTransition();

  const knownProject = projects.some((project) => project.id === projectId);
  const draft = useSheetDraft(knownProject ? projectId : null);
  const { found, save } = draft;

  // Brouillon (hors photos), en pause tant qu'un brouillon retrouve attend.
  useEffect(() => {
    if (found || done || !review) return;
    save({ exchangeDate, review, submissionKey, projectLabel });
  }, [found, done, review, exchangeDate, submissionKey, projectLabel, save]);

  function resetWork() {
    setReview(null);
    setSubmissionKey(null);
    setProjectLabel("");
    setError(null);
    setFiles([]);
    setDone(null);
  }

  // Une proposition ne peut jamais etre enregistree sur un autre dossier.
  function changeProject(value: string) {
    resetWork();
    setProjectId(value);
  }

  function resume() {
    if (!found) return;
    setExchangeDate(found.exchangeDate);
    setReview(found.review);
    setSubmissionKey(found.submissionKey);
    setProjectLabel(found.projectLabel);
    draft.dismissFound();
  }

  async function analyze() {
    if (!knownProject) return;
    setAnalyzing(true);
    setError(null);
    try {
      const images = await Promise.all(files.map(resizeImageToBase64));
      const response = await fetch("/api/dashboard/crm/fiche-import/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ images, exchangeDate, projectId }),
      });
      const body = (await response.json().catch(() => null)) as ExtractResponse | null;
      if (!response.ok || !body?.proposal || !body.submissionKey) throw new Error(body?.error || ANALYZE_ERROR);

      setReview(reviewFromProposal(body.proposal));
      setSubmissionKey(body.submissionKey);
      setProjectLabel(body.projectLabel ?? projects.find((project) => project.id === projectId)?.label ?? "");
      setPhotoCount(images.length);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : ANALYZE_ERROR);
    } finally {
      setAnalyzing(false);
    }
  }

  function submit() {
    if (!review || !submissionKey || saving) return;
    const validated = buildSheetCommit(review, { submissionKey, projectId, exchangeDate, photoCount });
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    setError(null);
    startSaving(async () => {
      try {
        const outcome = await applySheetImportAction(validated.commit);
        if (!outcome.ok) {
          setError(outcome.error);
          return;
        }
        draft.clear();
        setDone(outcome.result);
        setReview(null);
      } catch {
        setError("Enregistrement impossible (réseau ou serveur). Votre brouillon est conservé : réessayez.");
      }
    });
  }

  if (done) {
    return (
      <section className="grid gap-3 rounded-2xl border border-emerald-900 bg-emerald-950/30 p-5" role="status">
        <p className="text-base font-semibold text-emerald-300">
          {done.status === "already_applied" ? "Ces notes étaient déjà enregistrées." : "Fiche enregistrée."}
        </p>
        <p className="text-sm text-neutral-300">
          {done.writtenFields.length} champ(s) enregistré(s), {done.devicesCreated} appareil(s), {done.actionCount} action(s). Aucun message n&apos;a été envoyé au client.
        </p>
        <Link href={done.targetHref} className="flex h-11 items-center justify-center rounded-lg bg-brand-400 px-4 text-sm font-bold text-neutral-900 hover:bg-brand-300 focus-visible:ring-2 focus-visible:ring-white">
          Ouvrir le dossier
        </Link>
        <button type="button" onClick={resetWork} className="h-11 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-200 hover:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400">
          Nouvelle fiche
        </button>
      </section>
    );
  }

  return (
    <div className="grid gap-5">
      {found ? (
        <div role="status" className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-900 bg-sky-950/30 p-3 text-sm text-sky-200">
          <span className="mr-auto">Brouillon retrouvé pour ce dossier.</span>
          <button type="button" onClick={resume} className="h-11 rounded-lg bg-brand-400 px-4 font-bold text-neutral-900 focus-visible:ring-2 focus-visible:ring-white">
            Reprendre
          </button>
          <button type="button" onClick={draft.clear} className="h-11 rounded-lg border border-neutral-700 px-4 text-neutral-200 focus-visible:ring-2 focus-visible:ring-brand-400">
            Supprimer
          </button>
        </div>
      ) : null}

      <SheetInputForm
        projects={projects}
        projectId={projectId}
        locked={locked && Boolean(initialProjectId)}
        exchangeDate={exchangeDate}
        files={files}
        analyzing={analyzing}
        canAnalyze={knownProject && files.length > 0 && !found && Boolean(exchangeDate)}
        onProjectChange={changeProject}
        onDateChange={setExchangeDate}
        onFilesChange={setFiles}
        onAnalyze={analyze}
      />

      <p aria-live="polite" className="text-sm text-neutral-400">
        {analyzing ? "Analyse en cours… (photos lues par l'IA, quelques secondes)" : ""}
      </p>

      {error && !review ? (
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {review ? (
        <SheetReviewPanel review={review} projectLabel={projectLabel} error={error} submitting={saving} onChange={setReview} onSubmit={submit} />
      ) : null}
    </div>
  );
}
