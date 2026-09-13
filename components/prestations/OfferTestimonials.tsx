import { listPublishedTestimonials } from "@/lib/services/testimonials";

// Server component : n'affiche rien tant qu'aucun temoignage publie n'est
// rattache a cette offre (via Testimonial.relatedOffer) — pas d'etat vide
// sur une page de vente, contrairement a TestimonialsSection (page d'accueil).
export async function OfferTestimonials({ offerSlug }: { offerSlug: string }) {
  const testimonials = await listPublishedTestimonials(offerSlug);

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Ils l&apos;ont vécu</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight">Ce qu&apos;en disent nos clients</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {testimonials.map((testimonial) => (
          <figure key={testimonial.id} className="rounded-2xl border border-neutral-200 bg-[#fbfaf7] p-5">
            <blockquote className="text-sm leading-relaxed text-neutral-800">
              &quot;{testimonial.quote}&quot;
            </blockquote>
            <figcaption className="mt-4 border-t border-neutral-100 pt-3 text-sm">
              <p className="font-semibold text-neutral-950">{testimonial.displayName}</p>
              {testimonial.isVerifiedPurchase ? (
                <p className="mt-0.5 text-xs font-medium text-emerald-700">Achat vérifié</p>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
