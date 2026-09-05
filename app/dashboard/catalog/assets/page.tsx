import { formatDate } from "@/lib/format";
import {
  activateDigitalAssetAction,
  archiveDigitalAssetAction,
  migrateEbookAssetsAction,
} from "@/app/dashboard/catalog/assets/actions";
import { listDashboardAssets } from "@/lib/services/catalog";
import { getDigitalAssetStatusLabel, getDigitalAssetStatusTone } from "@/lib/dashboard-status-labels";
import {
  DashboardPageShell, AdminAlert, AdminBadge, AdminButton, AdminEmptyState, AdminPageHeader } from "@/components/dashboard/ui";

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
  const hasSupabaseAssets = assets.some((asset) => asset.provider === "SUPABASE");

  return (
    <DashboardPageShell>
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

        {hasSupabaseAssets ? (
          <AdminAlert tone="warning">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Des assets sont encore hébergés sur Supabase (pause possible après 7 jours
                d&apos;inactivité sur le plan gratuit). Migration vers Vercel Blob recommandée.
              </p>
              <form action={migrateEbookAssetsAction}>
                <AdminButton type="submit" variant="warning" size="sm">
                  Migrer vers Vercel Blob
                </AdminButton>
              </form>
            </div>
          </AdminAlert>
        ) : null}

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
                      <AdminBadge tone={getDigitalAssetStatusTone(asset.status)}>{getDigitalAssetStatusLabel(asset.status)}</AdminBadge>
                    </div>
                    <p>Bucket : {asset.bucket}</p>
                    <p className="break-all">Path : {asset.path}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {asset.status !== "ACTIVE" ? (
                      <form action={activateDigitalAssetAction}>
                        <input type="hidden" name="assetId" value={asset.id} />
                        <AdminButton type="submit" variant="success" size="sm">Activer</AdminButton>
                      </form>
                    ) : null}
                    {asset.status !== "ARCHIVED" ? (
                      <form action={archiveDigitalAssetAction}>
                        <input type="hidden" name="assetId" value={asset.id} />
                        <AdminButton type="submit" variant="secondary" size="sm">Archiver</AdminButton>
                      </form>
                    ) : null}
                    <AdminButton href={`/dashboard/catalog/assets/${asset.id}/edit`} variant="secondary" size="sm">
                      Modifier
                    </AdminButton>
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
  </DashboardPageShell>
  );
}
