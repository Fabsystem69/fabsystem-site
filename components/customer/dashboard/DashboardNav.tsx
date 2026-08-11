"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Espace client V2 — navigation du dashboard (MASTER-04 §15 : 5 entrées
// cibles). "Mon accompagnement" est volontairement absente : aucun backend
// réel n'existe pour l'accompagnement (période/niveau/livrables) — voir
// docs/audits/UI-8-SAAS-CLIENT.md, "Accompagnement". "Mes outils" pointe
// vers les calculateurs publics réels (/outils), qui restent utilisables
// avec ou sans compte.
const NAV_ITEMS = [
  { href: "/mon-compte", label: "Accueil" },
  { href: "/mon-compte/projets", label: "Mes projets" },
  { href: "/mon-compte/achats", label: "Mes achats" },
  { href: "/outils", label: "Mes outils" },
  { href: "/mon-compte/profil", label: "Mon profil" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation de l'espace client" className="flex flex-wrap gap-1.5 sm:flex-col sm:gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/mon-compte"
            ? pathname === "/mon-compte"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
              isActive
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
