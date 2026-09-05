"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/shell/Sidebar";
import { MobileDrawer, MobileMenuButton, useMobileDrawer } from "@/components/dashboard/shell/MobileDrawer";
import { NAV_GROUPS, resolveActiveNavHref } from "@/components/dashboard/shell/nav-data";

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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileDrawer open={drawer.open} onClose={drawer.onClose} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-800/80 bg-[#0a0a0b] px-4 lg:hidden">
          <MobileMenuButton onOpen={drawer.onOpen} />
          <span className="text-sm font-semibold text-white">FabSystem Admin</span>
        </header>

        {breadcrumb ? (
          <div className="hidden h-11 shrink-0 items-center border-b border-neutral-800/60 bg-[#0a0a0b] px-6 text-sm lg:flex">
            {breadcrumb.groupTitle ? (
              <>
                <span className="text-neutral-500">{breadcrumb.groupTitle}</span>
                <span className="mx-2 text-neutral-700">/</span>
              </>
            ) : null}
            <span className="font-medium text-neutral-300">{breadcrumb.itemLabel}</span>
          </div>
        ) : null}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
