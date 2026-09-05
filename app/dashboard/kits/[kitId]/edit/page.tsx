import { notFound } from "next/navigation";
import { formatEuroFromCents } from "@/lib/format";
import { getKitForEdit } from "@/lib/services/kit";
import {
  DashboardPageShell,
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminPageHeader,
  AdminTable,
  adminTableBodyClass,
  adminTableCellClass,
  adminTableCellStrongClass,
  adminTableHeadCellClass,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/dashboard/ui";
import {
  addKitItemAction,
  deleteKitAction,
  deleteKitItemAction,
  updateKitAction,
} from "../../actions";

export const dynamic = "force-dynamic";

function linesValue(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.filter((line): line is string => typeof line === "string").join("\n");
}

export default async function DashboardEditKitPage({
  params,
  searchParams,
}: {
  params: Promise<{ kitId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { kitId } = await params;
  const { error, success } = await searchParams;

  let kit;
  try {
    kit = await getKitForEdit(kitId);
  } catch {
    notFound();
  }

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title={kit.name}
        backHref="/dashboard/kits"
        backLabel="Retour aux kits"
        description="Articles, budget et contrôles de ce kit — assignable ensuite à un projet depuis sa fiche."
        actions={
          <form action={deleteKitAction}>
            <input type="hidden" name="kitId" value={kit.id} />
            <AdminButton type="submit" variant="danger" size="sm">Supprimer le kit</AdminButton>
          </form>
        }
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
      {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

      <AdminCard title="Nom">
        <form action={updateKitAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="kitId" value={kit.id} />
          <input type="hidden" name="photoControls" value={linesValue(kit.photoControls)} />
          <input type="hidden" name="powerControls" value={linesValue(kit.powerControls)} />
          <input type="hidden" name="checklist" value={linesValue(kit.checklist)} />
          <input
            name="name"
            type="text"
            defaultValue={kit.name}
            required
            className="h-10 min-w-64 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-brand-400"
          />
          <AdminButton type="submit" variant="secondary" size="sm">Renommer</AdminButton>
        </form>
      </AdminCard>

      <AdminCard title="Articles" description="Base indispensable et options officielles.">
        {kit.items.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun article pour l'instant.</p>
        ) : (
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}>Priorité</th>
                <th className={adminTableHeadCellClass}>Bloc</th>
                <th className={adminTableHeadCellClass}>Article</th>
                <th className={adminTableHeadCellClass}>Budget</th>
                <th className={adminTableHeadCellClass}>Action</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {kit.items.map((item) => (
                <tr key={item.id} className={adminTableRowClass}>
                  <td className={adminTableCellClass}>{item.priority}</td>
                  <td className={adminTableCellClass}>{item.block}</td>
                  <td className={adminTableCellClass}>
                    <p className="font-semibold text-neutral-100">{item.name}</p>
                    <p className="mt-1 text-xs text-neutral-500">{item.why}</p>
                  </td>
                  <td className={adminTableCellStrongClass}>{formatEuroFromCents(item.budgetCents)}</td>
                  <td className={adminTableCellClass}>
                    <form action={deleteKitItemAction}>
                      <input type="hidden" name="kitId" value={kit.id} />
                      <input type="hidden" name="kitItemId" value={item.id} />
                      <AdminButton type="submit" variant="danger" size="sm">Retirer</AdminButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}

        <form action={addKitItemAction} className="mt-5 grid gap-3 border-t border-neutral-800 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" name="kitId" value={kit.id} />
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Priorité
            <select name="priority" className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-brand-400">
              <option value="Indispensable">Indispensable</option>
              <option value="Option officielle">Option officielle</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Bloc
            <input name="block" type="text" required placeholder="Ex. Énergie" className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400" />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Nom
            <input name="name" type="text" required placeholder="Ex. Station AFERIY P280" className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400" />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:col-span-2 lg:col-span-1">
            Pourquoi
            <input name="why" type="text" required placeholder="Ex. Le cœur du système" className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400" />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Budget (€)
            <input name="budgetEuros" type="number" step="0.01" min="0" required placeholder="859.00" className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400" />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Lien
            <input name="href" type="url" required placeholder="https://..." className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400" />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <AdminButton type="submit" variant="primary" size="sm">Ajouter l'article</AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard title="Contrôles et checklist" description="Une ligne par entrée, affichées telles quelles côté client.">
        <form action={updateKitAction} className="grid gap-4">
          <input type="hidden" name="kitId" value={kit.id} />
          <input type="hidden" name="name" value={kit.name} />
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Contrôles photo (avant branchement)
            <textarea
              name="photoControls"
              rows={4}
              defaultValue={linesValue(kit.photoControls)}
              placeholder={"Photo implantation banquette\nPhoto tableau 12 V"}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Checklist sécurité (mise sous tension)
            <textarea
              name="powerControls"
              rows={4}
              defaultValue={linesValue(kit.powerControls)}
              placeholder={"Polarité 12 V confirmée\nFusibles en place et bien calibrés"}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Checklist avant impression du dossier
            <textarea
              name="checklist"
              rows={4}
              defaultValue={linesValue(kit.checklist)}
              placeholder="Architecture générale relue et cohérente."
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
            />
          </label>
          <div>
            <AdminButton type="submit" variant="secondary" size="sm">Enregistrer</AdminButton>
          </div>
        </form>
      </AdminCard>
    </DashboardPageShell>
  );
}
