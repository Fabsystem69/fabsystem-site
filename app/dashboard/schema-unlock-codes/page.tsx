import { formatDate } from "@/lib/format";
import {
  activateTrialAccessCodeAction,
  revokeTrialAccessCodeAction,
} from "@/app/dashboard/schema-unlock-codes/actions";
import { listTrialAccessCodes } from "@/lib/services/trial-access-code";
import { CodesPageTabs } from "@/components/dashboard/CodesPageTabs";
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
  REVOKED: "neutral",
};

const successButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 transition-colors duration-150 hover:bg-emerald-500/20";
const secondaryButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-xs font-semibold text-neutral-200 transition-colors duration-150 hover:bg-neutral-800";

export default async function DashboardSchemaUnlockCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const codes = await listTrialAccessCodes();
  const { error, success } = await searchParams;

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Codes promo"
          description="Accès illimité (consommateurs) à l'éditeur de schéma, à distribuer à la communauté sans paiement — un compte client est requis pour les saisir."
          actions={
            <>
              <AdminButton variant="primary" href="/dashboard/schema-unlock-codes/new">
                Créer un code
              </AdminButton>
              <AdminButton href="/dashboard">Retour dashboard</AdminButton>
            </>
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
                    <AdminBadge tone={STATUS_TONE[code.status] ?? "neutral"}>{code.status}</AdminBadge>
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
                        <button type="submit" className={secondaryButtonClass}>
                          Désactiver
                        </button>
                      </form>
                    ) : (
                      <form action={activateTrialAccessCodeAction}>
                        <input type="hidden" name="codeId" value={code.id} />
                        <button type="submit" className={successButtonClass}>
                          Réactiver
                        </button>
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
