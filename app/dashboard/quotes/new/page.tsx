import Link from "next/link";
import {
  QuoteCreateForm,
  type CustomerOption,
} from "@/components/dashboard/QuoteCreateForm";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { getCustomerSelectOptions } from "@/lib/services/customers";

export default async function DashboardQuoteNewPage() {
  let customers: CustomerOption[] = [];
  let databaseError: string | null = null;

  try {
    customers = await getCustomerSelectOptions();
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Nouveau devis</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Formulaire minimal branché sur Prisma.
          </p>
        </div>
        <Link
          href="/dashboard/quotes"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
        >
          Retour aux devis
        </Link>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Crée d’abord un client avant de pouvoir générer un devis.
        </div>
      ) : (
        <QuoteCreateForm customers={customers} />
      )}
    </main>
  );
}
