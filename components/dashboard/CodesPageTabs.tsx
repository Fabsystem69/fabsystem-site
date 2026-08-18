import Link from "next/link";

// Deux systèmes de données distincts sous le capot (DiscountCode = réduction
// sur une commande, TrialAccessCode = accès gratuit temporaire à l'éditeur
// de schéma — rien en commun côté base) mais confondus par l'utilisateur
// admin ("codes promo"), qui ne trouvait pas le second parce qu'il vivait
// sur une page complètement séparée sans lien entre elles. Onglets partagés
// plutôt qu'une fusion des deux pages : chaque page garde sa propre
// récupération de données et ses propres actions, seule la présentation
// donne l'impression d'une page unique.
const TABS = [
  { label: "Réduction", href: "/dashboard/discounts" },
  { label: "Éditeur de schéma", href: "/dashboard/schema-unlock-codes" },
] as const;

export function CodesPageTabs({ active }: { active: "discounts" | "schema-unlock-codes" }) {
  return (
    <div className="flex gap-1.5 border-b border-neutral-800 pb-0">
      {TABS.map((tab) => {
        const isActive = tab.href === `/dashboard/${active}`;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "border-emerald-500 text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
