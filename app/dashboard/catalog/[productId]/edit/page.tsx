import Link from "next/link";
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
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Modifier le produit</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Mise a jour du produit et de son prix courant. Les anciens snapshots de commande
          restent inchanges dans `OrderItem`.
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
        className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5"
      >
        <input type="hidden" name="productId" value={product.id} />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-950">Prix courant</h2>
          <p className="text-sm text-neutral-600">
            Si le montant change, l&apos;ancien prix actif sera archive et un nouveau prix actif
            sera cree.
          </p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="font-medium text-neutral-900">Montant TTC (EUR)</span>
          <input
            name="amountEuros"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={activePrice ? formatPriceEurosFromCents(activePrice.unitAmountCents) : ""}
            className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base md:max-w-xs"
          />
        </label>

        <button className="rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800">
          Mettre a jour le prix
        </button>
      </form>

      <ProductAssetManager
        productId={product.id}
        linkedAssets={product.assets}
        availableAssets={availableAssets}
      />
    </section>
  );
}
