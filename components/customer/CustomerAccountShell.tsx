import Link from "next/link";
import { LogoutButton } from "@/components/customer/LogoutButton";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import type { CustomerAccountOverview } from "@/lib/services/customer-account";

type CustomerAccountShellProps = {
  overview: CustomerAccountOverview;
  downloadError?: string;
};

function formatOrderAmount(value: number, currency: string) {
  if (currency === "EUR") {
    return formatEuroFromCents(value);
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(value / 100);
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

export function CustomerAccountShell({ overview, downloadError }: CustomerAccountShellProps) {
  const { customer, orders } = overview;

  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Compte client FabSystem
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Espace client FabSystem
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
              Retrouvez ici vos achats numériques FabSystem et les téléchargements encore
              disponibles.
            </p>
            {downloadError ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {downloadError}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h2 className="text-base font-semibold text-neutral-950">Informations client</h2>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p className="mt-1 text-sm font-medium text-neutral-950">{customer.email}</p>
              </div>
              {customer.name ? (
                <div>
                  <p className="text-sm text-neutral-500">Nom</p>
                  <p className="mt-1 text-sm font-medium text-neutral-950">{customer.name}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h2 className="text-base font-semibold text-neutral-950">Mes achats</h2>
            </div>

            {orders.length === 0 ? (
              <div className="px-6 py-6">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm font-medium text-neutral-950">Aucun achat pour le moment</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    Vos commandes payées et vos téléchargements apparaîtront ici dès votre premier
                    achat numérique.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {orders.map((order) => (
                  <article key={order.id} className="px-6 py-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-neutral-950">
                          Commande {order.orderNumber}
                        </h3>
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
                        <h4 className="text-sm font-semibold text-neutral-950">Produits</h4>
                        <div className="mt-3 space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                            >
                              <p className="text-sm font-medium text-neutral-950">
                                {item.productName}
                              </p>
                              <p className="mt-1 text-sm text-neutral-600">
                                /boutique/{item.productSlug}
                              </p>
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
                        <h4 className="text-sm font-semibold text-neutral-950">
                          Téléchargements disponibles
                        </h4>
                        {order.downloads.length === 0 ? (
                          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                            <p className="text-sm text-neutral-700">
                              Aucun téléchargement actif pour cette commande pour le moment.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {order.downloads.map((download) => (
                              <div
                                key={download.grantId}
                                className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                              >
                                <p className="text-sm font-medium text-neutral-950">
                                  {download.productName}
                                </p>
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
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-base font-semibold text-neutral-950">Espace client</h2>
          <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-950">Accès sécurisé</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Cette page est protégée par votre connexion. Vos liens de téléchargement sont générés
              de façon sécurisée et ne sont valables que pour vous.
            </p>
          </div>
          <div className="mt-6">
            <LogoutButton />
          </div>
        </aside>
      </section>
    </main>
  );
}
