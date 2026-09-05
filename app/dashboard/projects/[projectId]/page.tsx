import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DashboardPageShell,
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminPageHeader,
  AdminTable,
  adminTableBodyClass,
  adminTableCellClass,
  adminTableCellStrongClass,
  adminTableHeadCellClass,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/dashboard/ui";
import { listRegisteredEngineIds } from "@/lib/engines";
import type { RegisteredEngineId } from "@/lib/engine-payload";
import { formatCustomerDisplayName, formatDate } from "@/lib/format";
import { buildProjectFollowUpDossier } from "@/lib/project-follow-up";
import { getProjectAssetTypeLabel, getProjectVoltageLabel } from "@/lib/project-labels";
import { prisma } from "@/lib/prisma";
import { getRetainedValueLabel, formatRetainedValueDisplay } from "@/lib/retained-value-labels";
import { getProjectFollowUpReviewLabel, getProjectFollowUpReviewTone } from "@/lib/services/project-follow-up-review";
import { listKits } from "@/lib/services/kit";
import { setProjectFollowUpStepOverrideAction, setProjectKitAction, updateProjectFollowUpReviewAction } from "./actions";

export const dynamic = "force-dynamic";

function technicalTone(status: "done" | "current" | "upcoming") {
  if (status === "done") return "success" as const;
  if (status === "current") return "info" as const;
  return "neutral" as const;
}

function eventLabel(type: "NOTE" | "APPROVED" | "CHANGES_REQUESTED") {
  if (type === "APPROVED") return "Étape validée";
  if (type === "CHANGES_REQUESTED") return "Correction demandée";
  return "Consigne mise à jour";
}

