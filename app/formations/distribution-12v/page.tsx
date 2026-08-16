import ModuleStepper from "@/components/ModuleStepper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Module 4 — Construire une distribution 12V propre | FabSystem Formations",
  description:
    "Apprenez à organiser une distribution 12V propre et sûre : fusible principal, coupe-batterie, shunt, busbars et départs par circuit.",
  alternates: { canonical: "/formations/distribution-12v" },
};

const steps = [
  {
    title: "Voir l'architecture d'ensemble",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Une distribution 12 V propre repose sur une idée simple : <strong>chaque élément a une
          place logique</strong>. Quand l&apos;ordre est clair, le schéma devient lisible, les pannes
          sont plus faciles à isoler, et l&apos;installation évolue sans repartir de zéro.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Chaîne positive
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-900">
              Batterie + → fusible principal → coupe-batterie → barre + → protections par circuit
            </p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">
              Toute l&apos;énergie part d&apos;ici. Le but est de protéger d&apos;abord le câble principal,
              puis de distribuer proprement vers chaque départ.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Chaîne négative
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-900">
              Retours circuits → barre − → shunt → batterie −
            </p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">
              Tous les retours doivent converger vers un point clair. Le shunt se place sur ce
              chemin pour mesurer ce qui entre et sort réellement de la batterie.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">Pourquoi éviter les montages improvisés ?</p>
          <ul className="mt-2 space-y-1.5">
            {[
              "Plusieurs cosses empilées sur la borne batterie compliquent les contrôles et chauffent plus facilement.",
              "Un départ non protégé ou mal placé devient un vrai point de risque en cas de court-circuit.",
              "Sans logique de distribution, chaque ajout futur devient plus long, plus sale et plus dangereux.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="mt-0.5 text-brand-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Mettre les composants dans le bon ordre",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Sur le + batterie, l&apos;ordre compte vraiment. Les premiers composants doivent limiter le
          risque avant même de distribuer l&apos;énergie au reste de l&apos;installation.
        </p>

        <div className="space-y-2">
          {[
            {
              title: "1. Fusible principal",
              text:
                "Il protège le câble principal dès sa sortie de batterie. Il doit rester très proche de la batterie pour éviter un tronçon positif non protégé.",
            },
            {
              title: "2. Coupe-batterie / sectionneur",
              text:
                "Il sert à isoler l'installation pour intervenir, hiverner, ou sécuriser un arrêt prolongé. Il ne remplace jamais le fusible principal.",
            },
            {
              title: "3. Barre omnibus positive",
              text:
                "Elle centralise les départs. Chaque circuit important part ensuite avec sa propre protection adaptée à son câble.",
            },
            {
              title: "4. Barre négative et shunt",
              text:
                "La barre négative regroupe les retours. Le shunt se place entre la barre négative et la batterie pour que toute la consommation passe par lui.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Point de vigilance
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Si un appareil doit rester alimenté même coupe-batterie ouvert, il lui faut un départ
            explicitement prévu, identifié et protégé. Pas un branchement “en direct” ajouté au
            hasard.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Distribuer par circuits",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Une installation devient saine quand on cesse de raisonner “appareil par appareil” et
          qu&apos;on regroupe les usages par <strong>circuits logiques</strong> : éclairage, prises, pompe,
          électronique, charge, onduleur, etc.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Bonne logique de distribution</p>
            <ul className="mt-2 space-y-1.5">
              {[
                "Un départ = un câble identifié = une protection dédiée",
                "Des circuits courts et lisibles plutôt qu'un gros paquet de dérivations",
                "Des libellés clairs sur le tableau ou le porte-fusibles",
                "Des sections choisies selon courant + longueur + chute de tension admissible",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-neutral-700">
                  <span className="text-green-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Ce qui complique tout</p>
            <ul className="mt-2 space-y-1.5">
              {[
                "Ajouter des départs directement sur la batterie",
                "Mélanger petits consommateurs et gros appels sur la même ligne",
                "Réutiliser une protection existante “parce qu'il reste une place”",
                "Ne plus savoir quel fusible correspond à quel usage",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-neutral-700">
                  <span className="text-red-500">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Exemple de famille de circuits
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              "Éclairage LED",
              "Prises USB / 12 V",
              "Pompe et automatismes",
              "Électronique de bord",
              "Onduleur / chargeur",
              "Frigo ou gros consommateurs dédiés",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white bg-white px-3 py-2 text-sm text-neutral-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Erreurs fréquentes",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Une distribution brouillonne ne se voit pas toujours au premier regard, mais elle finit
          presque toujours par coûter du temps, de la fiabilité, ou de la sécurité.
        </p>

        <div className="space-y-2">
          {[
            "Empiler plusieurs gros départs sur la borne batterie au lieu d'utiliser des busbars.",
            "Mettre le shunt au mauvais endroit, ce qui fausse complètement le suivi de batterie.",
            "Oublier qu'un gros consommateur demande souvent son propre départ et sa propre protection.",
            "Créer une installation impossible à relire six mois plus tard faute de repérage.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
              <span className="mt-0.5 text-red-500">!</span>
              <p className="text-sm text-neutral-800">{item}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Méthode simple avant d&apos;ajouter un appareil
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Demandez-vous toujours : d&apos;où part le +, où revient le −, quel câble convient, où
            placer le fusible, et comment retrouver ce départ dans six mois. Si vous ne savez pas
            répondre clairement, le circuit n&apos;est pas encore prêt.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "À retenir",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Module 4 terminé. Vous avez maintenant la logique de base d&apos;une distribution 12 V
          propre, lisible et évolutive.
        </p>

        <div className="space-y-2">
          {[
            "Le positif doit être protégé très tôt, avant toute vraie distribution.",
            "Le coupe-batterie isole l'installation, mais ne remplace jamais un fusible principal.",
            "Les busbars rendent le schéma plus propre et limitent le bazar sur les bornes batterie.",
            "Le shunt se place sur le retour batterie pour voir toute la consommation réelle.",
            "Un départ bien conçu = une protection claire, un câble cohérent et un repérage simple.",
          ].map((point) => (
            <div key={point} className="flex items-start gap-2.5 rounded-lg border border-green-100 bg-green-50 px-3 py-2.5">
              <span className="mt-0.5 text-green-600">✓</span>
              <p className="text-sm text-neutral-800">{point}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Suite logique</p>
          <p className="mt-2 text-sm text-neutral-700">
            Une fois la distribution comprise, la prochaine étape consiste à comprendre comment les
            batteries se rechargent réellement selon les sources disponibles à bord.
          </p>
        </div>
      </div>
    ),
  },
];

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.fabsystem.fr" },
    { "@type": "ListItem", position: 2, name: "Formations", item: "https://www.fabsystem.fr/formations" },
    { "@type": "ListItem", position: 3, name: "Construire une distribution 12V propre", item: "https://www.fabsystem.fr/formations/distribution-12v" },
  ],
};

export default function Module4Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ModuleStepper
        moduleNum={4}
        moduleTitle="Construire une distribution 12V propre et sûre"
        tag="Gratuit"
        duration="~25 min"
        level="Débutant"
        steps={steps}
        voltaNote={{
          title: "Le conseil de Volta",
          message:
            "Si vous ne savez pas où raccorder un nouvel appareil, revenez à l'ordre des composants. Une distribution propre doit rester lisible aujourd'hui comme dans six mois.",
          variant: "tip",
          pose: "action",
        }}
        prevModule={{ href: "/formations/types-batteries", label: "Batteries AGM, GEL, Lithium" }}
        nextModule={{ href: "/formations/recharger-batteries", label: "Bien recharger ses batteries" }}
      />
    </>
  );
}
