import { formatDateTime } from "@/lib/format";
import { AdminButton, AdminCard } from "@/components/dashboard/ui";
import type { getCoachingProjectForDetail } from "@/lib/services/coaching-project";

const fieldClass =
  "h-11 min-w-0 max-w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

type Project = Awaited<ReturnType<typeof getCoachingProjectForDetail>>;

// CoachingProjectEvent.type est un texte libre (pas un enum) — aucun
// libellé métier n'est inventé ici, seulement une mise en forme neutre.
function formatEventType(type: string) {
  return type.replace(/^LEGACY_DOSSIER:/, "").replace(/_/g, " ").toLowerCase();
}

// Clôture (PLAN_AMELIORATION_CRM_FABSYSTEM.md §4.6) — extraite de la page
// projet (déjà volumineuse) plutôt que d'y ajouter encore du JSX inline.
// Rendue juste après les messages d'erreur/succès, avant les cartes "Temps" :
// un accompagnement clôturé est l'information la plus importante à voir
// d'emblée sur cette page.
export function ClotureCard({
  project,
  closeCoachingProjectAction,
  reopenCoachingProjectAction,
}: {
  project: Project;
  closeCoachingProjectAction: (formData: FormData) => Promise<void>;
  reopenCoachingProjectAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <AdminCard
      title="Clôture"
      description="Résultat obtenu, documents remis, points restants — une courte synthèse, pas un formulaire disproportionné."
    >
      {project.status === "TERMINE" ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">
            Clôturé le {project.clotureAt ? formatDateTime(project.clotureAt) : "—"}
          </p>
          {project.clotureResume ? (
            <p className="whitespace-pre-wrap text-sm text-neutral-300">{project.clotureResume}</p>
          ) : (
            <p className="text-sm text-neutral-500">Aucune synthèse enregistrée.</p>
          )}
          {project.bilanCeQuiAAide || project.bilanCeQuiAPrisDuTemps || project.bilanAAmeliorer ? (
            <div className="grid gap-2 border-t border-neutral-800 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Bilan interne (jamais visible du client)
              </p>
              {project.bilanCeQuiAAide ? (
                <p className="text-sm text-neutral-300">
                  <span className="text-neutral-500">Ce qui a aidé : </span>
                  {project.bilanCeQuiAAide}
                </p>
              ) : null}
              {project.bilanCeQuiAPrisDuTemps ? (
                <p className="text-sm text-neutral-300">
                  <span className="text-neutral-500">Ce qui a pris du temps : </span>
                  {project.bilanCeQuiAPrisDuTemps}
                </p>
              ) : null}
              {project.bilanAAmeliorer ? (
                <p className="text-sm text-neutral-300">
                  <span className="text-neutral-500">À changer pour le prochain client : </span>
                  {project.bilanAAmeliorer}
                </p>
              ) : null}
            </div>
          ) : null}
          <form action={reopenCoachingProjectAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <AdminButton type="submit" variant="secondary" size="sm">Rouvrir l&apos;accompagnement</AdminButton>
          </form>
        </div>
      ) : (
        <form action={closeCoachingProjectAction} className="grid gap-3">
          <input type="hidden" name="projectId" value={project.id} />
          <label className={labelClass}>
            Synthèse (facultative)
            <textarea
              name="resume"
              rows={3}
              placeholder="Résultat obtenu, documents remis, points restant à la charge du client, prochain rendez-vous..."
              defaultValue={project.clotureResume ?? ""}
              className={`${fieldClass} h-auto py-2.5`}
            />
          </label>
          <div className="grid gap-3 border-t border-neutral-800 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Bilan interne, pour vous seul (jamais visible du client)
            </p>
            <label className={labelClass}>
              Ce qui a aidé
              <textarea
                name="bilanCeQuiAAide"
                rows={2}
                placeholder="Facultatif"
                defaultValue={project.bilanCeQuiAAide ?? ""}
                className={`${fieldClass} h-auto py-2.5`}
              />
            </label>
            <label className={labelClass}>
              Ce qui a pris du temps
              <textarea
                name="bilanCeQuiAPrisDuTemps"
                rows={2}
                placeholder="Facultatif"
                defaultValue={project.bilanCeQuiAPrisDuTemps ?? ""}
                className={`${fieldClass} h-auto py-2.5`}
              />
            </label>
            <label className={labelClass}>
              À changer pour le prochain client
              <textarea
                name="bilanAAmeliorer"
                rows={2}
                placeholder="Facultatif"
                defaultValue={project.bilanAAmeliorer ?? ""}
                className={`${fieldClass} h-auto py-2.5`}
              />
            </label>
          </div>
          <AdminButton type="submit" variant="secondary" className="h-11 self-start px-6">Clôturer l&apos;accompagnement</AdminButton>
        </form>
      )}
    </AdminCard>
  );
}

// Historique (PLAN_AMELIORATION_CRM_FABSYSTEM.md §6, "reprendre le dossier
// en quelques secondes") — même raison d'extraction.
export function HistoriqueCard({ project }: { project: Project }) {
  return (
    <AdminCard title="Historique" description="Reprendre le dossier en quelques secondes — ce qui a été ajouté depuis votre dernier passage.">
      {project.events.length === 0 ? (
        <p className="text-sm text-neutral-500">Aucun événement pour l&apos;instant.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {project.events.map((event) => (
            <li key={event.id} className="border-b border-neutral-800/60 pb-2 text-sm last:border-0 last:pb-0">
              <span className="text-neutral-500">{formatDateTime(event.createdAt)} · {event.authorName} · {formatEventType(event.type)}</span>
              {event.note ? <p className="mt-0.5 text-neutral-300">{event.note}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
