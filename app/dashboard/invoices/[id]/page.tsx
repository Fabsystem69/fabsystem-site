import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

async function findInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        orderBy: { position: "asc" },
      },
    },
  });
}

export default async function DashboardInvoiceDetailPage({ params }: Params) {
  const { id } = await params;
  let invoice: Awaited<ReturnType<typeof findInvoice>> = null;

  try {
    invoice = await findInvoice(id);
  } catch (error) {
    return (
      <main className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {getDatabaseErrorMessage(error)}
      </main>
    );
  }

  if (!invoice) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">{invoice.number}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Facture {invoice.status} pour {invoice.customer.name}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard/invoices"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
          >
            Retour aux factures
          </Link>
          <Link
            href={`/api/internal/invoices/${invoice.id}/pdf`}
            target="_blank"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Télécharger PDF
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Client</h2>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p>{invoice.customer.name}</p>
            {invoice.customer.address ? <p className="whitespace-pre-line">{invoice.customer.address}</p> : null}
            {invoice.customer.email ? <p>{invoice.customer.email}</p> : null}
            {invoice.customer.phone ? <p>{invoice.customer.phone}</p> : null}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Informations</h2>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p>Date d&apos;émission: {formatDate(invoice.issueDate)}</p>
            <p>Échéance: {formatDate(invoice.dueDate)}</p>
            <p>Statut: {invoice.status}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Qté</th>
              <th className="px-4 py-3 font-medium text-right">PU HT</th>
              <th className="px-4 py-3 font-medium text-right">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-neutral-700">{item.description}</td>
                <td className="px-4 py-3 text-right text-neutral-700">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-neutral-700">
                  {formatEuroFromCents(item.unitPrice)}
                </td>
                <td className="px-4 py-3 text-right text-neutral-700">
                  {formatEuroFromCents(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ml-auto max-w-sm rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
        <p>Sous-total HT: {formatEuroFromCents(invoice.subtotal)}</p>
        <p className="mt-2">TVA / taxe: {formatEuroFromCents(invoice.tax)}</p>
        <p className="mt-2 text-base font-semibold text-neutral-900">
          Total TTC: {formatEuroFromCents(invoice.total)}
        </p>
        {invoice.notes ? <p className="mt-4 whitespace-pre-line">{invoice.notes}</p> : null}
      </section>
    </main>
  );
}
