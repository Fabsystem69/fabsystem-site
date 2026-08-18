import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { listPublishedTestimonials } from "@/lib/services/testimonials";
import {
  ConfianceCarousel,
  type HomeTestimonialSlide,
} from "@/components/home/ConfianceCarousel";

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  VAN: "Van & Fourgon aménagés",
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
    return (
      <Section
        tone="light"
        containerClassName="max-w-4xl"
        className="!py-8 sm:!py-10"
      >
        <div className="rounded-[1.7rem] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,213,79,0.14),_transparent_34%),linear-gradient(180deg,_rgba(250,250,250,0.98),_rgba(255,255,255,1))] p-5 shadow-card sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Votre retour
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-950 sm:text-[1.7rem]">
            Vous avez avancé avec FabSystem ?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
            Partagez ce que le projet, le guide ou l&apos;accompagnement vous a réellement apporté.
            Un retour concret aide les prochains clients à mieux se projeter.
          </p>

          <div className="mt-4 flex flex-col items-start gap-2">
            <Button href="/temoignage" variant="primary">
              Laisser mon témoignage
            </Button>
            <p className="text-xs leading-relaxed text-neutral-500">
              Chaque avis est relu avant publication.
            </p>
          </div>
        </div>
      </Section>
    );
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
    <Section
      tone="light"
      containerClassName="max-w-4xl"
      className="!py-8 sm:!py-10"
    >
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-7">
        <div className="max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Avis clients
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-950 sm:text-[1.7rem]">
            Des conseils ancrés dans le réel
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Des retours concrets sur de vrais projets, présentés de façon plus simple à parcourir.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <div className="min-w-[8rem] rounded-xl border border-brand-200 bg-brand-50/70 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                Note moyenne
              </p>
              <p className="mt-1 text-lg font-bold text-neutral-950">
                {formatAverageRating(slides)} <span className="text-xs text-neutral-500">/ 5</span>
              </p>
            </div>

            <div className="min-w-[8rem] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Témoignages
              </p>
              <p className="mt-1 text-lg font-bold text-neutral-950">{formatCountLabel(slides.length)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-start gap-2">
            <Button href="/temoignage" variant="primary">
              Laisser mon témoignage
            </Button>
            <p className="text-xs leading-relaxed text-neutral-500">
              Chaque avis est relu avant publication.
            </p>
          </div>
        </div>

        <ConfianceCarousel testimonials={slides} />
      </div>
    </Section>
  );
}
