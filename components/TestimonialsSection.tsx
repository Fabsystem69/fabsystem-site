import { listPublishedTestimonials } from "@/lib/services/testimonials";

const customerTypeLabels: Record<string, string> = {
  VAN: "Van aménagé",
  CAMPING_CAR: "Camping-car",
  BOAT: "Bateau",
  OTHER: "",
};

function Stars({ rating }: { rating: number }) {
  const safeRating = Math.min(5, Math.max(0, rating));
  return (
    <div className="flex gap-0.5 text-yellow-400" aria-label={`${safeRating} sur 5`}>
      {"★".repeat(safeRating)}
      {"☆".repeat(5 - safeRating)}
    </div>
  );
}

// Server component : lit uniquement les temoignages isPublished = true, ne
// rend jamais de HTML fourni par un temoignage (texte brut uniquement via
// JSX, qui echappe automatiquement le contenu).
export async function TestimonialsSection() {
  const testimonials = await listPublishedTestimonials();

  if (testimonials.length === 0) {
    return (
      <section className="border-t border-neutral-200 bg-neutral-50 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Avis clients
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">Bientôt ici</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Les avis clients FabSystem seront publiés ici dès que le suivi des témoignages sera
            en place.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-neutral-200 bg-neutral-50 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Ils ont fait appel à FabSystem
        </p>
        <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
          Ce qu&apos;ils en disent
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <Stars rating={testimonial.rating} />
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                &quot;{testimonial.quote}&quot;
              </p>
              <div className="mt-4 border-t border-neutral-100 pt-3">
                <p className="text-sm font-semibold text-neutral-900">
                  {testimonial.displayName}
                </p>
                <p className="text-xs text-neutral-500">
                  {[customerTypeLabels[testimonial.customerType], testimonial.vehicleModel, testimonial.region]
                    .filter(Boolean)
                    .join(" — ")}
                </p>
                {testimonial.isVerifiedPurchase ? (
                  <p className="mt-1 text-xs font-medium text-emerald-700">Achat vérifié</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
