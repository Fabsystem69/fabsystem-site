import Link from "next/link";
import { createCoachingDiscountAction } from "@/app/dashboard/discounts/actions";
import { listDashboardProducts } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export default async function DashboardDiscountsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const products = await listDashboardProducts();
  const ebookProducts = products.filter((product) => product.productType === "EBOOK");

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Créer un code coaching ebook</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Le montant de remise est figé à partir du prix actif actuel de l&apos;ebook, pour deux
          mois, avec un seul usage.
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
        action={createCoachingDiscountAction}
        className="max-w-2xl space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Email client</span>
          <input
            name="customerEmail"
            type="email"
            required
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
            placeholder="client@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Ebook ciblé</span>
          <select
            name="productId"
            required
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          >
            <option value="">Sélectionner un ebook</option>
            {ebookProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Raison</span>
          <input
            name="reason"
            type="text"
            defaultValue="Prestation coaching"
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          />
        </label>

        <button className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
          Créer le code coaching
        </button>
      </form>
    </section>
  );
}
