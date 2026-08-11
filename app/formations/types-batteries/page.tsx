import ModuleStepper from "@/components/ModuleStepper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Module 3 — Batteries AGM, GEL, Lithium | FabSystem Formations",
  description:
    "Comprendre les différences entre batteries AGM, GEL et Lithium pour bateau, van et camping-car. Série, parallèle, câblage correct. Module gratuit FabSystem.",
  alternates: { canonical: "/formations/types-batteries" },
};

const steps = [
  {
    title: "Série, parallèle, mixte",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Avant de choisir une technologie de batterie, il faut comprendre comment les assembler.
          Selon la façon dont vous les connectez, vous pouvez augmenter la tension, la capacité, ou
          les deux.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { mode: "En série", effect: "↑ Tension", example: "2 × 12V/100Ah\n→ 24V / 100Ah", detail: "La capacité reste identique à une seule batterie. La tension s'additionne.", color: "border-blue-200 bg-blue-50", badge: "bg-blue-100 text-blue-800" },
            { mode: "En parallèle", effect: "↑ Capacité", example: "2 × 12V/100Ah\n→ 12V / 200Ah", detail: "La tension reste identique. Le courant disponible double.", color: "border-green-200 bg-green-50", badge: "bg-green-100 text-green-800" },
            { mode: "Série / parallèle", effect: "↑ Tension + Capacité", example: "4 × 12V/100Ah\n→ 24V / 200Ah", detail: "Combinaison des deux. Exige un câblage soigné et équilibré.", color: "border-purple-200 bg-purple-50", badge: "bg-purple-100 text-purple-800" },
          ].map((item) => (
            <div key={item.mode} className={`rounded-xl border p-4 ${item.color}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-neutral-900">{item.mode}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.badge}`}>{item.effect}</span>
              </div>
              <p className="mt-2 whitespace-pre-line font-mono text-xs text-neutral-800">{item.example}</p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Limite recommandée en plomb-acide</p>
          <p className="mt-1 text-sm text-neutral-700">
            Ne dépassez pas <strong>3 ou 4 chaînes en parallèle</strong> avec du plomb. Au-delà, les
            déséquilibres de câblage et les légères variations de résistance interne provoquent une
            usure prématurée inégale des batteries.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "AGM — points forts et limites",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          L&apos;AGM (Absorbent Glass Mat) est une batterie plomb-acide scellée et sans entretien. Son
          électrolyte est absorbé dans un séparateur en fibre de verre. C&apos;est la batterie de
          référence pour les installations embarquées d&apos;entrée et milieu de gamme.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">Points forts ✓</p>
            <ul className="mt-2 space-y-1.5">
              {["Bon rapport qualité / prix", "Supporte des courants de charge élevés", "Charge rapide vs GEL", "Excellent comportement aux vibrations", "Installation dans n'importe quelle position"].map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-xs text-neutral-700"><span className="text-green-600">+</span>{p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">Limites ✗</p>
            <ul className="mt-2 space-y-1.5">
              {["Profondeur de décharge max recommandée : 50 %", "Très sensible à la surcharge", "Plus lourde que le lithium à capacité égale", "Durée de vie limitée (400–600 cycles)"].map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-xs text-neutral-700"><span className="text-red-500">−</span>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">Idéal pour</p>
          <p className="mt-1 text-xs text-neutral-600">Navigation côtière, usage week-end, budget serré. Installation simple ne nécessitant pas de BMS.</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Calculer la capacité utile</p>
          <p className="mt-2 text-sm text-neutral-800">
            Une batterie AGM de 100 Ah ne doit être déchargée qu&apos;à 50 % pour préserver sa durée de
            vie. Capacité utile réelle = <strong>50 Ah</strong>. Pour avoir 100 Ah utiles, il faut
            une batterie AGM de 200 Ah.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "GEL — quand le choisir",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Le GEL est une autre variante du plomb-acide scellée, où l&apos;électrolyte est gélifié. Il
          est plus tolérant aux cycles profonds et aux hautes températures que l&apos;AGM, mais exige
          un chargeur spécifiquement configuré pour GEL.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">Points forts ✓</p>
            <ul className="mt-2 space-y-1.5">
              {["Très bonne résistance aux cycles profonds", "Longue durée de vie si bien chargée", "Supporte bien les hautes températures", "Faible autodécharge"].map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-xs text-neutral-700"><span className="text-green-600">+</span>{p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">Limites ✗</p>
            <ul className="mt-2 space-y-1.5">
              {["Chargeur GEL spécifique obligatoire", "Très sensible aux courants de charge trop élevés", "Moins performante par temps froid", "Prix légèrement supérieur à l'AGM"].map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-xs text-neutral-700"><span className="text-red-500">−</span>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Attention au chargeur</p>
          <p className="mt-1 text-sm text-neutral-700">
            Charger une batterie GEL avec un chargeur configuré pour AGM ou plomb ouvert peut
            l&apos;endommager irrémédiablement. La tension d&apos;absorption du GEL est plus basse (2,35 V/cellule
            vs 2,45 V pour l&apos;AGM). Toujours vérifier le profil de charge.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">Idéal pour</p>
          <p className="mt-1 text-xs text-neutral-600">Installations solaires avec cycles réguliers, hivernage en zone chaude, utilisation autonome longue durée.</p>
        </div>
      </div>
    ),
  },
  {
    title: "Lithium LiFePO₄",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Le lithium LiFePO₄ (lithium fer phosphate) est devenu la référence pour les installations
          sérieuses. Plus léger, plus de capacité utile, bien plus de cycles — mais il demande un
          BMS et un câblage adapté.
        </p>

        <div className="rounded-2xl border border-neutral-900 bg-neutral-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Lithium vs AGM — comparatif</p>
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="py-1.5 text-left text-neutral-400">Critère</th>
                <th className="py-1.5 text-right text-neutral-400">AGM</th>
                <th className="py-1.5 text-right text-green-400">Lithium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {[
                { c: "Capacité utile", agm: "50 %", li: "80–100 %" },
                { c: "Cycles de vie", agm: "400–600", li: "2 000–5 000" },
                { c: "Poids (100 Ah)", agm: "~28 kg", li: "~12 kg" },
                { c: "Charge rapide", agm: "0,2C max", li: "1C possible" },
                { c: "Tension stable", agm: "Variable", li: "Quasi-plate" },
                { c: "BMS requis", agm: "Non", li: "Oui, obligatoire" },
              ].map((row) => (
                <tr key={row.c}>
                  <td className="py-1.5 text-neutral-300">{row.c}</td>
                  <td className="py-1.5 text-right text-neutral-400">{row.agm}</td>
                  <td className="py-1.5 text-right font-semibold text-green-400">{row.li}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Avantage clé : énergie utile</p>
            <p className="mt-2 text-xs text-neutral-600">
              Pour avoir 100 Ah utiles : il faut une AGM de 200 Ah (50 % utile) ou une Lithium de
              100 Ah (100 % utile). Le lithium coûte plus cher à l&apos;achat mais est amorti en 3–5 ans
              grâce à sa longévité.
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Ce qu&apos;il faut prévoir</p>
            <ul className="mt-2 space-y-1 text-xs text-neutral-600">
              {["BMS obligatoire", "Chargeur compatible Li (profil spécifique)", "Alternateur : prévoir un coupleur ou DC-DC", "Investissement initial plus élevé"].map((p) => (
                <li key={p} className="flex items-start gap-1.5"><span className="text-amber-600">!</span>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Câblage du banc",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          La manière dont les batteries sont raccordées entre elles est aussi critique que leur
          technologie. Une erreur de câblage sur un banc parallèle entraîne une usure prématurée des
          batteries les plus sollicitées et une panne prématurée.
        </p>

        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Erreur classique — ne JAMAIS faire</p>
          <p className="mt-2 text-sm text-neutral-700">
            Mettre toutes les batteries en parallèle puis raccorder le système d&apos;un seul côté. La
            batterie la plus proche reçoit la majorité du courant, se décharge plus vite, et vieillit
            prématurément. La loi de Ohm s&apos;applique : le courant prend toujours le chemin de moindre
            résistance.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-neutral-900">4 méthodes correctes de câblage parallèle</p>
          {[
            { method: "Via barres omnibus", desc: "Chaque batterie raccordée à une barre + et une barre −. Distribution parfaitement uniforme.", ok: true },
            { method: "Connexion aux bornes opposées", desc: "Le + sur la batterie du haut, le − sur la batterie du bas (ou inversement). Câbles d'interconnexion de même longueur.", ok: true },
            { method: "Connexion à mi-chemin", desc: "+ et − pris au centre du banc. Câbles d'interconnexion de même section.", ok: true },
            { method: "Connexion en diagonale", desc: "+ à un coin, − au coin opposé. Simple mais légères différences de courant peuvent subsister.", ok: false },
          ].map((item) => (
            <div key={item.method} className={`flex items-start gap-3 rounded-xl border p-4 ${item.ok ? "border-green-100 bg-green-50" : "border-amber-100 bg-amber-50"}`}>
              <span className={`mt-0.5 font-bold ${item.ok ? "text-green-600" : "text-amber-600"}`}>{item.ok ? "✓" : "~"}</span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.method}</p>
                <p className="mt-0.5 text-xs text-neutral-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Principe clé</p>
          <p className="mt-1 text-sm text-neutral-700">
            Le chemin total parcouru par le courant (aller + retour) doit être{" "}
            <strong>identique pour chaque batterie</strong>. C&apos;est le seul moyen d&apos;assurer un partage
            égal du courant et une usure homogène du banc.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Choisir et récapitulatif",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Vous avez terminé le module 3 ! Voici un guide de choix rapide selon votre usage, puis les
          points essentiels à retenir.
        </p>

        <div className="space-y-2">
          {[
            { usage: "Navigation côtière, usage week-end, budget serré", choice: "AGM", badge: "bg-neutral-100 text-neutral-700" },
            { usage: "Usage solaire régulier, cycles profonds, zone chaude", choice: "GEL", badge: "bg-amber-100 text-amber-800" },
            { usage: "Van, camping-car — légèreté et autonomie maximale", choice: "Lithium", badge: "bg-green-100 text-green-800" },
            { usage: "Grande installation 24V/48V, puissance importante", choice: "Lithium en série", badge: "bg-blue-100 text-blue-800" },
          ].map((item) => (
            <div key={item.usage} className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-700">{item.usage}</p>
              <span className={`shrink-0 self-start rounded-full px-3 py-1 text-xs font-bold sm:self-auto ${item.badge}`}>{item.choice}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {[
            "En série = tension ↑ · En parallèle = capacité ↑",
            "AGM : 50 % de capacité utile. Lithium : 80–100 %",
            "Ne jamais dépasser 3–4 batteries plomb en parallèle",
            "Le lithium exige un BMS et un chargeur compatible",
            "Le câblage du banc est aussi important que la technologie choisie",
            "Toujours câbler pour que le courant parcourt le même chemin pour chaque batterie",
          ].map((point) => (
            <div key={point} className="flex items-start gap-2.5 rounded-lg border border-green-100 bg-green-50 px-3 py-2.5">
              <span className="mt-0.5 text-green-600">✓</span>
              <p className="text-sm text-neutral-800">{point}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Testez vos connaissances</p>
          <a href="/formations#quiz" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-600">
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
    { "@type": "ListItem", position: 3, name: "Batteries AGM, GEL, Lithium", item: "https://www.fabsystem.fr/formations/types-batteries" },
  ],
};

export default function Module3Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ModuleStepper
        moduleNum={3}
        moduleTitle="Batteries AGM, GEL, Lithium — comprendre les différences"
        tag="Gratuit"
        duration="~25 min"
        level="Débutant"
        steps={steps}
        prevModule={{ href: "/formations/lire-schema", label: "Lire un schéma électrique" }}
      />
    </>
  );
}
