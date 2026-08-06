import { formatDate, formatEuroFromCents } from "@/lib/format";
import Link from "next/link";
import { listDashboardProducts } from "@/lib/services/catalog";
import {
  activateProductAction,
  archiveProductAction,
  draftProductAction,
} from "@/app/dashboard/catalog/actions";

export const dynamic = "force-dynamic";

type DashboardCatalogPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function getStatusBadgeClass(status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "ARCHIVED") {
    return "border-neutral-300 bg-neutral-100 text-neutral-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function getPriceSummary(
  prices: Array<{
    status: "ACTIVE" | "ARCHIVED";
    unitAmountCents: number;
    currency: string;
  }>
) {
  const activePrices = prices.filter((price) => price.status === "ACTIVE");

  if (activePrices.length === 0) {
    return {
      label: "Aucun prix actif",
      status: null,
    };
  }

  if (activePrices.length > 1) {
    return {
      label: "Conflit: plusieurs prix actifs",
      status: "ACTIVE" as const,
    };
  }

  const price = activePrices[0];

  return {
    label: `${formatEuroFromCents(price.unitAmountCents)} · ${price.currency}`,
    status: price.status,
  };
}

function ProductStatusActions({
  productId,
  status,
}: {
  productId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "ACTIVE" ? (
        <form action={activateProductAction}>
          <input type="hidden" name="productId" value={productId} />
          <button className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
            Activer
          </button>
        </form>
      ) : null}

      {status !== "ARCHIVED" ? (
        <form action={archiveProductAction}>
          <input type="hidden" name="productId" value={productId} />
          <button className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50">
            Archiver
          </button>
        </form>
      ) : null}

      {status !== "DRAFT" ? (
        <form action={draftProductAction}>
          <input type="hidden" name="productId" value={productId} />
          <button className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100">
            Brouillon
          </button>
        </form>
      ) : null}
    </div>
  );
}

export default async function DashboardCatalogPage({
  searchParams,
}: DashboardCatalogPageProps) {
  const products = await listDashboardProducts();
  const { error, success } = await searchParams;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Catalogue e-commerce</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Produits vendus via FabSystem. Cette vue MVP permet la lecture du catalogue,
          des prix et des assets, ainsi que les changements de statut simples.
        </p>
        <div className="pt-2">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/catalog/new"
              className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Creer un produit
            </Link>
            <Link
              href="/dashboard/catalog/assets"
              className="inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Gérer les assets
            </Link>
          </div>
        </div>
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

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          Aucun produit numerique n&apos;est encore disponible dans le catalogue.
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const priceSummary = getPriceSummary(product.prices);

            return (
              <article
                key={product.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-neutral-950">{product.name}</h2>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(product.status)}`}
                      >
                        {product.status}
                      </span>
                      <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
                        {product.productType}
                      </span>
                      <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
                        {product.purchaseMode}
                      </span>
                    </div>

                    <div className="text-sm text-neutral-600">
                      <p>
                        <span className="font-medium text-neutral-900">Slug :</span> {product.slug}
                      </p>
                      <p className="mt-1">
                        {product.shortDescription || "Aucune description courte"}
                      </p>
                    </div>
                  </div>

                  <ProductStatusActions productId={product.id} status={product.status} />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <h3 className="text-sm font-semibold text-neutral-900">Prix</h3>
                    <p className="mt-2 text-sm text-neutral-800">{priceSummary.label}</p>
                    <ul className="mt-3 space-y-2 text-xs text-neutral-600">
                      {product.prices.length === 0 ? (
                        <li>Aucun prix enregistre.</li>
                      ) : (
                        product.prices.map((price) => (
                          <li key={price.id}>
                            {formatEuroFromCents(price.unitAmountCents)} · {price.currency} ·{" "}
                            {price.status}
                          </li>
                        ))
                      )}
                    </ul>
                  </section>

                  <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-neutral-900">Assets liés</h3>
                    {product.assets.length === 0 ? (
                      <p className="mt-2 text-sm text-neutral-600">Aucun asset lie.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {product.assets.map((productAsset) => (
                          <div
                            key={`${productAsset.productId}-${productAsset.assetId}`}
                            className="rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-700"
                          >
                            <p className="font-medium text-neutral-900">
                              {productAsset.asset.filename}
                            </p>
                            <p className="mt-1">
                              {productAsset.asset.provider} · {productAsset.asset.status}
                            </p>
                            <p className="mt-1">Bucket : {productAsset.asset.bucket}</p>
                            <p className="mt-1 break-all">Path : {productAsset.asset.path}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500">
                  <p>Creation : {formatDate(product.createdAt)}</p>
                  <p>Mise a jour : {formatDate(product.updatedAt)}</p>
                  <Link
                    href={`/dashboard/catalog/${product.id}/edit`}
                    className="font-medium text-neutral-900 underline underline-offset-4"
                  >
                    Modifier
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
