import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { getCustomerAccountOverview } from "@/lib/services/customer-account";
import { requireCustomerActor } from "@/lib/server/project-actor";

export const metadata: Metadata = {
  title: "Mes achats",
  description: "Vos commandes et téléchargements FabSystem.",
  alternates: { canonical: "/mon-compte/achats" },
  robots: { index: false, follow: false },
};

function formatOrderAmount(value: number, currency: string) {
  if (currency === "EUR") {
    return formatEuroFromCents(value);
  }
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value / 100);
}

function formatOrderStatus(status: string) {
  switch (status) {
    case "PAID":
      return "Payée";
    case "PENDING_PAYMENT":
      return "Paiement en attente";
    case "CANCELLED":
      return "Annulée";
    case "REFUNDED":
      return "Remboursée";
    case "DRAFT":
      return "Brouillon";
    default:
      return status;
  }
}

// Espace client V2 (UI-8) — Mes achats, déplacé depuis l'ancien
// CustomerAccountShell (contenu et logique inchangés, MASTER-04 §18 :
// distinct de Mes projets).
export default async function MesAchatsPage({
  searchParams,
}: {
  searchParams?: Promise<{ downloadError?: string }>;
}) {
  const actor = await requireCustomerActor();
  const customerId = actor.role === "customer" ? actor.customerId : "";
  const overview = await getCustomerAccountOverview(customerId);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const downloadError = resolvedSearchParams?.downloadError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Mes achats</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Vos commandes payées et vos téléchargements disponibles.
        </p>
        {downloadError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {downloadError}
          </div>
        ) : null}
      </div>

      {overview.orders.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm font-medium text-neutral-950">Aucun achat pour le moment</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Vos commandes payées et vos téléchargements apparaîtront ici dès votre premier achat
            numérique.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {overview.orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    Commande {order.orderNumber}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {formatOrderStatus(order.status)} · {formatDate(order.paidAt ?? order.createdAt)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-neutral-500">Total</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-950">
                    {formatOrderAmount(order.totalCents, order.currency)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950">Produits</h3>
                  <div className="mt-3 space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-sm font-medium text-neutral-950">{item.productName}</p>
                        <p className="mt-1 text-sm text-neutral-600">/boutique/{item.productSlug}</p>
                        <div className="mt-3 flex items-start justify-between gap-4 text-sm">
                          <span className="text-neutral-500">Quantité {item.quantity}</span>
                          <span className="font-medium text-neutral-900">
                            {formatOrderAmount(item.lineTotalCents, order.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-950">
                    Téléchargements disponibles
                  </h3>
                  {order.downloads.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-sm text-neutral-700">
                        Aucun téléchargement actif pour cette commande pour le moment.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {order.downloads.map((download) => (
                        <div key={download.grantId} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-sm font-medium text-neutral-950">{download.productName}</p>
                          <p className="mt-1 text-sm text-neutral-700">{download.filename}</p>
                          <p className="mt-2 text-sm text-neutral-600">
                            Téléchargements restants : {download.remainingDownloads}/
                            {download.maxDownloads}
                          </p>
                          {download.expiresAt ? (
                            <p className="mt-1 text-sm text-neutral-600">
                              Expire le {formatDate(download.expiresAt)}
                            </p>
                          ) : null}
                          <div className="mt-4">
                            <Link
                              href={`/api/downloads/${download.grantId}`}
                              className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                            >
                              Télécharger
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
