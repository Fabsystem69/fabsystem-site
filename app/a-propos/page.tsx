import Image from "next/image";

export default function AProposPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto mt-16 max-w-3xl px-6 pb-24">
        <div className="space-y-12">
          <header className="space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-neutral-500">
              À propos
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">
              FabSystem, spécialiste en électricité embarquée
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-neutral-700">
              FabSystem accompagne les propriétaires et les professionnels qui
              recherchent une installation électrique embarquée plus lisible,
              plus sûre et plus durable, sur bateau, van ou camping-car.
            </p>
          </header>

          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <Image
              src="/fab-bateau.png"
              alt="Fabien Lages"
              width={1200}
              height={720}
              className="h-auto w-full object-cover"
              priority
            />
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-950">
              Expertise
            </h2>
            <p className="leading-relaxed text-neutral-700">
              Fabien Lages intervient sur des systèmes électriques embarqués qui
              exigent à la fois compréhension globale, précision technique et
              capacité d&apos;adaptation au réel. L&apos;activité s&apos;articule
              autour de l&apos;audit électrique, de l&apos;installation, de
              l&apos;optimisation et de la formation technique.
            </p>
            <p className="leading-relaxed text-neutral-700">
              Chaque intervention vise à clarifier l&apos;architecture, fiabiliser
              les protections, améliorer l&apos;usage et redonner une vision
              cohérente de l&apos;ensemble. L&apos;objectif n&apos;est pas
              uniquement de corriger un point faible, mais de rendre le système
              compréhensible et maîtrisable dans la durée.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-950">
              Approche
            </h2>
            <p className="leading-relaxed text-neutral-700">
              La méthode repose sur la rigueur, la sécurité et la conformité.
              Elle commence toujours par l&apos;analyse de l&apos;existant :
              comprendre les choix déjà en place, identifier les incohérences,
              mesurer les risques et définir un cadre d&apos;intervention
              pertinent.
            </p>
            <p className="leading-relaxed text-neutral-700">
              Cette approche privilégie une vision long terme. Une installation
              bien pensée doit rester lisible, documentée, évolutive et adaptée
              à l&apos;usage réel. La technique n&apos;est jamais traitée comme
              un assemblage de solutions ponctuelles, mais comme un système qui
              doit conserver sa cohérence dans le temps.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-950">
              Positionnement
            </h2>
            <p className="leading-relaxed text-neutral-700">
              FabSystem s&apos;adresse à celles et ceux qui attendent un regard
              structuré, une expertise technique solide et une exécution
              sérieuse. L&apos;intervention peut concerner une remise à niveau,
              une sécurisation, une refonte partielle ou un accompagnement plus
              global sur des installations sensibles.
            </p>
            <p className="leading-relaxed text-neutral-700">
              Le positionnement est volontairement clair : apporter des réponses
              fiables, défendables techniquement et adaptées aux contraintes du
              terrain, sans approximation ni sur-promesse.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-950">
              Conclusion
            </h2>
            <p className="leading-relaxed text-neutral-700">
              FabSystem s&apos;engage à construire des installations embarquées
              sûres, cohérentes et durables, avec une exigence professionnelle
              constante.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
