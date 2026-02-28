import TrackedLink from "@/components/TrackedLink";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réalisations en électricité embarquée | FabSystem",
  description:
    "Quelques cas d’intervention en électricité embarquée sur bateau, van et camping-car.",
};

const cases = [
  {
    title: "Bateau — Sécurisation 12V/230V",
    context: "Refonte partielle avant saison",
    problem: "Protections et distribution à fiabiliser",
    actions: [
      "Reprise protections et sections",
      "Nettoyage distribution + repérage",
      "Contrôles de sécurité",
    ],
    result: "Installation plus sûre et lisible, risques réduits.",
    details: [
      { label: "Durée", value: "1 journée" },
      { label: "Périmètre", value: "12V + 230V (protections, distribution)" },
      { label: "Livrable", value: "Priorités + plan d’action" },
    ],
    image: "/realisations/realisation-avant.jpg",
    imageAlt: "Miniature d'une intervention de sécurisation électrique sur bateau",
    beforeImage: "/preuves/bateau-apres.jpg",
    beforeImageAlt: "Installation avant sécurisation",
    afterImage: "/preuves/bateau-avant.jpg",
    afterImageAlt: "Installation après sécurisation",
  },
  {
    title: "Bateau — Charge & autonomie",
    context: "Ajout batterie / charge à bord",
    problem: "Incohérences chargeur/DC-DC/section",
    actions: [
      "Diagnostic charge et chutes de tension",
      "Recommandation matériel + câblage",
      "Validation fonctionnement",
    ],
    result: "Charge stable et utilisation cohérente.",
    details: [
      { label: "Durée", value: "½ journée" },
      {
        label: "Périmètre",
        value: "charge (DC-DC / alternateur / solaire selon montage)",
      },
      { label: "Livrable", value: "Recommandations matériel + câblage" },
    ],
    image: "/realisations/realisation-apres-1.jpg",
    imageAlt: "Miniature d'une installation électrique sur bateau",
  },
  {
    title: "Camping-car — Pannes 12V",
    context: "Pannes intermittentes",
    problem: "Masse/connexions et protections",
    actions: [
      "Recherche défaut + mesures",
      "Reprise connexions critiques",
      "Sécurisation protections",
    ],
    result: "Pannes supprimées, fiabilité retrouvée.",
    details: [
      { label: "Durée", value: "2h" },
      { label: "Périmètre", value: "recherche défaut + sécurisation" },
      { label: "Livrable", value: "Correctifs + prévention" },
    ],
    image: "/preuves/fuse-out.jpg",
    imageAlt: "Miniature d'un fusible sorti lors d'un dépannage 12V sur camping-car",
  },
] as const;

const methodItems = [
  "Priorités sécurité d’abord",
  "Plan d’action clair",
  "Installation lisible et documentée si nécessaire",
] as const;

export default function RealisationsPage() {
  return (
    <main>
      <section
        className="relative bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-fabsystem.png')" }}
      >
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 text-white sm:py-10">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Réalisations
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Trois cas types pour montrer le niveau d’analyse, d’intervention et de résultat.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/90 sm:w-auto"
            >
              Parler de votre projet
            </Link>

            <TrackedLink
              href="/visio"
              event="click_rdv"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-white/70 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Visio conseil
            </TrackedLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="max-w-3xl">
          <h2 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
            Études de cas
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Format court : contexte, problème, intervention et résultat.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((item) => (
            <article
              key={item.title}
              className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <h3 className="text-sm font-semibold text-neutral-950">
                {item.title}
              </h3>

              <div className="mt-3 space-y-2 text-sm text-neutral-700">
                <p>
                  <span className="font-medium text-neutral-900">Contexte :</span>{" "}
                  {item.context}
                </p>
                <p>
                  <span className="font-medium text-neutral-900">Problème :</span>{" "}
                  {item.problem}
                </p>
              </div>

              <div className="mt-3">
                <p className="text-sm font-medium text-neutral-900">Intervention :</p>
                <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                  {item.actions.map((action) => (
                    <li key={action}>• {action}</li>
                  ))}
                </ul>
              </div>

              <p className="mt-3 text-sm text-neutral-700">
                <span className="font-medium text-neutral-900">Résultat :</span>{" "}
                {item.result}
              </p>

              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Détails
                </p>
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  {item.details.map((detail) => (
                    <div key={detail.label} className="flex gap-2">
                      <dt className="text-neutral-600">{detail.label}</dt>
                      <dd className="font-medium text-neutral-900">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {item.beforeImage && item.afterImage ? (
                <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-neutral-600">
                      Avant
                    </p>
                    <Image
                      src={item.beforeImage}
                      alt={item.beforeImageAlt}
                      width={500}
                      height={350}
                      quality={75}
                      sizes="(max-width: 640px) 50vw, 250px"
                      className="h-28 w-full rounded-lg border border-neutral-200 object-cover"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-neutral-600">
                      Après
                    </p>
                    <Image
                      src={item.afterImage}
                      alt={item.afterImageAlt}
                      width={500}
                      height={350}
                      quality={75}
                      sizes="(max-width: 640px) 50vw, 250px"
                      className="h-28 w-full rounded-lg border border-neutral-200 object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-4">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    width={640}
                    height={420}
                    className="h-28 w-full rounded-xl border border-neutral-200 object-cover"
                  />
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-neutral-950">
            Méthode
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
            {methodItems.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
            >
              Parler de votre projet
            </Link>
            <TrackedLink
              href="/visio"
              event="click_rdv"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
            >
              Visio conseil
            </TrackedLink>
          </div>
        </div>
      </section>
    </main>
  );
}
