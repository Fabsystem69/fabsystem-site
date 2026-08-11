import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { listPublishedTestimonials } from "@/lib/services/testimonials";

// Services V2 — Preuves et réalisations
// (docs/refonte-site-public/services/06-PREUVES-ET-REALISATIONS.md).
// Remplace la page /realisations dédiée (§4, hors architecture cible V2).
// Les trois études de cas reprennent mot pour mot le contenu réel déjà
// publié sur /realisations (mêmes photos, même texte) plutôt que d'inventer
// de nouvelles réalisations — seule la structure visuelle change
// (Besoin / Intervention / Résultat, format demandé par le CDC).
//
// Aucun filtre Toutes/Bateau/Van/Camping-car : le volume réel actuel (2
// Bateau + 1 Camping-car, aucun Van) ne le justifie pas et créerait un
// onglet Van artificiellement vide, explicitement déconseillé (§6).
const CASES = [
  {
    title: "Bateau — Sécurisation 12V/230V",
    besoin: "Refonte partielle avant saison : protections et distribution à fiabiliser.",
    intervention: [
      "Reprise protections et sections",
      "Nettoyage distribution + repérage",
      "Contrôles de sécurité",
    ],
    resultat: "Installation plus sûre et lisible, risques réduits.",
    beforeImage: "/preuves/bateau-avant.jpg",
    beforeAlt: "Installation électrique bateau avant sécurisation",
    afterImage: "/preuves/bateau-apres.jpg",
    afterAlt: "Installation électrique bateau après sécurisation",
  },
  {
    title: "Bateau — Charge & autonomie",
    besoin: "Ajout batterie / charge à bord : incohérences chargeur/DC-DC/section.",
    intervention: [
      "Diagnostic charge et chutes de tension",
      "Recommandation matériel + câblage",
      "Validation fonctionnement",
    ],
    resultat: "Charge stable et utilisation cohérente.",
    image: "/realisations/realisation-apres-1.jpg",
    imageAlt: "Installation électrique de charge sur un bateau",
  },
  {
    title: "Camping-car — Pannes 12V",
    besoin: "Pannes intermittentes : masse/connexions et protections en cause.",
    intervention: [
      "Recherche défaut + mesures",
      "Reprise connexions critiques",
      "Sécurisation protections",
    ],
    resultat: "Pannes supprimées, fiabilité retrouvée.",
    image: "/preuves/fuse-out.jpg",
    imageAlt: "Fusible sorti lors d'un dépannage 12V sur camping-car",
  },
] as const;

export async function Preuves() {
  const testimonials = (await listPublishedTestimonials()).slice(0, 3);

  return (
    <Section id="preuves" tone="light" className="scroll-mt-16">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Du terrain, pas seulement de la théorie
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-600">
          Diagnostic, installation, refit, dépannage ou accompagnement : les méthodes FabSystem
          viennent d&apos;installations et de situations réelles.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CASES.map((item) => (
          <article key={item.title} className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-base font-bold text-neutral-950">{item.title}</h3>

            <div className="mt-3 space-y-2 text-sm text-neutral-600">
              <p>
                <span className="font-semibold text-neutral-900">Le besoin — </span>
                {item.besoin}
              </p>
              <div>
                <span className="font-semibold text-neutral-900">L&apos;intervention</span>
                <ul className="mt-1 space-y-0.5">
                  {item.intervention.map((action) => (
                    <li key={action}>• {action}</li>
                  ))}
                </ul>
              </div>
              <p>
                <span className="font-semibold text-neutral-900">Le résultat — </span>
                {item.resultat}
              </p>
            </div>

            <div className="mt-4 pt-2">
              {"beforeImage" in item ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-xs font-medium text-neutral-500">Avant</p>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-neutral-200">
                      <Image src={item.beforeImage} alt={item.beforeAlt} fill sizes="200px" className="object-cover" loading="lazy" />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-neutral-500">Après</p>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-neutral-200">
                      <Image src={item.afterImage} alt={item.afterAlt} fill sizes="200px" className="object-cover" loading="lazy" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-neutral-200">
                  <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" loading="lazy" />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Témoignages — uniquement ceux réellement publiés (isPublished=true),
          jamais de faux avis (§17). Section entièrement absente si aucun. */}
      {testimonials.length > 0 ? (
        <div className="mt-12">
          <h3 className="text-lg font-bold text-neutral-950">Ils ont choisi FabSystem</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <blockquote key={testimonial.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-sm leading-relaxed text-neutral-700">« {testimonial.quote} »</p>
                <footer className="mt-3 text-xs text-neutral-500">{testimonial.displayName}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      ) : null}

      {/* Double pont */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="text-base font-bold text-neutral-950">Vous préférez réaliser vous-même ?</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            C&apos;est cette expérience du terrain que je mets aussi à votre disposition dans les
            accompagnements FabSystem.
          </p>
          <div className="mt-4">
            <Button href="#on-fait-ensemble" variant="secondary">
              Découvrir les accompagnements
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="text-base font-bold text-neutral-950">Vous préférez me confier les travaux ?</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Décrivez-moi votre projet, je vous recontacte pour en discuter.
          </p>
          <div className="mt-4">
            <Button href="/contact" variant="primary">
              Parler de mon projet
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
