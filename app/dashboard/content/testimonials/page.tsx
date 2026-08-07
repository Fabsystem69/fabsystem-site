import Link from "next/link";
import { formatDate } from "@/lib/format";
import { listAdminTestimonials } from "@/lib/services/testimonials";
import {
  deleteTestimonialAction,
  setTestimonialDisplayOrderAction,
  setTestimonialFeaturedAction,
  setTestimonialPublishedAction,
} from "./actions";

export const dynamic = "force-dynamic";

const customerTypeLabels: Record<string, string> = {
  VAN: "Van",
  CAMPING_CAR: "Camping-car",
  BOAT: "Bateau",
  OTHER: "Autre",
};

export default async function DashboardTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const testimonials = await listAdminTestimonials();
  const { error, success } = await searchParams;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Témoignages clients</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Gestion des avis clients affichés sur le site. Un témoignage n&apos;est jamais visible
          publiquement tant qu&apos;il n&apos;est pas explicitement publié.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/content/testimonials/new"
            className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Ajouter un témoignage
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Retour dashboard
          </Link>
        </div>
      </div>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {testimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          Aucun témoignage enregistré pour le moment. Aucun avis n&apos;est inventé ici : ajoutez
          uniquement de vrais retours clients.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Véhicule / bateau</th>
                <th className="px-4 py-3">Région</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Publié</th>
                <th className="px-4 py-3">Mis en avant</th>
                <th className="px-4 py-3">Achat vérifié</th>
                <th className="px-4 py-3">Ordre</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {testimonials.map((testimonial) => (
                <tr key={testimonial.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-950">{testimonial.displayName}</div>
                    <div className="mt-1 max-w-xs text-xs text-neutral-500">
                      {testimonial.quote.length > 80
                        ? `${testimonial.quote.slice(0, 80)}…`
                        : testimonial.quote}
                    </div>
                    <div className="mt-1 text-xs text-neutral-400">
                      Créé le {formatDate(testimonial.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {customerTypeLabels[testimonial.customerType] ?? testimonial.customerType}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {testimonial.vehicleModel || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{testimonial.region || "—"}</td>
                  <td className="px-4 py-3 text-neutral-700">{testimonial.rating} / 5</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {testimonial.isPublished ? "Oui" : "Non"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {testimonial.isFeatured ? "Oui" : "Non"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {testimonial.isVerifiedPurchase ? "Oui" : "Non"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={setTestimonialDisplayOrderAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={testimonial.id} />
                      <input
                        type="number"
                        name="displayOrder"
                        defaultValue={testimonial.displayOrder}
                        className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
                      >
                        OK
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <Link
                        href={`/dashboard/content/testimonials/${testimonial.id}/edit`}
                        className="text-xs font-semibold text-neutral-900 underline underline-offset-2"
                      >
                        Modifier
                      </Link>

                      <form action={setTestimonialPublishedAction}>
                        <input type="hidden" name="id" value={testimonial.id} />
                        <input
                          type="hidden"
                          name="isPublished"
                          value={testimonial.isPublished ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
                        >
                          {testimonial.isPublished ? "Masquer" : "Publier"}
                        </button>
                      </form>

                      <form action={setTestimonialFeaturedAction}>
                        <input type="hidden" name="id" value={testimonial.id} />
                        <input
                          type="hidden"
                          name="isFeatured"
                          value={testimonial.isFeatured ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
                        >
                          {testimonial.isFeatured ? "Retirer avant" : "Mettre en avant"}
                        </button>
                      </form>

                      {!testimonial.isPublished ? (
                        <form action={deleteTestimonialAction}>
                          <input type="hidden" name="id" value={testimonial.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-100"
                          >
                            Supprimer
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
