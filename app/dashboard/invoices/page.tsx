import Link from "next/link";
import type { Customer, Invoice, InvoiceItem } from "@/lib/generated/prisma/client";
import { formatEuroFromCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

export default async function DashboardInvoicesPage() {
  let invoices: Array<
    Invoice & {
      customer: Customer;
      items: InvoiceItem[];
    }
  > = [];
  let databaseError: string | null = null;

  try {
    invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        items: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900">Factures</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Liste minimale des factures enregistrées en base.
        </p>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : null}

      <section className="rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Numéro</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Lignes</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-neutral-500">
                  Aucune facture pour l’instant.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="underline underline-offset-2">
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{invoice.customer.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{invoice.status}</td>
                  <td className="px-4 py-3 text-neutral-600">{invoice.items.length}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatEuroFromCents(invoice.total)}
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
