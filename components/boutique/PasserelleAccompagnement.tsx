import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

// Boutique V2 — Passerelle accompagnement
// (docs/refonte-site-public/Boutique/05-PASSERELLE-ACCOMPAGNEMENT.md).
// Textes repris mot pour mot (§2-4, §6). CTA vers l'ancre réelle "on-fait-
// ensemble" de /prestations (components/services/OnFaitEnsemble.tsx),
// conformément à §6 ("idéalement directement vers la zone On fait
// ensemble"). Aucun tableau/prix d'accompagnement recopié (§7).
export function PasserelleAccompagnement() {
  return (
    <Section tone="dark">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Besoin d&apos;un coup de main ensuite ?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-300 sm:text-base">
          Vous pouvez commencer avec votre guide et avancer à votre rythme. Si vous avez besoin
          d&apos;un regard extérieur, de valider vos choix ou d&apos;être accompagné dans votre
          projet, Fabien peut prendre le relais avec vous.
        </p>

        <p className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white">
          Le prix de votre ebook est déduit de votre accompagnement FabSystem.
        </p>

        <div className="mt-6">
          <Button href="/prestations/accompagnement" variant="primary">
            Découvrir les accompagnements
          </Button>
        </div>
      </div>
    </Section>
  );
}
