import {
  createDigitalAssetAction,
  createDigitalAssetFromUploadAction,
} from "@/app/dashboard/catalog/assets/actions";
import { AssetUploadForm } from "@/components/dashboard/AssetUploadForm";
import { DigitalAssetForm } from "@/components/dashboard/DigitalAssetForm";
import {
  DashboardPageShell, AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

type DashboardCatalogAssetsNewPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function DashboardCatalogAssetsNewPage({
  searchParams,
}: DashboardCatalogAssetsNewPageProps) {
  const { error, success } = await searchParams;

  return (
    <DashboardPageShell maxWidth="3xl">
        <AdminPageHeader
          title="Créer un asset"
          description="Création d'une référence DigitalAsset privée. Le fichier doit déjà exister hors du dashboard ; aucun upload n'est effectué ici."
          backHref="/dashboard/catalog/assets"
          backLabel="Retour aux assets"
        />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        <AssetUploadForm createAssetAction={createDigitalAssetFromUploadAction} />

        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-600">
          <div className="h-px flex-1 bg-neutral-800" />
          ou renseigner un fichier déjà présent sur le stockage
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        <DigitalAssetForm
          action={createDigitalAssetAction}
          submitLabel="Créer l'asset"
          initialValues={{
            provider: "SUPABASE",
            status: "DRAFT",
          }}
        />
  </DashboardPageShell>
  );
}
