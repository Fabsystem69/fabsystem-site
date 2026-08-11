import ModuleStepper from "@/components/ModuleStepper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Module 1 — Les bases du 12V embarqué | FabSystem Formations",
  description:
    "Comprendre la loi d'Ohm, la puissance et la résistance des câbles en électricité embarquée. Module gratuit FabSystem pour bateau, van et camping-car.",
  alternates: { canonical: "/formations/bases-12v" },
};

const steps = [
  {
    title: "Tension, courant, résistance",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          L&apos;électricité, c&apos;est le mouvement d&apos;électrons dans un conducteur. Ce mouvement crée un{" "}
          <strong>courant électrique</strong>. Pour le faire circuler, il faut une force motrice — la{" "}
          <strong>tension</strong>. Et sur son chemin, il rencontre une <strong>résistance</strong>.
          Ces trois grandeurs sont indissociables.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              symbol: "V",
              name: "Tension",
              unit: "Volts (V)",
              color: "border-blue-200 bg-blue-50",
              badge: "bg-blue-100 text-blue-800",
              desc: 'La "pression" qui pousse les électrons. En embarqué : 12 V, 24 V ou 48 V selon le système.',
            },
            {
              symbol: "I",
              name: "Courant",
              unit: "Ampères (A)",
              color: "border-green-200 bg-green-50",
              badge: "bg-green-100 text-green-800",
              desc: "La quantité d'électrons qui circule. Plus il est élevé, plus le câble doit être épais.",
            },
            {
              symbol: "R",
              name: "Résistance",
              unit: "Ohms (Ω)",
              color: "border-orange-200 bg-orange-50",
              badge: "bg-orange-100 text-orange-800",
              desc: "Ce qui freine la circulation. Générée par les câbles, connexions, fusibles, contacts…",
            },
          ].map((item) => (
            <div key={item.symbol} className={`rounded-xl border p-4 ${item.color}`}>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-neutral-900">{item.symbol}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.badge}`}>
                  {item.unit}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-neutral-700">{item.name}</p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Le principe à retenir
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Quand la résistance est faible → beaucoup d&apos;électrons circulent → le courant est fort.
            Quand la résistance est élevée → peu d&apos;électrons circulent → le courant est faible. À
            résistance très élevée → plus aucun courant ne passe : c&apos;est un circuit ouvert.
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Dans la pratique embarquée
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Un système 12 V sous 200 A de courant (ex : gros onduleur) génère une tension d&apos;entrée
            de 12 × 200 = 2 400 W. La même puissance en 24 V ne demande que 100 A — câbles deux
            fois moins épais. D&apos;où l&apos;intérêt de monter en tension sur les grosses installations.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "La loi d'Ohm",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          La loi d&apos;Ohm est <strong>la formule fondamentale</strong> de tout circuit électrique. Elle
          relie les trois grandeurs de base et permet de calculer n&apos;importe laquelle si vous
          connaissez les deux autres.
        </p>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-900 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Loi d&apos;Ohm
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-white">V = R × I</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { eq: "I = V / R", label: "Trouver le courant" },
              { eq: "R = V / I", label: "Trouver la résistance" },
              { eq: "V = R × I", label: "Trouver la tension" },
            ].map((f) => (
              <div key={f.eq} className="rounded-lg bg-white/5 p-2">
                <p className="font-mono text-sm font-bold text-white">{f.eq}</p>
                <p className="mt-1 text-xs text-neutral-400">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Exemple 1 — Frigo à bord
          </p>
          <p className="mt-2 text-sm text-neutral-800">
            Votre frigo consomme <strong>5 A</strong> sous <strong>12 V</strong>. Quelle est sa
            résistance équivalente ?
          </p>
          <p className="mt-2 rounded-md bg-white p-2 font-mono text-sm text-neutral-900">
            R = V / I = 12 / 5 = <strong>2,4 Ω</strong>
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Exemple 2 — Résistance de câble
          </p>
          <p className="mt-2 text-sm text-neutral-800">
            Un câble de 1,5 m en cuivre 16 mm² a une résistance de <strong>1,6 mΩ</strong> (soit
            0,0016 Ω). Si 100 A y circulent, quelle tension est perdue sur ce câble ?
          </p>
          <p className="mt-2 rounded-md bg-white p-2 font-mono text-sm text-neutral-900">
            V = R × I = 0,0016 × 100 = <strong>0,16 V</strong>
          </p>
          <p className="mt-2 text-xs text-neutral-600">
            Faible ici, mais si le câble est plus long ou la résistance plus élevée (mauvaise
            connexion, câble trop fin), cette perte devient significative.
          </p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Règle pratique — Chute de tension max
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            En embarqué, on vise une chute de tension inférieure à <strong>2,5 %</strong> sur
            l&apos;ensemble du circuit. Sur un système 12 V cela représente 0,3 V max. Au-delà, les
            équipements sous-performent et les batteries se rechargent mal.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "La puissance",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          La puissance exprime la quantité d&apos;énergie consommée ou produite par seconde. Elle
          s&apos;exprime en <strong>Watts (W)</strong>. C&apos;est la grandeur indiquée sur la quasi-totalité
          des équipements — et c&apos;est souvent la plus facile à trouver.
        </p>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-900 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Formule de puissance
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-white">P = V × I</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
            {[
              { eq: "I = P / V", label: "Courant depuis puissance" },
              { eq: "V = P / I", label: "Tension depuis puissance" },
              { eq: "P = V × I", label: "Puissance en watts" },
            ].map((f) => (
              <div key={f.eq} className="rounded-lg bg-white/5 p-2">
                <p className="font-mono text-sm font-bold text-white">{f.eq}</p>
                <p className="mt-1 text-xs text-neutral-400">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Exemple clé — Dimensionner les câbles d&apos;un onduleur
          </p>
          <p className="mt-2 text-sm text-neutral-800">
            Votre onduleur est de <strong>1 200 W</strong> sous <strong>12 V</strong>. Quel courant
            circule dans les câbles de batterie ?
          </p>
          <p className="mt-2 rounded-md bg-white p-2 font-mono text-sm text-neutral-900">
            I = P / V = 1 200 / 12 = <strong>100 A</strong>
          </p>
          <p className="mt-2 text-xs text-neutral-600">
            Ce courant impose un câble très épais (≥ 35 mm²). En 24 V, le même onduleur ne
            tirerait que 50 A — câbles deux fois moins épais, installation bien plus simple.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-900">Courant par tension</p>
            <table className="mt-2 w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="py-1 text-left text-neutral-500">Puissance</th>
                  <th className="py-1 text-right text-neutral-500">12 V</th>
                  <th className="py-1 text-right text-neutral-500">24 V</th>
                  <th className="py-1 text-right text-neutral-500">48 V</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {[
                  { p: "300 W", a12: "25 A", a24: "12,5 A", a48: "6,3 A" },
                  { p: "1 200 W", a12: "100 A", a24: "50 A", a48: "25 A" },
                  { p: "3 000 W", a12: "250 A", a24: "125 A", a48: "62,5 A" },
                ].map((row) => (
                  <tr key={row.p}>
                    <td className="py-1.5 font-medium text-neutral-900">{row.p}</td>
                    <td className="py-1.5 text-right text-neutral-600">{row.a12}</td>
                    <td className="py-1.5 text-right text-neutral-600">{row.a24}</td>
                    <td className="py-1.5 text-right text-neutral-600">{row.a48}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">La puissance est indépendante de la tension</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Un onduleur de 2 400 W consomme toujours 2 400 W, que la batterie soit à 12, 24 ou
              48 V. Seul le courant change. C&apos;est pour ça que la puissance en watts est la grandeur
              la plus utile pour comparer des appareils sur des tensions différentes.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Résistance des câbles",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Un câble n&apos;est pas un conducteur parfait. Il a une résistance qui dépend de trois facteurs :
          le matériau, la longueur et la section. Cette résistance provoque deux effets indésirables :{" "}
          <strong>une chute de tension</strong> et <strong>un échauffement du câble</strong>.
        </p>

        <div className="space-y-2">
          {[
            {
              rule: "Plus le câble est long → résistance ↑",
              example: "Câble 5 m = ~3× plus de résistance qu'un câble 1,5 m (même section)",
              color: "border-blue-100 bg-blue-50",
            },
            {
              rule: "Plus le câble est fin → résistance ↑",
              example: "Câble 2,5 mm² = ~6× plus de résistance qu'un câble 16 mm² (même longueur)",
              color: "border-orange-100 bg-orange-50",
            },
            {
              rule: "Le cuivre est le meilleur conducteur pratique",
              example: "58× meilleure conductivité que le fer. L'aluminium est 36× — suffisant mais moins pratique.",
              color: "border-yellow-100 bg-yellow-50",
            },
          ].map((item) => (
            <div key={item.rule} className={`rounded-xl border p-4 ${item.color}`}>
              <p className="text-sm font-semibold text-neutral-900">{item.rule}</p>
              <p className="mt-0.5 text-xs text-neutral-600">{item.example}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Règle empirique — Section minimale
          </p>
          <p className="mt-3 text-center text-2xl font-bold text-white">
            Section (mm²) = Courant (A) ÷ 3
          </p>
          <p className="mt-2 text-center text-xs text-neutral-400">
            Valable pour des câbles jusqu&apos;à 5 m (longueur totale aller + retour)
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { a: "30 A", s: "10 mm²" },
              { a: "60 A", s: "25 mm²" },
              { a: "100 A", s: "35 mm²" },
              { a: "150 A", s: "50 mm²" },
              { a: "200 A", s: "70 mm²" },
              { a: "300 A", s: "120 mm²" },
            ].map((r) => (
              <div key={r.a} className="rounded-md bg-white/10 p-2">
                <p className="font-bold text-white">{r.a}</p>
                <p className="text-neutral-300">→ {r.s}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Danger — Câble sous-dimensionné
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Un câble trop fin chauffe selon la formule <strong>P = I² × R</strong>. Avec 100 A dans
            un câble de 6 mm² (prévu pour 18 A max), la puissance dissipée est 30× supérieure à la
            limite — risque d&apos;incendie certain. Ne jamais sous-dimensionner les câbles en embarqué.
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
          Félicitations — vous avez terminé le module 1 ! Voici les points essentiels à maîtriser
          avant de passer à la suite.
        </p>

        <div className="space-y-2">
          {[
            { point: "V = R × I (loi d'Ohm) — la base de tout calcul électrique", key: "ohm" },
            { point: "P = V × I — convertir watts en ampères pour dimensionner vos câbles", key: "p" },
            { point: "Plus le câble est long ou fin, plus sa résistance est élevée", key: "res" },
            { point: "Section (mm²) ≈ Courant (A) ÷ 3 pour des câbles jusqu'à 5 m", key: "dim" },
            { point: "Monter la tension (24 V ou 48 V) réduit le courant et les sections de câble", key: "tens" },
            { point: "Une mauvaise connexion crée de la résistance, de la chaleur et un risque d'incendie", key: "cnx" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-start gap-2.5 rounded-lg border border-green-100 bg-green-50 px-3 py-2.5"
            >
              <span className="mt-0.5 text-green-600">✓</span>
              <p className="text-sm text-neutral-800">{item.point}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Testez vos connaissances
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Retournez sur la page formations pour passer le quiz et vérifier que vous avez bien
            assimilé les bases du 12V.
          </p>
          <a
            href="/formations#quiz"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
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
    { "@type": "ListItem", position: 3, name: "Les bases du 12V embarqué", item: "https://www.fabsystem.fr/formations/bases-12v" },
  ],
};

export default function Module1Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ModuleStepper
        moduleNum={1}
        moduleTitle="Les bases du 12V embarqué"
        tag="Gratuit"
        duration="~30 min"
        level="Débutant"
        steps={steps}
        nextModule={{ href: "/formations/lire-schema", label: "Lire un schéma électrique" }}
      />
    </>
  );
}
