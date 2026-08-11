import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

// Services V2 — CTA final (docs/refonte-site-public/services/08-CTA-FINAL.md).
// Reprend la symétrie voulue avec le Hero : mêmes trois voies, destinations
// différentes par bloc (§5), aucun badge "Recommandé" (§4).
const CHOICES = [
  {
    title: "Je fais seul",
    text: "Je veux avancer à mon rythme : outils, ressources et ebooks FabSystem.",
    cta: "Découvrir les ressources",
    href: "/outils",
  },
  {
    title: "On fait ensemble",
    text: "Je veux réaliser moi-même, avec FabSystem à mes côtés. On fait le point ensemble, puis vous choisissez le niveau d'accompagnement adapté à votre projet.",
    cta: "Choisir mon accompagnement",
    href: "#on-fait-ensemble",
  },
  {
    title: "Je confie",
    text: "Je préfère vous confier les travaux : diagnostic, installation, modification, dépannage ou refit directement sur votre bateau, van ou camping-car.",
    cta: "Parler de mon projet",
    href: "/contact",
  },
] as const;

export function ServicesCtaFinal() {
  return (
    <Section tone="dark" className="border-t border-neutral-800">
      <h2 className="text-2xl font-bold text-white sm:text-3xl">
        Vous savez maintenant comment vous voulez avancer ?
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-400">
        Seul, accompagné ou en me confiant la réalisation : choisissez simplement ce qui
        correspond à votre projet aujourd&apos;hui.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {CHOICES.map((choice) => (
          <div key={choice.title} className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-base font-bold text-white">{choice.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-400">{choice.text}</p>
            <div className="mt-5">
              <Button href={choice.href} variant="primary" className="w-full">
                {choice.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-white/10 pt-6">
        <h3 className="text-base font-bold text-white">Vous hésitez encore ?</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">
          Expliquez-moi simplement votre situation. Je vous orienterai vers la solution adaptée —
          y compris si vous n&apos;avez besoin d&apos;aucun accompagnement.
        </p>
        <div className="mt-4">
          <Button href="/contact" variant="tertiary" className="text-neutral-300 hover:bg-white/10 hover:text-white">
            Décrire ma situation
          </Button>
        </div>
      </div>
    </Section>
  );
}
