import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { VoltaGuide } from "@/components/volta/VoltaGuide";
import { VOLTA_MESSAGES } from "@/lib/volta/messages";

// Les Bases V2 — Les bons gestes
// (docs/refonte-site-public/les-bases/03-BONS-GESTES-INDISPENSABLES.md
// §4-8). Aucun contenu "bons gestes" n'existait avant cette mission
// (confirmé par audit) : les 3 entrées ci-dessous sont extraites et
// condensées à partir de règles déjà rédigées et publiées dans les modules
// réels (app/formations/lire-schema/page.tsx et .../bases-12v/page.tsx) —
// jamais un nouveau fait technique inventé pour cette page. Chacune
// renvoie vers son module source (§5 : "passerelle vers un module ...
// lorsque le lien est naturel").
const BONS_GESTES = [
  {
    title: "Le fusible protège le câble, pas l'appareil",
    text:
      "Son calibre correspond à la capacité du câble qu'il protège, pas à l'appareil branché. Le fusible principal doit rester à moins de 30 cm des bornes de la batterie : au-delà, le tronçon non protégé peut brûler en cas de défaut.",
    href: "/formations/lire-schema",
    source: "Module 2 — Lire un schéma électrique",
  },
  {
    title: "Une cosse mal sertie chauffe avant de lâcher",
    text:
      "Une mauvaise connexion crée de la résistance, donc de la chaleur — sans forcément faire sauter le fusible. Épissures bout à bout et câbles torsadés à la main sont à proscrire en permanent : chaque cosse doit être sertie avec l'outil adapté à sa section.",
    href: "/formations/lire-schema",
    source: "Module 2 — Lire un schéma électrique",
  },
  {
    title: "Un câble trop fin chauffe et peut prendre feu",
    text:
      "La puissance dissipée par un câble sous-dimensionné suit P = I² × R : un écart de section qui semble minime peut multiplier le risque par plusieurs dizaines. Ne jamais sous-dimensionner un câble en embarqué, même sur une courte longueur.",
    href: "/formations/bases-12v",
    source: "Module 1 — Les bases du 12V embarqué",
    voltaNote: true,
    // Passerelle contextuelle vers Outils (00-ARCHITECTURE.md §9 : autorisée
    // lorsqu'elle aide réellement à appliquer la notion consultée) — route
    // dédiée réelle depuis UI-7.1 (app/outils/section-cable/page.tsx).
    outilHref: "/outils/section-cable",
    outilLabel: "Mettre en pratique → Calculateur de section",
  },
] as const;

export function BonsGestes() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        Les bons gestes
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Trois repères simples pour éviter les erreurs de base avant même de parler matériel,
        calculs ou optimisation.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
        <div className="rounded-[24px] border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            À retenir
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Le fusible protège le câble, une cosse mal sertie chauffe avant de lâcher, et une
            section sous-dimensionnée reste un vrai risque d&apos;échauffement.
          </p>
        </div>

        <figure className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm">
          <Image
            src="/formations/bons-gestes-a-retenir.webp"
            alt="Vignette des bons gestes à retenir en câblage"
            width={960}
            height={720}
            sizes="(max-width: 640px) 100vw, 220px"
            className="h-36 w-full object-cover object-center sm:h-40"
          />
        </figure>
      </div>

      <div className="mt-5 space-y-3">
        {BONS_GESTES.map((geste) => (
          <Card key={geste.title} className="p-4">
            <h3 className="text-base font-semibold text-neutral-950">{geste.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{geste.text}</p>

            {"voltaNote" in geste && geste.voltaNote ? (
              <VoltaGuide variant="warning" pose="perplexe" className="mt-3">
                {VOLTA_MESSAGES.cableUndersized}
              </VoltaGuide>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href={geste.href}
                className="inline-flex text-xs font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
              >
                Voir {geste.source} →
              </Link>
              {"outilHref" in geste ? (
                <Link
                  href={geste.outilHref}
                  className="inline-flex text-xs font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
                >
                  {geste.outilLabel}
                </Link>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
