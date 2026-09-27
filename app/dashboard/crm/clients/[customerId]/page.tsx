import Link from "next/link";
import { formatCustomerDisplayName, formatDate } from "@/lib/format";
import { getCoachingProjectStatusLabel, getCoachingProjectStatusTone } from "@/lib/dashboard-status-labels";
import { getCoachingClient } from "@/lib/services/coaching-project";
import { AdminAlert, AdminBadge, AdminButton, AdminCard, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";
import { createCoachingProjectAction } from "../../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-12 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

export default async function DashboardCrmClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { customerId } = await params;
  const { error } = await searchParams;
  const customer = await getCoachingClient(customerId);

  return (
    <DashboardPageShell maxWidth="3xl">
      <AdminPageHeader
        title={formatCustomerDisplayName(customer)}
        backHref="/dashboard/crm/clients"
        backLabel="Retour aux clients"
        description={customer.email}
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

      <AdminCard title="Projets électriques">
        {customer.coachingProjects.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun projet pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-2">
            {customer.coachingProjects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard/crm/projects/${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3 hover:border-neutral-700"
                >
                  <span>
                    <span className="block text-base font-semibold text-white">{project.title}</span>
                    <span className="mt-0.5 block text-sm text-neutral-500">Dernière activité le {formatDate(project.derniereActivite)}</span>
                  </span>
                  <AdminBadge tone={getCoachingProjectStatusTone(project.status)}>{getCoachingProjectStatusLabel(project.status)}</AdminBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Nouveau projet">
        <form action={createCoachingProjectAction} className="grid gap-4">
          <input type="hidden" name="customerId" value={customer.id} />
          <label className={labelClass}>
            Titre
            <input name="title" required placeholder="Installation électrique van" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Description
            <textarea name="description" rows={3} className={`${fieldClass} h-auto py-2.5`} />
          </label>
          <label className={labelClass}>
            Objectifs
            <textarea name="objectifs" rows={2} className={`${fieldClass} h-auto py-2.5`} />
          </label>
          <label className={labelClass}>
            Niveau du client
            <select name="niveauClient" defaultValue="" className={fieldClass}>
              <option value="">Non précisé</option>
              <option value="DEBUTANT">Débutant</option>
              <option value="INTERMEDIAIRE">Intermédiaire</option>
              <option value="AVANCE">Avancé</option>
            </select>
          </label>
          <AdminButton type="submit" variant="primary" className="h-12 text-base">Créer le projet</AdminButton>
        </form>
      </AdminCard>
    </DashboardPageShell>
  );
}
