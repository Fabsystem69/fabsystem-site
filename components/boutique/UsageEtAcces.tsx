import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";

// Boutique V2 — Usage et accès (docs/refonte-site-public/Boutique/04-USAGE-ET-ACCES.md).
// Textes repris mot pour mot (§2-3, §6). Aucune illustration Volta dédiée
// n'existe dans le dépôt (constat déjà documenté en UI-2/UI-3/UI-4) : le
// bloc pédagogique reste donc textuel, avec le repère "Le saviez-vous ?"
// en tenant lieu d'en-tête, conformément à §20 ("Volta considérée comme
// décorative si tout son message est déjà présent en texte").
const USAGES = [
  { title: "Préparer", text: "Comprendre et préparer son installation avant de commencer." },
  { title: "Consulter", text: "Retrouver rapidement l'information utile pendant les travaux." },
  { title: "Retrouver", text: "Accéder à ses contenus depuis son espace client." },
];

export function UsageEtAcces() {
  return (
    <Section tone="light">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        Pensés pour être utilisés, pas simplement lus.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
        Les guides FabSystem sont conçus pour vous accompagner de la préparation jusqu&apos;au
        chantier.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {USAGES.map((usage) => (
          <Card key={usage.title} className="p-5">
            <h3 className="text-base font-semibold text-neutral-950">{usage.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{usage.text}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 max-w-3xl border-brand-300 bg-brand-50/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          💡 Le saviez-vous ?
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-neutral-900">
          Votre premier achat FabSystem active automatiquement votre espace client.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
          Vous y retrouvez vos contenus. À terme, votre espace client accueillera également les
          outils avancés FabSystem, avec notamment l&apos;enregistrement de vos calculs et de vos
          schémas.
        </p>
        <p className="mt-2 text-xs font-semibold text-neutral-500">
          Fonctionnalités en développement.
        </p>
      </Card>
    </Section>
  );
}
