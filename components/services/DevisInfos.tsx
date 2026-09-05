const FAQ = [
  {
    q: "Comment obtenir un devis pour mon installation électrique ?",
    a: "Décrivez votre projet via le formulaire de contact ou l'une des cartes ci-dessus (bateau, van ou camping-car). Fabien qualifie votre demande — usage, matériel déjà présent, contraintes du chantier — puis vous propose un devis chiffré, sans engagement.",
  },
  {
    q: "Quel est le prix d'un devis électrique pour un van, un bateau ou un camping-car ?",
    a: "Il n'existe pas de tarif fixe : un diagnostic simple, un refit complet ou l'ajout d'un équipement n'ont rien à voir en termes de temps et de matériel. Le devis est établi après qualification de votre besoin, pour rester au plus près de votre projet réel.",
  },
  {
    q: "Le devis est-il gratuit ?",
    a: "Oui. L'échange de qualification et le devis qui en résulte ne vous engagent à rien.",
  },
  {
    q: "Sous combien de temps ai-je une réponse ?",
    a: "Sous 24 à 48h ouvrées pour le premier échange. Le délai d'intervention lui-même dépend de la disponibilité et de la complexité du projet, confirmé une fois le devis validé.",
  },
  {
    q: "Intervenez-vous partout en France ?",
    a: "Les interventions sur site se concentrent sur le Rhône et les secteurs environnants. Pour un projet plus éloigné, contactez Fabien : certaines interventions peuvent être étudiées au cas par cas, et l'accompagnement à distance reste possible partout.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export function DevisInfos() {
  return (
    <div className="bg-neutral-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
          Comment se passe une demande de devis ?
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-neutral-200 bg-white p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white">
              1
            </span>
            <h3 className="mt-3 font-bold text-neutral-950">Vous décrivez votre besoin</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Diagnostic, refit complet, ajout d&apos;un équipement ou dépannage : quelques phrases
              sur votre bateau, van ou camping-car et son électricité actuelle suffisent pour démarrer.
            </p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white">
              2
            </span>
            <h3 className="mt-3 font-bold text-neutral-950">Fabien qualifie le projet</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Usage réel, matériel déjà en place, contraintes d&apos;accès ou de chantier : ces
              éléments déterminent le temps nécessaire et le matériel à prévoir.
            </p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white">
              3
            </span>
            <h3 className="mt-3 font-bold text-neutral-950">Vous recevez un devis chiffré</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Sans engagement. Vous validez si le devis vous convient ; sinon, vous ne devez rien.
            </p>
          </article>
        </div>

        <h2 className="mt-10 text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
          Ce qui influence le prix d&apos;une installation électrique embarquée
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-700 sm:text-base">
          Un devis électrique pour un van, un bateau ou un camping-car dépend surtout de la
          complexité réelle du chantier, pas d&apos;un tarif au mètre carré : l&apos;état de
          l&apos;installation existante (à refaire ou à compléter), le nombre et la puissance des
          équipements à alimenter, l&apos;accès au chantier (démontage nécessaire ou non), et le
          niveau de finition attendu. C&apos;est pour cette raison qu&apos;un prix fixe annoncé sans
          voir le projet serait rarement honnête — d&apos;où la qualification avant chiffrage.
        </p>

        <h2 className="mt-10 text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
          Questions fréquentes
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-xl border border-neutral-200 bg-white p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-neutral-950">
                {item.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
