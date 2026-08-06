import Link from "next/link";
import { notFound } from "next/navigation";
import { updateDigitalAssetAction } from "@/app/dashboard/catalog/assets/actions";
import { DigitalAssetForm } from "@/components/dashboard/DigitalAssetForm";
import { getDashboardAssetForEdit } from "@/lib/services/catalog";

type DashboardCatalogAssetsEditPageProps = {
  params: Promise<{
    assetId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function DashboardCatalogAssetsEditPage({
  params,
  searchParams,
}: DashboardCatalogAssetsEditPageProps) {
  const { assetId } = await params;
  const { error, success } = await searchParams;

  let asset;
  try {
    asset = await getDashboardAssetForEdit(assetId);
  } catch {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Modifier l&apos;asset</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Mise a jour des metadonnees de reference stockees dans Prisma. Aucune URL signee
          n&apos;est generee et aucun upload Supabase n&apos;est lance depuis cette page.
        </p>
        <Link
          href="/dashboard/catalog/assets"
          className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          Retour aux assets
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

      <DigitalAssetForm
        action={updateDigitalAssetAction}
        submitLabel="Enregistrer l'asset"
        initialValues={{
          assetId: asset.id,
          provider: asset.provider,
          filename: asset.filename,
          bucket: asset.bucket,
          path: asset.path,
          status: asset.status,
        }}
      />
    </section>
  );
}
