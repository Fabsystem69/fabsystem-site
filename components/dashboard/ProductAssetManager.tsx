import type { DigitalAssetProvider } from "@/lib/generated/prisma/client";
import {
  activateDigitalAssetAction,
  archiveDigitalAssetAction,
  linkAssetToProductAction,
  unlinkAssetFromProductAction,
} from "@/app/dashboard/catalog/assets/actions";

type ProductAssetManagerProps = {
  productId: string;
  linkedAssets: Array<{
    productId: string;
    assetId: string;
    sortOrder: number;
    asset: {
      id: string;
      filename: string;
      provider: DigitalAssetProvider;
      bucket: string;
      path: string;
      status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    };
  }>;
  availableAssets: Array<{
    id: string;
    filename: string;
    bucket: string;
    path: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  }>;
};

const successButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 transition-colors duration-150 hover:bg-emerald-500/20";
const secondaryButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-xs font-semibold text-neutral-200 transition-colors duration-150 hover:bg-neutral-800";
const dangerButtonClass =
  "inline-flex h-9 items-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-400 transition-colors duration-150 hover:bg-red-500/20";

export function ProductAssetManager({
  productId,
  linkedAssets,
  availableAssets,
}: ProductAssetManagerProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-white">Assets liés</h2>
        <p className="text-sm text-neutral-400">
          Cette section gère uniquement les références Prisma des assets numériques. Aucun
          upload Supabase ni signed URL n&apos;est généré ici.
        </p>
      </div>

      {linkedAssets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 p-4 text-sm text-neutral-500">
          Aucun asset n&apos;est encore lié à ce produit.
        </div>
      ) : (
        <div className="space-y-3">
          {linkedAssets.map((productAsset) => (
            <article
              key={`${productAsset.productId}-${productAsset.assetId}`}
              className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1 text-sm text-neutral-300">
                  <p className="font-medium text-white">{productAsset.asset.filename}</p>
                  <p>
                    {productAsset.asset.provider} · {productAsset.asset.status}
                  </p>
                  <p>Bucket : {productAsset.asset.bucket}</p>
                  <p className="break-all">Path : {productAsset.asset.path}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {productAsset.asset.status !== "ACTIVE" ? (
                    <form action={activateDigitalAssetAction}>
                      <input type="hidden" name="assetId" value={productAsset.asset.id} />
                      <input type="hidden" name="productId" value={productId} />
                      <button className={successButtonClass}>Activer l&apos;asset</button>
                    </form>
                  ) : null}

                  {productAsset.asset.status !== "ARCHIVED" ? (
                    <form action={archiveDigitalAssetAction}>
                      <input type="hidden" name="assetId" value={productAsset.asset.id} />
                      <input type="hidden" name="productId" value={productId} />
                      <button className={secondaryButtonClass}>Archiver l&apos;asset</button>
                    </form>
                  ) : null}

                  <form action={unlinkAssetFromProductAction}>
                    <input type="hidden" name="productId" value={productId} />
                    <input type="hidden" name="assetId" value={productAsset.asset.id} />
                    <button className={dangerButtonClass}>Délier</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <form action={linkAssetToProductAction} className="space-y-4 rounded-xl border border-neutral-800/80 p-4">
        <input type="hidden" name="productId" value={productId} />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-100">Lier un asset existant</h3>
          <p className="text-sm text-neutral-400">
            Sélectionne un asset disponible déjà référencé dans le dashboard.
          </p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="font-medium text-neutral-200">Asset disponible</span>
          <select
            name="assetId"
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
            defaultValue=""
            disabled={availableAssets.length === 0}
          >
            <option value="" disabled>
              {availableAssets.length === 0
                ? "Aucun asset disponible à lier"
                : "Choisir un asset"}
            </option>
            {availableAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.filename} · {asset.status} · {asset.bucket}
              </option>
            ))}
          </select>
        </label>

        <button
          disabled={availableAssets.length === 0}
          className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Lier l&apos;asset
        </button>
      </form>
    </section>
  );
}
