"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/shell/Sidebar";
import { MobileDrawer, MobileMenuButton, useMobileDrawer } from "@/components/dashboard/shell/MobileDrawer";
import { NAV_GROUPS, resolveActiveNavHref } from "@/components/dashboard/shell/nav-data";

const THEME_STORAGE_KEY = "fabsystem-dashboard-theme";

// Retour utilisateur : "mode sombre difficilement visible le jour" (usage
// en extérieur). Etat initial toujours "dark" (identique au rendu serveur,
// aucun flash de contenu hydraté différemment) ; la préférence enregistrée
// n'est appliquée qu'après montage, via localStorage — un seul appareil,
// jamais synchronisé entre coach et client (ce toggle n'existe que dans le
// dashboard admin).
function useDashboardTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Lecture d'une préférence persistée une seule fois après montage — pas
    // une synchronisation continue avec une source externe qui changerait
    // en direct. localStorage n'existe pas côté serveur, donc impossible de
    // lire la préférence dans l'état initial (SSR casserait) ; même
    // contrainte déjà présente sur Sidebar.tsx (COLLAPSE_STORAGE_KEY).
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY) === "light") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme("light");
      }
    } catch {
      // Stockage indisponible (navigation privée...) : reste en sombre par défaut.
    }
  }, []);

  function toggle() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Rien de grave si la préférence n'est pas mémorisée cette fois-ci.
      }
      return next;
    });
  }

  return { theme, toggle };
}

// Retour utilisateur : "dashboard pas intuitif ni clair", aucun repère
// "où suis-je" n'existait sur desktop (seul le header mobile en avait un,
// minimal). Dérivé de resolveActiveNavHref + NAV_GROUPS, déjà partagés avec
// Sidebar/MobileDrawer — jamais de logique de correspondance dupliquée.
function useActiveBreadcrumb() {
  const pathname = usePathname();
  const activeHref = resolveActiveNavHref(pathname);
  if (!activeHref) return null;

  for (const group of NAV_GROUPS) {
    const item = group.items.find((navItem) => navItem.href === activeHref);
    if (item) {
      return { groupTitle: group.title, itemLabel: item.label };
    }
  }

  return null;
}

// Le contenu ({children}) n'a pas de fond force ici : la nouvelle page
// d'accueil (/dashboard) fournit son propre fond sombre plein ecran, tandis
// que les autres pages /dashboard/* (non refondues dans ce lot) continuent
// de s'afficher sur le fond blanc par defaut du site, sans regression.
export function DashboardShell({ children }: { children: ReactNode }) {
  const drawer = useMobileDrawer();
  const breadcrumb = useActiveBreadcrumb();
  const { theme, toggle } = useDashboardTheme();

  return (
    <div className="flex min-h-screen" data-theme={theme}>
      <Sidebar />
      <MobileDrawer open={drawer.open} onClose={drawer.onClose} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-800/80 bg-[#0a0a0b] px-4 lg:hidden">
          <MobileMenuButton onOpen={drawer.onOpen} open={drawer.open} />
          <span className="flex-1 text-sm font-semibold text-white">FabSystem Admin</span>
          <ThemeToggleButton theme={theme} onToggle={toggle} />
        </header>

        {breadcrumb ? (
          <div className="hidden h-11 shrink-0 items-center gap-3 border-b border-neutral-800/60 bg-[#0a0a0b] px-6 text-sm lg:flex">
            {breadcrumb.groupTitle ? (
              <>
                <span className="text-neutral-500">{breadcrumb.groupTitle}</span>
                <span className="mx-2 text-neutral-700">/</span>
              </>
            ) : null}
            <span className="font-medium text-neutral-300">{breadcrumb.itemLabel}</span>
            <ThemeToggleButton theme={theme} onToggle={toggle} className="ml-auto" />
          </div>
        ) : null}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

// Cible tactile >=44px, texte clair plutôt qu'une icône seule
// (PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md).
function ThemeToggleButton({
  theme,
  onToggle,
  className = "",
}: {
  theme: "dark" | "light";
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium text-neutral-200 hover:bg-neutral-800 ${className}`}
    >
      {theme === "dark" ? "Mode clair" : "Mode sombre"}
    </button>
  );
}
