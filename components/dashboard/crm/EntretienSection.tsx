import { formatEuroFromCents } from "@/lib/format";
import { AdminButton, AdminCard } from "@/components/dashboard/ui";
import type { getCoachingProjectForDetail } from "@/lib/services/coaching-project";

const fieldClass =
  "h-11 min-w-0 max-w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

type Project = Awaited<ReturnType<typeof getCoachingProjectForDetail>>;

type EntretienDraft = {
  preoccupations?: string;
  accordPrixEuros?: string;
  accordPerimetre?: string;
  accordMiseAuPropre?: string;
  resumePartage?: string;
};

type NoteDraft = {
  channel?: string;
  subject?: string;
  conclusion?: string;
  nextActionLabel?: string;
  nextActionResponsible?: string;
  nextActionDueDate?: string;
  sharedWithClient?: string;
};

// D13 (audit) : si l'enregistrement échoue (ex. prix mal saisi, sujet
// oublié), le texte tapé à côté ne doit pas disparaître. `raw` vient d'un
// paramètre d'URL — jamais fait confiance sans un parsing défensif (JSON
// invalide/absent = simplement pas de brouillon, jamais une erreur affichée
// à la place du formulaire).
function parseDraft<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch {
    return null;
  }
}

// Fiche d'entretien + note rapide (FICHE_ENTRETIEN_ET_SUIVI_COACHING.md) —
// extraites de la page projet (deja tres longue) plutot que d'y ajouter
// encore du JSX inline. Composants serveur simples (pas de useActionState) :
// mêmes formulaires POST-puis-redirection que le reste de la page.
export function EntretienSection({
  project,
  draft: rawDraft,
  noteDraft: rawNoteDraft,
  updateEntretienInfoAction,
  addQuickCoachingNoteAction,
}: {
  project: Project;
  draft?: string;
  noteDraft?: string;
  updateEntretienInfoAction: (formData: FormData) => Promise<void>;
  addQuickCoachingNoteAction: (formData: FormData) => Promise<void>;
}) {
  const draft = parseDraft<EntretienDraft>(rawDraft);
  const noteDraft = parseDraft<NoteDraft>(rawNoteDraft);
  return (
    <>
      <AdminCard
        title="Fiche d'entretien"
        description="Ce que CE client a convenu — distinct de l'offre achetée, les tarifs évoluant. « Résumé partagé » est le seul champ visible du client."
      >
        <form action={updateEntretienInfoAction} className="grid gap-4">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="expectedEntretienUpdatedAt" value={project.entretienUpdatedAt.toISOString()} />
          <label className={labelClass}>
            Préoccupations du client
            <textarea
              name="preoccupations"
              rows={2}
              defaultValue={draft?.preoccupations ?? project.preoccupations ?? ""}
              className={`${fieldClass} h-auto py-2.5`}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Prix convenu (€)
              <input
                name="accordPrixEuros"
                type="text"
                inputMode="decimal"
                defaultValue={draft?.accordPrixEuros ?? (project.accordPrixCents != null ? (project.accordPrixCents / 100).toFixed(2) : "")}
                placeholder="199"
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Mise au propre
              <input
                name="accordMiseAuPropre"
                defaultValue={draft?.accordMiseAuPropre ?? project.accordMiseAuPropre ?? ""}
                placeholder="Incluse / complément convenu / non prévue"
                className={fieldClass}
              />
            </label>
          </div>
          <label className={labelClass}>
            Périmètre convenu / travail promis sur le schéma
            <textarea
              name="accordPerimetre"
              rows={2}
              defaultValue={draft?.accordPerimetre ?? project.accordPerimetre ?? ""}
              className={`${fieldClass} h-auto py-2.5`}
            />
          </label>
          <label className={labelClass}>
            Résumé partagé au client
            <textarea
              name="resumePartage"
              rows={3}
              defaultValue={draft?.resumePartage ?? project.resumePartage ?? ""}
              className={`${fieldClass} h-auto py-2.5`}
            />
          </label>
          <AdminButton type="submit" variant="primary" className="h-11 self-start px-6">Enregistrer l&apos;entretien</AdminButton>
        </form>
        {project.accordPrixCents != null ? (
          <p className="mt-3 text-xs text-neutral-500">Prix convenu actuel : {formatEuroFromCents(project.accordPrixCents)}</p>
        ) : null}
      </AdminCard>

      <AdminCard
        title="Note rapide"
        description="WhatsApp, visio ou appel de quelques minutes — une seule séance déjà réalisée, jamais un rendez-vous à créer d'abord."
      >
        <form action={addQuickCoachingNoteAction} className="grid gap-3">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Canal
              <select name="channel" defaultValue={noteDraft?.channel || "WhatsApp"} className={fieldClass}>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Visio">Visio</option>
                <option value="Appel">Appel</option>
                <option value="Autre">Autre</option>
              </select>
            </label>
            <label className={labelClass}>
              Sujet
              <input name="subject" required defaultValue={noteDraft?.subject ?? ""} placeholder="Emplacement du matériel" className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            Conclusion
            <textarea
              name="conclusion"
              required
              rows={2}
              defaultValue={noteDraft?.conclusion ?? ""}
              placeholder="Le client envoie une photo avant de poursuivre."
              className={`${fieldClass} h-auto py-2.5`}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem_10rem]">
            <label className={labelClass}>
              Prochaine action (facultatif)
              <input
                name="nextActionLabel"
                defaultValue={noteDraft?.nextActionLabel ?? ""}
                placeholder="Envoyer une photo de la batterie"
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Pour
              <select name="nextActionResponsible" defaultValue={noteDraft?.nextActionResponsible ?? ""} className={fieldClass}>
                <option value="">—</option>
                <option value="CLIENT">Client</option>
                <option value="COACH">Vous</option>
              </select>
            </label>
            <label className={labelClass}>
              Date
              <input name="nextActionDueDate" type="date" defaultValue={noteDraft?.nextActionDueDate ?? ""} className={fieldClass} />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-2 py-1 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="sharedWithClient"
              value="true"
              defaultChecked={noteDraft?.sharedWithClient === "true"}
              className="h-5 w-5 shrink-0 rounded border-neutral-700 bg-neutral-900"
            />
            Partager cette synthèse au client
          </label>
          <AdminButton type="submit" variant="secondary" className="h-11 self-start px-6">Enregistrer la note</AdminButton>
        </form>
      </AdminCard>
    </>
  );
}
