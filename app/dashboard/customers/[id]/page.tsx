import Link from "next/link";
import { notFound } from "next/navigation";
import type { Customer, Invoice, Quote } from "@/lib/generated/prisma/client";
import { formatCustomerAssetSummary, getCustomerAssetLabel } from "@/lib/customer-asset";
import { formatCustomerDisplayName, formatDate } from "@/lib/format";
import { getProjectAssetTypeLabel, getProjectStatusLabel } from "@/lib/project-labels";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { listResourceGrantsForCustomer } from "@/lib/services/customer-resource-grants";
import { revokeResourceGrantAction } from "./actions";
import { AdminAlert, AdminButton, AdminCard, AdminPageHeader } from "@/components/dashboard/ui";

type Params = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function DashboardCustomerDetailPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { error, success } = await searchParams;

  let customer:
    | (Customer & {
        quotes: Quote[];
        invoices: Invoice[];
      })
    | null = null;

  try {
    customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
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

  const [resourceGrants, projects] = await Promise.all([
    listResourceGrantsForCustomer(customer.id),
    customer.dataShareConsent
      ? prisma.project.findMany({
          where: { customerId: customer.id },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const activeGrants = resourceGrants.filter((grant) => grant.status === "ACTIVE");

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title={formatCustomerDisplayName(customer)}
          description={formatCustomerAssetSummary(customer) || "Aucune information véhicule / bateau"}
          backHref="/dashboard/customers"
          backLabel="Retour aux clients"
          actions={
            <AdminButton variant="primary" href={`/dashboard/customers/${customer.id}/edit`}>
              Modifier
            </AdminButton>
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
            <div className="grid gap-4 md:grid-cols-2">
              <AdminCard title="Derniers devis">
                <div className="space-y-2 text-sm">
                  {customer.quotes.length === 0 ? (
                    <p className="text-neutral-500">Aucun devis.</p>
                  ) : (
                    customer.quotes.map((quote) => (
                      <Link
                        key={quote.id}
                        href={`/dashboard/quotes/${quote.id}`}
                        className="block text-neutral-200 underline underline-offset-2 hover:text-brand-300"
                      >
                        {quote.number}
                      </Link>
                    ))
                  )}
                </div>
              </AdminCard>

              <AdminCard title="Dernières factures">
                <div className="space-y-2 text-sm">
                  {customer.invoices.length === 0 ? (
                    <p className="text-neutral-500">Aucune facture.</p>
                  ) : (
                    customer.invoices.map((invoice) => (
                      <Link
                        key={invoice.id}
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="block text-neutral-200 underline underline-offset-2 hover:text-brand-300"
                      >
                        {invoice.number}
                      </Link>
                    ))
                  )}
                </div>
              </AdminCard>
            </div>

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
                <p className="text-sm text-neutral-500">
                  Le client n&apos;a pas autorisé le partage de son dossier projet.
                </p>
              ) : projects.length === 0 ? (
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
            </AdminCard>
          </div>
        </div>
      </main>
    </div>
  );
}
