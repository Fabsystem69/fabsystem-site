import Link from "next/link";

const offers = [
  { title: "Appel découverte", price: "Gratuit · 15 min", text: "Présentez votre projet et choisissez le bon parcours, sans expertise technique détaillée.", href: "/prestations/appel-decouverte", cta: "Comprendre le parcours", tone: "border-emerald-400/50 bg-emerald-400/10" },
  { title: "Appel conseil", price: "69 € · environ 1 h", text: "Un avis d'expérience pour répondre à des questions concrètes et définir les prochaines actions.", href: "/prestations/appel-conseil", cta: "Voir l'appel conseil", tone: "border-white/15 bg-white/[0.04]" },
  { title: "Accompagnement guidé", price: "199 € · lancement", text: "Vous préparez le projet ; nous vérifions vos choix, corrigeons le schéma et sécurisons le chantier.", href: "/prestations/accompagnement-guide", cta: "Voir l'accompagnement", tone: "border-brand-400 bg-brand-400/10 ring-1 ring-brand-400/40" },
  { title: "Conception complète", price: "499 € · lancement", text: "Nous construisons le cahier des charges, le schéma et la liste d'achat à partir de vos besoins.", href: "/prestations/conception-electrique", cta: "Voir la conception", tone: "border-white/15 bg-white/[0.04]" },
];

export function AccompagnementOfferPaths() {
  return <section aria-label="Forfaits d'accompagnement" className="mt-5">
    <div className="grid gap-4 lg:grid-cols-4">
      {offers.map((offer) => <article key={offer.title} className={`flex min-h-full flex-col rounded-2xl border p-5 ${offer.tone}`}>
        <h2 className="text-xl font-bold text-white">{offer.title}</h2>
        <p className="mt-3 text-lg font-bold text-brand-300">{offer.price}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-300">{offer.text}</p>
        <Link href={offer.href} className="mt-5 text-sm font-bold text-white underline decoration-brand-400 decoration-2 underline-offset-4 hover:text-brand-300">{offer.cta} →</Link>
      </article>)}
    </div>
    <p className="mt-5 text-center text-xs leading-relaxed text-neutral-500">Même prix pour van, camping-car et bateau. Les installations hors standard sont étudiées avant toute commande.</p>
  </section>;
}
