import Link from "next/link";
import { notFound } from "next/navigation";
import { listAdminTestimonials } from "@/lib/services/testimonials";
import { updateTestimonialAction } from "../../actions";

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
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Modifier le témoignage</h1>
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
        action={updateTestimonialAction}
        className="max-w-2xl space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={testimonial.id} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Nom affiché</span>
          <input
            name="displayName"
            type="text"
            required
            defaultValue={testimonial.displayName}
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Type de client</span>
          <select
            name="customerType"
            required
            defaultValue={testimonial.customerType}
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
              defaultValue={testimonial.vehicleModel ?? ""}
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
              defaultValue={testimonial.region ?? ""}
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
            defaultValue={testimonial.rating}
            className="block min-h-11 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-900">Témoignage</span>
          <textarea
            name="quote"
            required
            rows={4}
            defaultValue={testimonial.quote}
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
            defaultValue={testimonial.relatedOffer ?? ""}
            className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <input
            type="checkbox"
            name="isVerifiedPurchase"
            defaultChecked={testimonial.isVerifiedPurchase}
            className="h-4 w-4 rounded border-neutral-300"
          />
          Achat / prestation vérifiée
        </label>

        <p className="text-xs text-neutral-500">
          Statut publié : {testimonial.isPublished ? "oui" : "non"} — se gère depuis la liste des
          témoignages, pas depuis ce formulaire.
        </p>

        <button className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
          Enregistrer les modifications
        </button>
      </form>
    </section>
  );
}
