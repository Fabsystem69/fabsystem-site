import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";
import { DashboardNav } from "@/components/customer/dashboard/DashboardNav";
import { LogoutButton } from "@/components/customer/LogoutButton";

// Espace client V2 (UI-8) — coquille commune à toutes les pages
// /mon-compte/**. Garde d'authentification centralisée ici (au lieu de
// chaque page) : direction validée MASTER-12 §8 ("SaaS clair, premium,
// pédagogique, rassurant"), thème clair — pas de thème sombre pour le
// compte client.
export const dynamic = "force-dynamic";

export default async function MonCompteLayout({ children }: { children: ReactNode }) {
  const session = await getCustomerSessionFromCookie();

  if (!session) {
    redirect("/connexion-client");
  }

  return (
    <main className="bg-white text-neutral-900">
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link
            href="/"
            className="text-xs font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
          >
            ← Retour au site
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Espace client FabSystem
          </p>
          <p className="mt-1 text-sm text-neutral-600">{session.customer.email}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <DashboardNav />
            <div className="mt-6 hidden lg:block">
              <LogoutButton />
            </div>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
