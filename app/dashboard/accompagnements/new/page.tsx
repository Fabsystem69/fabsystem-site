import {
  DashboardPageShell,
  AdminAlert,
  AdminButton,
  AdminPageHeader,
} from "@/components/dashboard/ui";
import { createManualDossierAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function DashboardNewDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <DashboardPageShell maxWidth="3xl">
      <AdminPageHeader
        title="Créer un dossier"
        backHref="/dashboard/accompagnements"
        backLabel="Retour aux accompagnements"
        description="Création manuelle — seul chemin pour l'appel découverte (jamais de commande), ou filet de rattrapage pour une offre payante."
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

      <form action={createManualDossierAction} className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Email du client
          <input
            name="customerEmail"
            type="email"
            required
            placeholder="client@exemple.fr"
            className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Offre
          <select
            name="offre"
            className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
          >
            <option value="DECOUVERTE">Appel découverte</option>
            <option value="CONSEIL">Appel conseil</option>
            <option value="GUIDE">Accompagnement guidé</option>
            <option value="CONCEPTION">Conception complète</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Numéro WhatsApp <span className="normal-case tracking-normal text-neutral-600">(optionnel)</span>
          <input
            name="whatsapp"
            type="tel"
            placeholder="+33612345678"
            className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
          />
        </label>
        <div>
          <AdminButton type="submit" variant="primary">Créer</AdminButton>
        </div>
      </form>
    </DashboardPageShell>
  );
}
