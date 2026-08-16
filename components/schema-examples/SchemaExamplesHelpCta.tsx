import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";

export function SchemaExamplesHelpCta({
  contextLabel,
}: {
  contextLabel?: string;
}) {
  const subject = contextLabel
    ? `Besoin d'un schéma précis - ${contextLabel}`
    : "Besoin d'un schéma précis";

  return (
    <section className="print:hidden">
      <div className="rounded-[28px] bg-neutral-950 px-5 py-6 text-white sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
          Besoin d&apos;un cas précis ?
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
          Votre installation mérite parfois un schéma sur mesure.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300">
          Si votre montage est plus spécifique, vous pouvez m&apos;envoyer un message ou passer par
          l&apos;accompagnement pour repartir sur une base claire, sécurisée et adaptée à votre
          matériel.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            href={`mailto:${site.email}?subject=${encodeURIComponent(subject)}`}
            variant="primary"
          >
            Demander un schéma précis par mail
          </Button>
          <Button href="/prestations/accompagnement" variant="secondary">
            Voir l&apos;accompagnement
          </Button>
        </div>
      </div>
    </section>
  );
}