export default async function DashboardProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { projectId } = await params;
  const { error, success } = await searchParams;
  const [project, kits] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, customer: { dataShareConsent: true } },
      include: {
        customer: true,
        retainedValues: true,
        schema: true,
        followUpReviews: true,
        followUpEvents: { orderBy: { createdAt: "desc" }, take: 12 },
        kit: { include: { items: true } },
      },
    }),
    listKits(),
  ]);

  if (!project) notFound();

  const dossier = buildProjectFollowUpDossier({
    project,
    retainedValues: project.retainedValues,
    engineIds: listRegisteredEngineIds() as RegisteredEngineId[],
    hasSchema: Boolean(project.schema),
    stepOverride: project.followUpStepOverride,
    kit: project.kit
      ? {
          name: project.kit.name,
          items: project.kit.items,
          photoControls: Array.isArray(project.kit.photoControls)
            ? (project.kit.photoControls as string[])
            : [],
          powerControls: Array.isArray(project.kit.powerControls)
            ? (project.kit.powerControls as string[])
            : [],
          checklist: Array.isArray(project.kit.checklist) ? (project.kit.checklist as string[]) : [],
        }
      : null,
  });
  const reviews = new Map(project.followUpReviews.map((review) => [review.stepKey, review]));

  return (
    <DashboardPageShell>
        <AdminPageHeader
          title={project.name}
          description={`${formatCustomerDisplayName(project.customer)} · ${getProjectAssetTypeLabel(project.assetType)} · ${getProjectVoltageLabel(project.voltage)}`}
          backHref="/dashboard/projects"
          backLabel="Retour aux projets"
          actions={
            <>
              <AdminButton href={`/dashboard/customers/${project.customerId}`}>Voir le client</AdminButton>
              <AdminButton variant="primary" href={`/outils/schema/editeur?projectId=${project.id}`}>Ouvrir le schéma</AdminButton>
            </>
          }
        />

        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <AdminCard title="Situation du projet" description="Lecture technique automatique, à partir des données réellement enregistrées — sauf étape forcée manuellement ci-dessous.">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Étape technique</p>
                <p className="mt-1 font-semibold text-white">{dossier.currentStepTitle}</p>
                {dossier.isStepOverridden ? (
                  <p className="mt-0.5 text-xs text-orange-400">Forcée manuellement (auto : {dossier.inferredStepTitle})</p>
                ) : null}
              </div>
              <div><p className="text-xs uppercase tracking-wide text-neutral-500">Dossier</p><p className="mt-1 font-semibold text-white">{dossier.readinessLabel}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-neutral-500">Schéma</p><p className="mt-1 font-semibold text-white">{project.schema ? "Enregistré" : "À créer"}</p></div>
            </div>

            <form action={setProjectFollowUpStepOverrideAction} className="mt-5 flex flex-wrap items-end gap-3 border-t border-neutral-800 pt-4">
              <input type="hidden" name="projectId" value={project.id} />
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Forcer l&apos;étape technique
                <select
                  name="stepKey"
                  defaultValue={project.followUpStepOverride ?? ""}
                  className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
                >
                  <option value="">Automatique ({dossier.inferredStepTitle})</option>
                  {dossier.steps.map((step) => (
                    <option key={step.key} value={step.key}>{step.title}</option>
                  ))}
                </select>
              </label>
              <AdminButton type="submit" variant="secondary" size="sm">Appliquer</AdminButton>
            </form>

            <form action={setProjectKitAction} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="projectId" value={project.id} />
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Kit assigné
                <select
                  name="kitId"
                  defaultValue={project.kitId ?? ""}
                  className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
                >
                  <option value="">Aucun</option>
                  {kits.map((kit) => (
                    <option key={kit.id} value={kit.id}>{kit.name}</option>
                  ))}
                </select>
              </label>
              <AdminButton type="submit" variant="secondary" size="sm">Appliquer</AdminButton>
              <AdminButton href="/dashboard/kits" variant="ghost" size="sm">Gérer les kits</AdminButton>
            </form>

            {project.customer.driveLinkUrl ? (
              <a href={project.customer.driveLinkUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-semibold text-brand-300 underline underline-offset-4 hover:text-brand-200">
                Ouvrir le dossier cloud partagé →
              </a>
            ) : null}
          </AdminCard>

          <AdminCard title="Dernière activité">
            {project.followUpEvents.length === 0 ? <p className="text-sm text-neutral-500">Aucune décision FabSystem enregistrée.</p> : (
              <div className="space-y-3">
                {project.followUpEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="border-l border-neutral-700 pl-3">
                    <p className="text-sm font-medium text-neutral-200">{eventLabel(event.type)}</p>
                    <p className="mt-1 text-xs text-neutral-500">{formatDate(event.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </section>

        <AdminCard title="Parcours d'accompagnement" description="Validez une étape, demandez une correction ou laissez une consigne visible par le client.">
          <div className="space-y-4">
            {dossier.steps.map((step) => {
              const review = reviews.get(step.key);
              return (
                <form key={step.key} action={updateProjectFollowUpReviewAction} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="stepKey" value={step.key} />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-white">{step.title}</h2><AdminBadge tone={technicalTone(step.status)}>{step.status === "done" ? "Technique prête" : step.status === "current" ? "En cours" : "À venir"}</AdminBadge></div>
                      <p className="mt-2 max-w-3xl text-sm text-neutral-400">{step.fabsystemValidation}</p>
                    </div>
                    {review ? <AdminBadge tone={getProjectFollowUpReviewTone(review.status)}>{getProjectFollowUpReviewLabel(review.status)}</AdminBadge> : null}
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
                    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Décision
                      <select name="status" defaultValue={review?.status ?? "PENDING"} className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400">
                        <option value="PENDING">En attente</option><option value="APPROVED">Valider</option><option value="CHANGES_REQUESTED">Demander une correction</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Consigne client
                      <textarea name="adminNote" rows={2} defaultValue={review?.adminNote ?? ""} placeholder="Ex. Envoyez une photo de la platine avant de brancher." className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400" />
                    </label>
                    <AdminButton type="submit" variant="primary">Enregistrer</AdminButton>
                  </div>
                </form>
              );
            })}
          </div>
        </AdminCard>

        <AdminCard title="Décisions techniques retenues" description="À consulter pour accompagner le client, sans modifier ses données depuis cet écran.">
          {dossier.decisionHighlights.length === 0 ? <p className="text-sm text-neutral-500">Le client n'a pas encore enregistré de décision technique.</p> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{dossier.decisionHighlights.map((item) => <div key={item.label} className="rounded-xl border border-neutral-800 p-3"><p className="text-xs text-neutral-500">{item.label}</p><p className="mt-1 text-sm font-semibold text-neutral-100">{item.value}</p></div>)}</div>
          )}
        </AdminCard>

        <AdminCard
          title="Toutes les données enregistrées"
          description="Détail complet derrière l'étape technique et les décisions ci-dessus, y compris les valeurs obsolètes — pour juger en connaissance de cause avant de forcer une étape."
        >
          {project.retainedValues.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucune valeur enregistrée pour l&apos;instant.</p>
          ) : (
            <AdminTable>
              <thead className={adminTableHeadClass}>
                <tr>
                  <th className={adminTableHeadCellClass}>Donnée</th>
                  <th className={adminTableHeadCellClass}>Valeur</th>
                  <th className={adminTableHeadCellClass}>Statut</th>
                  <th className={adminTableHeadCellClass}>Mis à jour</th>
                </tr>
              </thead>
              <tbody className={adminTableBodyClass}>
                {[...project.retainedValues]
                  .sort((a, b) => a.key.localeCompare(b.key))
                  .map((value) => (
                    <tr key={value.id} className={adminTableRowClass}>
                      <td className={adminTableCellStrongClass}>{getRetainedValueLabel(value.key, value.value)}</td>
                      <td className={adminTableCellClass}>{formatRetainedValueDisplay(value.value, value.key) ?? "—"}</td>
                      <td className={adminTableCellClass}>
                        <AdminBadge tone={value.status === "ACTIVE" ? "success" : "warning"}>
                          {value.status === "ACTIVE" ? "Actif" : "Obsolète"}
                        </AdminBadge>
                      </td>
                      <td className={adminTableCellClass}>{formatDate(value.updatedAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </AdminTable>
          )}
        </AdminCard>
  </DashboardPageShell>
  );
}
