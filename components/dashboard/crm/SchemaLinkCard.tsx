import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { AdminButton, AdminCard } from "@/components/dashboard/ui";
import type { getCoachingProjectForDetail } from "@/lib/services/coaching-project";
import type { listProjectsForCustomer } from "@/lib/services/project";

const fieldClass =
  "h-11 min-w-0 max-w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

type Project = Awaited<ReturnType<typeof getCoachingProjectForDetail>>;
type LinkableProject = Awaited<ReturnType<typeof listProjectsForCustomer>>[number];

// Rattachement à l'éditeur de schéma existant (Project/ProjectSchema,
// docs/03-DATABASE.md §4, NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md) —
// jamais un second éditeur : on relie un Project déjà présent chez ce
// client (créé depuis sa fiche client), ou on invite à en créer un là-bas
// plutôt que de dupliquer ce parcours ici.
export function SchemaLinkCard({
  project,
  linkableProjects,
  linkCoachingProjectSchemaAction,
  unlinkCoachingProjectSchemaAction,
}: {
  project: Project;
  linkableProjects: LinkableProject[];
  linkCoachingProjectSchemaAction: (formData: FormData) => Promise<void>;
  unlinkCoachingProjectSchemaAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <AdminCard
      title="Éditeur de schéma"
      description="Le canevas visuel (nœuds/câbles) existant — jamais dupliqué ici, seulement rattaché à cet accompagnement."
    >
      {project.linkedProject ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{project.linkedProject.name}</p>
            <p className="mt-0.5 text-sm text-neutral-500">Modifié le {formatDateTime(project.linkedProject.updatedAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminButton href={`/outils/schema/editeur?projectId=${project.linkedProject.id}`} variant="secondary" size="sm">
              Ouvrir l&apos;éditeur
            </AdminButton>
            <form action={unlinkCoachingProjectSchemaAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <AdminButton type="submit" variant="secondary" size="sm">Détacher</AdminButton>
            </form>
          </div>
        </div>
      ) : linkableProjects.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Ce client n&apos;a pas encore de projet dans l&apos;éditeur de schéma.{" "}
          <Link href={`/dashboard/customers/${project.customerId}`} className="underline underline-offset-4">
            En créer un depuis sa fiche client
          </Link>
          , puis revenir ici pour le rattacher.
        </p>
      ) : (
        <form action={linkCoachingProjectSchemaAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="projectId" value={project.id} />
          <label className={`${labelClass} min-w-56 flex-1`}>
            Rattacher un projet existant
            <select name="schemaProjectId" className={fieldClass} defaultValue="">
              <option value="" disabled>
                Choisir…
              </option>
              {linkableProjects.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>
          <AdminButton type="submit" variant="secondary" className="h-11">Rattacher</AdminButton>
        </form>
      )}
    </AdminCard>
  );
}
