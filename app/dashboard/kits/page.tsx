import { formatEuroFromCents } from "@/lib/format";
import { listKits } from "@/lib/services/kit";
import {
  DashboardPageShell,
  AdminAlert,
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

export default async function DashboardKitsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const kits = await listKits();

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title="Kits"
        backHref="/dashboard"
        backLabel="Retour au dashboard"
        description="Bundles d'achat réutilisables (liste, budget, contrôles) assignables à un projet — remplace la liste AFERIY P280 qui s'appliquait par erreur à tous les projets."
        actions={
          <AdminButton variant="primary" href="/dashboard/kits/new">
            Créer un kit
          </AdminButton>
        }
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
      {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

      {kits.length === 0 ? (
        <AdminEmptyState title="Aucun kit créé pour l'instant." />
      ) : (
        <AdminTable>
          <thead className={adminTableHeadClass}>
            <tr>
              <th className={adminTableHeadCellClass}>Nom</th>
              <th className={adminTableHeadCellClass}>Articles</th>
              <th className={adminTableHeadCellClass}>Budget indispensable</th>
              <th className={adminTableHeadCellClass}>Projets assignés</th>
              <th className={adminTableHeadCellClass}>Action</th>
            </tr>
          </thead>
          <tbody className={adminTableBodyClass}>
            {kits.map((kit) => {
              const baseBudgetCents = kit.items
                .filter((item) => item.priority === "Indispensable")
                .reduce((sum, item) => sum + item.budgetCents, 0);

              return (
                <tr key={kit.id} className={adminTableRowClass}>
                  <td className={adminTableCellStrongClass}>{kit.name}</td>
                  <td className={adminTableCellClass}>{kit.items.length}</td>
                  <td className={adminTableCellClass}>{formatEuroFromCents(baseBudgetCents)}</td>
                  <td className={adminTableCellClass}>{kit._count.projects}</td>
                  <td className={adminTableCellClass}>
                    <AdminButton href={`/dashboard/kits/${kit.id}/edit`} variant="secondary" size="sm">
                      Modifier
                    </AdminButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
    </DashboardPageShell>
  );
}
