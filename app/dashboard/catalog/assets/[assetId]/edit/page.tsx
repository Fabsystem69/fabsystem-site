import { notFound } from "next/navigation";
import { updateDigitalAssetAction } from "@/app/dashboard/catalog/assets/actions";
import { DigitalAssetForm } from "@/components/dashboard/DigitalAssetForm";
import { getDashboardAssetForEdit } from "@/lib/services/catalog";
import { AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

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
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Modifier l'asset"
          description="Mise à jour des métadonnées de référence stockées dans Prisma. Aucune URL signée n'est générée et aucun upload Supabase n'est lancé depuis cette page."
          backHref="/dashboard/catalog/assets"
          backLabel="Retour aux assets"
        />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

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
      </main>
    </div>
  );
}
