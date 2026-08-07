import Link from "next/link";
import { createDiscountCodeAction } from "@/app/dashboard/discounts/actions";
import { listDashboardProducts } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export default async function DashboardDiscountsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const products = await listDashboardProducts();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Créer un code de réduction</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Montant fixe ou pourcentage, ciblé sur un produit du catalogue (ebook ou pack) ou sur
          tout le catalogue, nominatif ou non, usage limité ou illimité, avec ou sans date
          d&apos;expiration.
        </p>
        <Link
          href="/dashboard/discounts"
          className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          Retour aux codes
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <form
        action={createDiscountCodeAction}
        className="max-w-2xl space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-neutral-900">Type de réduction</legend>
          <div className="flex gap-4 text-sm text-neutral-800">
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
            <span className="text-sm font-medium text-neutral-900">Montant (€)</span>
            <input
              name="amountOffEuros"
              type="number"
              min="0"
              step="0.01"
              className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
              placeholder="49.00"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-900">Pourcentage (%)</span>
            <input
              name="percentOff"
              type="number"
              min="1"
              max="100"
              className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
              placeholder="20"
            />
          </label>
        </div>
        <p className="text-xs text-neutral-500">
          Ne renseigner que le champ correspondant au type sélectionné ci-dessus.
        </p>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">
            Produit ciblé
            <span className="ml-2 text-neutral-500">(optionnel)</span>
          </span>
          <select
            name="productId"
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
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
          <span className="text-sm font-medium text-neutral-900">
            Email client
            <span className="ml-2 text-neutral-500">(optionnel — laisser vide pour un code utilisable par tous)</span>
          </span>
          <input
            name="customerEmail"
            type="email"
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
            placeholder="client@example.com"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-900">Limite d&apos;usage</span>
            <input
              name="maxRedemptions"
              type="number"
              min="1"
              defaultValue={1}
              className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
            />
          </label>

          <label className="mt-8 flex items-center gap-2 text-sm text-neutral-800">
            <input type="checkbox" name="unlimitedRedemptions" />
            Usage illimité
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">
            Expire le
            <span className="ml-2 text-neutral-500">(optionnel — laisser vide pour ne jamais expirer)</span>
          </span>
          <input
            name="expiresAt"
            type="date"
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">
            Préfixe du code
            <span className="ml-2 text-neutral-500">(optionnel, défaut : PROMO)</span>
          </span>
          <input
            name="codePrefix"
            type="text"
            maxLength={20}
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
            placeholder="PROMO"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Raison</span>
          <input
            name="reason"
            type="text"
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
            placeholder="Prestation coaching, opération commerciale..."
          />
        </label>

        <button className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
          Créer le code
        </button>
      </form>
    </section>
  );
}
