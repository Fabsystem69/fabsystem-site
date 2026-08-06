import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  activateDigitalAssetAction,
  archiveDigitalAssetAction,
} from "@/app/dashboard/catalog/assets/actions";
import { listDashboardAssets } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

type DashboardCatalogAssetsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function DashboardCatalogAssetsPage({
  searchParams,
}: DashboardCatalogAssetsPageProps) {
  const assets = await listDashboardAssets();
  const { error, success } = await searchParams;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Assets numeriques</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Gestion des references `DigitalAsset` du catalogue. Cette interface ne fait pas
          d&apos;upload Supabase et ne genere aucune URL signee.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/dashboard/catalog"
            className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4"
          >
            Retour au catalogue
          </Link>
          <Link
            href="/dashboard/catalog/assets/new"
            className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Creer un asset
          </Link>
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

      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          Aucun asset numerique n&apos;est encore reference dans le dashboard.
        </div>
      ) : (
        <div className="space-y-4">
          {assets.map((asset) => (
            <article
              key={asset.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2 text-sm text-neutral-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-neutral-950">{asset.filename}</h2>
                    <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
                      {asset.provider}
                    </span>
                    <span className="rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
                      {asset.status}
                    </span>
                  </div>
                  <p>Bucket : {asset.bucket}</p>
                  <p className="break-all">Path : {asset.path}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {asset.status !== "ACTIVE" ? (
                    <form action={activateDigitalAssetAction}>
                      <input type="hidden" name="assetId" value={asset.id} />
                      <button className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
                        Activer
                      </button>
                    </form>
                  ) : null}
                  {asset.status !== "ARCHIVED" ? (
                    <form action={archiveDigitalAssetAction}>
                      <input type="hidden" name="assetId" value={asset.id} />
                      <button className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50">
                        Archiver
                      </button>
                    </form>
                  ) : null}
                  <Link
                    href={`/dashboard/catalog/assets/${asset.id}/edit`}
                    className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                  >
                    Modifier
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                  <h3 className="text-sm font-semibold text-neutral-900">Produits lies</h3>
                  {asset.products.length === 0 ? (
                    <p className="mt-2 text-neutral-600">Aucun produit lie.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {asset.products.map((productLink) => (
                        <li key={`${productLink.productId}-${asset.id}`}>
                          <span className="font-medium text-neutral-900">
                            {productLink.product.name}
                          </span>{" "}
                          · {productLink.product.slug} · {productLink.product.productType} ·{" "}
                          {productLink.product.status}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                  <h3 className="text-sm font-semibold text-neutral-900">Metadonnees</h3>
                  <p className="mt-2">Creation : {formatDate(asset.createdAt)}</p>
                  <p className="mt-1">Mise a jour : {formatDate(asset.updatedAt)}</p>
                </section>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
