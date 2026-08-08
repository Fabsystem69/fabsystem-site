import { notFound } from "next/navigation";
import { listAdminTestimonials } from "@/lib/services/testimonials";
import { updateTestimonialAction } from "../../actions";
import { AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function DashboardTestimonialEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  // Pas de findById dedie cote admin : la liste reste petite, on filtre ici
  // pour eviter d'exposer une nouvelle fonction juste pour cet ecran.
  const testimonials = await listAdminTestimonials();
  const testimonial = testimonials.find((item) => item.id === id);

  if (!testimonial) {
    notFound();
  }

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Modifier le témoignage"
          backHref="/dashboard/content/testimonials"
          backLabel="Retour aux témoignages"
        />

        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        <form
          action={updateTestimonialAction}
          className="space-y-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-6"
        >
        <input type="hidden" name="id" value={testimonial.id} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Nom affiché</span>
          <input
            name="displayName"
            type="text"
            required
            defaultValue={testimonial.displayName}
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Type de client</span>
          <select
            name="customerType"
            required
            defaultValue={testimonial.customerType}
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
              defaultValue={testimonial.vehicleModel ?? ""}
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
              defaultValue={testimonial.region ?? ""}
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
            defaultValue={testimonial.rating}
            className="block min-h-11 w-32 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Témoignage</span>
          <textarea
            name="quote"
            required
            rows={4}
            defaultValue={testimonial.quote}
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
            defaultValue={testimonial.relatedOffer ?? ""}
            className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-neutral-200">
          <input
            type="checkbox"
            name="isVerifiedPurchase"
            defaultChecked={testimonial.isVerifiedPurchase}
            className="h-4 w-4 rounded border-neutral-600 bg-neutral-900"
          />
          Achat / prestation vérifiée
        </label>

        <p className="text-xs text-neutral-500">
          Statut publié : {testimonial.isPublished ? "oui" : "non"} — se gère depuis la liste des
          témoignages, pas depuis ce formulaire.
        </p>

        <button className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300">
          Enregistrer les modifications
        </button>
        </form>
      </main>
    </div>
  );
}
