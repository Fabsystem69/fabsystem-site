import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatEuroFromCents } from "@/lib/format";
import { getPublicP280LightKit, getPublicVictronLightKit } from "@/lib/project-follow-up";
import { ProjectPrintButton } from "@/components/project-follow-up/ProjectPrintButton";

export function LightProjectKit({
  projectCtaHref,
  variant = "p280",
}: {
  projectCtaHref?: string | null;
  variant?: "p280" | "victron";
}) {
  const kit = variant === "victron" ? getPublicVictronLightKit() : getPublicP280LightKit();
  const baseRows = kit.purchases.filter((item) => item.priority === "Indispensable");
  const optionRows = kit.purchases.filter((item) => item.priority === "Option officielle");

  return (
    <section className="rounded-[32px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Kit imprimable light
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Liste rapide à imprimer : articles, schéma et liens utiles
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
            Une version légère pour garder l&apos;essentiel sous la main pendant le chantier : la
            base d&apos;achat, le schéma conseillé et les liens directs.
          </p>
        </div>
        <ProjectPrintButton />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 print:mt-0 print:grid-cols-3">
        <Card className="p-4 print:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Base estimative
          </p>
          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {formatEuroFromCents(kit.budgetBaseCents)}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{kit.baseSummary}</p>
        </Card>
        <Card className="p-4 print:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Avec recharge roulage
          </p>
          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {formatEuroFromCents(kit.budgetWithOptionsCents)}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{kit.optionSummary}</p>
        </Card>
        <Card className="p-4 print:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Schéma conseillé
          </p>
          <p className="mt-2 text-sm font-semibold text-neutral-950">{kit.schemaLabel}</p>
          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            <Button href={kit.schemaUrl} variant="secondary" className="h-9 min-h-9 px-3 text-xs">
              Voir la fiche
            </Button>
            <Button href={kit.editorUrl} variant="secondary" className="h-9 min-h-9 px-3 text-xs">
              Ouvrir l&apos;éditeur
            </Button>
          </div>
          <p className="mt-2 hidden text-xs text-neutral-500 print:block">
            Schéma : {kit.schemaUrl}
          </p>
          <p className="mt-1 hidden text-xs text-neutral-500 print:block">
            Éditeur : {kit.editorUrl}
          </p>
        </Card>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-neutral-200 bg-white print:mt-4 print:rounded-none print:border">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h3 className="text-base font-semibold text-neutral-950">Base indispensable</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Bloc</th>
                <th className="px-4 py-3 font-semibold">Article</th>
                <th className="px-4 py-3 font-semibold">Budget</th>
                <th className="px-4 py-3 font-semibold">Lien</th>
              </tr>
            </thead>
            <tbody>
              {baseRows.map((item) => (
                <tr key={item.name} className="border-t border-neutral-200 align-top">
                  <td className="px-4 py-3 text-neutral-600">{item.block}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-neutral-950">{item.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">{item.why}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {formatEuroFromCents(item.budgetCents)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-neutral-900 underline underline-offset-4"
                    >
                      Ouvrir
                    </a>
                    <p className="mt-1 hidden max-w-[240px] text-[11px] leading-relaxed text-neutral-500 print:block">
                      {item.href}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-neutral-200 bg-white print:rounded-none print:border">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h3 className="text-base font-semibold text-neutral-950">Options officielles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Bloc</th>
                <th className="px-4 py-3 font-semibold">Option</th>
                <th className="px-4 py-3 font-semibold">Budget</th>
                <th className="px-4 py-3 font-semibold">Lien</th>
              </tr>
            </thead>
            <tbody>
              {optionRows.map((item) => (
                <tr key={item.name} className="border-t border-neutral-200 align-top">
                  <td className="px-4 py-3">
                    <Badge tone="info">{item.block}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-neutral-950">{item.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">{item.why}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {formatEuroFromCents(item.budgetCents)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-neutral-900 underline underline-offset-4"
                    >
                      Ouvrir
                    </a>
                    <p className="mt-1 hidden max-w-[240px] text-[11px] leading-relaxed text-neutral-500 print:block">
                      {item.href}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <Button href={kit.schemaUrl} variant="primary">
          Voir le schéma conseillé
        </Button>
        <Button href={kit.editorUrl} variant="secondary">
          Ouvrir le template dans l&apos;éditeur
        </Button>
        {projectCtaHref ? (
          <Button href={projectCtaHref} variant="secondary">
            Convertir en projet client
          </Button>
        ) : null}
      </div>

      {projectCtaHref ? (
        <p className="mt-3 text-sm text-neutral-600 print:hidden">
          Déjà client ? Ce kit peut devenir un vrai projet centralisé dans votre espace avec le
          schéma, le suivi et le dossier final imprimable.
        </p>
      ) : null}

      <div className="mt-6 hidden rounded-[24px] border border-neutral-200 p-4 text-xs leading-relaxed text-neutral-600 print:block">
        <p className="font-semibold text-neutral-950">Note impression</p>
        <p className="mt-1">{kit.printNote}</p>
      </div>
    </section>
  );
}
