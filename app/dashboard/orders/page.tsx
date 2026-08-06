import Link from "next/link";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { listDashboardOrders } from "@/lib/services/admin-orders";

export const dynamic = "force-dynamic";

function getOrderStatusLabel(status: string) {
  return status;
}

export default async function DashboardOrdersPage() {
  const orders = await listDashboardOrders();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Commandes e-commerce</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Vue admin lecture seule des commandes, paiements et tentatives du commerce
          FabSystem.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          Retour au dashboard
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          Aucune commande e-commerce n&apos;est encore disponible.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Remise</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Paiement principal</th>
                <th className="px-4 py-3">Tentatives</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {orders.map((order) => (
                <tr key={order.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-950">{order.orderNumber}</div>
                    <div className="text-xs text-neutral-500">{order.id}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div>{order.customerEmail}</div>
                    <div className="text-xs text-neutral-500">
                      {order.customerName || "Nom non renseigne"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {getOrderStatusLabel(order.status)}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {order.discountTotalCents > 0 ? (
                      <div>
                        <div>-{formatEuroFromCents(order.discountTotalCents)}</div>
                        <div className="text-xs text-neutral-500">
                          {order.discountCode || "Code appliqué"}
                        </div>
                      </div>
                    ) : (
                      "Aucune"
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div>{formatEuroFromCents(order.totalCents)} · {order.currency}</div>
                    {order.totalCents === 0 && order.status === "PAID" ? (
                      <div className="text-xs text-emerald-700">Offert via code coaching</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{order.itemCount}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {order.primaryPaymentStatus ?? "Aucun"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{order.paymentCount}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium text-neutral-900 underline underline-offset-4"
                    >
                      Voir le detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
