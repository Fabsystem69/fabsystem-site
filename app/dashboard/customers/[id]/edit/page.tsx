import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CustomerCreateForm,
  type CustomerFormInitialData,
} from "@/components/dashboard/CustomerCreateForm";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DashboardCustomerEditPage({ params }: Params) {
  const { id } = await params;
  let customer: CustomerFormInitialData | null = null;
  let databaseError: string | null = null;

  try {
    const result = await prisma.customer.findUnique({
      where: { id },
    });

    customer = result
      ? {
          id: result.id,
          name: result.name,
          email: result.email,
          phone: result.phone,
          address: result.address,
          assetType: result.assetType,
          assetBrand: result.assetBrand,
          assetModel: result.assetModel,
          registration: result.registration,
          odometerKm: result.odometerKm,
          engineHours: result.engineHours,
        }
      : null;
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  if (!databaseError && !customer) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Modifier le client</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Mets à jour les informations de contact et les données véhicule / bateau.
          </p>
        </div>
        <Link
          href={customer ? `/dashboard/customers/${customer.id}` : "/dashboard/customers"}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
        >
          Retour
        </Link>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : customer ? (
        <CustomerCreateForm initialData={customer} />
      ) : null}
    </main>
  );
}
