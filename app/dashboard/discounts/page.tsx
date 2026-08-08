import { formatDate, formatEuroFromCents } from "@/lib/format";
import {
  activateDiscountCodeAction,
  disableDiscountCodeAction,
} from "@/app/dashboard/discounts/actions";
import { UNLIMITED_DISCOUNT_REDEMPTIONS, listDashboardDiscountCodes } from "@/lib/services/discounts";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
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

const STATUS_TONE: Record<string, AdminBadgeTone> = {
  ACTIVE: "success",
  DISABLED: "neutral",
  EXPIRED: "danger",
};

const successButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 transition-colors duration-150 hover:bg-emerald-500/20";
const secondaryButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-xs font-semibold text-neutral-200 transition-colors duration-150 hover:bg-neutral-800";

export default async function DashboardDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const discounts = await listDashboardDiscountCodes();
  const { error, success } = await searchParams;

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Codes de réduction"
          description="Montant fixe ou pourcentage, ciblés sur un produit ou tout le catalogue, nominatifs ou non, usage limité ou illimité."
          actions={
            <>
              <AdminButton variant="primary" href="/dashboard/discounts/new">
                Créer un code
              </AdminButton>
              <AdminButton href="/dashboard">Retour dashboard</AdminButton>
            </>
          }
        />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        {discounts.length === 0 ? (
          <AdminEmptyState title="Aucun code de réduction n'est encore enregistré." />
        ) : (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Code</th>
                <th className={adminTableHeadCellClass}>Statut</th>
                <th className={adminTableHeadCellClass}>Montant</th>
                <th className={adminTableHeadCellClass}>Client</th>
                <th className={adminTableHeadCellClass}>Produit</th>
                <th className={adminTableHeadCellClass}>Usage</th>
                <th className={adminTableHeadCellClass}>Validité</th>
                <th className={adminTableHeadCellClass}>Raison</th>
                <th className={adminTableHeadCellClass}>Action</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {discounts.map((discount) => (
                <tr key={discount.id} className={adminTableRowClass}>
                  <td className={adminTableCellStrongClass}>{discount.code}</td>
                  <td className={adminTableCellClass}>
                    <AdminBadge tone={STATUS_TONE[discount.status] ?? "neutral"}>{discount.status}</AdminBadge>
                  </td>
                  <td className={adminTableCellClass}>
                    {discount.type === "FIXED_AMOUNT"
                      ? `${formatEuroFromCents(discount.amountOffCents ?? 0)} · ${discount.currency}`
                      : `${discount.percentOff ?? 0}%`}
                  </td>
                  <td className={adminTableCellClass}>{discount.customerEmail || "Tous"}</td>
                  <td className={adminTableCellClass}>{discount.product?.name || "Tout le catalogue"}</td>
                  <td className={adminTableCellClass}>
                    {discount.redeemedCount} /{" "}
                    {discount.maxRedemptions >= UNLIMITED_DISCOUNT_REDEMPTIONS ? "illimité" : discount.maxRedemptions}
                  </td>
                  <td className={adminTableCellClass}>
                    <div>{discount.startsAt ? formatDate(discount.startsAt) : "Immédiat"}</div>
                    <div className="text-xs text-neutral-500">
                      Expire : {discount.expiresAt ? formatDate(discount.expiresAt) : "Jamais"}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>{discount.reason || "—"}</td>
                  <td className={adminTableCellClass}>
                    {discount.status === "ACTIVE" ? (
                      <form action={disableDiscountCodeAction}>
                        <input type="hidden" name="discountCodeId" value={discount.id} />
                        <button className={secondaryButtonClass}>Désactiver</button>
                      </form>
                    ) : (
                      <form action={activateDiscountCodeAction}>
                        <input type="hidden" name="discountCodeId" value={discount.id} />
                        <button className={successButtonClass}>Réactiver</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </main>
    </div>
  );
}
