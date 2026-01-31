import Image from "next/image";
import Link from "next/link";

export default function AProposPage() {
  return (
    <main>
      {/* HERO */}
      <section
        className="relative min-h-[45vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-fabsystem.png')" }}
      >
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 text-white sm:py-24">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            À propos de FabSystem
          </h1>
          <p className="mt-4 max-w-2xl text-white/90">
            Électricité embarquée fiable, lisible et sécurisée pour bateaux,
            vans et camping-cars.
          </p>
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-[300px_1fr] sm:items-start">
          
          {/* PHOTO */}
          <div className="flex justify-center sm:justify-start">
            <div className="w-full max-w-[260px] sm:max-w-[300px]">
              <Image
                src="/fab-bateau.png"
                alt="Fabien – électricien systèmes embarqués"
                width={300}
                height={380}
                className="w-full h-auto rounded-lg object-cover shadow-md"
                priority
              />
            </div>
          </div>

          {/* TEXTE */}
          <div>
            <h2 className="text-2xl font-semibold">
    Fabien, électricien en systèmes embarqués
  </h2>

  <p className="mt-4 text-neutral-700 leading-relaxed">
    Je suis spécialisé en <strong>électricité embarquée</strong> pour les
    bateaux, vans et camping-cars.
  </p>

  <p className="mt-4 text-neutral-700 leading-relaxed">
    Avec le temps, j’ai vu trop d’installations dangereuses, bricolées,
    mal protégées ou simplement incomprises.  
    Mon approche est simple : <strong>remettre de la logique, de la sécurité
    et de la lisibilité</strong> dans des systèmes électriques souvent complexes.
  </p>

  <p className="mt-4 text-neutral-700 leading-relaxed">
    J’interviens aussi bien pour des diagnostics, des remises à plat
    que pour du conseil à distance. Chaque projet commence par
    l’existant, sans jugement, afin de proposer une solution
    réellement adaptée à l’usage et aux contraintes du terrain.
  </p>

  <p className="mt-4 text-neutral-700 leading-relaxed">
    J’interviens également en <strong>sous-traitance pour des professionnels</strong>,
    notamment sur des installations techniques ou sensibles,
    lorsqu’un regard expert, un diagnostic précis ou un renfort ponctuel
    est nécessaire.
  </p>

  <p className="mt-4 text-neutral-700 leading-relaxed">
    Mon objectif reste toujours le même : <strong>une installation fiable,
    compréhensible et durable</strong>, que ce soit pour un particulier
    ou dans un cadre professionnel.
  </p>
          </div>
        </div>
      </section>

      {/* POURQUOI FABSYSTEM */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8">
          <h3 className="text-lg font-semibold text-neutral-900">
            Pourquoi FabSystem ?
          </h3>

          <ul className="mt-4 space-y-3 text-sm text-neutral-700">
            <li>• Pas de solutions standard : chaque installation est différente</li>
            <li>• Sécurité avant tout (protections, sections, architecture)</li>
            <li>• Explications claires, sans jargon inutile</li>
            <li>• Matériel fiable, éprouvé et adapté à l’usage réel</li>
          </ul>
        </div>
      </section>

      {/* MÉTHODE */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 p-6">
            <h4 className="font-semibold">Analyser</h4>
            <p className="mt-2 text-sm text-neutral-700">
              Comprendre l’existant, repérer les risques et incohérences.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-6">
            <h4 className="font-semibold">Clarifier</h4>
            <p className="mt-2 text-sm text-neutral-700">
              Rendre l’installation lisible, logique et compréhensible.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-6">
            <h4 className="font-semibold">Sécuriser</h4>
            <p className="mt-2 text-sm text-neutral-700">
              Protéger durablement les personnes et le matériel.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Me contacter
          </Link>

          <Link
            href="/visio"
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
          >
            Découvrir la visio conseil
          </Link>
        </div>
      </section>
    </main>
  );
}