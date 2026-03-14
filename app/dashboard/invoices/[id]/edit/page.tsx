import Link from "next/link";
import { notFound } from "next/navigation";
import {
  InvoiceCreateForm,
  type InvoiceCustomerOption,
  type InvoiceFormInitialData,
} from "@/components/dashboard/InvoiceCreateForm";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { getCustomerSelectOptions } from "@/lib/services/customers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DashboardInvoiceEditPage({ params }: Params) {
  const { id } = await params;
  let customers: InvoiceCustomerOption[] = [];
  let invoice: InvoiceFormInitialData | null = null;
  let databaseError: string | null = null;

  try {
    const [customersResult, invoiceResult] = await Promise.all([
      getCustomerSelectOptions(),
      prisma.invoice.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { position: "asc" },
          },
        },
      }),
    ]);

    customers = customersResult;
    invoice = invoiceResult
      ? {
          id: invoiceResult.id,
          customerId: invoiceResult.customerId,
          sourceQuoteId: invoiceResult.sourceQuoteId,
          issueDate: invoiceResult.issueDate,
          dueDate: invoiceResult.dueDate,
          currency: invoiceResult.currency,
          customerReference: invoiceResult.customerReference,
          projectReference: invoiceResult.projectReference,
          serviceReference: invoiceResult.serviceReference,
          serviceDate: invoiceResult.serviceDate,
          serviceType: invoiceResult.serviceType,
          deliveryMode: invoiceResult.deliveryMode,
          paidAt: invoiceResult.paidAt,
          paymentMethod: invoiceResult.paymentMethod,
          paymentRef: invoiceResult.paymentRef,
          notes: invoiceResult.notes,
          status: invoiceResult.status,
          items: invoiceResult.items.map((item) => ({
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

  if (!databaseError && !invoice) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Modifier la facture</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Mets à jour le client, les lignes et les totaux recalculés côté serveur.
          </p>
        </div>
        <Link
          href={invoice ? `/dashboard/invoices/${invoice.id}` : "/dashboard/invoices"}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
        >
          Retour
        </Link>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : customers.length === 0 || !invoice ? null : (
        <InvoiceCreateForm customers={customers} initialData={invoice} />
      )}
    </main>
  );
}
