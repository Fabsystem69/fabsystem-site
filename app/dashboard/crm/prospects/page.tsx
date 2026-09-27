import Link from "next/link";
import { formatDate } from "@/lib/format";
import { getProspectSourceLabel, getProspectStatusLabel, getProspectStatusTone } from "@/lib/dashboard-status-labels";
import { listProspects } from "@/lib/services/prospect";
import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminSearchInput,
  DashboardPageShell,
} from "@/components/dashboard/ui";
import type { ProspectStatus } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

const STATUSES: ProspectStatus[] = ["NOUVEAU", "EN_DISCUSSION", "COACHING_PROPOSE", "RESERVE", "GAGNE", "SANS_SUITE"];

export default async function DashboardCrmProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const statusFilter = status && STATUSES.includes(status as ProspectStatus) ? (status as ProspectStatus) : undefined;
  const prospects = await listProspects({ status: statusFilter, search: q });

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title="Prospects"
        backHref="/dashboard/crm"
        backLabel="Aujourd'hui"
        description="Contacts Facebook avant qu'ils deviennent clients."
        actions={
          <>
            <AdminButton href="/dashboard/crm/prospects/templates" variant="secondary">Modèles de messages</AdminButton>
            <AdminButton href="/dashboard/crm/prospects/new" variant="primary">+ Prospect</AdminButton>
          </>
        }
      />

      <form className="flex flex-wrap gap-2" action="/dashboard/crm/prospects">
        <AdminSearchInput name="q" defaultValue={q ?? ""} placeholder="Nom, téléphone, email…" className="flex-1 min-w-[12rem]" />
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <AdminButton type="submit" variant="secondary">Rechercher</AdminButton>
      </form>

      <div className="flex flex-wrap gap-1.5">
        <Link
          href={q ? `/dashboard/crm/prospects?q=${encodeURIComponent(q)}` : "/dashboard/crm/prospects"}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${!statusFilter ? "border-brand-400 bg-brand-400/10 text-brand-300" : "border-neutral-700 bg-neutral-900 text-neutral-300"}`}
        >
          Tous
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={`/dashboard/crm/prospects?status=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusFilter === value ? "border-brand-400 bg-brand-400/10 text-brand-300" : "border-neutral-700 bg-neutral-900 text-neutral-300"}`}
          >
            {getProspectStatusLabel(value)}
          </Link>
        ))}
      </div>

      {prospects.length === 0 ? (
        <AdminEmptyState title="Aucun prospect pour l'instant." description="Ajoutez votre premier contact Facebook." />
      ) : (
        <ul className="space-y-2">
          {prospects.map((prospect) => (
            <li key={prospect.id}>
              <Link
                href={`/dashboard/crm/prospects/${prospect.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 hover:border-neutral-700"
              >
                <span>
                  <span className="block text-base font-semibold text-white">{prospect.name}</span>
                  <span className="mt-0.5 block text-sm text-neutral-500">
                    {getProspectSourceLabel(prospect.source)} · dernière activité le {formatDate(prospect.derniereActivite)}
                  </span>
                </span>
                <AdminBadge tone={getProspectStatusTone(prospect.status)}>{getProspectStatusLabel(prospect.status)}</AdminBadge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPageShell>
  );
}
