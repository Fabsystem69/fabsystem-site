import { formatDate } from "@/lib/format";
import {
  activateTrialAccessCodeAction,
  revokeTrialAccessCodeAction,
} from "@/app/dashboard/schema-unlock-codes/actions";
import { listTrialAccessCodes } from "@/lib/services/trial-access-code";
import { getTrialAccessCodeStatusLabel, getTrialAccessCodeStatusTone } from "@/lib/dashboard-status-labels";
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

export default async function DashboardSchemaUnlockCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const codes = await listTrialAccessCodes();
  const { error, success } = await searchParams;

  return (
    <DashboardPageShell>
        <AdminPageHeader
          title="Codes promo"
          backHref="/dashboard"
          backLabel="Retour au dashboard"
          description="Accès illimité (consommateurs) à l'éditeur de schéma, à distribuer à la communauté sans paiement — un compte client est requis pour les saisir."
          actions={
            <AdminButton variant="primary" href="/dashboard/schema-unlock-codes/new">
              Créer un code
            </AdminButton>
          }
        />

        <CodesPageTabs active="schema-unlock-codes" />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        {codes.length === 0 ? (
          <AdminEmptyState title="Aucun code promo n'est encore créé." />
        ) : (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Code</th>
                <th className={adminTableHeadCellClass}>Statut</th>
                <th className={adminTableHeadCellClass}>Durée accordée</th>
                <th className={adminTableHeadCellClass}>Usage</th>
                <th className={adminTableHeadCellClass}>Validité du code</th>
                <th className={adminTableHeadCellClass}>Raison</th>
                <th className={adminTableHeadCellClass}>Action</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {codes.map((code) => (
                <tr key={code.id} className={adminTableRowClass}>
                  <td className={adminTableCellStrongClass}>{code.code}</td>
                  <td className={adminTableCellClass}>
                    <AdminBadge tone={getTrialAccessCodeStatusTone(code.status)}>
                      {getTrialAccessCodeStatusLabel(code.status)}
                    </AdminBadge>
                  </td>
                  <td className={adminTableCellClass}>{code.durationDays} jours</td>
                  <td className={adminTableCellClass}>
                    {code.redeemedCount} / {code.maxRedemptions}
                  </td>
                  <td className={adminTableCellClass}>
                    {code.expiresAt ? formatDate(code.expiresAt) : "Illimitée"}
                  </td>
                  <td className={adminTableCellClass}>{code.reason ?? "—"}</td>
                  <td className={adminTableCellClass}>
                    {code.status === "ACTIVE" ? (
                      <form action={revokeTrialAccessCodeAction}>
                        <input type="hidden" name="codeId" value={code.id} />
                        <AdminButton type="submit" variant="secondary" size="sm">
                          Désactiver
                        </AdminButton>
                      </form>
                    ) : (
                      <form action={activateTrialAccessCodeAction}>
                        <input type="hidden" name="codeId" value={code.id} />
                        <AdminButton type="submit" variant="success" size="sm">
                          Réactiver
                        </AdminButton>
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
