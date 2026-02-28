import Link from "next/link";
import { notFound } from "next/navigation";
import {
  QuoteCreateForm,
  type CustomerOption,
  type QuoteFormInitialData,
} from "@/components/dashboard/QuoteCreateForm";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DashboardQuoteEditPage({ params }: Params) {
  const { id } = await params;
  let customers: CustomerOption[] = [];
  let quote: QuoteFormInitialData | null = null;
  let databaseError: string | null = null;

  try {
    const [customersResult, quoteResult] = await Promise.all([
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.quote.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { position: "asc" },
          },
        },
      }),
    ]);

    customers = customersResult;
    quote = quoteResult
      ? {
          id: quoteResult.id,
          customerId: quoteResult.customerId,
          issueDate: quoteResult.issueDate,
          validUntil: quoteResult.validUntil,
          notes: quoteResult.notes,
          status: quoteResult.status,
          items: quoteResult.items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }
      : null;
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  if (!databaseError && !quote) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Modifier le devis</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Mets à jour le client, les lignes et les totaux recalculés côté serveur.
          </p>
        </div>
        <Link
          href={quote ? `/dashboard/quotes/${quote.id}` : "/dashboard/quotes"}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
        >
          Retour
        </Link>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : customers.length === 0 || !quote ? null : (
        <QuoteCreateForm customers={customers} initialData={quote} />
      )}
    </main>
  );
}
