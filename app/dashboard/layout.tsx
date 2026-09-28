import type { Metadata } from "next";
import { requireSession } from "@/lib/require-session";
import { DashboardShell } from "@/components/dashboard/shell/DashboardShell";
import "./dashboard-theme.css";

export const dynamic = "force-dynamic";

// Retour utilisateur : "je veux y accéder toujours de mon iPhone... créer
// un accès mobile ou application... garder le dashboard du site". Manifeste
// séparé de public/manifest.webmanifest (scope "/outils/schema", éditeur de
// schéma uniquement — voir components/pwa/PwaRegistration.tsx : le dashboard
// proposait à tort "Ouvrir dans l'appli" quand la portée était trop large,
// corrigé exprès par le passé). Ici : juste une icône d'écran d'accueil qui
// ouvre directement le CRM coaching, sans barre d'adresse — aucun service
// worker, aucun changement au scope existant.
export const metadata: Metadata = {
  manifest: "/manifest-dashboard.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FabSystem Pro",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession({ redirectTo: "/login?next=/dashboard" });

  return <DashboardShell>{children}</DashboardShell>;
}
