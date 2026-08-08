import Link from "next/link";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { listDashboardOrders } from "@/lib/services/admin-orders";
import { listPendingOrdersForPurge } from "@/lib/services/order-purge";
import { PendingOrderPurgeButton } from "@/components/dashboard/PendingOrderPurgeButton";
import { PurgeAllPendingOrdersButton } from "@/components/dashboard/PurgeAllPendingOrdersButton";
import {
  AdminBadge,
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  adminTableBodyClass,
  adminTableCellClass,
  adminTableCellStrongClass,
  adminTableHeadCellClass,
  adminTableHeadClass,
  adminTableRowClass,
  type AdminBadgeTone,
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const ORDER_STATUS_TONE: Record<string, AdminBadgeTone> = {
  PAID: "success",
  PENDING_PAYMENT: "warning",
  CANCELLED: "neutral",
  REFUNDED: "info",
  DRAFT: "neutral",
};

const PAYMENT_STATUS_TONE: Record<string, AdminBadgeTone> = {
  SUCCEEDED: "success",
  PENDING: "warning",
  FAILED: "danger",
  REFUNDED: "info",
};

export default async function DashboardOrdersPage() {
  const [orders, purgeSummaries] = await Promise.all([
    listDashboardOrders(),
    listPendingOrdersForPurge(),
  ]);

  const purgeInfoByOrderId = new Map(purgeSummaries.map((summary) => [summary.id, summary]));
  const purgeableCount = purgeSummaries.filter(
    (summary) => summary.isPurgeTier && summary.eligibility.eligible
  ).length;

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Commandes e-commerce"
          description="Vue admin lecture seule des commandes, paiements et tentatives du commerce FabSystem."
          backHref="/dashboard"
          backLabel="Retour au dashboard"
        />

        {purgeSummaries.length > 0 ? (
          <div
            id="purge"
            className="flex flex-col gap-3 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div>
              <h2 className="text-sm font-semibold text-white">Entretien · paiements en attente</h2>
              <p className="mt-1 text-sm text-neutral-400">
                {purgeSummaries.length} commande(s) en attente de paiement, dont {purgeableCount}{" "}
                à purger (jamais aboutie depuis plus de 5 jours, sans accès ni téléchargement
                délivré).
              </p>
            </div>
            <PurgeAllPendingOrdersButton purgeableCount={purgeableCount} />
          </div>
        ) : null}

        {orders.length === 0 ? (
          <AdminEmptyState title="Aucune commande e-commerce n'est encore disponible." />
        ) : (
          <>
            {/* Mobile : vue transactionnelle en cartes, jamais un tableau desktop compresse. */}
            <div className="space-y-3 sm:hidden">
              {orders.map((order) => {
                const purgeInfo = purgeInfoByOrderId.get(order.id);

                return (
                  <div key={order.id} className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4">
                    <Link href={`/dashboard/orders/${order.id}`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-white">{order.orderNumber}</p>
                          <p className="mt-0.5 truncate text-sm text-neutral-400">{order.customerEmail}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <AdminBadge tone={ORDER_STATUS_TONE[order.status] ?? "neutral"}>{order.status}</AdminBadge>
                          {purgeInfo?.isPurgeTier ? <AdminBadge tone="danger">À purger</AdminBadge> : null}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-neutral-500">{formatDate(order.createdAt)}</span>
                        <span className="font-semibold text-white">
                          {formatEuroFromCents(order.totalCents)} · {order.currency}
                        </span>
                      </div>
                      {order.primaryPaymentStatus ? (
                        <div className="mt-2">
                          <AdminBadge tone={PAYMENT_STATUS_TONE[order.primaryPaymentStatus] ?? "neutral"}>
                            Paiement {order.primaryPaymentStatus}
                          </AdminBadge>
                        </div>
                      ) : null}
                    </Link>
                    {purgeInfo?.eligibility.eligible ? (
                      <div className="mt-3 flex justify-end border-t border-neutral-800/60 pt-3">
                        <PendingOrderPurgeButton orderId={order.id} orderNumber={order.orderNumber} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="hidden sm:block">
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Commande</th>
                <th className={adminTableHeadCellClass}>Date</th>
                <th className={adminTableHeadCellClass}>Client</th>
                <th className={adminTableHeadCellClass}>Statut</th>
                <th className={adminTableHeadCellClass}>Remise</th>
                <th className={adminTableHeadCellClass}>Total</th>
                <th className={adminTableHeadCellClass}>Items</th>
                <th className={adminTableHeadCellClass}>Paiement principal</th>
                <th className={adminTableHeadCellClass}>Tentatives</th>
                <th className={adminTableHeadCellClass}>Action</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {orders.map((order) => (
                <tr key={order.id} className={adminTableRowClass}>
                  <td className={adminTableCellStrongClass}>
                    <div>{order.orderNumber}</div>
                    <div className="text-xs font-normal text-neutral-500">{order.id}</div>
                  </td>
                  <td className={adminTableCellClass}>{formatDate(order.createdAt)}</td>
                  <td className={adminTableCellClass}>
                    <div>{order.customerEmail}</div>
                    <div className="text-xs text-neutral-500">{order.customerName || "Nom non renseigné"}</div>
                  </td>
                  <td className={adminTableCellClass}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AdminBadge tone={ORDER_STATUS_TONE[order.status] ?? "neutral"}>{order.status}</AdminBadge>
                      {purgeInfoByOrderId.get(order.id)?.isPurgeTier ? (
                        <AdminBadge tone="danger">À purger</AdminBadge>
                      ) : null}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>
                    {order.discountTotalCents > 0 ? (
                      <div>
                        <div>-{formatEuroFromCents(order.discountTotalCents)}</div>
                        <div className="text-xs text-neutral-500">{order.discountCode || "Code appliqué"}</div>
                      </div>
                    ) : (
                      "Aucune"
                    )}
                  </td>
                  <td className={adminTableCellClass}>
                    <div>
                      {formatEuroFromCents(order.totalCents)} · {order.currency}
                    </div>
                    {order.totalCents === 0 && order.status === "PAID" ? (
                      <div className="text-xs text-emerald-400">Offert via code coaching</div>
                    ) : null}
                  </td>
                  <td className={adminTableCellClass}>{order.itemCount}</td>
                  <td className={adminTableCellClass}>
                    {order.primaryPaymentStatus ? (
                      <AdminBadge tone={PAYMENT_STATUS_TONE[order.primaryPaymentStatus] ?? "neutral"}>
                        {order.primaryPaymentStatus}
                      </AdminBadge>
                    ) : (
                      "Aucun"
                    )}
                  </td>
                  <td className={adminTableCellClass}>{order.paymentCount}</td>
                  <td className={adminTableCellClass}>
                    <div className="flex flex-col items-start gap-2">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-medium text-brand-300 underline underline-offset-4 hover:text-brand-200"
                      >
                        Voir le détail
                      </Link>
                      {purgeInfoByOrderId.get(order.id)?.eligibility.eligible ? (
                        <PendingOrderPurgeButton orderId={order.id} orderNumber={order.orderNumber} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
