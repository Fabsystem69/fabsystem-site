import Link from "next/link";
import { createTestimonialAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function DashboardTestimonialsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Ajouter un témoignage</h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          Saisissez uniquement un avis client réel. Le témoignage est créé non publié : vous le
          rendrez visible ensuite depuis la liste.
        </p>
        <Link
          href="/dashboard/content/testimonials"
          className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          Retour aux témoignages
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <form
        action={createTestimonialAction}
        className="max-w-2xl space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Nom affiché</span>
          <input
            name="displayName"
            type="text"
            required
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
            placeholder="Pascal M."
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Type de client</span>
          <select
            name="customerType"
            required
            defaultValue="OTHER"
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          >
            <option value="VAN">Van</option>
            <option value="CAMPING_CAR">Camping-car</option>
            <option value="BOAT">Bateau</option>
            <option value="OTHER">Autre</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-900">
              Modèle véhicule/bateau <span className="text-neutral-500">(optionnel)</span>
            </span>
            <input
              name="vehicleModel"
              type="text"
              className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-900">
              Région <span className="text-neutral-500">(optionnel)</span>
            </span>
            <input
              name="region"
              type="text"
              className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Note (1 à 5)</span>
          <input
            name="rating"
            type="number"
            min={1}
            max={5}
            required
            defaultValue={5}
            className="block min-h-11 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Témoignage</span>
          <textarea
            name="quote"
            required
            rows={4}
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">
            Offre concernée <span className="text-neutral-500">(optionnel, ex. PASSERELLE)</span>
          </span>
          <input
            name="relatedOffer"
            type="text"
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <input type="checkbox" name="isVerifiedPurchase" className="h-4 w-4 rounded border-neutral-300" />
          Achat / prestation vérifiée
        </label>

        <button className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
          Créer le témoignage
        </button>
      </form>
    </section>
  );
}
