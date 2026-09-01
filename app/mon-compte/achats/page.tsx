import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { getCustomerAccountOverview, type CustomerAccountOverview } from "@/lib/services/customer-account";
import { requireCustomerActor } from "@/lib/server/project-actor";

export const metadata: Metadata = {
  title: "Mes achats",
  description: "Vos guides et vos commandes FabSystem.",
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

type LibraryEntry = {
  productSlug: string;
  productName: string;
  purchasedAt: Date;
  orderNumbers: string[];
  downloads: CustomerAccountOverview["orders"][number]["downloads"];
};

// Vue "bibliothèque" : regroupée par produit possédé, pas par commande.
// Une page organisée par commande devient vite peu lisible dès qu'un
// client possède plusieurs achats (retrouver "mon ebook" implique de
// parcourir plusieurs cartes commande) — ici, un produit = une carte,
// quel que soit le nombre de commandes qui y ont contribué.
// L'historique des commandes (référence, montant) reste disponible plus
// bas, pour la valeur de justificatif, mais n'est plus la structure
// principale de la page.
function buildLibrary(orders: CustomerAccountOverview["orders"]): LibraryEntry[] {
  const bySlug = new Map<string, LibraryEntry>();

  for (const order of orders) {
    const orderDate = order.paidAt ?? order.createdAt;

    for (const item of order.items) {
      const entry = bySlug.get(item.productSlug) ?? {
        productSlug: item.productSlug,
        productName: item.productName,
        purchasedAt: orderDate,
        orderNumbers: [],
        downloads: [],
      };

      entry.orderNumbers.push(order.orderNumber);
      if (orderDate < entry.purchasedAt) {
        entry.purchasedAt = orderDate;
      }

      for (const download of order.downloads) {
        const alreadyListed = entry.downloads.some((d) => d.grantId === download.grantId);
        if (!alreadyListed && download.productName === item.productName) {
          entry.downloads.push(download);
        }
      }

      bySlug.set(item.productSlug, entry);
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
}

// Espace client V2 (UI-8) — Mes achats, restructuré en bibliothèque
// (regroupement par produit) : voir buildLibrary ci-dessus.
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
  const library = buildLibrary(overview.orders);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Mes achats</h1>
        <p className="mt-1 text-sm text-neutral-600">Vos guides et vos commandes FabSystem.</p>
        {downloadError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {downloadError}
          </div>
        ) : null}
      </div>

      {overview.offeredResources.length > 0 ? (
        <section>
          <h2 className="text-base font-semibold text-neutral-950">Ressources offertes</h2>
          <div className="mt-4 space-y-4">
            {overview.offeredResources.map((resource) => (
              <Card key={resource.grantId} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-950">{resource.productName}</h3>
                    <p className="mt-1 text-sm text-neutral-600">Offert le {formatDate(resource.grantedAt)}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button href={`/api/customer-resources/${resource.grantId}`} variant="primary">
                      Télécharger
                    </Button>
                    <p className="mt-1.5 text-xs text-neutral-500">
                      {resource.remainingDownloads}/{resource.maxDownloads} téléchargement
                      {resource.maxDownloads > 1 ? "s" : ""} restant
                      {resource.remainingDownloads > 1 ? "s" : ""}
                      {resource.expiresAt ? ` · expire le ${formatDate(resource.expiresAt)}` : ""}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {overview.editorAccessCodes.length > 0 ? (
        <section>
          <h2 className="text-base font-semibold text-neutral-950">Accès éditeur inclus</h2>
          <div className="mt-4 space-y-4">
            {overview.editorAccessCodes.map((accessCode) => (
              <Card key={accessCode.code} className="p-6">
                <h3 className="text-base font-semibold text-neutral-950">
                  {accessCode.durationDays} jours d&apos;accès complet à l&apos;éditeur de schémas
                </h3>
                {accessCode.redeemed ? (
                  <p className="mt-2 text-sm text-neutral-600">Code déjà activé sur votre compte.</p>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-neutral-600">
                      Saisissez ce code depuis l&apos;éditeur, avec ce même compte, pour démarrer vos {accessCode.durationDays} jours.
                    </p>
                    <code className="mt-4 inline-flex rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold tracking-wide text-neutral-950">
                      {accessCode.code}
                    </code>
                    <div className="mt-4">
                      <Button href="/outils/schema/editeur" variant="primary">Ouvrir l&apos;éditeur</Button>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {overview.orders.length === 0 ? (
        overview.offeredResources.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm font-medium text-neutral-950">Aucun achat pour le moment</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Vos guides et vos téléchargements apparaîtront ici dès votre premier achat numérique.
            </p>
          </Card>
        ) : null
      ) : (
        <>
          <section>
            <h2 className="text-base font-semibold text-neutral-950">Mes guides</h2>
            <div className="mt-4 space-y-4">
              {library.map((entry) => (
                <Card key={entry.productSlug} id={`produit-${entry.productSlug}`} className="scroll-mt-24 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-950">{entry.productName}</h3>
                      <p className="mt-1 text-sm text-neutral-600">
                        Acheté le {formatDate(entry.purchasedAt)}
                      </p>
                      <Link
                        href={`/boutique/${entry.productSlug}`}
                        className="mt-2 inline-block text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
                      >
                        Voir la fiche produit
                      </Link>
                    </div>

                    {entry.downloads.length > 0 ? (
                      <div className="flex flex-col gap-2 sm:items-end">
                        {entry.downloads.map((download) => (
                          <div key={download.grantId} className="text-left sm:text-right">
                            <Button href={`/api/downloads/${download.grantId}`} variant="primary">
                              Télécharger
                            </Button>
                            <p className="mt-1.5 text-xs text-neutral-500">
                              {download.remainingDownloads}/{download.maxDownloads} téléchargement
                              {download.maxDownloads > 1 ? "s" : ""} restant
                              {download.remainingDownloads > 1 ? "s" : ""}
                              {download.expiresAt ? ` · expire le ${formatDate(download.expiresAt)}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">Aucun téléchargement actif pour le moment.</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-950">Historique des commandes</h2>
            <div className="mt-4 space-y-2">
              {overview.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm text-neutral-700">
                    <span className="font-medium text-neutral-950">Commande {order.orderNumber}</span>
                    <span className="mx-2 text-neutral-400">·</span>
                    {formatOrderStatus(order.status)}
                    <span className="mx-2 text-neutral-400">·</span>
                    {formatDate(order.paidAt ?? order.createdAt)}
                  </p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatOrderAmount(order.totalCents, order.currency)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
