import Link from "next/link";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { createProductAction } from "@/app/dashboard/catalog/actions";

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
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Creer un produit</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Premiere creation MVP d&apos;un produit e-commerce FabSystem. Les assets seront geres
          dans un sprint dedie.
        </p>
        <Link
          href="/dashboard/catalog"
          className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          Retour au catalogue
        </Link>
      </div>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <ProductForm
        action={createProductAction}
        submitLabel="Creer le produit"
        showPriceField
        initialValues={{
          productType: "EBOOK",
          purchaseMode: "BUY_NOW",
          status: "DRAFT",
          activePriceEuros: "29.00",
        }}
      />
    </section>
  );
}
