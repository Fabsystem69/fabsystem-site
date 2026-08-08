import { notFound } from "next/navigation";
import {
  CustomerCreateForm,
  type CustomerFormInitialData,
} from "@/components/dashboard/CustomerCreateForm";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import { AdminAlert, AdminButton, AdminPageHeader } from "@/components/dashboard/ui";

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
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Modifier le client"
          description="Mets à jour les informations de contact et les données véhicule / bateau."
          actions={
            <AdminButton href={customer ? `/dashboard/customers/${customer.id}` : "/dashboard/customers"}>
              Retour
            </AdminButton>
          }
        />

        {databaseError ? (
          <AdminAlert tone="warning">{databaseError}</AdminAlert>
        ) : customer ? (
          <CustomerCreateForm initialData={customer} />
        ) : null}
      </main>
    </div>
  );
}
