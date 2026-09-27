import Link from "next/link";
import { formatCustomerDisplayName, formatDate, formatDateTime } from "@/lib/format";
import { getProspectStatusLabel, getProspectStatusTone } from "@/lib/dashboard-status-labels";
import { getCoachingDashboardData } from "@/lib/services/coaching-dashboard";
import { AdminBadge, AdminButton, AdminCard, AdminEmptyState, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

function minutesLabel(minutes: number) {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  const label = hours > 0 ? `${hours} h${rest > 0 ? ` ${rest} min` : ""}` : `${rest} min`;
  return minutes < 0 ? `-${label}` : label;
}

export default async function DashboardCrmTodayPage() {
  const {
    prospectsToFollowUp,
    sessionsToday,
    upcomingSessions,
    overdueActions,
    projectsLowOnTime,
    projectsAwaitingReview,
    projectsWithIncompleteBilan,
  } = await getCoachingDashboardData();

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title="Aujourd'hui"
        description="Ce qui a besoin de votre attention en coaching électricité."
        actions={
          <>
            <AdminButton variant="primary" href="/dashboard/crm/prospects/new">+ Prospect</AdminButton>
            <AdminButton variant="secondary" href="/dashboard/crm/agenda">Programmer une séance</AdminButton>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">À relancer</p>
          <p className="mt-2 text-3xl font-semibold text-white">{prospectsToFollowUp.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Séances aujourd&apos;hui</p>
          <p className="mt-2 text-3xl font-semibold text-white">{sessionsToday.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Actions en retard</p>
          <p className="mt-2 text-3xl font-semibold text-white">{overdueActions.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Temps bientôt épuisé</p>
          <p className="mt-2 text-3xl font-semibold text-white">{projectsLowOnTime.length}</p>
        </AdminCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="À relire">
          {projectsAwaitingReview.length === 0 ? (
            <AdminEmptyState title="Rien à relire." />
          ) : (
            <ul className="divide-y divide-neutral-800/80">
              {projectsAwaitingReview.map((project) => (
                <li key={project.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/dashboard/crm/projects/${project.id}`} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="block text-base font-semibold text-white">{formatCustomerDisplayName(project.customer)}</span>
                      <span className="mt-0.5 block text-sm text-neutral-500">{project.title} · envoyé le {formatDate(project.readyForReviewAt)}</span>
                    </span>
                    <AdminBadge tone="info">À relire</AdminBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="Informations manquantes">
          {projectsWithIncompleteBilan.length === 0 ? (
            <AdminEmptyState title="Aucun bilan incomplet." />
          ) : (
            <ul className="divide-y divide-neutral-800/80">
              {projectsWithIncompleteBilan.map(({ project, incompleteCount }) => (
                <li key={project.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/dashboard/crm/projects/${project.id}`} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="block text-base font-semibold text-white">{formatCustomerDisplayName(project.customer)}</span>
                      <span className="mt-0.5 block text-sm text-neutral-500">{project.title}</span>
                    </span>
                    <AdminBadge tone="warning">{incompleteCount} appareil{incompleteCount > 1 ? "s" : ""} incomplet{incompleteCount > 1 ? "s" : ""}</AdminBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Prospects à relancer">
        {prospectsToFollowUp.length === 0 ? (
          <AdminEmptyState title="Aucune relance en attente." />
        ) : (
          <ul className="divide-y divide-neutral-800/80">
            {prospectsToFollowUp.map((prospect) => (
              <li key={prospect.id} className="py-3 first:pt-0 last:pb-0">
                <Link href={`/dashboard/crm/prospects/${prospect.id}`} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="block text-base font-semibold text-white">{prospect.name}</span>
                    <span className="mt-0.5 block text-sm text-neutral-500">
                      {prospect.nextAction || "Relance prévue"}
                      {prospect.nextActionAt ? ` · ${formatDate(prospect.nextActionAt)}` : ""}
                    </span>
                  </span>
                  <AdminBadge tone={getProspectStatusTone(prospect.status)}>{getProspectStatusLabel(prospect.status)}</AdminBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Séances du jour">
          {sessionsToday.length === 0 ? (
            <AdminEmptyState title="Aucune séance aujourd'hui." />
          ) : (
            <ul className="divide-y divide-neutral-800/80">
              {sessionsToday.map((session) => (
                <li key={session.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/dashboard/crm/projects/${session.projectId}`} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="block text-base font-semibold text-white">{formatCustomerDisplayName(session.project.customer)}</span>
                      <span className="mt-0.5 block text-sm text-neutral-500">{session.project.title} · {formatDateTime(session.scheduledAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="Séances à venir (7 jours)">
          {upcomingSessions.length === 0 ? (
            <AdminEmptyState title="Rien de programmé cette semaine." />
          ) : (
            <ul className="divide-y divide-neutral-800/80">
              {upcomingSessions.map((session) => (
                <li key={session.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/dashboard/crm/projects/${session.projectId}`} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="block text-base font-semibold text-white">{formatCustomerDisplayName(session.project.customer)}</span>
                      <span className="mt-0.5 block text-sm text-neutral-500">{session.project.title} · {formatDateTime(session.scheduledAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Actions en retard">
        {overdueActions.length === 0 ? (
          <AdminEmptyState title="Rien en retard." />
        ) : (
          <ul className="divide-y divide-neutral-800/80">
            {overdueActions.map((action) => (
              <li key={action.id} className="py-3 first:pt-0 last:pb-0">
                <Link href={`/dashboard/crm/projects/${action.projectId}`} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="block text-base font-semibold text-white">{action.label}</span>
                    <span className="mt-0.5 block text-sm text-neutral-500">
                      {formatCustomerDisplayName(action.project.customer)} · {action.project.title}
                      {action.dueDate ? ` · échéance ${formatDate(action.dueDate)}` : ""}
                    </span>
                  </span>
                  <AdminBadge tone="danger">En retard</AdminBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Temps de coaching bientôt épuisé">
        {projectsLowOnTime.length === 0 ? (
          <AdminEmptyState title="Aucun client à court d'heures." />
        ) : (
          <ul className="divide-y divide-neutral-800/80">
            {projectsLowOnTime.map(({ project, balance }) => (
              <li key={project.id} className="py-3 first:pt-0 last:pb-0">
                <Link href={`/dashboard/crm/projects/${project.id}`} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="block text-base font-semibold text-white">{formatCustomerDisplayName(project.customer)}</span>
                    <span className="mt-0.5 block text-sm text-neutral-500">{project.title}</span>
                  </span>
                  <AdminBadge tone={balance.remainingMinutes <= 0 ? "danger" : "warning"}>
                    {minutesLabel(balance.remainingMinutes)} restant{balance.remainingMinutes > 60 ? "es" : ""}
                  </AdminBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </DashboardPageShell>
  );
}
