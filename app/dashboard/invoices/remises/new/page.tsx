import Link from "next/link";
import {
  RemiseCreateForm,
  type RemiseCustomerOption,
  type RemiseInvoiceOption,
} from "@/components/dashboard/RemiseCreateForm";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { getCustomerSelectOptions } from "@/lib/services/customers";
import { prisma } from "@/lib/prisma";

export default async function DashboardRemiseNewPage() {
  let customers: RemiseCustomerOption[] = [];
  let invoices: RemiseInvoiceOption[] = [];
  let databaseError: string | null = null;

  try {
    const [customersResult, invoicesResult] = await Promise.all([
      getCustomerSelectOptions(),
      prisma.invoice.findMany({
        select: { id: true, number: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    customers = customersResult;
    invoices = invoicesResult;
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Nouvelle remise</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Créer un avoir ou une remise liée à un client.
          </p>
        </div>
        <Link
          href="/dashboard/invoices?tab=remises"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
        >
          Retour aux remises
        </Link>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Crée d&apos;abord un client avant de pouvoir créer une remise.
        </div>
      ) : (
        <RemiseCreateForm customers={customers} invoices={invoices} />
      )}
    </main>
  );
}
