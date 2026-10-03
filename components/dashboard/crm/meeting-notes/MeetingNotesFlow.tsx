"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { applyMeetingNotesAction } from "@/app/dashboard/crm/notes/meeting-actions";
import type { MeetingExtraction, MeetingTarget } from "@/lib/crm/meeting-notes-contract";
import { resizeImageToBase64 } from "@/lib/crm/resize-image";
import type { MeetingTargetOption } from "@/lib/services/meeting-notes-targets";
import { MeetingInputForm, targetValueOf } from "./MeetingInputForm";
import { MeetingReviewPanel } from "./MeetingReviewPanel";
import { buildValidatedCommit, reviewFromExtraction, sourceKindOf, type ReviewState } from "./meeting-review-state";
import { useMeetingDraft } from "./useMeetingDraft";

type ExtractResponse = {
  extraction?: MeetingExtraction;
  targetLabel?: string;
  warnings?: string[];
  submissionKey?: string;
  error?: string;
};

type Done = { status: "created" | "already_applied"; targetHref: string; actionCount: number };

const parisToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

function parseTarget(value: string, targets: MeetingTargetOption[]): MeetingTarget | null {
  const option = targets.find((target) => targetValueOf(target) === value);
  if (!option) return null;
  return option.kind === "coaching_project" ? { kind: "coaching_project", projectId: option.id } : { kind: "prospect", prospectId: option.id };
}

export function MeetingNotesFlow({
  targets,
  initialTarget = null,
  lockedTarget = false,
}: {
  targets: MeetingTargetOption[];
  initialTarget?: { kind: "coaching_project" | "prospect"; id: string } | null;
  lockedTarget?: boolean;
}) {
  const [targetValue, setTargetValue] = useState(initialTarget ? targetValueOf(initialTarget) : "");
  const [exchangeDate, setExchangeDate] = useState(parisToday);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [submissionKey, setSubmissionKey] = useState<string | null>(null);
  const [targetLabel, setTargetLabel] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [saving, startSaving] = useTransition();

  const target = parseTarget(targetValue, targets);
  const draft = useMeetingDraft(target ? targetValue : null);
  const hasInput = text.trim().length > 0 || files.length > 0;

  // Sauvegarde du brouillon (hors photos) ; en pause tant qu'un brouillon
  // retrouve attend la decision de Fabien.
  const { found, save } = draft;
  useEffect(() => {
    if (found || done || (!text && !review)) return;
    save({ text, exchangeDate, review, submissionKey, targetLabel, warnings });
  }, [found, done, text, exchangeDate, review, submissionKey, targetLabel, warnings, save]);

  function resetWork() {
    setReview(null);
    setSubmissionKey(null);
    setTargetLabel("");
    setWarnings([]);
    setError(null);
    setText("");
    setFiles([]);
    setDone(null);
  }

  // Changer de dossier repart de zero : une proposition ne peut jamais etre
  // enregistree sur un autre dossier que celui analyse.
  function changeTarget(value: string) {
    resetWork();
    setTargetValue(value);
  }

  function resume() {
    if (!found) return;
    setText(found.text);
    setExchangeDate(found.exchangeDate);
    setReview(found.review);
    setSubmissionKey(found.submissionKey);
    setTargetLabel(found.targetLabel);
    setWarnings(found.warnings);
    draft.dismissFound();
  }

  async function analyze() {
    if (!target) return;
    setAnalyzing(true);
    setError(null);
    try {
      const images = await Promise.all(files.map(resizeImageToBase64));
      const option = targets.find((item) => targetValueOf(item) === targetValue);
      const response = await fetch("/api/dashboard/crm/meeting-notes/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, images, exchangeDate, targetKind: option?.kind, targetId: option?.id }),
      });
      const body = (await response.json().catch(() => null)) as ExtractResponse | null;
      if (!response.ok || !body?.extraction || !body.submissionKey) throw new Error(body?.error || "Analyse impossible. Votre saisie est conservée, réessayez.");

      setReview(reviewFromExtraction(body.extraction, sourceKindOf(text.trim().length > 0, images.length)));
      setSubmissionKey(body.submissionKey);
      setTargetLabel(body.targetLabel ?? option?.label ?? "");
      setWarnings(body.warnings ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analyse impossible. Votre saisie est conservée, réessayez.");
    } finally {
      setAnalyzing(false);
    }
  }

  function submit() {
    if (!review || !target || !submissionKey) return;
    const validated = buildValidatedCommit(review, { submissionKey, target, exchangeDate });
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    setError(null);
    startSaving(async () => {
      try {
        const outcome = await applyMeetingNotesAction(validated.commit);
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
          {done.status === "already_applied" ? "Ces notes étaient déjà enregistrées." : "Compte rendu enregistré."}
        </p>
        <p className="text-sm text-neutral-300">{done.actionCount} action(s) dans ce compte rendu. Aucun message n&apos;a été envoyé au client.</p>
        <Link href={done.targetHref} className="flex h-11 items-center justify-center rounded-lg bg-brand-400 px-4 text-sm font-bold text-neutral-900 hover:bg-brand-300 focus-visible:ring-2 focus-visible:ring-white">
          Ouvrir le dossier
        </Link>
        <button type="button" onClick={resetWork} className="h-11 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-200 hover:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400">
          Nouvelles notes
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

      <MeetingInputForm
        targets={targets}
        targetValue={targetValue}
        locked={lockedTarget && Boolean(initialTarget)}
        exchangeDate={exchangeDate}
        text={text}
        fileCount={files.length}
        analyzing={analyzing}
        canAnalyze={Boolean(target) && hasInput && !found && Boolean(exchangeDate)}
        onTargetChange={changeTarget}
        onDateChange={setExchangeDate}
        onTextChange={setText}
        onFilesChange={setFiles}
        onAnalyze={analyze}
      />

      <p aria-live="polite" className="text-sm text-neutral-400">
        {analyzing ? "Analyse en cours… (photos et texte lus par l'IA, quelques secondes)" : ""}
      </p>

      {error && !review ? (
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {review ? (
        <MeetingReviewPanel
          review={review}
          warnings={warnings}
          targetLabel={targetLabel}
          error={error}
          submitting={saving}
          onChange={setReview}
          onSubmit={submit}
        />
      ) : null}
    </div>
  );
}
