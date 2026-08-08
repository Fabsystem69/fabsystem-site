import { formatDate, formatEuroFromCents } from "@/lib/format";
import Link from "next/link";
import { listDashboardProducts } from "@/lib/services/catalog";
import {
  activateProductAction,
  archiveProductAction,
  draftProductAction,
} from "@/app/dashboard/catalog/actions";
import { AdminAlert, AdminBadge, AdminButton, AdminEmptyState, AdminPageHeader, type AdminBadgeTone } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

type DashboardCatalogPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const STATUS_TONE: Record<"DRAFT" | "ACTIVE" | "ARCHIVED", AdminBadgeTone> = {
  ACTIVE: "success",
  ARCHIVED: "neutral",
  DRAFT: "warning",
};

function getPriceSummary(
  prices: Array<{
    status: "ACTIVE" | "ARCHIVED";
    unitAmountCents: number;
    currency: string;
  }>
) {
  const activePrices = prices.filter((price) => price.status === "ACTIVE");

  if (activePrices.length === 0) {
    return { label: "Aucun prix actif", status: null };
  }

  if (activePrices.length > 1) {
    return { label: "Conflit: plusieurs prix actifs", status: "ACTIVE" as const };
  }

  const price = activePrices[0];

  return {
    label: `${formatEuroFromCents(price.unitAmountCents)} · ${price.currency}`,
    status: price.status,
  };
}

const secondaryButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-xs font-semibold text-neutral-200 transition-colors duration-150 hover:bg-neutral-800";
const successButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 transition-colors duration-150 hover:bg-emerald-500/20";
const warningButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 text-xs font-semibold text-orange-400 transition-colors duration-150 hover:bg-orange-500/20";

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
          <button className={successButtonClass}>Activer</button>
        </form>
      ) : null}

      {status !== "ARCHIVED" ? (
        <form action={archiveProductAction}>
          <input type="hidden" name="productId" value={productId} />
          <button className={secondaryButtonClass}>Archiver</button>
        </form>
      ) : null}

      {status !== "DRAFT" ? (
        <form action={draftProductAction}>
          <input type="hidden" name="productId" value={productId} />
          <button className={warningButtonClass}>Brouillon</button>
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
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Catalogue e-commerce"
          description="Produits vendus via FabSystem. Lecture du catalogue, des prix et des assets, ainsi que les changements de statut."
          actions={
            <>
              <AdminButton variant="primary" href="/dashboard/catalog/new">
                Créer un produit
              </AdminButton>
              <AdminButton href="/dashboard/catalog/assets">Gérer les fichiers numériques</AdminButton>
            </>
          }
        />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        {products.length === 0 ? (
          <AdminEmptyState title="Aucun produit numérique n'est encore disponible dans le catalogue." />
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const priceSummary = getPriceSummary(product.prices);

              return (
                <article
                  key={product.id}
                  className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-white">{product.name}</h2>
                        <AdminBadge tone={STATUS_TONE[product.status]}>{product.status}</AdminBadge>
                        <AdminBadge tone="neutral">{product.productType}</AdminBadge>
                        <AdminBadge tone="neutral">{product.purchaseMode}</AdminBadge>
                      </div>

                      <div className="text-sm text-neutral-400">
                        <p>
                          <span className="font-medium text-neutral-200">Slug :</span> {product.slug}
                        </p>
                        <p className="mt-1">{product.shortDescription || "Aucune description courte"}</p>
                      </div>
                    </div>

                    <ProductStatusActions productId={product.id} status={product.status} />
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <section className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4">
                      <h3 className="text-sm font-semibold text-neutral-100">Prix</h3>
                      <p className="mt-2 text-sm text-neutral-300">{priceSummary.label}</p>
                      <ul className="mt-3 space-y-2 text-xs text-neutral-500">
                        {product.prices.length === 0 ? (
                          <li>Aucun prix enregistré.</li>
                        ) : (
                          product.prices.map((price) => (
                            <li key={price.id}>
                              {formatEuroFromCents(price.unitAmountCents)} · {price.currency} · {price.status}
                            </li>
                          ))
                        )}
                      </ul>
                    </section>

                    <section className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4 lg:col-span-2">
                      <h3 className="text-sm font-semibold text-neutral-100">Assets liés</h3>
                      {product.assets.length === 0 ? (
                        <p className="mt-2 text-sm text-neutral-500">Aucun asset lié.</p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {product.assets.map((productAsset) => (
                            <div
                              key={`${productAsset.productId}-${productAsset.assetId}`}
                              className="rounded-lg border border-neutral-800/80 bg-neutral-900/60 p-3 text-xs text-neutral-400"
                            >
                              <p className="font-medium text-neutral-100">{productAsset.asset.filename}</p>
                              <p className="mt-1">{productAsset.asset.provider} · {productAsset.asset.status}</p>
                              <p className="mt-1">Bucket : {productAsset.asset.bucket}</p>
                              <p className="mt-1 break-all">Path : {productAsset.asset.path}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                    <p>Création : {formatDate(product.createdAt)}</p>
                    <p>Mise à jour : {formatDate(product.updatedAt)}</p>
                    <Link
                      href={`/dashboard/catalog/${product.id}/edit`}
                      className="font-medium text-brand-300 underline underline-offset-4 hover:text-brand-200"
                    >
                      Modifier
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
