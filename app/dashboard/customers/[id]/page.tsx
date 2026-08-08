import Link from "next/link";
import { notFound } from "next/navigation";
import type { Customer, Invoice, Quote } from "@/lib/generated/prisma/client";
import { formatCustomerAssetSummary, getCustomerAssetLabel } from "@/lib/customer-asset";
import { formatCustomerDisplayName } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { AdminAlert, AdminButton, AdminCard, AdminPageHeader } from "@/components/dashboard/ui";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DashboardCustomerDetailPage({ params }: Params) {
  const { id } = await params;
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
  } catch (error) {
    return (
      <div className="min-h-full bg-[#0a0a0b] p-6">
        <AdminAlert tone="warning">{getDatabaseErrorMessage(error)}</AdminAlert>
      </div>
    );
  }

  if (!customer) {
    notFound();
  }

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

        <section className="grid gap-4 md:grid-cols-2">
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
        </section>

        <section className="grid gap-4 md:grid-cols-2">
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
        </section>
      </main>
    </div>
  );
}
