import Link from "next/link";
import { CustomerCreateForm } from "@/components/dashboard/CustomerCreateForm";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

export default async function DashboardCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  let customers: Awaited<ReturnType<typeof prisma.customer.findMany>> = [];
  let databaseError: string | null = null;

  try {
    customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Clients</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Liste minimale des clients pour devis et factures.
          </p>
        </div>
        <Link
          href="/dashboard/customers?new=1"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Nouveau client
        </Link>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : null}

      {params.new === "1" && !databaseError ? <CustomerCreateForm /> : null}

      <section className="rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-neutral-500">
                  Aucun client pour l’instant.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {customer.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {customer.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {customer.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Intl.DateTimeFormat("fr-FR").format(customer.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
