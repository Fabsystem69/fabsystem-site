import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { listPublishedTestimonials } from "@/lib/services/testimonials";

// Home V2 — Confiance / preuves réelles
// (docs/refonte-site-public/home/08-CONFIANCE.md). Section conditionnelle :
// si aucun témoignage publié n'existe, la section est entièrement absente
// du rendu (§9 — pas de placeholder "Bientôt ici", contrairement à
// components/TestimonialsSection.tsx utilisé sur /prestations, qui affiche
// un état vide : ce composant est volontairement distinct pour respecter
// la règle propre à la Home). Un seul témoignage authentique mis en avant
// (§3-4, §8) ; jamais inventé.
const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  VAN: "Van aménagé",
  CAMPING_CAR: "Camping-car",
  BOAT: "Bateau",
  OTHER: "",
};

export async function Confiance() {
  const testimonials = await listPublishedTestimonials();
  const testimonial = testimonials[0];

  if (!testimonial) {
    return null;
  }

  const context = [CUSTOMER_TYPE_LABELS[testimonial.customerType], testimonial.vehicleModel]
    .filter(Boolean)
    .join(" · ");

  return (
    <Section tone="light">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200">
          <Image
            src="/preuves/cable.png"
            alt="Câble électrique embarqué lors d'un diagnostic d'installation"
            fill
            loading="lazy"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Des conseils ancrés dans le réel
          </h2>
          <blockquote className="mt-5 border-l-2 border-brand-400 pl-4 text-lg leading-relaxed text-neutral-800">
            « {testimonial.quote} »
          </blockquote>
          <p className="mt-4 text-sm text-neutral-500">
            {testimonial.displayName}
            {context ? ` — ${context}` : ""}
          </p>
        </div>
      </div>
    </Section>
  );
}
