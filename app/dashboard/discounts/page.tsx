import { formatDate, formatEuroFromCents } from "@/lib/format";
import {
  activateDiscountCodeAction,
  disableDiscountCodeAction,
} from "@/app/dashboard/discounts/actions";
import { UNLIMITED_DISCOUNT_REDEMPTIONS, listDashboardDiscountCodes } from "@/lib/services/discounts";
import { getDiscountCodeStatusLabel, getDiscountCodeStatusTone } from "@/lib/dashboard-status-labels";
import { CodesPageTabs } from "@/components/dashboard/CodesPageTabs";
import {
  DashboardPageShell,
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
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function DashboardDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const discounts = await listDashboardDiscountCodes();
  const { error, success } = await searchParams;

  return (
    <DashboardPageShell>
        <AdminPageHeader
          title="Codes promo"
          backHref="/dashboard"
          backLabel="Retour au dashboard"
          description="Montant fixe ou pourcentage, ciblés sur un produit ou tout le catalogue, nominatifs ou non, usage limité ou illimité."
          actions={
            <AdminButton variant="primary" href="/dashboard/discounts/new">
              Créer un code
            </AdminButton>
          }
        />

        <CodesPageTabs active="discounts" />

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
                    <AdminBadge tone={getDiscountCodeStatusTone(discount.status)}>
                      {getDiscountCodeStatusLabel(discount.status)}
                    </AdminBadge>
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
                        <AdminButton type="submit" variant="secondary" size="sm">Désactiver</AdminButton>
                      </form>
                    ) : (
                      <form action={activateDiscountCodeAction}>
                        <input type="hidden" name="discountCodeId" value={discount.id} />
                        <AdminButton type="submit" variant="success" size="sm">Réactiver</AdminButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
  </DashboardPageShell>
  );
}
