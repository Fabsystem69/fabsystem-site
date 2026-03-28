import LightboxImage from "@/components/LightboxImage";
import PageHero from "@/components/PageHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import TrackedLink from "@/components/TrackedLink";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réalisations en électricité embarquée",
  description:
    "Quelques cas d’intervention en électricité embarquée sur bateau, van et camping-car.",
  alternates: {
    canonical: "/realisations",
  },
};

type CaseDetail = {
  label: string;
  value: string;
};

type CaseStudy = {
  title: string;
  context: string;
  problem: string;
  actions: string[];
  result: string;
  details: CaseDetail[];
  image: string;
  imageAlt: string;
  beforeImage?: string;
  beforeImageAlt?: string;
  afterImage?: string;
  afterImageAlt?: string;
};

const cases: CaseStudy[] = [
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
    beforeImage: "/preuves/bateau-avant.jpg",
    beforeImageAlt: "Installation avant sécurisation",
    afterImage: "/preuves/bateau-apres.jpg",
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

export default function RealisationsPage() {
  return (
    <main>
      <PageHero
        title="Réalisations"
        subtitle="Trois cas types pour montrer le niveau d’analyse, d’intervention et de résultat."
        micro="Études de cas réelles, avant / après, avec une lecture claire du contexte, des actions et du résultat."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "/contact", label: "Parler de votre projet", variant: "primary" },
          {
            href: "/visio",
            label: "Visio conseil",
            variant: "secondary",
            event: "click_rdv",
          },
        ]}
        assurance={<ServiceAssurance tone="inverse" />}
      />

      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Études de cas
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Format court : contexte, problème, intervention et résultat.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((item) => (
            <article
              key={item.title}
              className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <h3 className="text-base font-bold text-neutral-950">
                {item.title}
              </h3>

              <div className="mt-3 space-y-1.5 text-sm text-neutral-600">
                <p>
                  <span className="font-semibold text-neutral-900">Contexte :</span>{" "}
                  {item.context}
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">Problème :</span>{" "}
                  {item.problem}
                </p>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-700">Intervention :</p>
                <ul className="mt-1.5 space-y-1 text-sm text-neutral-600">
                  {item.actions.map((action) => (
                    <li key={action}>• {action}</li>
                  ))}
                </ul>
              </div>

              <p className="mt-3 text-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">Résultat :</span>{" "}
                {item.result}
              </p>

              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Détails
                </p>
                <dl className="mt-2 space-y-1.5">
                  {item.details.map((detail) => (
                    <div key={detail.label} className="flex items-baseline gap-2">
                      <dt className="shrink-0 text-xs text-neutral-500">{detail.label}</dt>
                      <dd className="text-xs font-semibold text-neutral-900">{detail.value}</dd>
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
                    <LightboxImage
                      src={item.beforeImage}
                      alt={item.beforeImageAlt ?? "Installation avant sécurisation"}
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
                    <LightboxImage
                      src={item.afterImage}
                      alt={item.afterImageAlt ?? "Installation après sécurisation"}
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
                  <LightboxImage
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
            Exemples / études de cas
          </h3>
          <p className="mt-2 text-sm text-neutral-700">
            Quelques cas réels pour comprendre l’approche et le niveau de détail.
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/probleme-charge-batterie-bateau"
                className="inline-flex text-sm font-semibold text-neutral-900 underline underline-offset-4"
              >
                Charge batterie bateau
              </Link>
            </li>
            <li>
              <Link
                href="/installation-12v-bateau"
                className="inline-flex text-sm font-semibold text-neutral-900 underline underline-offset-4"
              >
                Installation 12V bateau
              </Link>
            </li>
          </ul>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
            >
              Parler de votre projet
            </Link>
            <TrackedLink
              href="/visio"
              event="click_rdv"
              className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
            >
              Visio conseil
            </TrackedLink>
          </div>
        </div>
      </section>
    </main>
  );
}
