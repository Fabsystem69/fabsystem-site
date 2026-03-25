import ModuleStepper from "@/components/ModuleStepper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Module 2 — Lire un schéma électrique embarqué | FabSystem Formations",
  description:
    "Apprenez à décoder un schéma de distribution 12V : barres omnibus, fusibles, sectionneurs, points de masse. Module gratuit FabSystem.",
  alternates: { canonical: "/formations/lire-schema" },
};

const steps = [
  {
    title: "Les symboles de base",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Un schéma électrique embarqué représente la circulation de l&apos;énergie depuis les sources
          (batterie, solaire, alternateur…) jusqu&apos;aux consommateurs (frigo, pompe, éclairage…).
          Chaque élément a un symbole standardisé. Voici ceux que vous rencontrerez sur 99 % des
          schémas.
        </p>

        <div className="space-y-2">
          {[
            { symbol: "━━━━", color: "text-red-600", name: "Fil positif (+)", desc: "Toujours en rouge ou marqué +. Transporte l'énergie depuis la source vers les équipements." },
            { symbol: "━━━━", color: "text-neutral-800", name: "Fil négatif (−)", desc: "Toujours en noir ou marqué −. Retour du courant vers la batterie via la masse." },
            { symbol: "⊞", color: "text-blue-600", name: "Barre omnibus (busbar)", desc: "Point de distribution central en cuivre. Relie toutes les sources et charges sur un même potentiel." },
            { symbol: "⊣⊢", color: "text-amber-600", name: "Fusible / disjoncteur", desc: "Protection contre surcharges et courts-circuits. Représenté par un rectangle ou un losange selon la norme." },
            { symbol: "⊸—⊷", color: "text-purple-600", name: "Sectionneur", desc: "Interrupteur de coupure entre batterie et installation. Permet l'isolement total du système." },
            { symbol: "⏚", color: "text-neutral-500", name: "Point de masse", desc: "Connexion vers la masse commune. Tous les retours négatifs convergent ici." },
          ].map((item) => (
            <div key={item.name} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <span className={`shrink-0 w-10 text-center font-mono text-base font-bold ${item.color}`}>{item.symbol}</span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Barres omnibus",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          La barre omnibus (ou busbar) est le nœud central de toute distribution bien organisée.
          C&apos;est une barre de cuivre massif qui regroupe en un seul point toutes les connexions
          positives ou négatives d&apos;un système.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Pourquoi utiliser un busbar ?</p>
            <ul className="mt-2 space-y-1.5">
              {[
                "Évite les connexions multiples sur les bornes de batterie",
                "Centralise la distribution — schéma lisible",
                "Permet un fusible par circuit",
                "Facilite les interventions et le dépannage",
              ].map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-xs text-neutral-700">
                  <span className="mt-0.5 text-green-600">+</span>{p}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Comment le dimensionner ?</p>
            <ul className="mt-2 space-y-1.5">
              {[
                "Section busbar ≥ somme de tous les câbles raccordés",
                "Ex : 3 câbles de 16 mm² → busbar ≥ 48 mm²",
                "Busbar 10×5 mm = 50 mm² ≈ 150 A jusqu'à 5 m",
                "Toujours un fusible principal côté batterie",
              ].map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-xs text-neutral-700">
                  <span className="mt-0.5 text-blue-600">→</span>{p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">⚠️ Sécurité busbar</p>
          <p className="mt-1 text-sm text-neutral-700">
            Les barres omnibus <strong>ne sont pas isolées</strong>. Utilisez uniquement des outils
            isolés à proximité. Ne portez pas de bijoux métalliques. Protégez la barre avec un
            capot plexiglas si elle est exposée à l&apos;air libre.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">Sur un schéma : lire la barre omnibus</p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">
            Chaque trait arrivant sur la barre omnibus est un câble connecté. Le trait le plus épais
            (ou annoté avec la section la plus grande) est le câble venant de la batterie. Les autres
            traits alimentent les équipements. Les annotations donnent la section en mm² et souvent
            l&apos;intensité nominale du fusible correspondant.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Fusibles et protections",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Le fusible est la protection d&apos;un circuit électrique. Il fond si le courant dépasse sa
          valeur nominale, coupant le circuit avant que le câble ne surchauffe. C&apos;est la première
          règle de sécurité en embarqué : <strong>aucun circuit sans protection</strong>.
        </p>

        <div className="rounded-xl border border-neutral-900 bg-neutral-900 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Règle d&apos;or</p>
          <p className="mt-2 text-sm font-semibold">Le fusible protège le câble — pas l&apos;équipement</p>
          <p className="mt-1 text-xs text-neutral-300">
            Son calibre est choisi selon la capacité maximale du câble. Si le câble supporte 50 A, le
            fusible doit être ≤ 50 A. En cas de défaut, le fusible fond avant que le câble ne brûle.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { type: "Fusibles MEGA / ANL", usage: "100–400 A. Entre batterie et onduleur principal.", color: "border-purple-100 bg-purple-50" },
            { type: "Fusibles MIDI", usage: "30–200 A. Circuits secondaires importants.", color: "border-blue-100 bg-blue-50" },
            { type: "Fusibles plats (ATO/ATC)", usage: "5–40 A. Petits circuits : éclairage, USB, pompes.", color: "border-green-100 bg-green-50" },
          ].map((item) => (
            <div key={item.type} className={`rounded-xl border p-3 ${item.color}`}>
              <p className="text-sm font-bold text-neutral-900">{item.type}</p>
              <p className="mt-1 text-xs text-neutral-600">{item.usage}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Erreur fréquente</p>
          <p className="mt-1 text-sm text-neutral-700">
            Installer le fusible <strong>loin de la batterie</strong> laisse une portion de câble non
            protégée entre la batterie et le fusible. Ce tronçon peut brûler sans que le fusible
            saute. Le fusible principal doit être à <strong>moins de 30 cm</strong> des bornes de la
            batterie.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Connexions et cosses",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Sur un schéma, chaque jonction entre un câble et un équipement correspond à une connexion
          physique. La qualité de cette connexion est aussi importante que le dimensionnement du
          câble — une mauvaise connexion crée de la résistance, de la chaleur, et un risque
          d&apos;incendie.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: "Cosses à œillet", desc: "Gros câbles sur boulons M5–M10. Sertir avec outil adapté. Ordre : rondelle + rondelle élastique + écrou.", icon: "⭕" },
            { name: "Cosses colorées sertissables", desc: "Rouge (0,5–1,5 mm²) · Bleu (1,5–2,5 mm²) · Jaune (2,5–6 mm²). Pince à cliquet obligatoire.", icon: "🔌" },
            { name: "Embouts de câble", desc: "Pour câbles multibrins dans bornes à vis. Empêchent les brins de s'écarter et de provoquer un court-circuit.", icon: "🔧" },
            { name: "Connecteurs MC4", desc: "Exclusivement panneaux solaires. Étanches IP67, 20 A max. Ne jamais mélanger des marques différentes.", icon: "☀️" },
          ].map((item) => (
            <div key={item.name} className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">À ne jamais utiliser en permanent</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Pinces de batterie", "Fiches allume-cigare > 10 A", "Épissures bout à bout", "Câbles torsadés à la main"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs text-neutral-700">
                <span className="text-red-500">✗</span> {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Méthode de lecture",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-700">
          Face à un schéma inconnu, suivez cette méthode en 5 étapes pour le décoder rapidement et
          identifier les éventuelles anomalies.
        </p>

        <div className="space-y-2">
          {[
            { step: "Identifiez les sources d'énergie", detail: "Batterie, panneau solaire, alternateur, prise de quai… Ce sont les points de départ du courant. Repérez leur tension nominale." },
            { step: "Suivez le fil positif", detail: "Tracez le chemin du + depuis la batterie vers chaque équipement. Notez chaque fusible et sectionneur rencontré." },
            { step: "Identifiez les barres omnibus", detail: "Ce sont les nœuds. Une barre + alimente plusieurs circuits ; une barre − collecte tous les retours." },
            { step: "Vérifiez les protections", detail: "Chaque circuit doit avoir un fusible, placé côté source. S'il en manque un, c'est une anomalie à corriger." },
            { step: "Vérifiez les masses", detail: "Tous les fils − doivent converger vers un point de masse commun, relié à la batterie par un câble de même section que le positif." },
          ].map((item, idx) => (
            <div key={item.step} className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">{idx + 1}</span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.step}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Conseil</p>
          <p className="mt-1 text-sm text-neutral-700">
            Pas de schéma existant ? Créez-en un avant toute intervention, même au crayon. Partir à
            l&apos;aveugle sur une installation inconnue est la première cause d&apos;accidents en électricité
            embarquée.
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
          Module 2 terminé ! Vous savez maintenant identifier et interpréter tous les éléments d&apos;un
          schéma de distribution embarqué.
        </p>

        <div className="space-y-2">
          {[
            "Les barres omnibus centralisent la distribution — indispensables dès plusieurs équipements",
            "Le fusible protège le câble, pas l'équipement — calibré sur la capacité du câble",
            "Fusible principal : toujours à moins de 30 cm des bornes de la batterie",
            "Toutes les connexions doivent être sertie ou boulonnées — jamais torsadées",
            "En milieu marin : cuivre étamé obligatoire pour les câbles et connecteurs",
            "Sans schéma = pas d'intervention en sécurité",
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

export default function Module2Page() {
  return (
    <ModuleStepper
      moduleNum={2}
      moduleTitle="Lire un schéma électrique embarqué"
      tag="Gratuit"
      duration="~20 min"
      level="Débutant"
      steps={steps}
      prevModule={{ href: "/formations/bases-12v", label: "Les bases du 12V" }}
      nextModule={{ href: "/formations/types-batteries", label: "Types de batteries" }}
    />
  );
}
