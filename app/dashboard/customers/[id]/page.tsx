import Link from "next/link";
import { notFound } from "next/navigation";
import type { Customer } from "@/lib/generated/prisma/client";
import { formatCustomerAssetSummary, getCustomerAssetLabel } from "@/lib/customer-asset";
import { formatCustomerDisplayName, formatDate, formatEuroFromCents } from "@/lib/format";
import { getProjectAssetTypeLabel, getProjectStatusLabel } from "@/lib/project-labels";
import { getSchemaTemplatesByVehicleGroup } from "@/features/schemas/templates";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { listDashboardOrdersForCustomer } from "@/lib/services/admin-orders";
import { listResourceGrantsForCustomer } from "@/lib/services/customer-resource-grants";
import { listSchemaEditorAccessGrantsForCustomer } from "@/lib/services/schema-editor-plus";
import {
  getDossierOffreLabel,
  getDossierStatutSimpleLabel,
  getDossierStatutSimpleTone,
  getOrderStatusLabel,
  getOrderStatusTone,
} from "@/lib/dashboard-status-labels";
import { getDossierStepStatuses, isTimelineOffre } from "@/lib/dossier-client";
import {
  createProjectForCustomerAction,
  grantSchemaEditorPlusAction,
  inviteCustomerToPortalAction,
  revokeResourceGrantAction,
  revokeSchemaEditorPlusGrantAction,
} from "./actions";
import {
  DashboardPageShell, AdminAlert, AdminBadge, AdminButton, AdminCard, AdminPageHeader } from "@/components/dashboard/ui";

