import Link from "next/link";
import { requireSession } from "@/lib/require-session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession({ redirectTo: "/login?next=/dashboard" });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/dashboard"
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/customers"
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          >
            Clients
          </Link>
          <Link
            href="/dashboard/quotes"
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          >
            Devis
          </Link>
        </nav>

        <form action="/api/auth/logout" method="post">
          <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
            Se déconnecter
          </button>
        </form>
      </div>

      {children}
    </div>
  );
}
