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
import { formatCustomerDisplayName, formatDate } from "@/lib/format";
import { listEditorUsersWithoutSubscription } from "@/lib/services/editor-crm";
import { runEditorCrmAutoRemindersAction, sendEditorCrmMailingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardEditorCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const users = await listEditorUsersWithoutSubscription();

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title="Éditeur sans abonnement"
        backHref="/dashboard"
        backLabel="Retour au dashboard"
        description="Comptes ayant créé au moins un projet dans l'éditeur de schéma, sans abonnement Éditeur Plus actif. Sélectionnez des destinataires pour un mailing ponctuel, ou laissez la relance automatique (14 jours d'inactivité, jamais plus d'un contact tous les 60 jours) faire le travail en tâche de fond."
        actions={
          <form action={runEditorCrmAutoRemindersAction}>
            <AdminButton type="submit" variant="secondary">Lancer la relance automatique maintenant</AdminButton>
          </form>
        }
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
      {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

      {users.length === 0 ? (
        <AdminEmptyState title="Aucun compte dans ce segment pour l'instant." description="Tous les utilisateurs de l'éditeur ont un abonnement actif, ou personne n'a encore créé de projet." />
      ) : (
        <form action={sendEditorCrmMailingAction} className="space-y-4">
          <AdminTable>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeadCellClass}></th>
                <th className={adminTableHeadCellClass}>Client</th>
                <th className={adminTableHeadCellClass}>Projets</th>
                <th className={adminTableHeadCellClass}>Dernière activité</th>
                <th className={adminTableHeadCellClass}>Dernier contact</th>
                <th className={adminTableHeadCellClass}>Compte créé</th>
              </tr>
            </thead>
            <tbody className={adminTableBodyClass}>
              {users.map((user) => (
                <tr key={user.id} className={adminTableRowClass}>
                  <td className={adminTableCellClass}>
                    <input type="checkbox" name="customerIds" value={user.id} className="h-4 w-4 rounded border-neutral-600 bg-neutral-900" />
                  </td>
                  <td className={adminTableCellStrongClass}>
                    <div>{formatCustomerDisplayName(user)}</div>
                    <div className="text-xs font-normal text-neutral-500">{user.email}</div>
                  </td>
                  <td className={adminTableCellClass}>{user.projectCount}</td>
                  <td className={adminTableCellClass}>{formatDate(user.lastActivityAt)}</td>
                  <td className={adminTableCellClass}>{user.lastContactedAt ? formatDate(user.lastContactedAt) : "Jamais"}</td>
                  <td className={adminTableCellClass}>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
            <p className="mb-3 text-sm font-semibold text-white">Mailing vers les cases cochées ci-dessus</p>
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Objet
                <input
                  name="subject"
                  type="text"
                  required
                  placeholder="Ex. Débloquez le dimensionnement automatique sur votre projet"
                  className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Message
                <textarea
                  name="message"
                  rows={5}
                  required
                  placeholder="Bonjour, ..."
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
                />
              </label>
              <div>
                <AdminButton type="submit" variant="primary">Envoyer aux destinataires sélectionnés</AdminButton>
              </div>
            </div>
          </div>
        </form>
      )}
    </DashboardPageShell>
  );
}
