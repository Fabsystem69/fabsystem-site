import Link from "next/link";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import {
  activateDiscountCodeAction,
  disableDiscountCodeAction,
} from "@/app/dashboard/discounts/actions";
import { UNLIMITED_DISCOUNT_REDEMPTIONS, listDashboardDiscountCodes } from "@/lib/services/discounts";

export const dynamic = "force-dynamic";

export default async function DashboardDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const discounts = await listDashboardDiscountCodes();
  const { error, success } = await searchParams;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Codes de réduction</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Montant fixe ou pourcentage, ciblés sur un produit ou tout le catalogue, nominatifs ou
          non, usage limité ou illimité.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/discounts/new"
            className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Créer un code
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Retour dashboard
          </Link>
        </div>
      </div>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {discounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          Aucun code de réduction n&apos;est encore enregistré.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Validité</th>
                <th className="px-4 py-3">Raison</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {discounts.map((discount) => (
                <tr key={discount.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-neutral-950">{discount.code}</td>
                  <td className="px-4 py-3 text-neutral-700">{discount.status}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {discount.type === "FIXED_AMOUNT"
                      ? `${formatEuroFromCents(discount.amountOffCents ?? 0)} · ${discount.currency}`
                      : `${discount.percentOff ?? 0}%`}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{discount.customerEmail || "Tous"}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {discount.product?.name || "Tout le catalogue"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {discount.redeemedCount} /{" "}
                    {discount.maxRedemptions >= UNLIMITED_DISCOUNT_REDEMPTIONS
                      ? "illimité"
                      : discount.maxRedemptions}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div>{discount.startsAt ? formatDate(discount.startsAt) : "Immédiat"}</div>
                    <div className="text-xs text-neutral-500">
                      Expire : {discount.expiresAt ? formatDate(discount.expiresAt) : "Jamais"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{discount.reason || "—"}</td>
                  <td className="px-4 py-3">
                    {discount.status === "ACTIVE" ? (
                      <form action={disableDiscountCodeAction}>
                        <input type="hidden" name="discountCodeId" value={discount.id} />
                        <button className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50">
                          Désactiver
                        </button>
                      </form>
                    ) : (
                      <form action={activateDiscountCodeAction}>
                        <input type="hidden" name="discountCodeId" value={discount.id} />
                        <button className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
                          Réactiver
                        </button>
                      </form>
                    )}
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
