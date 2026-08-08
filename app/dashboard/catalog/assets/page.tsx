import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  activateDigitalAssetAction,
  archiveDigitalAssetAction,
} from "@/app/dashboard/catalog/assets/actions";
import { listDashboardAssets } from "@/lib/services/catalog";
import { AdminAlert, AdminBadge, AdminButton, AdminEmptyState, AdminPageHeader, type AdminBadgeTone } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

type DashboardCatalogAssetsPageProps = {
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

const successButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 transition-colors duration-150 hover:bg-emerald-500/20";
const secondaryButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-xs font-semibold text-neutral-200 transition-colors duration-150 hover:bg-neutral-800";

export default async function DashboardCatalogAssetsPage({
  searchParams,
}: DashboardCatalogAssetsPageProps) {
  const assets = await listDashboardAssets();
  const { error, success } = await searchParams;

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Fichiers numériques"
          description="Gestion des références DigitalAsset du catalogue. Cette interface ne fait pas d'upload Supabase et ne génère aucune URL signée."
          backHref="/dashboard/catalog"
          backLabel="Retour au catalogue"
          actions={
            <AdminButton variant="primary" href="/dashboard/catalog/assets/new">
              Créer un asset
            </AdminButton>
          }
        />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        {assets.length === 0 ? (
          <AdminEmptyState title="Aucun asset numérique n'est encore référencé dans le dashboard." />
        ) : (
          <div className="space-y-4">
            {assets.map((asset) => (
              <article key={asset.id} className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 text-sm text-neutral-300">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">{asset.filename}</h2>
                      <AdminBadge tone="neutral">{asset.provider}</AdminBadge>
                      <AdminBadge tone={STATUS_TONE[asset.status]}>{asset.status}</AdminBadge>
                    </div>
                    <p>Bucket : {asset.bucket}</p>
                    <p className="break-all">Path : {asset.path}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {asset.status !== "ACTIVE" ? (
                      <form action={activateDigitalAssetAction}>
                        <input type="hidden" name="assetId" value={asset.id} />
                        <button className={successButtonClass}>Activer</button>
                      </form>
                    ) : null}
                    {asset.status !== "ARCHIVED" ? (
                      <form action={archiveDigitalAssetAction}>
                        <input type="hidden" name="assetId" value={asset.id} />
                        <button className={secondaryButtonClass}>Archiver</button>
                      </form>
                    ) : null}
                    <Link href={`/dashboard/catalog/assets/${asset.id}/edit`} className={secondaryButtonClass}>
                      Modifier
                    </Link>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <section className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4 text-sm text-neutral-300">
                    <h3 className="text-sm font-semibold text-neutral-100">Produits liés</h3>
                    {asset.products.length === 0 ? (
                      <p className="mt-2 text-neutral-500">Aucun produit lié.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {asset.products.map((productLink) => (
                          <li key={`${productLink.productId}-${asset.id}`}>
                            <span className="font-medium text-neutral-100">{productLink.product.name}</span>{" "}
                            · {productLink.product.slug} · {productLink.product.productType} · {productLink.product.status}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4 text-sm text-neutral-300">
                    <h3 className="text-sm font-semibold text-neutral-100">Métadonnées</h3>
                    <p className="mt-2">Création : {formatDate(asset.createdAt)}</p>
                    <p className="mt-1">Mise à jour : {formatDate(asset.updatedAt)}</p>
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
