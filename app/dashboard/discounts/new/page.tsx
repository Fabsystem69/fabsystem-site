import { createDiscountCodeAction } from "@/app/dashboard/discounts/actions";
import { listDashboardProducts } from "@/lib/services/catalog";
import {
  DashboardPageShell, AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function DashboardDiscountsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const products = await listDashboardProducts();

  return (
    <DashboardPageShell maxWidth="3xl">
        <AdminPageHeader
          title="Créer un code de réduction"
          description="Montant fixe ou pourcentage, ciblé sur un produit du catalogue (ebook ou pack) ou sur tout le catalogue, nominatif ou non, usage limité ou illimité, avec ou sans date d'expiration."
          backHref="/dashboard/discounts"
          backLabel="Retour aux codes"
        />

        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        <form
          action={createDiscountCodeAction}
          className="space-y-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-6"
        >
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-neutral-200">Type de réduction</legend>
          <div className="flex gap-4 text-sm text-neutral-300">
            <label className="flex items-center gap-2">
              <input type="radio" name="type" value="FIXED_AMOUNT" defaultChecked />
              Montant fixe (€)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="type" value="PERCENTAGE" />
              Pourcentage (%)
            </label>
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-200">Montant (€)</span>
            <input
              name="amountOffEuros"
              type="number"
              min="0"
              step="0.01"
              className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="49.00"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-200">Pourcentage (%)</span>
            <input
              name="percentOff"
              type="number"
              min="1"
              max="100"
              className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="20"
            />
          </label>
        </div>
        <p className="text-xs text-neutral-500">
          Ne renseigner que le champ correspondant au type sélectionné ci-dessus.
        </p>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">
            Produit ciblé
            <span className="ml-2 text-neutral-500">(optionnel)</span>
          </span>
          <select
            name="productId"
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          >
            <option value="">Tout le catalogue</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">
            Email client
            <span className="ml-2 text-neutral-500">(optionnel — laisser vide pour un code utilisable par tous)</span>
          </span>
          <input
            name="customerEmail"
            type="email"
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            placeholder="client@example.com"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-200">Limite d&apos;usage</span>
            <input
              name="maxRedemptions"
              type="number"
              min="1"
              defaultValue={1}
              className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>

          <label className="mt-8 flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="unlimitedRedemptions" />
            Usage illimité
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">
            Expire le
            <span className="ml-2 text-neutral-500">(optionnel — laisser vide pour ne jamais expirer)</span>
          </span>
          <input
            name="expiresAt"
            type="date"
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">
            Préfixe du code
            <span className="ml-2 text-neutral-500">(optionnel, défaut : PROMO)</span>
          </span>
          <input
            name="codePrefix"
            type="text"
            maxLength={20}
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            placeholder="PROMO"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Raison</span>
          <input
            name="reason"
            type="text"
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            placeholder="Prestation coaching, opération commerciale..."
          />
        </label>

        <button className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300">
          Créer le code
        </button>
        </form>
  </DashboardPageShell>
  );
}
