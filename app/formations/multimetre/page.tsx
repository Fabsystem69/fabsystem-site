import ModuleStepper from "@/components/ModuleStepper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Module 6 — Utiliser un multimètre sans se tromper | FabSystem Formations",
  description:
    "Apprenez à utiliser un multimètre à bord : tension, continuité, résistance et méthode simple pour diagnostiquer une panne.",
  alternates: { canonical: "/formations/multimetre" },
};

const steps = [
  {
    title: "Avant de mesurer",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Un multimètre est simple, mais il faut respecter quelques règles de base. L&apos;erreur la
          plus fréquente n&apos;est pas “mal lire la valeur” : c&apos;est <strong>sélectionner le mauvais
          mode</strong> ou brancher les pointes au mauvais endroit.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Modes utiles au débutant</p>
            <ul className="mt-2 space-y-1.5">
              {[
                "Tension continue (V⎓) pour le 12 V / 24 V",
                "Continuité pour vérifier si un circuit est coupé",
                "Résistance pour contrôler un élément hors tension",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-neutral-700">
                  <span className="text-green-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Ce qu&apos;il faut éviter</p>
            <ul className="mt-2 space-y-1.5">
              {[
                "Mesurer un courant fort directement sans savoir ce que l'on fait",
                "Passer en mode continuité ou résistance sur un circuit encore alimenté",
                "Laisser la pointe rouge branchée sur l'entrée ampères par habitude",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-neutral-700">
                  <span className="text-red-500">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">Règle simple</p>
          <p className="mt-2 text-sm text-neutral-700">
            Si vous mesurez une installation embarquée classique, commencez presque toujours par
            <strong> la tension continue</strong>. C&apos;est le mode le plus sûr et le plus utile pour
            comprendre ce qui se passe.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Mesurer une tension",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Mesurer une tension consiste à comparer deux points : la pointe noire sur une référence
          négative, la pointe rouge sur le point à contrôler. Cette mesure se fait <strong>en
          parallèle</strong>, sans ouvrir le circuit.
        </p>

        <div className="space-y-2">
          {[
            {
              title: "Batterie au repos",
              text:
                "Mesurez directement entre la borne + et la borne −. Vous obtenez un premier indice sur l'état du parc, mais ce n'est pas un diagnostic complet à lui seul.",
            },
            {
              title: "Arrivée d'un équipement",
              text:
                "Mesurez entre le + d'alimentation de l'équipement et son −. Si la tension est absente ou trop basse, le problème est souvent en amont.",
            },
            {
              title: "Avant / après un composant",
              text:
                "Comparer la tension avant et après un fusible, un coupe-batterie ou une connexion permet de repérer rapidement un point de perte ou un défaut ouvert.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Bonne habitude
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Commencez par mesurer à la batterie, puis avancez pas à pas dans le circuit. Cela évite
            de se perdre et permet de savoir à quel moment la tension devient incohérente.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Continuité et résistance",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          La continuité sert à vérifier si deux points sont bien reliés électriquement. La
          résistance sert à voir si un chemin oppose une valeur importante. Ces mesures se font
          <strong> hors tension</strong>.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-900">Tester un fusible</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Débranchez ou isolez le circuit si nécessaire, puis contrôlez la continuité du
              fusible. S&apos;il n&apos;y a pas de continuité, il est coupé ou le contact est mauvais.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-900">Tester un câble ou un retour</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Une absence de continuité sur un câble supposé intact oriente vers une coupure, une
              cosse rompue, ou un mauvais point de connexion.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Point important
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Le bip de continuité ne “certifie” pas qu&apos;une connexion est bonne sous charge. Un
            contact peut biper correctement et pourtant chauffer ou chuter fortement quand du
            courant passe réellement.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Diagnostiquer une panne simple",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Pour éviter de tourner en rond, gardez une méthode simple : partez de la source, avancez
          étape par étape, et vérifiez à chaque point si la tension attendue est toujours là.
        </p>

        <div className="space-y-2">
          {[
            { step: "1. Vérifier la batterie", detail: "Si la tension est déjà incohérente à la source, inutile d'aller plus loin dans un premier temps." },
            { step: "2. Vérifier le fusible principal", detail: "Présence de tension avant et après. Si elle disparaît ici, le problème est localisé." },
            { step: "3. Vérifier le coupe-batterie et la distribution", detail: "Même logique : comparez l'entrée et la sortie." },
            { step: "4. Vérifier le départ du circuit concerné", detail: "Regardez si la tension arrive bien sur le circuit de l'équipement en panne." },
            { step: "5. Vérifier l'équipement et son retour négatif", detail: "Un + présent sans retour correct donne souvent l'impression d'une panne “mystérieuse”." },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                {item.step[0]}
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.step}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Piège fréquent
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Changer un appareil “par intuition” avant d&apos;avoir confirmé l&apos;alimentation et le
            retour négatif. Très souvent, la panne vient du chemin électrique, pas de l&apos;appareil
            lui-même.
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
          Module 6 terminé. Vous avez maintenant la méthode la plus utile pour contrôler une
          installation sans partir à l&apos;aveugle.
        </p>

        <div className="space-y-2">
          {[
            "En embarqué, le mode tension continue est le point de départ le plus utile.",
            "La tension se mesure en parallèle ; la continuité et la résistance se testent hors tension.",
            "Un fusible ou une connexion peuvent sembler corrects visuellement et pourtant poser problème.",
            "On cherche une panne en avançant pas à pas depuis la batterie, pas en sautant d'un point à l'autre.",
            "Pour les gros courants, mieux vaut un outil dédié qu'une mesure improvisée en ampérage direct.",
          ].map((point) => (
            <div key={point} className="flex items-start gap-2.5 rounded-lg border border-green-100 bg-green-50 px-3 py-2.5">
              <span className="mt-0.5 text-green-600">✓</span>
              <p className="text-sm text-neutral-800">{point}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Pour continuer
          </p>
          <a
            href="/formations#quiz"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
          >
            Faire le quiz →
          </a>
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
    { "@type": "ListItem", position: 3, name: "Utiliser un multimètre sans se tromper", item: "https://www.fabsystem.fr/formations/multimetre" },
  ],
};

export default function Module6Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ModuleStepper
        moduleNum={6}
        moduleTitle="Utiliser un multimètre sans se tromper"
        tag="Gratuit"
        duration="~20 min"
        level="Débutant"
        steps={steps}
        voltaNote={{
          title: "Le conseil de Volta",
          message:
            "Le multimètre sert surtout à confirmer calmement ce qui se passe. On suit le courant pas à pas, et on ne remplace rien tant que l'alimentation et le retour ne sont pas prouvés.",
          variant: "next",
          pose: "confiante",
        }}
        prevModule={{ href: "/formations/recharger-batteries", label: "Bien recharger ses batteries" }}
      />
    </>
  );
}
