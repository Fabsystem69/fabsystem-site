import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { listPublishedTestimonials } from "@/lib/services/testimonials";
import {
  ConfianceCarousel,
  type HomeTestimonialSlide,
} from "@/components/home/ConfianceCarousel";

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  VAN: "Van aménagé",
  CAMPING_CAR: "Camping-car",
  BOAT: "Bateau",
  OTHER: "",
};

function formatAverageRating(testimonials: HomeTestimonialSlide[]) {
  const average =
    testimonials.reduce((total, testimonial) => total + testimonial.rating, 0) /
    testimonials.length;

  return average.toFixed(1).replace(".", ",");
}

function formatCountLabel(count: number) {
  return `${count} témoignage${count > 1 ? "s" : ""}`;
}

// Home V2 — preuve sociale compacte. Cette section lit uniquement les
// témoignages publiés et disparaît complètement s'il n'y en a aucun.
// Le rendu est prévu pour accueillir plusieurs avis réels sans réintroduire
// un grand visuel décoratif déconnecté du contenu.
export async function Confiance() {
  const testimonials = await listPublishedTestimonials();

  if (testimonials.length === 0) {
    return null;
  }

  const slides: HomeTestimonialSlide[] = testimonials.map((testimonial) => ({
    id: testimonial.id,
    displayName: testimonial.displayName,
    quote: testimonial.quote,
    rating: testimonial.rating,
    context: [
      CUSTOMER_TYPE_LABELS[testimonial.customerType],
      testimonial.vehicleModel,
      testimonial.region,
    ]
      .filter(Boolean)
      .join(" · "),
    isVerifiedPurchase: testimonial.isVerifiedPurchase,
  }));

  return (
    <Section tone="light" containerClassName="max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr] lg:items-center lg:gap-10">
        <div className="max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Avis clients
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950 sm:text-[2rem]">
            Des conseils ancrés dans le réel
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Des retours concrets sur de vrais projets, présentés de façon plus simple à parcourir.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="min-w-[9rem] rounded-2xl border border-brand-200 bg-brand-50/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                Note moyenne
              </p>
              <p className="mt-1 text-xl font-bold text-neutral-950">
                {formatAverageRating(slides)} <span className="text-sm text-neutral-500">/ 5</span>
              </p>
            </div>

            <div className="min-w-[9rem] rounded-2xl border border-neutral-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Témoignages
              </p>
              <p className="mt-1 text-xl font-bold text-neutral-950">{formatCountLabel(slides.length)}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-start gap-2">
            <Button href="/temoignage" variant="primary">
              Laisser mon témoignage
            </Button>
            <p className="text-xs leading-relaxed text-neutral-500">
              Chaque avis est relu avant publication et arrive d&apos;abord dans le dashboard pour
              validation.
            </p>
          </div>
        </div>

        <ConfianceCarousel testimonials={slides} />
      </div>
    </Section>
  );
}
