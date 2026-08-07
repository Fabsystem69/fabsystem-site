"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard-preview/Sidebar";
import { MobileDrawer, MobileMenuButton, useMobileDrawer } from "@/components/dashboard-preview/MobileDrawer";

export function PreviewShell({ children }: { children: ReactNode }) {
  const drawer = useMobileDrawer();

  return (
    <div className="flex min-h-screen bg-[#0a0a0b] text-neutral-100">
      <Sidebar />
      <MobileDrawer open={drawer.open} onClose={drawer.onClose} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-800/80 bg-[#0a0a0b]/95 px-4 backdrop-blur lg:hidden">
          <MobileMenuButton onOpen={drawer.onOpen} />
          <span className="text-sm font-semibold text-white">FabSystem Admin</span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
