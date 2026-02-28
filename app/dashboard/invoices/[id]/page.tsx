import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceDeleteButton } from "@/components/dashboard/InvoiceDeleteButton";
import { InvoicePaymentForm } from "@/components/dashboard/InvoicePaymentForm";
import { formatCustomerAssetSummary } from "@/lib/customer-asset";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { formatDeliveryMode, formatServiceType } from "@/lib/service-meta";

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

  const customerAssetSummary = formatCustomerAssetSummary(invoice.customer);

  return (
    <main className="space-y-6 pb-28 md:pb-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">{invoice.number}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Facture {invoice.status} pour {invoice.customer.name}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/dashboard/invoices/${invoice.id}/edit`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
          >
            Modifier
          </Link>
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
          <InvoiceDeleteButton
            invoiceId={invoice.id}
            disabled={invoice.status !== "DRAFT"}
          />
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
            {customerAssetSummary ? <p>{customerAssetSummary}</p> : null}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Informations</h2>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p>Date d&apos;émission: {formatDate(invoice.issueDate)}</p>
            <p>Échéance: {formatDate(invoice.dueDate)}</p>
            <p>Type: {formatServiceType(invoice.serviceType)}</p>
            <p>Mode: {formatDeliveryMode(invoice.deliveryMode)}</p>
            <p>Date prestation: {formatDate(invoice.serviceDate)}</p>
            <p>Statut: {invoice.status}</p>
            <p>Encaissement: {formatDate(invoice.paidAt)}</p>
            {invoice.paymentMethod ? <p>Mode: {invoice.paymentMethod}</p> : null}
            {invoice.paymentRef ? <p>Référence: {invoice.paymentRef}</p> : null}
            {invoice.status !== "DRAFT" ? (
              <p className="text-amber-700">
                Suppression désactivée: seules les factures DRAFT peuvent être supprimées.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="hidden rounded-lg border border-neutral-200 bg-white md:block">
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

      <section className="space-y-3 md:hidden">
        {invoice.items.map((item) => (
          <article key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-neutral-900">{item.description}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-neutral-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Qté</p>
                <p className="mt-1 font-medium text-neutral-900">{item.quantity}</p>
              </div>
              <div className="rounded-lg bg-neutral-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-neutral-500">PU</p>
                <p className="mt-1 font-medium text-neutral-900">
                  {formatEuroFromCents(item.unitPrice)}
                </p>
              </div>
              <div className="col-span-2 rounded-lg bg-neutral-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Total</p>
                <p className="mt-1 font-medium text-neutral-900">
                  {formatEuroFromCents(item.lineTotal)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="ml-auto max-w-sm rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
        <p>Total HT: {formatEuroFromCents(invoice.subtotal)}</p>
        <p className="mt-2 text-base font-semibold text-neutral-900">
          Total TTC: {formatEuroFromCents(invoice.total)}
        </p>
        {invoice.notes ? <p className="mt-4 whitespace-pre-line">{invoice.notes}</p> : null}
      </section>

      <InvoicePaymentForm
        invoiceId={invoice.id}
        initialStatus={invoice.status}
        initialPaidAt={invoice.paidAt}
        initialPaymentMethod={invoice.paymentMethod}
        initialPaymentRef={invoice.paymentRef}
      />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          <Link
            href={`/dashboard/invoices/${invoice.id}/edit`}
            className="flex h-11 flex-1 items-center justify-center rounded-md border border-neutral-300 px-4 text-base font-semibold text-neutral-900"
          >
            Modifier
          </Link>
          <Link
            href={`/api/internal/invoices/${invoice.id}/pdf`}
            target="_blank"
            className="flex h-11 flex-[1.2] items-center justify-center rounded-md bg-neutral-900 px-4 text-base font-semibold text-white"
          >
            PDF
          </Link>
        </div>
      </div>
    </main>
  );
}
