import { notFound } from "next/navigation";
import {
  CustomerCreateForm,
  type CustomerFormInitialData,
} from "@/components/dashboard/CustomerCreateForm";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";
import {
  DashboardPageShell, AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

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
    <DashboardPageShell maxWidth="3xl">
        <AdminPageHeader
          title="Modifier le client"
          backHref={customer ? `/dashboard/customers/${customer.id}` : "/dashboard/customers"}
          backLabel="Retour à la fiche client"
          description="Mets à jour les informations de contact et les données véhicule / bateau."
        />

        {databaseError ? (
          <AdminAlert tone="warning">{databaseError}</AdminAlert>
        ) : customer ? (
          <CustomerCreateForm initialData={customer} />
        ) : null}
  </DashboardPageShell>
  );
}
