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
      provider: "SUPABASE";
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

export function ProductAssetManager({
  productId,
  linkedAssets,
  availableAssets,
}: ProductAssetManagerProps) {
  return (
    <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-neutral-950">Assets liés</h2>
        <p className="text-sm text-neutral-600">
          Cette section gere uniquement les references Prisma des assets numeriques. Aucun
          upload Supabase ni signed URL n&apos;est genere ici.
        </p>
      </div>

      {linkedAssets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
          Aucun asset n&apos;est encore lie a ce produit.
        </div>
      ) : (
        <div className="space-y-3">
          {linkedAssets.map((productAsset) => (
            <article
              key={`${productAsset.productId}-${productAsset.assetId}`}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1 text-sm text-neutral-700">
                  <p className="font-medium text-neutral-950">{productAsset.asset.filename}</p>
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
                      <button className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
                        Activer l&apos;asset
                      </button>
                    </form>
                  ) : null}

                  {productAsset.asset.status !== "ARCHIVED" ? (
                    <form action={archiveDigitalAssetAction}>
                      <input type="hidden" name="assetId" value={productAsset.asset.id} />
                      <input type="hidden" name="productId" value={productId} />
                      <button className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50">
                        Archiver l&apos;asset
                      </button>
                    </form>
                  ) : null}

                  <form action={unlinkAssetFromProductAction}>
                    <input type="hidden" name="productId" value={productId} />
                    <input type="hidden" name="assetId" value={productAsset.asset.id} />
                    <button className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
                      Délier
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <form action={linkAssetToProductAction} className="space-y-4 rounded-lg border border-neutral-200 p-4">
        <input type="hidden" name="productId" value={productId} />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-900">Lier un asset existant</h3>
          <p className="text-sm text-neutral-600">
            Selectionne un asset disponible deja reference dans le dashboard.
          </p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="font-medium text-neutral-900">Asset disponible</span>
          <select
            name="assetId"
            className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
            defaultValue=""
            disabled={availableAssets.length === 0}
          >
            <option value="" disabled>
              {availableAssets.length === 0
                ? "Aucun asset disponible a lier"
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
          className="rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Lier l&apos;asset
        </button>
      </form>
    </section>
  );
}
