import { Section } from "@/components/layout/Section";
import QuizFormations from "@/components/QuizFormations";

// Les Bases V2 — Quiz (docs/refonte-site-public/les-bases/02-QUIZ.md §3).
// Bloc sombre fort, jaune FabSystem en accent, position centrale dans le
// parcours. Le composant QuizFormations gère lui-même les états (avant
// passage / en cours / terminé compact ou complet) — voir son propre
// commentaire pour la logique de persistance locale du résultat réel.
export function QuizSection() {
  return (
    <Section id="quiz" tone="dark" className="scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
          Vérifiez vos acquis
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Testez vos bases
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-300 sm:text-base">
          Vérifiez que les notions essentielles sont acquises avant de passer à la pratique.
        </p>

        <div className="mt-6">
          <QuizFormations />
        </div>
      </div>
    </Section>
  );
}
