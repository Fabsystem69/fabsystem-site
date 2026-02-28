import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteDeleteButton } from "@/components/dashboard/QuoteDeleteButton";
import { QuoteSignatureActions } from "@/components/dashboard/QuoteSignatureActions";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

async function findQuote(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        orderBy: { position: "asc" },
      },
    },
  });
}

export default async function DashboardQuoteDetailPage({ params }: Params) {
  const { id } = await params;
  let quote: Awaited<ReturnType<typeof findQuote>> = null;

  try {
    quote = await findQuote(id);
  } catch (error) {
    return (
      <main className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {getDatabaseErrorMessage(error)}
      </main>
    );
  }

  if (!quote) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">{quote.number}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Devis {quote.status} pour {quote.customer.name}
          </p>
        </div>

        <div className="flex gap-3">
          <QuoteSignatureActions
            quoteId={quote.id}
            disabled={Boolean(quote.signedAt)}
          />
          <Link
            href={`/dashboard/quotes/${quote.id}/edit`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
          >
            Modifier
          </Link>
          <Link
            href="/dashboard/quotes"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
          >
            Retour aux devis
          </Link>
          <Link
            href={`/api/internal/quotes/${quote.id}/pdf`}
            target="_blank"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Télécharger PDF
          </Link>
          <QuoteDeleteButton
            quoteId={quote.id}
            disabled={quote.status !== "DRAFT"}
          />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Client</h2>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p>{quote.customer.name}</p>
            {quote.customer.address ? <p className="whitespace-pre-line">{quote.customer.address}</p> : null}
            {quote.customer.email ? <p>{quote.customer.email}</p> : null}
            {quote.customer.phone ? <p>{quote.customer.phone}</p> : null}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Informations</h2>
          <div className="mt-3 space-y-1 text-sm text-neutral-700">
            <p>Date d&apos;émission: {formatDate(quote.issueDate)}</p>
            <p>Validité: {formatDate(quote.validUntil)}</p>
            <p>Statut: {quote.status}</p>
            {quote.signedAt && quote.signedName ? (
              <p className="text-green-700">
                Signé le {formatDate(quote.signedAt)} par {quote.signedName}
              </p>
            ) : null}
            {quote.status !== "DRAFT" ? (
              <p className="text-amber-700">
                Suppression désactivée: seuls les devis DRAFT peuvent être supprimés.
              </p>
            ) : null}
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
            {quote.items.map((item) => (
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
        <p>Sous-total HT: {formatEuroFromCents(quote.subtotal)}</p>
        <p className="mt-2">TVA / taxe: {formatEuroFromCents(quote.tax)}</p>
        <p className="mt-2 text-base font-semibold text-neutral-900">
          Total TTC: {formatEuroFromCents(quote.total)}
        </p>
        {quote.notes ? <p className="mt-4 whitespace-pre-line">{quote.notes}</p> : null}
        {quote.signatureDataUrl ? (
          <div className="mt-4">
            <p className="mb-2 font-medium text-neutral-900">Signature client</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={quote.signatureDataUrl}
              alt="Signature client"
              className="max-h-28 rounded border border-neutral-200 bg-white"
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
