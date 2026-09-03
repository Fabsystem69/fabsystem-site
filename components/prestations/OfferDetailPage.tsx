import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { OfferPurchaseCta } from "@/components/prestations/OfferPurchaseCta";
import Image from "next/image";

type OfferDetailPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  price: string;
  priceNote?: string;
  promise: string;
  forWhom: string[];
  deliverable: string;
  included: string[];
  boundaries: string[];
  steps: { title: string; text: string }[];
  ctaLabel: string;
  ctaHref: string;
  purchaseProductId?: string;
  summary: string[];
  imageSrc: string;
  imageAlt: string;
  serviceType: string;
  faq: Array<{ question: string; answer: string }>;
};

export function OfferDetailPage({
  eyebrow,
  title,
  description,
  price,
  priceNote,
  promise,
  forWhom,
  deliverable,
  included,
  boundaries,
  steps,
  ctaLabel,
  ctaHref,
  purchaseProductId,
  summary,
  imageSrc,
  imageAlt,
  serviceType,
  faq,
}: OfferDetailPageProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    serviceType,
    description,
    provider: { "@type": "Organization", name: "FabSystem", url: "https://www.fabsystem.fr" },
    areaServed: "FR",
    offers: price !== "Gratuit" ? { "@type": "Offer", price: price.replace(/[^0-9]/g, ""), priceCurrency: "EUR", availability: "https://schema.org/InStock" } : undefined,
  };
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };

  return (
    <main className="bg-[#fbfaf7] text-neutral-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">{eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-300">{description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {purchaseProductId ? <OfferPurchaseCta productId={purchaseProductId} label={ctaLabel} /> : <Button href={ctaHref} variant="primary">{ctaLabel}</Button>}
              {purchaseProductId ? <Button href="/prestations/appel-decouverte" variant="secondary">Je ne sais pas quel forfait choisir</Button> : null}
              <Button href="/prestations/accompagnement" variant="secondary">Voir tous les forfaits</Button>
            </div>
          </div>
          <aside className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.03] p-6 shadow-2xl shadow-black/30 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Tarif</p>
            <p className="mt-2 text-4xl font-bold text-brand-400">{price}</p>
            {priceNote ? <p className="mt-2 text-sm leading-relaxed text-neutral-400">{priceNote}</p> : null}
            <ul className="mt-6 space-y-2 border-t border-white/10 pt-5 text-sm leading-relaxed text-neutral-300">
              {summary.map((item) => <li key={item} className="flex gap-2"><span className="font-bold text-brand-400">✓</span>{item}</li>)}
            </ul>
          </aside>
        </div>
      </section>

      <Section tone="light" className="pb-0 pt-8 sm:pt-10">
        <figure className="overflow-hidden rounded-3xl border border-neutral-200 bg-[#ece8df] shadow-[0_24px_70px_-40px_rgba(10,10,10,0.45)]">
          <Image src={imageSrc} alt={imageAlt} width={1680} height={945} className="h-auto w-full object-cover" priority />
          <figcaption className="border-t border-neutral-200 bg-white px-5 py-3 text-xs leading-relaxed text-neutral-500 sm:px-6">Illustration FabSystem : un accompagnement construit autour de votre vrai projet, de vos choix et de vos contraintes.</figcaption>
        </figure>
      </Section>

      <Section tone="light" className="py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-amber-200 bg-[#fff9e8] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">Pour qui ?</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Ce forfait est fait pour vous si…</h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-neutral-800">
              {forWhom.map((item) => <li key={item} className="flex gap-3"><span className="font-bold text-amber-700">✓</span>{item}</li>)}
            </ul>
          </article>
          <article className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">À la fin</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Vous repartez avec</h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-700">{deliverable}</p>
            <div className="mt-6 border-t border-neutral-100 pt-5">
              <p className="text-sm font-bold text-neutral-950">Le résultat attendu</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{promise}</p>
            </div>
          </article>
        </div>
      </Section>

      <Section tone="light" className="pt-0 pb-10 sm:pb-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Comment cela se passe</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Un parcours simple, sans vous laisser seul.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-brand-400">{index + 1}</span>
              <h3 className="mt-4 font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="light" className="pt-0 pb-16 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Ce qui est inclus</p>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-neutral-800">
              {included.map((item) => <li key={item} className="flex gap-3"><span className="font-bold text-emerald-700">✓</span>{item}</li>)}
            </ul>
          </article>
          <article className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Le cadre du forfait</p>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-neutral-700">
              {boundaries.map((item) => <li key={item} className="flex gap-3"><span className="font-bold text-neutral-400">—</span>{item}</li>)}
            </ul>
          </article>
        </div>
        <div className="mt-6 rounded-3xl bg-neutral-950 px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-400">Prêt à avancer ?</p>
            <p className="mt-2 text-lg font-bold">Choisissez un cadre clair avant de vous lancer.</p>
          </div>
          <div className="mt-5 flex shrink-0 flex-wrap items-start gap-3 sm:mt-0">
            {purchaseProductId ? <OfferPurchaseCta productId={purchaseProductId} label={ctaLabel} /> : <Button href={ctaHref} variant="primary">{ctaLabel}</Button>}
            {purchaseProductId ? <Button href="/prestations/appel-decouverte" variant="secondary">Je ne sais pas quel forfait choisir</Button> : null}
            <Button href="/prestations/accompagnement" variant="secondary">Voir tous les forfaits</Button>
          </div>
        </div>
      </Section>

      <Section tone="light" className="pt-0 pb-16 sm:pb-20">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Questions fréquentes</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Ce qu&apos;il faut savoir avant de choisir.</h2>
          <div className="mt-7 space-y-3">
            {faq.map((item) => (
              <details key={item.question} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4">
                <summary className="cursor-pointer pr-8 text-base font-bold text-neutral-950">{item.question}</summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}
