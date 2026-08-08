import { notFound } from "next/navigation";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { getDashboardOrderDetail } from "@/lib/services/admin-orders";
import {
  AdminAlert,
  AdminBadge,
  AdminCard,
  AdminPageHeader,
  type AdminBadgeTone,
} from "@/components/dashboard/ui";
import {
  addDownloadsToGrantAction,
  refundOrderInFullAction,
  resendMagicLinkAction,
  resetDownloadGrantCountAction,
  revokeDownloadGrantAction,
} from "./actions";

export const dynamic = "force-dynamic";

const ORDER_STATUS_TONE: Record<string, AdminBadgeTone> = {
  PAID: "success",
  PENDING_PAYMENT: "warning",
  CANCELLED: "neutral",
  REFUNDED: "info",
  DRAFT: "neutral",
};

const GRANT_STATUS_TONE: Record<string, AdminBadgeTone> = {
  ACTIVE: "success",
  REVOKED: "danger",
  EXPIRED: "neutral",
};

function formatOptionalDate(value: Date | string | null | undefined) {
  return value ? formatDate(value) : "Non renseigné";
}

const secondaryButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-xs font-semibold text-neutral-200 transition-colors duration-150 hover:bg-neutral-800";
const successButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 transition-colors duration-150 hover:bg-emerald-500/20";
const dangerButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-400 transition-colors duration-150 hover:bg-red-500/20";

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
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        {successMessage ? <AdminAlert tone="success">{successMessage}</AdminAlert> : null}
        {errorMessage ? <AdminAlert tone="danger">{errorMessage}</AdminAlert> : null}

        <AdminPageHeader
          title={order.orderNumber}
          description="Détail lecture seule d'une commande e-commerce, de ses paiements et de ses accès numériques."
          backHref="/dashboard/orders"
          backLabel="Retour aux commandes"
        />

        <AdminCard title="Commande">
          <dl className="grid gap-3 text-sm text-neutral-300 md:grid-cols-2">
            <div>
              <dt className="font-medium text-neutral-100">ID technique</dt>
              <dd>{order.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Statut</dt>
              <dd><AdminBadge tone={ORDER_STATUS_TONE[order.status] ?? "neutral"}>{order.status}</AdminBadge></dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Email client</dt>
              <dd>{order.customerEmail}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Nom client</dt>
              <dd>{order.customerName || "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Customer ID</dt>
              <dd>{order.customerId || "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Créée le</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Payée le</dt>
              <dd>{formatOptionalDate(order.paidAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Annulée le</dt>
              <dd>{formatOptionalDate(order.cancelledAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Remboursée le</dt>
              <dd>{formatOptionalDate(order.refundedAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Sous-total</dt>
              <dd>{formatEuroFromCents(order.subtotalCents)} · {order.currency}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Remise totale</dt>
              <dd>-{formatEuroFromCents(order.discountTotalCents)} · {order.currency}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Total TTC</dt>
              <dd>{formatEuroFromCents(order.totalCents)} · {order.currency}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-100">Code réduction</dt>
              <dd>{order.discountCode?.code || "Non renseigné"}</dd>
            </div>
          </dl>
          {order.totalCents === 0 && order.status === "PAID" ? (
            <div className="mt-4">
              <AdminAlert tone="success">Commande offerte via code coaching.</AdminAlert>
            </div>
          ) : null}

          <form action={resendMagicLinkAction} className="mt-4">
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="customerEmail" value={order.customerEmail} />
            <button type="submit" className={secondaryButtonClass}>
              Renvoyer le lien de connexion (magic link)
            </button>
          </form>
        </AdminCard>

        <AdminCard title="Items">
          <div className="space-y-3">
            {order.items.map((item) => (
              <article key={item.id} className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4 text-sm text-neutral-300">
                <p className="font-medium text-white">{item.productName}</p>
                <p className="mt-1">Slug snapshot : {item.productSlug}</p>
                <p className="mt-1">Type snapshot : {item.productType}</p>
                <p className="mt-1">Product ID : {item.productId}</p>
                <p className="mt-1">Quantité : {item.quantity}</p>
                <p className="mt-1">Prix unitaire : {formatEuroFromCents(item.unitAmountCents)} · {item.currency}</p>
                <p className="mt-1">Total ligne : {formatEuroFromCents(item.lineTotalCents)} · {item.currency}</p>
              </article>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Paiements">
          <div className="space-y-3">
            {order.payments.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucun paiement enregistré.</p>
            ) : (
              order.payments.map((payment) => (
                <article key={payment.id} className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4 text-sm text-neutral-300">
                  <p className="flex items-center gap-2 font-medium text-white">
                    {payment.provider}
                    <AdminBadge tone={GRANT_STATUS_TONE[payment.status] ?? "neutral"}>{payment.status}</AdminBadge>
                  </p>
                  <p className="mt-1">Montant : {formatEuroFromCents(payment.amountCents)} · {payment.currency}</p>
                  <p className="mt-1">Stripe checkout session : {payment.stripeCheckoutSessionId || "Non renseigné"}</p>
                  <p className="mt-1">Stripe payment intent : {payment.stripePaymentIntentId || "Non renseigné"}</p>
                  <p className="mt-1">Raw provider status : {payment.rawProviderStatus || "Non renseigné"}</p>
                  <p className="mt-1">Créé le : {formatDate(payment.createdAt)}</p>
                  <p className="mt-1">Mis à jour le : {formatDate(payment.updatedAt)}</p>
                  <p className="mt-1">Réussi le : {formatOptionalDate(payment.succeededAt)}</p>
                  <p className="mt-1">Échoué le : {formatOptionalDate(payment.failedAt)}</p>
                  <p className="mt-1">Remboursé le : {formatOptionalDate(payment.refundedAt)}</p>
                </article>
              ))
            )}
          </div>
        </AdminCard>

        <AdminCard title="DownloadGrants">
          <div className="space-y-3">
            {order.downloadGrants.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucun DownloadGrant associé.</p>
            ) : (
              order.downloadGrants.map((grant) => (
                <article key={grant.id} className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4 text-sm text-neutral-300">
                  <p className="flex items-center gap-2 font-medium text-white">
                    {grant.product.name}
                    <AdminBadge tone={GRANT_STATUS_TONE[grant.status] ?? "neutral"}>{grant.status}</AdminBadge>
                  </p>
                  <p className="mt-1">Grant ID : {grant.id}</p>
                  <p className="mt-1">Asset : {grant.asset.filename}</p>
                  <p className="mt-1" title={grant.asset.path}>Path : {grant.asset.path}</p>
                  <p className="mt-1">Téléchargements : {grant.downloadCount} / {grant.maxDownloads}</p>
                  <p className="mt-1">Expire le : {formatOptionalDate(grant.expiresAt)}</p>
                  <p className="mt-1">Dernier téléchargement : {formatOptionalDate(grant.lastDownloadedAt)}</p>
                  <p className="mt-1">Révoqué le : {formatOptionalDate(grant.revokedAt)}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={resetDownloadGrantCountAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="grantId" value={grant.id} />
                      <button type="submit" className={secondaryButtonClass}>
                        Réinitialiser le compteur
                      </button>
                    </form>
                    <form action={addDownloadsToGrantAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="grantId" value={grant.id} />
                      <button type="submit" className={successButtonClass}>
                        Ajouter 5 téléchargements
                      </button>
                    </form>
                    {grant.status !== "REVOKED" ? (
                      <form action={revokeDownloadGrantAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="grantId" value={grant.id} />
                        <button type="submit" className={dangerButtonClass}>
                          Révoquer l&apos;accès
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </AdminCard>

        <AdminCard title="Remboursement">
          <div className="space-y-2 text-sm text-neutral-300">
            <p>
              <span className="font-medium text-neutral-100">Remboursable :</span>{" "}
              {refundReadiness.canRefund ? "oui" : "non"}
            </p>
            <p>
              <span className="font-medium text-neutral-100">Raison :</span>{" "}
              {refundReadiness.reason || "Commande éligible à un remboursement total futur."}
            </p>
            <p>
              <span className="font-medium text-neutral-100">Montant remboursable estimé :</span>{" "}
              {formatEuroFromCents(refundReadiness.refundableAmountCents)} · {order.currency}
            </p>
            <div>
              <p className="font-medium text-neutral-100">Conséquences prévues</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {refundReadiness.consequences.map((consequence) => (
                  <li key={consequence}>{consequence}</li>
                ))}
              </ul>
            </div>
          </div>

          {refundReadiness.canRefund ? (
            <form
              action={refundOrderInFullAction}
              className="mt-5 space-y-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4"
            >
              <input type="hidden" name="orderId" value={order.id} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-300">Confirmation manuelle requise</p>
                <p className="text-sm text-red-400/90">
                  Ce remboursement est total, irréversible côté Stripe, et révoquera les accès numériques actifs.
                </p>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-200">
                  Tapez <span className="font-semibold text-white">REMBOURSER</span> pour confirmer
                </span>
                <input
                  name="confirmationText"
                  type="text"
                  autoComplete="off"
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-red-400"
                />
              </label>
              <button
                type="submit"
                className="h-11 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-red-400"
              >
                Rembourser totalement {formatEuroFromCents(refundReadiness.refundableAmountCents)}
              </button>
            </form>
          ) : (
            <div className="mt-4">
              <AdminAlert tone="warning">Remboursement indisponible pour cette commande dans son état actuel.</AdminAlert>
            </div>
          )}
        </AdminCard>
      </main>
    </div>
  );
}
