import { AdminAlert, AdminButton, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";
import { createCoachingProjectForExistingCustomerAction } from "../../project-lifecycle-actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-12 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

// Retour utilisateur : "comment je rajoute mes projets en cours" — pour un
// client déjà accompagné aujourd'hui, sans passer par le pipeline Prospect
// (voir /dashboard/crm/prospects/new pour un tout nouveau contact).
export default async function DashboardCrmNewClientProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <DashboardPageShell maxWidth="2xl">
      <AdminPageHeader
        title="Ajouter un projet pour un client existant"
        backHref="/dashboard/crm/clients"
        backLabel="Retour aux clients"
        description="Pour un client déjà accompagné, avec un compte FabSystem existant (achat, dossier...). Pour un tout nouveau contact, passez plutôt par Prospects."
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

      <form action={createCoachingProjectForExistingCustomerAction} className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <label className={labelClass}>
          Email du client
          <input name="email" type="email" required placeholder="client@exemple.fr" className={fieldClass} />
        </label>
        <label className={labelClass}>
          Titre du projet
          <input name="title" required placeholder="Installation électrique van" className={fieldClass} />
        </label>
        <AdminButton type="submit" variant="primary" className="h-12 self-start px-6">Créer le projet</AdminButton>
      </form>
    </DashboardPageShell>
  );
}
