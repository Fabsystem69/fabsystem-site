import { createTestimonialAction } from "../actions";
import {
  DashboardPageShell, AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function DashboardTestimonialsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <DashboardPageShell maxWidth="3xl">
        <AdminPageHeader
          title="Ajouter un témoignage"
          description="Saisissez uniquement un avis client réel. Le témoignage est créé non publié : vous le rendrez visible ensuite depuis la liste."
          backHref="/dashboard/content/testimonials"
          backLabel="Retour aux témoignages"
        />

        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        <form
          action={createTestimonialAction}
          className="space-y-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-6"
        >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Nom affiché</span>
          <input
            name="displayName"
            type="text"
            required
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            placeholder="Pascal M."
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Type de client</span>
          <select
            name="customerType"
            required
            defaultValue="OTHER"
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          >
            <option value="VAN">Van</option>
            <option value="CAMPING_CAR">Camping-car</option>
            <option value="BOAT">Bateau</option>
            <option value="OTHER">Autre</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-200">
              Modèle véhicule/bateau <span className="text-neutral-500">(optionnel)</span>
            </span>
            <input
              name="vehicleModel"
              type="text"
              className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-200">
              Région <span className="text-neutral-500">(optionnel)</span>
            </span>
            <input
              name="region"
              type="text"
              className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Note (1 à 5)</span>
          <input
            name="rating"
            type="number"
            min={1}
            max={5}
            required
            defaultValue={5}
            className="block min-h-11 w-32 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Témoignage</span>
          <textarea
            name="quote"
            required
            rows={4}
            className="block w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">
            Offre concernée <span className="text-neutral-500">(optionnel, ex. PASSERELLE)</span>
          </span>
          <input
            name="relatedOffer"
            type="text"
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-neutral-200">
          <input type="checkbox" name="isVerifiedPurchase" className="h-4 w-4 rounded border-neutral-600 bg-neutral-900" />
          Achat / prestation vérifiée
        </label>

        <button className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300">
          Créer le témoignage
        </button>
        </form>
  </DashboardPageShell>
  );
}
