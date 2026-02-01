import PageHero from "@/components/PageHero";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prestations électricité embarquée bateau, van, camping-car | FabSystem",
  description:
    "Diagnostic, sécurisation, distribution, autonomie (batteries/solaire/230V) et accompagnement. Prestations en électricité embarquée pour bateau, van et camping-car.",
};

const services = [
  {
    title: "Diagnostic & sécurisation",
    desc: "Identifier les risques, comprendre l’existant, prioriser les actions.",
    img: "/preuves/fuse-out180.jpeg",
    points: [
      "Contrôle protections, sections, points d’échauffement",
      "Recherche de pannes / coupures / charges anormales",
      "Repérage des risques (fusibles, masses, 230V, charge)",
    ],
    result: "Tu sais exactement ce qui est OK, ce qui est risqué, et quoi faire en priorité.",
  },
  {
    title: "Distribution & protections",
    desc: "Remettre au propre, rendre lisible, protéger correctement chaque ligne.",
    img: "/preuves/cable.png",
    points: [
      "Tableaux, porte-fusibles, coupe-circuits, busbars",
      "Câblage propre, repérage, organisation lisible",
      "Protection adaptée à chaque départ (DC/AC)",
    ],
    result: "Une installation claire, durable, et facile à diagnostiquer.",
  },
  {
    title: "Énergie & autonomie",
    desc: "Batteries, charge, solaire, 230V : une architecture cohérente selon l’usage.",
    img: "/preuves/victronbaylinermini.png",
    points: [
      "Batterie(s) moteur / service, lithium, relais, DC-DC",
      "Solaire (MPPT), alternateur, charge 230V, monitoring",
      "Optimisation selon ton usage réel (frigo, guindeau, etc.)",
    ],
    result: "Tu gagnes en autonomie sans bricolage, avec des choix cohérents.",
  },
  {
    title: "Conseil & visio",
    desc: "Pour décider avant d’acheter / monter : schéma, plan d’action, liste matériel.",
    img: "/preuves/mac.png",
    points: [
      "Analyse de schéma / photos / liste d’équipements",
      "Architecture recommandée + plan d’action",
      "Liste matériel + sections de câbles (si nécessaire)",
    ],
    result: "Tu prends les bonnes décisions avant de dépenser ou de câbler.",
  },
];

export default function PrestationsPage() {
  return (
    <main>
      <PageHero
        title="Prestations"
        subtitle="Sécurisation, diagnostic et installation électrique embarquée — bateau, van, camping-car."
        micro="Objectif : une installation fiable, lisible et protégée. On part de l’existant, on remet au propre, et on sécurise."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "/contact", label: "Demander un diagnostic", variant: "primary" },
          { href: "/visio", label: "Visio conseil", variant: "secondary" },
        ]}
      />

      {/* INTRO */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Ce que je fais, concrètement
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">
            Je t’aide à sécuriser et fiabiliser ton électricité embarquée, sans jargon inutile.
            L’idée n’est pas de “tout refaire pour refaire”, mais de construire une installation cohérente,
            adaptée à ton usage, et facile à maintenir.
          </p>
        </div>

        {/* CARDS avec photos */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {services.map((s) => (
            <div
              key={s.title}
              className="relative overflow-hidden rounded-xl border border-neutral-200"
            >
              {/* image fond */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${s.img}')` }}
              />
              {/* overlay lisibilité */}
              <div className="absolute inset-0 bg-black/55" />

              {/* contenu */}
              <div className="relative p-6 text-white">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/85 leading-relaxed">
                  {s.desc}
                </p>

                <ul className="mt-4 space-y-2 text-sm text-white/90">
                  {s.points.map((p) => (
                    <li key={p} className="leading-relaxed">
                      • {p}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-lg bg-white/10 p-4 backdrop-blur">
                  <div className="text-xs font-semibold text-white">Résultat</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/90">
                    {s.result}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 p-6">
              <div className="text-sm font-semibold text-neutral-900">1) On fait le point</div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Photos, schéma, symptômes, usages… On clarifie la situation rapidement.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 p-6">
              <div className="text-sm font-semibold text-neutral-900">2) Priorités & plan d’action</div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                On traite d’abord ce qui est risqué, puis on améliore l’organisation et la fiabilité.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 p-6">
              <div className="text-sm font-semibold text-neutral-900">3) Installation propre</div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Protections adaptées, câbles dimensionnés, repérage, finition propre et durable.
              </p>
            </div>
          </div>

          {/* CTA FINAL (sans “1h”) */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
            >
              Parler de ton projet
            </Link>

            <Link
              href="/visio"
              className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
            >
              Visio conseil
            </Link>
          </div>

          <p className="mt-4 text-xs text-neutral-500">
            Intervention sur rendez-vous • Bateau / van / camping-car • Objectif : sécuriser et rendre l’installation lisible.
          </p>
        </div>
      </section>
    </main>
  );
}