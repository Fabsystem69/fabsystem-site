import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { getDashboardOrderDetail } from "@/lib/services/admin-orders";
import {
  addDownloadsToGrantAction,
  refundOrderInFullAction,
  resendMagicLinkAction,
  resetDownloadGrantCountAction,
  revokeDownloadGrantAction,
} from "./actions";

export const dynamic = "force-dynamic";

function formatOptionalDate(value: Date | string | null | undefined) {
  return value ? formatDate(value) : "Non renseigne";
}

export default async function DashboardOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const { orderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = resolvedSearchParams?.error;
  const successMessage = resolvedSearchParams?.success;

  let detail;
  try {
    detail = await getDashboardOrderDetail(orderId);
  } catch {
    notFound();
  }

  const { order, refundReadiness } = detail;

  return (
    <section className="space-y-6">
      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">{order.orderNumber}</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Detail lecture seule d&apos;une commande e-commerce, de ses paiements et de ses
          acces numeriques.
        </p>
        <Link
          href="/dashboard/orders"
          className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          Retour aux commandes
        </Link>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-neutral-950">Commande</h2>
        <dl className="mt-4 grid gap-3 text-sm text-neutral-700 md:grid-cols-2">
          <div>
            <dt className="font-medium text-neutral-900">ID technique</dt>
            <dd>{order.id}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Statut</dt>
            <dd>{order.status}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Email client</dt>
            <dd>{order.customerEmail}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Nom client</dt>
            <dd>{order.customerName || "Non renseigne"}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Customer ID</dt>
            <dd>{order.customerId || "Non renseigne"}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Creee le</dt>
            <dd>{formatDate(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Payee le</dt>
            <dd>{formatOptionalDate(order.paidAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Annulee le</dt>
            <dd>{formatOptionalDate(order.cancelledAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Remboursee le</dt>
            <dd>{formatOptionalDate(order.refundedAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Sous-total</dt>
            <dd>
              {formatEuroFromCents(order.subtotalCents)} · {order.currency}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Remise totale</dt>
            <dd>
              -{formatEuroFromCents(order.discountTotalCents)} · {order.currency}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Total TTC</dt>
            <dd>
              {formatEuroFromCents(order.totalCents)} · {order.currency}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-900">Code réduction</dt>
            <dd>{order.discountCode?.code || "Non renseigne"}</dd>
          </div>
        </dl>
        {order.totalCents === 0 && order.status === "PAID" ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Commande offerte via code coaching.
          </p>
        ) : null}

        <form action={resendMagicLinkAction} className="mt-4">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="customerEmail" value={order.customerEmail} />
          <button
            type="submit"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Renvoyer le lien de connexion (magic link)
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-neutral-950">Items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <article key={item.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              <p className="font-medium text-neutral-900">{item.productName}</p>
              <p className="mt-1">Slug snapshot : {item.productSlug}</p>
              <p className="mt-1">Type snapshot : {item.productType}</p>
              <p className="mt-1">Product ID : {item.productId}</p>
              <p className="mt-1">Quantite : {item.quantity}</p>
              <p className="mt-1">
                Prix unitaire : {formatEuroFromCents(item.unitAmountCents)} · {item.currency}
              </p>
              <p className="mt-1">
                Total ligne : {formatEuroFromCents(item.lineTotalCents)} · {item.currency}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-neutral-950">Paiements</h2>
        <div className="mt-4 space-y-3">
          {order.payments.length === 0 ? (
            <p className="text-sm text-neutral-600">Aucun paiement enregistre.</p>
          ) : (
            order.payments.map((payment) => (
              <article key={payment.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <p className="font-medium text-neutral-900">
                  {payment.provider} · {payment.status}
                </p>
                <p className="mt-1">
                  Montant : {formatEuroFromCents(payment.amountCents)} · {payment.currency}
                </p>
                <p className="mt-1">
                  Stripe checkout session : {payment.stripeCheckoutSessionId || "Non renseigne"}
                </p>
                <p className="mt-1">
                  Stripe payment intent : {payment.stripePaymentIntentId || "Non renseigne"}
                </p>
                <p className="mt-1">
                  Raw provider status : {payment.rawProviderStatus || "Non renseigne"}
                </p>
                <p className="mt-1">Cree le : {formatDate(payment.createdAt)}</p>
                <p className="mt-1">Mis a jour le : {formatDate(payment.updatedAt)}</p>
                <p className="mt-1">Reussi le : {formatOptionalDate(payment.succeededAt)}</p>
                <p className="mt-1">Echoue le : {formatOptionalDate(payment.failedAt)}</p>
                <p className="mt-1">Rembourse le : {formatOptionalDate(payment.refundedAt)}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-neutral-950">DownloadGrants</h2>
        <div className="mt-4 space-y-3">
          {order.downloadGrants.length === 0 ? (
            <p className="text-sm text-neutral-600">Aucun DownloadGrant associe.</p>
          ) : (
            order.downloadGrants.map((grant) => (
              <article key={grant.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <p className="font-medium text-neutral-900">{grant.product.name}</p>
                <p className="mt-1">Grant ID : {grant.id}</p>
                <p className="mt-1">Asset : {grant.asset.filename}</p>
                <p className="mt-1" title={grant.asset.path}>
                  Path : {grant.asset.path}
                </p>
                <p className="mt-1">Statut : {grant.status}</p>
                <p className="mt-1">
                  Telechargements : {grant.downloadCount} / {grant.maxDownloads}
                </p>
                <p className="mt-1">Expire le : {formatOptionalDate(grant.expiresAt)}</p>
                <p className="mt-1">
                  Dernier telechargement : {formatOptionalDate(grant.lastDownloadedAt)}
                </p>
                <p className="mt-1">Revoque le : {formatOptionalDate(grant.revokedAt)}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={resetDownloadGrantCountAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="grantId" value={grant.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                    >
                      Reinitialiser le compteur
                    </button>
                  </form>
                  <form action={addDownloadsToGrantAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="grantId" value={grant.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      Ajouter 5 telechargements
                    </button>
                  </form>
                  {grant.status !== "REVOKED" ? (
                    <form action={revokeDownloadGrantAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="grantId" value={grant.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100"
                      >
                        Revoquer l&apos;acces
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-neutral-950">Remboursement</h2>
        <div className="mt-4 space-y-2 text-sm text-neutral-700">
          <p>
            <span className="font-medium text-neutral-900">Remboursable :</span>{" "}
            {refundReadiness.canRefund ? "oui" : "non"}
          </p>
          <p>
            <span className="font-medium text-neutral-900">Raison :</span>{" "}
            {refundReadiness.reason || "Commande eligibile a un remboursement total futur."}
          </p>
          <p>
            <span className="font-medium text-neutral-900">Montant remboursable estime :</span>{" "}
            {formatEuroFromCents(refundReadiness.refundableAmountCents)} · {order.currency}
          </p>
          <div>
            <p className="font-medium text-neutral-900">Consequences prevues</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {refundReadiness.consequences.map((consequence) => (
                <li key={consequence}>{consequence}</li>
              ))}
            </ul>
          </div>
        </div>

        {refundReadiness.canRefund ? (
          <form action={refundOrderInFullAction} className="mt-5 space-y-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <input type="hidden" name="orderId" value={order.id} />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900">Confirmation manuelle requise</p>
              <p className="text-sm text-red-800">
                Ce remboursement est total, irreversible cote Stripe, et revoquera les acces numeriques actifs.
              </p>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-900">
                Tapez <span className="font-semibold">REMBOURSER</span> pour confirmer
              </span>
              <input
                name="confirmationText"
                type="text"
                autoComplete="off"
                required
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-500"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Rembourser totalement {formatEuroFromCents(refundReadiness.refundableAmountCents)}
            </button>
          </form>
        ) : (
          <div className="mt-4 rounded-md border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
            Remboursement indisponible pour cette commande dans son etat actuel.
          </div>
        )}
      </section>
    </section>
  );
}
