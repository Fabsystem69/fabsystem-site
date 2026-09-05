import {
  DashboardPageShell,
  AdminAlert,
  AdminButton,
  AdminPageHeader,
} from "@/components/dashboard/ui";
import { createKitAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function DashboardNewKitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <DashboardPageShell maxWidth="3xl">
      <AdminPageHeader
        title="Créer un kit"
        backHref="/dashboard/kits"
        backLabel="Retour aux kits"
        description="Donnez un nom au kit — les articles, contrôles et checklist s'ajoutent sur l'écran suivant."
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

      <form action={createKitAction} className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Nom du kit
          <input
            name="name"
            type="text"
            required
            placeholder="Ex. AFERIY P280"
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
