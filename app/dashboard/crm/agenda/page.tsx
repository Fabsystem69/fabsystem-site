import Link from "next/link";
import { formatCustomerDisplayName, formatDate, formatDateTime } from "@/lib/format";
import { getCoachingSessionStatusLabel, getCoachingSessionStatusTone } from "@/lib/dashboard-status-labels";
import { listSessionsInRange } from "@/lib/services/coaching-project";
import { AdminBadge, AdminEmptyState, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

// Fenêtre large par défaut (retour utilisateur : "programmer une séance...
// à venir") — passé récent (pour retrouver une séance tout juste réalisée
// sans compte-rendu) + 3 semaines à venir, sans filtre à configurer pour un
// premier usage.
export default async function DashboardCrmAgendaPage() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 21);
  end.setHours(23, 59, 59, 999);

  const sessions = await listSessionsInRange(start, end);

  const groups = new Map<string, typeof sessions>();
  for (const session of sessions) {
    const key = formatDate(session.scheduledAt);
    const group = groups.get(key) ?? [];
    group.push(session);
    groups.set(key, group);
  }

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title="Agenda"
        backHref="/dashboard/crm"
        backLabel="Aujourd'hui"
        description="Séances de coaching des 7 derniers jours aux 3 prochaines semaines."
      />

      {sessions.length === 0 ? (
        <AdminEmptyState title="Aucune séance sur cette période." description="Programmez-en une depuis la fiche d'un projet." />
      ) : (
        <div className="space-y-5">
          {Array.from(groups.entries()).map(([day, daySessions]) => (
            <div key={day}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{day}</h2>
              <ul className="space-y-2">
                {daySessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/dashboard/crm/projects/${session.projectId}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 hover:border-neutral-700"
                    >
                      <span>
                        <span className="block text-base font-semibold text-white">{formatCustomerDisplayName(session.project.customer)}</span>
                        <span className="mt-0.5 block text-sm text-neutral-500">
                          {session.project.title} · {formatDateTime(session.scheduledAt)} · {session.durationMinutes} min
                        </span>
                      </span>
                      <AdminBadge tone={getCoachingSessionStatusTone(session.status)}>{getCoachingSessionStatusLabel(session.status)}</AdminBadge>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </DashboardPageShell>
  );
}
