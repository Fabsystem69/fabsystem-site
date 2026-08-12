import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

// Outils V2 — Accompagnement (docs/refonte-site-public/Outils/
// 01-HUB-PUBLIC.md §11). Bref, en fin de parcours. CTA vers l'ancre réelle
// "on-fait-ensemble" de /prestations (remplace l'ancienne ancre morte
// #accompagnement-distance encore présente avant UI-7).
export function Accompagnement() {
  return (
    <Section tone="dark">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Un doute sur votre installation ?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-300 sm:text-base">
          Ces outils couvrent les cas courants. Lorsqu&apos;un calcul ne suffit plus — batteries
          lithium, solaire, 230 V — Fabien peut vous accompagner à distance sur votre projet
          réel.
        </p>
        <div className="mt-6">
          <Button href="/prestations/accompagnement" variant="primary">
            Être accompagné
          </Button>
        </div>
      </div>
    </Section>
  );
}
