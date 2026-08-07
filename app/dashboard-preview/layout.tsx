import type { Metadata } from "next";
import { requireSession } from "@/lib/require-session";
import { PreviewShell } from "@/components/dashboard-preview/PreviewShell";

// Route de preview isolee (theme sombre) pour valider visuellement une
// nouvelle direction du dashboard admin, SANS toucher a app/dashboard/**.
// Protegee par le meme mecanisme d'authentification admin que le dashboard
// en production (requireSession) — aucun nouveau systeme d'acces.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aperçu — Dashboard Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession({ redirectTo: "/login?next=/dashboard-preview" });

  return <PreviewShell>{children}</PreviewShell>;
}
