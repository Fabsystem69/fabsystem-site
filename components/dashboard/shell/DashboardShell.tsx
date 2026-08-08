"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/shell/Sidebar";
import { MobileDrawer, MobileMenuButton, useMobileDrawer } from "@/components/dashboard/shell/MobileDrawer";

// Le contenu ({children}) n'a pas de fond force ici : la nouvelle page
// d'accueil (/dashboard) fournit son propre fond sombre plein ecran, tandis
// que les autres pages /dashboard/* (non refondues dans ce lot) continuent
// de s'afficher sur le fond blanc par defaut du site, sans regression.
export function DashboardShell({ children }: { children: ReactNode }) {
  const drawer = useMobileDrawer();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileDrawer open={drawer.open} onClose={drawer.onClose} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-800/80 bg-[#0a0a0b] px-4 lg:hidden">
          <MobileMenuButton onOpen={drawer.onOpen} />
          <span className="text-sm font-semibold text-white">FabSystem Admin</span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
