import { createTrialAccessCodeAction } from "@/app/dashboard/schema-unlock-codes/actions";
import { AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function DashboardSchemaUnlockCodesNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Créer un code promo éditeur"
          description="Débloque un accès illimité (consommateurs) sur tous les projets du compte qui saisit le code, sans paiement — pensé pour une distribution communauté/groupes."
          backHref="/dashboard/schema-unlock-codes"
          backLabel="Retour aux codes"
        />

        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        <form
          action={createTrialAccessCodeAction}
          className="space-y-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-6"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-200">
              Code
              <span className="ml-2 text-neutral-500">(optionnel — laisser vide pour un code aléatoire)</span>
            </span>
            <input
              name="code"
              type="text"
              maxLength={40}
              className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="FABSYSTEM-GROUPE-X"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-200">Durée accordée (jours)</span>
              <input
                name="durationDays"
                type="number"
                min="1"
                defaultValue={7}
                className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-200">Nombre d&apos;utilisations max</span>
              <input
                name="maxRedemptions"
                type="number"
                min="1"
                defaultValue={50}
                className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-200">
              Le code expire le
              <span className="ml-2 text-neutral-500">(optionnel — laisser vide pour ne jamais expirer)</span>
            </span>
            <input
              name="expiresAt"
              type="date"
              className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-200">Raison</span>
            <input
              name="reason"
              type="text"
              className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="Groupe Facebook Vanlife France, opération lancement..."
            />
          </label>

          <button className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300">
            Créer le code
          </button>
        </form>
      </main>
    </div>
  );
}
