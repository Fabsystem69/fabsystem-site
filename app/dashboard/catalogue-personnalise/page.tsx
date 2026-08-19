import { formatDate } from "@/lib/format";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { listAllCustomCatalogItems } from "@/lib/services/custom-catalog-item";
import {
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

// Lecture seule (retour utilisateur : "avoir accès à tous les items créés
// pour éventuellement les intégrer officiellement dans la bibliothèque") —
// aucun bouton "intégrer" : intégrer un item au catalogue officiel veut
// dire l'ajouter en dur dans lib/electrical-components/brand-models.ts,
// pas basculer un statut en base. Cette page sert juste à repérer les
// items qui mériteraient ce traitement manuel.
export default async function DashboardCustomCatalogItemsPage() {
  const items = await listAllCustomCatalogItems();

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Catalogue personnalisé"
          description="Items créés par les utilisateurs dans l'éditeur de schémas (marque/référence manquante du catalogue officiel) — à regarder pour repérer ceux qui mériteraient d'être ajoutés en dur au catalogue partagé."
        />

        {items.length === 0 ? (
          <AdminEmptyState title="Aucun item personnalisé créé pour l'instant." />
        ) : (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Photo</th>
                <th className={adminTableHeadCellClass}>Marque / modèle</th>
                <th className={adminTableHeadCellClass}>Type de composant</th>
                <th className={adminTableHeadCellClass}>Valeurs</th>
                <th className={adminTableHeadCellClass}>Compte</th>
                <th className={adminTableHeadCellClass}>Créé le</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {items.map((item) => (
                <tr key={item.id} className={adminTableRowClass}>
                  <td className={adminTableCellClass}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageDataUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  </td>
                  <td className={adminTableCellStrongClass}>
                    {item.brand} {item.model}
                  </td>
                  <td className={adminTableCellClass}>{getComponentDefinition(item.componentType)?.label ?? item.componentType}</td>
                  <td className={`${adminTableCellClass} max-w-xs truncate font-mono text-xs`} title={JSON.stringify(item.defaults)}>
                    {JSON.stringify(item.defaults)}
                  </td>
                  <td className={adminTableCellClass}>{item.customer.name ?? item.customer.email}</td>
                  <td className={adminTableCellClass}>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </main>
    </div>
  );
}
