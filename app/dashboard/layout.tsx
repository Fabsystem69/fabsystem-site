import { requireSession } from "@/lib/require-session";
import { DashboardShell } from "@/components/dashboard/shell/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession({ redirectTo: "/login?next=/dashboard" });

  return <DashboardShell>{children}</DashboardShell>;
}
