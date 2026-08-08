import { ProductForm } from "@/components/dashboard/ProductForm";
import { createProductAction } from "@/app/dashboard/catalog/actions";
import { AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

type DashboardCatalogNewPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function DashboardCatalogNewPage({
  searchParams,
}: DashboardCatalogNewPageProps) {
  const { error, success } = await searchParams;

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Créer un produit"
          description="Création d'un produit e-commerce FabSystem. Les assets sont gérés dans Fichiers numériques."
          backHref="/dashboard/catalog"
          backLabel="Retour au catalogue"
        />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        <ProductForm
          action={createProductAction}
          submitLabel="Créer le produit"
          showPriceField
          initialValues={{
            productType: "EBOOK",
            purchaseMode: "BUY_NOW",
            status: "DRAFT",
            activePriceEuros: "29.00",
          }}
        />
      </main>
    </div>
  );
}
