import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import FaqEbook from "@/components/FaqEbook";

export const metadata: Metadata = {
  title: "Ebook « Câbler son van sans se planter » — FabSystem",
  description:
    "Le manuel complet pour installer l'électricité et la plomberie de votre van comme un pro, écrit par un électricien spécialisé marine et van. 49,99 €, accès immédiat.",
  alternates: { canonical: "/ebook/cabler-son-van" },
};

const benefits = [
  "Dimensionner sa batterie et son solaire sans se tromper",
  "Poser son installation dans l'ordre qui évite de tout redémonter",
  "Comprendre la VASP et l'assurance sans y passer trois soirs",
  "La plomberie embarquée, de la cuve à l'eau chaude",
  "Mettre en service et repérer une panne avant qu'elle ne tourne mal",
  "Vivre avec son installation : entretien, hivernage, questions fréquentes",
];

const sommaire = [
  {
    n: "01",
    title: "Les bases du 12V embarqué",
    detail: "Comprendre avant de câbler : tension, intensité, sections, ce qui compte vraiment.",
  },
  {
    n: "02",
    title: "Dimensionner batterie et solaire",
    detail: "Calculer son besoin réel plutôt que de recopier le forum d'un autre projet.",
  },
  {
    n: "03",
    title: "Choisir son architecture et son matériel",
    detail: "Schéma de principe, composants, ce qui est indispensable et ce qui ne l'est pas.",
  },
  {
    n: "04",
    title: "Poser son installation dans l'ordre",
    detail: "La séquence qui évite de tout redémonter à la moitié du chantier.",
  },
  {
    n: "05",
    title: "VASP et assurance",
    detail: "Ce qu'il faut savoir, sans y passer trois soirs à éplucher des forums.",
  },
  {
    n: "06",
    title: "La plomberie embarquée",
    detail: "De la cuve à l'eau chaude : pompe, cuve, chauffe-eau, raccordements.",
  },
  {
    n: "07",
    title: "Mise en service et diagnostic",
    detail: "Vérifier son installation et repérer une panne avant qu'elle ne tourne mal.",
  },
  {
    n: "08",
    title: "Vivre avec son installation",
    detail: "Entretien, hivernage, et les questions qui reviennent le plus souvent.",
  },
];

const formats = [
  {
    icon: "🖥️",
    title: "Version bureau",
    detail: "Format confortable pour l'écran, schémas en grand format, pour une lecture posée avant de commencer.",
  },
  {
    icon: "📖",
    title: "Version poche",
    detail: "Format compact, facile à garder sous la main sur le chantier — téléphone ou version imprimée.",
  },
  {
    icon: "✍️",
    title: "Personnalisé & interactif",
    detail: "Ton nom en couverture, quiz à la fin de chaque partie pour vérifier que t'as bien tout compris.",
  },
];

const buyButtonClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-neutral-900 shadow-sm transition-colors duration-150 hover:bg-yellow-300 sm:w-auto";

export default function EbookPage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-neutral-950">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
              FabSystem · Ebook
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Câbler son van sans se planter
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Le manuel complet pour installer l&apos;électricité et la plomberie de ton van
              comme un pro — écrit par un électricien qui pose ça tous les jours, pas par un
              blogueur qui a lu deux forums.
            </p>
            <p className="mt-3 text-sm text-white/60">
              Format interactif · version bureau et poche · exemplaire personnalisé à ton nom
            </p>

            <div className="mt-7">
              <Link href="/boutique" className={buyButtonClassName}>
                Acheter l&apos;ebook — 49,99 €
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[280px] sm:max-w-xs lg:max-w-sm">
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
              <Image
                src="/ebook/couverture.jpg"
                alt="Couverture du livre « Câbler son van sans se planter »"
                width={870}
                height={1160}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* BÉNÉFICES */}
      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Ce que tu vas apprendre
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Tout ce qu&apos;il faut savoir pour ne pas se planter
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {benefits.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-neutral-200 p-4">
                <span className="mt-0.5 text-green-600">✓</span>
                <p className="text-sm leading-relaxed text-neutral-800">{item}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-neutral-500">
            Envie de dimensionner ton installation avant même d&apos;acheter le livre ?{" "}
            <Link href="/outils" className="underline underline-offset-2 hover:text-neutral-700">
              Nos calculateurs gratuits
            </Link>{" "}
            (section de câble, autonomie, MPPT…) sont disponibles sans inscription.
          </p>
        </div>
      </section>

      {/* SOMMAIRE */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Aperçu du sommaire
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            8 parties, dans l&apos;ordre où tu en as besoin sur le terrain
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {sommaire.map((part) => (
              <div
                key={part.n}
                className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <span className="text-lg font-bold text-yellow-500">{part.n}</span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{part.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">{part.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMATS */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Formats inclus
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Un seul achat, tout est fourni
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {formats.map((f) => (
              <div key={f.title} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <span className="text-2xl">{f.icon}</span>
                <p className="mt-3 text-sm font-bold text-neutral-950">{f.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIX + RÉASSURANCE */}
      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-2xl border-2 border-yellow-400 bg-neutral-50 p-6 text-center sm:p-8">
            <p className="text-3xl font-bold text-neutral-950 sm:text-4xl">
              49,99 €<span className="ml-2 text-base font-semibold text-neutral-500">accès immédiat</span>
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-700 sm:text-base">
              Et si tu passes ensuite par un accompagnement FabSystem (
              <Link href="/prestations#accompagnement-distance" className="font-semibold underline underline-offset-2">
                l&apos;accompagnement à distance
              </Link>{" "}
              ou{" "}
              <Link href="/visio" className="font-semibold underline underline-offset-2">
                visio conseil
              </Link>
              ), les 49,99 € sont déduits de la prestation. Ce livre n&apos;est jamais un coût
              perdu — au pire, c&apos;est ta meilleure préparation avant qu&apos;on travaille
              ensemble.
            </p>
            <div className="mt-6">
              <Link href="/boutique" className={buyButtonClassName}>
                Acheter l&apos;ebook — 49,99 €
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Questions fréquentes
          </p>
          <h2 className="mt-2 text-xl font-bold text-neutral-950 sm:text-2xl">
            Vous avez une question ?
          </h2>
          <div className="mt-6">
            <FaqEbook />
          </div>
        </div>
      </section>
    </main>
  );
}
