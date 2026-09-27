import Link from "next/link";
import { formatCustomerDisplayName, formatDate } from "@/lib/format";
import { getCoachingProjectStatusLabel, getCoachingProjectStatusTone } from "@/lib/dashboard-status-labels";
import { listCoachingClients } from "@/lib/services/coaching-project";
import { AdminBadge, AdminButton, AdminEmptyState, AdminPageHeader, AdminSearchInput, DashboardPageShell } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function DashboardCrmClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await listCoachingClients(q);

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title="Clients"
        backHref="/dashboard/crm"
        backLabel="Aujourd'hui"
        description="Clients en coaching électricité, avec leurs projets."
        actions={
          <>
            <AdminButton href="/dashboard/crm/clients/new" variant="secondary">+ Projet (client existant)</AdminButton>
            <AdminButton href="/dashboard/crm/prospects/new" variant="primary">+ Prospect</AdminButton>
          </>
        }
      />

      <form className="flex flex-wrap gap-2" action="/dashboard/crm/clients">
        <AdminSearchInput name="q" defaultValue={q ?? ""} placeholder="Nom, contact, projet…" className="flex-1 min-w-[12rem]" />
        <AdminButton type="submit" variant="secondary">Rechercher</AdminButton>
      </form>

      {clients.length === 0 ? (
        <AdminEmptyState title="Aucun client en coaching pour l'instant." description="Convertissez un prospect pour commencer." />
      ) : (
        <ul className="space-y-2">
          {clients.map((client) => (
            <li key={client.id}>
              <Link
                href={`/dashboard/crm/clients/${client.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 hover:border-neutral-700"
              >
                <span>
                  <span className="block text-base font-semibold text-white">{formatCustomerDisplayName(client)}</span>
                  <span className="mt-0.5 block text-sm text-neutral-500">
                    {client.email} · dernière activité le {formatDate(client.derniereActivite)}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {client.coachingProjects.map((project) => (
                    <AdminBadge key={project.id} tone={getCoachingProjectStatusTone(project.status)}>
                      {getCoachingProjectStatusLabel(project.status)}
                    </AdminBadge>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPageShell>
  );
}
