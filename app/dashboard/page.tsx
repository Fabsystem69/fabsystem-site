import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold text-neutral-900">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Étape 2 prête: base Prisma branchée pour clients, devis et futures factures.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/customers"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Clients</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Gérer le répertoire client utilisé par les devis et factures.
          </p>
        </Link>

        <Link
          href="/dashboard/quotes"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Devis</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Créer des devis simples avec lignes et totaux stockés en centimes.
          </p>
        </Link>

        <Link
          href="/dashboard/invoices"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Factures</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Consulter les factures et générer leur PDF côté serveur.
          </p>
        </Link>
      </div>
    </main>
  );
}