type Params = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function DashboardCustomerDetailPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const templateGroups = getSchemaTemplatesByVehicleGroup();

  let customer: Customer | null = null;

  try {
    customer = await prisma.customer.findUnique({
      where: { id },
    });
  } catch (dbError) {
    return (
      <div className="min-h-full bg-[#0a0a0b] p-6">
        <AdminAlert tone="warning">{getDatabaseErrorMessage(dbError)}</AdminAlert>
      </div>
    );
  }

  if (!customer) {
    notFound();
  }

  const [resourceGrants, projects, orders, editorAccessGrants, dossiers, contactLogs] = await Promise.all([
    listResourceGrantsForCustomer(customer.id),
    // Un projet que l'admin a créé lui-même reste visible même sans le
    // consentement de partage du client (retour utilisateur) — ce
    // consentement ne concerne que les projets que le client a créés de son
    // côté.
    prisma.project.findMany({
      where: customer.dataShareConsent ? { customerId: customer.id } : { customerId: customer.id, createdByAdmin: true },
      orderBy: { updatedAt: "desc" },
    }),
    listDashboardOrdersForCustomer(customer.id),
    listSchemaEditorAccessGrantsForCustomer(customer.id),
    prisma.dossierClient.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerContactLog.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const now = new Date();
  const activeEditorAccessGrants = editorAccessGrants.filter(
    (grant) => grant.status === "ACTIVE" && (!grant.expiresAt || grant.expiresAt > now)
  );

  const activeGrants = resourceGrants.filter((grant) => grant.status === "ACTIVE");

  return (
    <DashboardPageShell>
        <AdminPageHeader
          title={formatCustomerDisplayName(customer)}
          description={formatCustomerAssetSummary(customer) || "Aucune information véhicule / bateau"}
          backHref="/dashboard/customers"
          backLabel="Retour aux clients"
          actions={
            <>
              <form action={inviteCustomerToPortalAction}>
                <input type="hidden" name="customerId" value={customer.id} />
                <AdminButton type="submit">Inviter à mon espace</AdminButton>
              </form>
              <AdminButton variant="primary" href={`/dashboard/customers/${customer.id}/edit`}>Modifier</AdminButton>
            </>
          }
        />

        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <AdminCard title="Contact">
              <div className="space-y-1 text-sm text-neutral-300">
                <p>{customer.email || "-"}</p>
                <p>{customer.phone || "-"}</p>
                {customer.address ? <p className="whitespace-pre-line">{customer.address}</p> : <p>-</p>}
              </div>
            </AdminCard>

            <AdminCard title={getCustomerAssetLabel(customer.assetType)}>
              <div className="space-y-1 text-sm text-neutral-300">
                <p>Type : {getCustomerAssetLabel(customer.assetType)}</p>
                <p>Marque : {customer.assetBrand || "-"}</p>
                <p>Modèle : {customer.assetModel || "-"}</p>
                <p>{customer.assetType === "BOAT" ? "HIN" : "Immatriculation"} : {customer.registration || "-"}</p>
                <p>Kilométrage : {customer.odometerKm ?? "-"}</p>
                <p>Heures moteur : {customer.engineHours ?? "-"}</p>
              </div>
            </AdminCard>
          </div>

          <div className="space-y-4">
            <AdminCard
              title="Commandes"
              description="Historique des commandes passées par ce client."
            >
              {orders.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucune commande pour l&apos;instant.</p>
              ) : (
                <ul className="divide-y divide-neutral-800/80">
                  {orders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="flex items-center justify-between gap-4 py-3 text-sm hover:opacity-80"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-100">{order.orderNumber}</p>
                          <p className="truncate text-neutral-500">
                            {formatDate(order.createdAt)} · {order.itemCount} article(s)
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <AdminBadge tone={getOrderStatusTone(order.status)}>{getOrderStatusLabel(order.status)}</AdminBadge>
                          <span className="font-semibold text-white">
                            {formatEuroFromCents(order.totalCents)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Éditeur Plus"
              description="Accès inclus avec un accompagnement, ou offert manuellement."
            >
              <form action={grantSchemaEditorPlusAction} className="mb-4 flex flex-wrap items-end gap-3">
                <input type="hidden" name="customerId" value={customer.id} />
                <label className="space-y-1 text-sm">
                  <span className="block text-neutral-400">Offrir un accès de</span>
                  <span className="flex items-center gap-2">
                    <input
                      name="days"
                      type="number"
                      min="1"
                      step="1"
                      defaultValue={30}
                      required
                      className="h-9 w-20 rounded-lg border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                    />
                    <span className="text-neutral-400">jour(s)</span>
                  </span>
                </label>
                <AdminButton type="submit" variant="secondary" size="sm">
                  Offrir l&apos;accès
                </AdminButton>
              </form>

              {activeEditorAccessGrants.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucun accès éditeur actif pour l&apos;instant.</p>
              ) : (
                <ul className="divide-y divide-neutral-800/80">
                  {activeEditorAccessGrants.map((grant) => (
                    <li key={grant.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-100">
                          {grant.isManual ? "Offert manuellement" : "Inclus avec un accompagnement"}
                        </p>
                        <p className="truncate text-neutral-500">
                          {grant.expiresAt ? `Jusqu'au ${formatDate(grant.expiresAt)}` : "Sans date d'expiration"}
                        </p>
                      </div>
                      {grant.isManual ? (
                        <form action={revokeSchemaEditorPlusGrantAction}>
                          <input type="hidden" name="customerId" value={customer.id} />
                          <input type="hidden" name="capabilityId" value={grant.id} />
                          <button
                            type="submit"
                            className="shrink-0 text-sm font-medium text-red-400 underline underline-offset-2 hover:text-red-300"
                          >
                            Révoquer
                          </button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Ressources offertes"
              description="Ebooks ou fichiers octroyés directement, sans commande."
              actions={
                <AdminButton variant="secondary" href={`/dashboard/customers/${customer.id}/resources/new`}>
                  Offrir une ressource
                </AdminButton>
              }
            >
              {activeGrants.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucune ressource offerte pour l&apos;instant.</p>
              ) : (
                <ul className="divide-y divide-neutral-800/80">
                  {activeGrants.map((grant) => (
                    <li key={grant.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-100">{grant.product.name}</p>
                        <p className="truncate text-neutral-500">
                          {grant.asset.filename} · {Math.max(grant.maxDownloads - grant.downloadCount, 0)}{" "}
                          téléchargement(s) restant(s)
                        </p>
                      </div>
                      <form action={revokeResourceGrantAction}>
                        <input type="hidden" name="customerId" value={customer.id} />
                        <input type="hidden" name="grantId" value={grant.id} />
                        <button
                          type="submit"
                          className="shrink-0 text-sm font-medium text-red-400 underline underline-offset-2 hover:text-red-300"
                        >
                          Révoquer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Accompagnement"
              description="Prestations d'accompagnement achetées ou créées manuellement pour ce client."
            >
              {dossiers.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucun dossier d&apos;accompagnement pour l&apos;instant.</p>
              ) : (
                <ul className="divide-y divide-neutral-800/80">
                  {dossiers.map((dossier) => {
                    const currentStep = isTimelineOffre(dossier.offre)
                      ? getDossierStepStatuses(dossier.offre, dossier.etapeOverride ?? dossier.etapeActuelle).find(
                          (step) => step.status === "current"
                        )
                      : null;
                    return (
                      <li key={dossier.id}>
                        <Link
                          href={`/dashboard/accompagnements/${dossier.id}`}
                          className="flex items-center justify-between gap-4 py-3 text-sm hover:opacity-80"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-neutral-100">{getDossierOffreLabel(dossier.offre)}</p>
                            <p className="truncate text-neutral-500">
                              {dossier.dateLivraison
                                ? `Livré le ${formatDate(dossier.dateLivraison)}`
                                : `Dernière activité le ${formatDate(dossier.derniereActivite)}`}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {dossier.dateLivraison ? (
                              <AdminBadge tone="success">Livré</AdminBadge>
                            ) : dossier.statutSimple ? (
                              <AdminBadge tone={getDossierStatutSimpleTone(dossier.statutSimple)}>
                                {getDossierStatutSimpleLabel(dossier.statutSimple)}
                              </AdminBadge>
                            ) : currentStep ? (
                              <AdminBadge tone="info">{currentStep.title}</AdminBadge>
                            ) : (
                              <AdminBadge tone="neutral">En cours</AdminBadge>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Historique des contacts"
              description="Mailings manuels et relances automatiques envoyés à ce client."
            >
              {contactLogs.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucun email envoyé pour l&apos;instant.</p>
              ) : (
                <ul className="divide-y divide-neutral-800/80">
                  {contactLogs.map((log) => (
                    <li key={log.id} className="py-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <p className="truncate font-medium text-neutral-100">{log.subject}</p>
                        <span className="shrink-0 text-xs text-neutral-500">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">{log.sentBy}</p>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Dossier projet"
              description="Projets créés par le client dans l'éditeur de schéma."
            >
              {customer.driveLinkUrl ? (
                <p className="mb-3 text-sm text-neutral-300">
                  Drive partagé par le client :{" "}
                  <a
                    href={customer.driveLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-300 underline underline-offset-2 hover:text-brand-200"
                  >
                    {customer.driveLinkUrl}
                  </a>
                </p>
              ) : null}
              {!customer.dataShareConsent ? (
                <p className="mb-3 text-sm text-neutral-500">
                  Le client n&apos;a pas autorisé le partage des projets qu&apos;il aurait créés lui-même — seuls les schémas créés depuis le dashboard apparaissent ci-dessous.
                </p>
              ) : null}
              {projects.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucun projet pour l&apos;instant.</p>
              ) : (
                <ul className="divide-y divide-neutral-800/80">
                  {projects.map((project) => (
                    <li key={project.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-100">{project.name}</p>
                        <p className="truncate text-neutral-500">
                          {getProjectAssetTypeLabel(project.assetType)} · {getProjectStatusLabel(project.status)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-neutral-500">Mis à jour le {formatDate(project.updatedAt)}</span>
                        <Link
                          href={`/outils/schema/editeur?projectId=${project.id}`}
                          className="rounded-md border border-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 hover:border-brand-400 hover:text-white"
                        >
                          Ouvrir le schéma
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <form action={createProjectForCustomerAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-800 pt-4">
                <input type="hidden" name="customerId" value={customer.id} />
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Nom du schéma
                  <input
                    name="name"
                    required
                    defaultValue={`Schéma ${customer.name ?? ""}`.trim()}
                    className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-brand-400"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Type
                  <select
                    name="assetType"
                    defaultValue="VAN"
                    className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
                  >
                    <option value="VAN">Van</option>
                    <option value="MOTORHOME">Camping-car</option>
                    <option value="BOAT">Bateau</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Tension
                  <select
                    name="voltage"
                    defaultValue="V12"
                    className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
                  >
                    <option value="V12">12V</option>
                    <option value="V24">24V</option>
                    <option value="UNKNOWN">Je ne sais pas</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Pré-remplissage
                  <select
                    name="templateId"
                    defaultValue=""
                    className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
                  >
                    <option value="">Aucun (schéma vide)</option>
                    {templateGroups.map((group) => (
                      <optgroup key={group.id} label={group.label}>
                        {group.templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <AdminButton type="submit" variant="primary" size="sm">Créer et ouvrir l&apos;éditeur</AdminButton>
              </form>
            </AdminCard>
          </div>
        </div>
  </DashboardPageShell>
  );
}
