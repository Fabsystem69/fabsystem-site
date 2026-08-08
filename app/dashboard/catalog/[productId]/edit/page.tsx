import { notFound } from "next/navigation";
import { ProductAssetManager } from "@/components/dashboard/ProductAssetManager";
import { ProductForm } from "@/components/dashboard/ProductForm";
import {
  updateProductAction,
  updateProductPriceAction,
} from "@/app/dashboard/catalog/actions";
import {
  getDashboardProductForEdit,
  listAvailableAssetsForProduct,
} from "@/lib/services/catalog";
import { AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

type DashboardCatalogEditPageProps = {
  params: Promise<{
    productId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatPriceEurosFromCents(value: number) {
  return (value / 100).toFixed(2);
}

export default async function DashboardCatalogEditPage({
  params,
  searchParams,
}: DashboardCatalogEditPageProps) {
  const { productId } = await params;
  const { error, success } = await searchParams;

  let product;
  try {
    product = await getDashboardProductForEdit(productId);
  } catch {
    notFound();
  }
  const availableAssets = await listAvailableAssetsForProduct(product.id);

  const activePrice = product.prices.find((price) => price.status === "ACTIVE") ?? null;

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Modifier le produit"
          description="Mise à jour du produit et de son prix courant. Les anciens snapshots de commande restent inchangés dans OrderItem."
          backHref="/dashboard/catalog"
          backLabel="Retour au catalogue"
        />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        <ProductForm
          action={updateProductAction}
          submitLabel="Enregistrer le produit"
          initialValues={{
            productId: product.id,
            name: product.name,
            slug: product.slug,
            shortDescription: product.shortDescription,
            description: product.description,
            productType: product.productType,
            purchaseMode: product.purchaseMode,
            status: product.status,
          }}
        />

        <form
          action={updateProductPriceAction}
          className="space-y-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5"
        >
          <input type="hidden" name="productId" value={product.id} />
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-white">Prix courant</h2>
            <p className="text-sm text-neutral-400">
              Si le montant change, l&apos;ancien prix actif sera archivé et un nouveau prix actif sera créé.
            </p>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-neutral-200">Montant TTC (EUR)</span>
            <input
              name="amountEuros"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={activePrice ? formatPriceEurosFromCents(activePrice.unitAmountCents) : ""}
              className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500 md:max-w-xs"
            />
          </label>

          <button className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300">
            Mettre à jour le prix
          </button>
        </form>

        <ProductAssetManager
          productId={product.id}
          linkedAssets={product.assets}
          availableAssets={availableAssets}
        />
      </main>
    </div>
  );
}
