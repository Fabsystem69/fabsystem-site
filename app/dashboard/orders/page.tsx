import Link from "next/link";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { listDashboardOrders } from "@/lib/services/admin-orders";
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
  const orders = await listDashboardOrders();

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Commandes e-commerce"
          description="Vue admin lecture seule des commandes, paiements et tentatives du commerce FabSystem."
          backHref="/dashboard"
          backLabel="Retour au dashboard"
        />

        {orders.length === 0 ? (
          <AdminEmptyState title="Aucune commande e-commerce n'est encore disponible." />
        ) : (
          <>
            {/* Mobile : vue transactionnelle en cartes, jamais un tableau desktop compresse. */}
            <div className="space-y-3 sm:hidden">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="block rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{order.orderNumber}</p>
                      <p className="mt-0.5 truncate text-sm text-neutral-400">{order.customerEmail}</p>
                    </div>
                    <AdminBadge tone={ORDER_STATUS_TONE[order.status] ?? "neutral"}>{order.status}</AdminBadge>
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
              ))}
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
                    <AdminBadge tone={ORDER_STATUS_TONE[order.status] ?? "neutral"}>{order.status}</AdminBadge>
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
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium text-brand-300 underline underline-offset-4 hover:text-brand-200"
                    >
                      Voir le détail
                    </Link>
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
