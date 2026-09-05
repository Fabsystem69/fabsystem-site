import Link from "next/link";
import {
  DashboardPageShell, AdminBadge, AdminEmptyState, AdminPageHeader, AdminTable, adminTableBodyClass, adminTableCellClass, adminTableCellStrongClass, adminTableHeadCellClass, adminTableHeadClass, adminTableRowClass } from "@/components/dashboard/ui";
import { listRegisteredEngineIds } from "@/lib/engines";
import type { RegisteredEngineId } from "@/lib/engine-payload";
import { formatCustomerDisplayName, formatDate } from "@/lib/format";
import { buildProjectFollowUpDossier } from "@/lib/project-follow-up";
import { getProjectAssetTypeLabel } from "@/lib/project-labels";
import { prisma } from "@/lib/prisma";
import { getProjectFollowUpReviewLabel, getProjectFollowUpReviewTone } from "@/lib/services/project-follow-up-review";

export const dynamic = "force-dynamic";

export default async function DashboardProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { customer: { dataShareConsent: true } },
    include: {
      customer: true,
      retainedValues: true,
      schema: { select: { id: true, updatedAt: true } },
      followUpReviews: { where: { status: { not: "PENDING" } }, orderBy: { updatedAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const engineIds = listRegisteredEngineIds() as RegisteredEngineId[];

  return (
    <DashboardPageShell>
        <AdminPageHeader
          title="Projets"
          backHref="/dashboard"
          backLabel="Retour au dashboard"
          description="Pilotez les accompagnements pour lesquels le client a autorisé le partage de son dossier."
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Projets partagés</p>
            <p className="mt-2 text-2xl font-semibold text-white">{projects.length}</p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">À revoir</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {projects.filter((project) => project.followUpReviews.some((review) => review.status === "CHANGES_REQUESTED")).length}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Schémas enregistrés</p>
            <p className="mt-2 text-2xl font-semibold text-white">{projects.filter((project) => project.schema).length}</p>
          </div>
        </div>

        {projects.length === 0 ? (
          <AdminEmptyState title="Aucun projet partagé pour l'instant." description="Le client peut autoriser le partage de son dossier depuis son espace." />
        ) : (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Projet / client</th>
                <th className={adminTableHeadCellClass}>Avancement technique</th>
                <th className={adminTableHeadCellClass}>Revue FabSystem</th>
                <th className={adminTableHeadCellClass}>Dernière activité</th>
                <th className={adminTableHeadCellClass}>Action</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {projects.map((project) => {
                const dossier = buildProjectFollowUpDossier({
                  project,
                  retainedValues: project.retainedValues,
                  engineIds,
                  hasSchema: Boolean(project.schema),
                  stepOverride: project.followUpStepOverride,
                });
                const activeReview = project.followUpReviews.find((review) => review.status === "CHANGES_REQUESTED") ?? project.followUpReviews[0];

                return (
                  <tr key={project.id} className={adminTableRowClass}>
                    <td className={adminTableCellStrongClass}>
                      <Link href={`/dashboard/projects/${project.id}`} className="block hover:text-brand-300">
                        {project.name}
                      </Link>
                      <p className="mt-1 text-xs font-normal text-neutral-500">{formatCustomerDisplayName(project.customer)} · {getProjectAssetTypeLabel(project.assetType)}</p>
                    </td>
                    <td className={adminTableCellClass}>
                      <p className="text-neutral-200">{dossier.currentStepTitle}</p>
                      <p className="mt-1 text-xs text-neutral-500">{dossier.retainedModuleCount}/{dossier.totalModuleCount} modules retenus</p>
                    </td>
                    <td className={adminTableCellClass}>
                      {activeReview ? (
                        <AdminBadge tone={getProjectFollowUpReviewTone(activeReview.status)}>{getProjectFollowUpReviewLabel(activeReview.status)}</AdminBadge>
                      ) : (
                        <AdminBadge tone="neutral">Pas encore revu</AdminBadge>
                      )}
                    </td>
                    <td className={adminTableCellClass}>{formatDate(project.updatedAt)}</td>
                    <td className={adminTableCellClass}>
                      <Link href={`/dashboard/projects/${project.id}`} className="font-semibold text-brand-300 hover:text-brand-200">Ouvrir le suivi →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        )}
  </DashboardPageShell>
  );
}
