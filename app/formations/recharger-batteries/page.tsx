import ModuleStepper from "@/components/ModuleStepper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Module 5 — Bien recharger ses batteries | FabSystem Formations",
  description:
    "Comprendre les sources de charge à bord, les phases de recharge et les profils adaptés aux batteries AGM, GEL et lithium.",
  alternates: { canonical: "/formations/recharger-batteries" },
};

const steps = [
  {
    title: "Identifier les sources de charge",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          À bord, une batterie ne se recharge pas “toute seule” : elle reçoit de l&apos;énergie par
          une ou plusieurs <strong>sources de charge</strong>. Chaque source a son rôle, ses limites,
          et sa propre logique.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "Alternateur moteur",
              text:
                "Très utile en navigation ou en roulage. Il recharge vite, mais il n'est pas toujours capable de finaliser proprement la charge d'un parc servitude moderne sans gestion adaptée.",
              color: "border-blue-100 bg-blue-50",
            },
            {
              title: "Chargeur 230 V",
              text:
                "La source la plus stable au quai ou au branchement secteur. C'est souvent elle qui assure la recharge complète et la remise en état régulière du parc.",
              color: "border-green-100 bg-green-50",
            },
            {
              title: "Solaire + régulateur",
              text:
                "Excellent pour l'entretien et l'autonomie. Très efficace sur la durée, mais dépend évidemment de l'ensoleillement et du dimensionnement du système.",
              color: "border-amber-100 bg-amber-50",
            },
            {
              title: "DC-DC",
              text:
                "Il encadre la recharge entre une batterie moteur et une batterie servitude, surtout quand les profils de charge ou les tensions ne sont pas compatibles.",
              color: "border-purple-100 bg-purple-50",
            },
          ].map((item) => (
            <div key={item.title} className={`rounded-xl border p-4 ${item.color}`}>
              <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">Question de base à se poser</p>
          <p className="mt-2 text-sm text-neutral-700">
            Quelle source recharge ma batterie servitude au mouillage, au quai, et en navigation ?
            Si la réponse n&apos;est pas claire, il est très difficile d&apos;interpréter un manque
            d&apos;autonomie ou une batterie qui vieillit mal.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Comprendre les phases de charge",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Une recharge correcte n&apos;est pas juste “envoyer des ampères”. Une batterie passe
          normalement par plusieurs <strong>phases</strong> qui ne servent pas toutes au même moment.
        </p>

        <div className="space-y-2">
          {[
            {
              title: "Bulk",
              text:
                "La source envoie le plus de courant possible raisonnablement. C'est la phase où la batterie remonte vite après une décharge.",
            },
            {
              title: "Absorption",
              text:
                "La tension est maintenue de façon contrôlée pendant que le courant baisse progressivement. C'est souvent là que se joue la vraie recharge complète.",
            },
            {
              title: "Float / entretien",
              text:
                "Le système maintient la batterie sans la forcer. Très utile au quai ou en maintien longue durée sur les technologies qui l'acceptent.",
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
            Pourquoi une batterie semble “chargée” trop vite
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Voir une tension remonter ne veut pas dire que la recharge est terminée. Une batterie
            peut paraître “pleine” en surface alors qu&apos;elle n&apos;a pas encore terminé sa phase
            d&apos;absorption.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Adapter la charge à la batterie",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          AGM, GEL et lithium ne se rechargent pas de la même manière. Le bon chargeur n&apos;est pas
          seulement “assez puissant” : il doit aussi proposer un <strong>profil cohérent</strong>.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-900">AGM</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Bonne tolérance à la charge, mais sensible à une surcharge répétée. Un profil AGM
              permet d&apos;obtenir une recharge propre sans la fatiguer inutilement.
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">GEL</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">
              Plus exigeante sur le profil. Un chargeur non adapté peut abîmer une GEL plus vite
              qu&apos;on ne le croit, même si la batterie semble fonctionner au début.
            </p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Lithium LiFePO₄</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">
              Demande un BMS et une logique de charge compatible. La recharge peut être rapide, mais
              elle doit rester encadrée par les protections prévues pour cette techno.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Erreur classique
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Remplacer les batteries sans vérifier la compatibilité du chargeur, du solaire, ou de
            la recharge alternateur. Une techno mieux performante ne pardonne pas un système de
            charge resté bloqué sur l&apos;ancien montage.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Faire cohabiter plusieurs sources",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Une installation moderne cumule souvent alternateur, solaire, chargeur secteur et parfois
          DC-DC. Le but n&apos;est pas de tout faire charger partout, mais de <strong>donner à chaque
          source un rôle clair</strong>.
        </p>

        <div className="space-y-2">
          {[
            "Le solaire entretient très bien un parc au mouillage ou à l'arrêt, à condition que le régulateur soit cohérent.",
            "Le chargeur 230 V reste souvent la référence pour une recharge complète et régulière.",
            "L'alternateur est utile pour remettre vite de l'énergie, mais pas forcément pour gérer seul un parc servitude complexe.",
            "Le DC-DC devient précieux quand il faut encadrer la charge entre deux batteries ou deux logiques différentes.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
              <span className="mt-0.5 text-brand-600">•</span>
              <p className="text-sm text-neutral-800">{item}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">Le bon raisonnement</p>
          <p className="mt-2 text-sm text-neutral-700">
            Demandez-vous qui charge en premier, qui termine la charge, qui entretient le parc, et
            quelles protections empêchent un fonctionnement incohérent. Si plusieurs sources
            existent sans logique d&apos;ensemble, les symptômes deviennent vite trompeurs.
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
          Module 5 terminé. Vous avez maintenant une vue claire de la recharge, pas seulement des
          batteries elles-mêmes.
        </p>

        <div className="space-y-2">
          {[
            "Chaque source de charge a son rôle : alternateur, 230 V, solaire, DC-DC.",
            "Une recharge sérieuse passe par des phases distinctes, pas seulement par une tension qui monte.",
            "Le profil de charge doit correspondre à la technologie de batterie réellement installée.",
            "Plusieurs sources peuvent cohabiter, à condition d'avoir une logique claire et des protections adaptées.",
            "Un problème d'autonomie vient souvent autant de la recharge que de la batterie elle-même.",
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
            Après avoir compris l&apos;architecture et la recharge, le multimètre devient l&apos;outil
            le plus utile pour vérifier ce qui se passe réellement à bord.
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
    { "@type": "ListItem", position: 3, name: "Bien recharger ses batteries", item: "https://www.fabsystem.fr/formations/recharger-batteries" },
  ],
};

export default function Module5Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ModuleStepper
        moduleNum={5}
        moduleTitle="Bien recharger ses batteries"
        tag="Gratuit"
        duration="~25 min"
        level="Débutant"
        steps={steps}
        voltaNote={{
          title: "Le conseil de Volta",
          message:
            "Une batterie qui tient mal n'est pas toujours le vrai problème. Très souvent, c'est la logique de recharge ou la compatibilité entre les sources qu'il faut éclaircir.",
          variant: "warning",
          pose: "neutre",
        }}
        prevModule={{ href: "/formations/distribution-12v", label: "Construire une distribution 12V propre" }}
        nextModule={{ href: "/formations/multimetre", label: "Utiliser un multimètre sans se tromper" }}
      />
    </>
  );
}
