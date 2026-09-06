import Link from "next/link";
import { formatCustomerDisplayName, formatDate } from "@/lib/format";
import { listAllSchemaEditorAccess, SCHEMA_EDITOR_PLUS_PLANS } from "@/lib/services/schema-editor-plus";
import { getEditorSubscriptionStatusLabel, getEditorSubscriptionStatusTone } from "@/lib/dashboard-status-labels";
import {
  DashboardPageShell,
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
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

// Vue d'ensemble admin (retour utilisateur : "je vois ou les autres
// abonnements ?") — jusqu'ici, un abonnement Éditeur Plus n'était visible
// qu'un par un sur la fiche du client concerné, aucune liste globale
// n'existait. Combine les 3 sources d'accès éditeur illimité : abonnement
// Stripe réel, inclus avec un accompagnement, offert manuellement.
export default async function DashboardSubscriptionsPage() {
  const { subscriptionRows, capabilityRows } = await listAllSchemaEditorAccess();

  const now = new Date();
  const activeCapabilityRows = capabilityRows.filter(
    (row) => row.status === "ACTIVE" && (!row.expiresAt || row.expiresAt > now)
  );

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title="Abonnements Éditeur Plus"
        backHref="/dashboard"
        backLabel="Retour au dashboard"
        description="Toutes les sources d'accès illimité à l'éditeur de schéma : abonnements Stripe réels, accès inclus avec un accompagnement, et octrois manuels."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Abonnements Stripe ({subscriptionRows.length})
        </h2>
        {subscriptionRows.length === 0 ? (
          <AdminEmptyState title="Aucun abonnement Éditeur Plus payant pour l'instant." />
        ) : (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Client</th>
                <th className={adminTableHeadCellClass}>Formule</th>
                <th className={adminTableHeadCellClass}>Statut</th>
                <th className={adminTableHeadCellClass}>Renouvellement / fin</th>
                <th className={adminTableHeadCellClass}>Depuis</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {subscriptionRows.map((row) => (
                <tr key={row.id} className={adminTableRowClass}>
                  <td className={adminTableCellStrongClass}>
                    <Link href={`/dashboard/customers/${row.customer.id}`} className="hover:underline">
                      {formatCustomerDisplayName(row.customer)}
                    </Link>
                    <div className="text-xs font-normal text-neutral-500">{row.customer.email}</div>
                  </td>
                  <td className={adminTableCellClass}>
                    {row.plan ? SCHEMA_EDITOR_PLUS_PLANS[row.plan].label : "Formule inconnue"}
                  </td>
                  <td className={adminTableCellClass}>
                    <AdminBadge tone={getEditorSubscriptionStatusTone(row.status)}>
                      {getEditorSubscriptionStatusLabel(row.status)}
                    </AdminBadge>
                  </td>
                  <td className={adminTableCellClass}>
                    {row.currentPeriodEndsAt ? (
                      <>
                        {formatDate(row.currentPeriodEndsAt)}
                        {row.cancelAtPeriodEnd ? (
                          <span className="ml-1.5 text-xs text-amber-400">(résiliation prévue)</span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={adminTableCellClass}>{formatDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Accès inclus ou offerts, actifs ({activeCapabilityRows.length})
        </h2>
        {activeCapabilityRows.length === 0 ? (
          <AdminEmptyState title="Aucun accès inclus ou offert actif pour l'instant." />
        ) : (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Client</th>
                <th className={adminTableHeadCellClass}>Origine</th>
                <th className={adminTableHeadCellClass}>Expire le</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {activeCapabilityRows.map((row) => (
                <tr key={row.id} className={adminTableRowClass}>
                  <td className={adminTableCellStrongClass}>
                    <Link href={`/dashboard/customers/${row.customer.id}`} className="hover:underline">
                      {formatCustomerDisplayName(row.customer)}
                    </Link>
                    <div className="text-xs font-normal text-neutral-500">{row.customer.email}</div>
                  </td>
                  <td className={adminTableCellClass}>
                    {row.kind === "manual" ? "Offert manuellement" : "Inclus (achat ebook/accompagnement)"}
                  </td>
                  <td className={adminTableCellClass}>{row.expiresAt ? formatDate(row.expiresAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </section>
    </DashboardPageShell>
  );
}
