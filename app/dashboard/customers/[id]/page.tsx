import Link from "next/link";
import { notFound } from "next/navigation";
import type { Customer, Invoice, Quote } from "@/lib/generated/prisma/client";
import { formatCustomerAssetSummary, getCustomerAssetLabel } from "@/lib/customer-asset";
import { formatCustomerDisplayName } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

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
      <main className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {getDatabaseErrorMessage(error)}
      </main>
    );
  }

  if (!customer) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">{formatCustomerDisplayName(customer)}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {formatCustomerAssetSummary(customer) || "Aucune information véhicule / bateau"}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/customers/${customer.id}/edit`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
          >
            Modifier
          </Link>
          <Link
            href="/dashboard/customers"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
          >
            Retour
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p>{customer.email || "-"}</p>
            <p>{customer.phone || "-"}</p>
            {customer.address ? <p className="whitespace-pre-line">{customer.address}</p> : <p>-</p>}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {getCustomerAssetLabel(customer.assetType)}
          </h2>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p>Type: {getCustomerAssetLabel(customer.assetType)}</p>
            <p>Marque: {customer.assetBrand || "-"}</p>
            <p>Modèle: {customer.assetModel || "-"}</p>
            <p>{customer.assetType === "BOAT" ? "HIN" : "Immatriculation"}: {customer.registration || "-"}</p>
            <p>Kilométrage: {customer.odometerKm ?? "-"}</p>
            <p>Heures moteur: {customer.engineHours ?? "-"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Derniers devis</h2>
          <div className="mt-3 space-y-2 text-sm">
            {customer.quotes.length === 0 ? (
              <p className="text-neutral-500">Aucun devis.</p>
            ) : (
              customer.quotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/dashboard/quotes/${quote.id}`}
                  className="block text-neutral-900 underline underline-offset-2"
                >
                  {quote.number}
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Dernières factures</h2>
          <div className="mt-3 space-y-2 text-sm">
            {customer.invoices.length === 0 ? (
              <p className="text-neutral-500">Aucune facture.</p>
            ) : (
              customer.invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="block text-neutral-900 underline underline-offset-2"
                >
                  {invoice.number}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
