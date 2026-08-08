import { createDigitalAssetAction } from "@/app/dashboard/catalog/assets/actions";
import { DigitalAssetForm } from "@/components/dashboard/DigitalAssetForm";
import { AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

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
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <AdminPageHeader
          title="Créer un asset"
          description="Création d'une référence DigitalAsset privée. Le fichier doit déjà exister hors du dashboard ; aucun upload n'est effectué ici."
          backHref="/dashboard/catalog/assets"
          backLabel="Retour aux assets"
        />

        {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        <DigitalAssetForm
          action={createDigitalAssetAction}
          submitLabel="Créer l'asset"
          initialValues={{
            provider: "SUPABASE",
            status: "DRAFT",
          }}
        />
      </main>
    </div>
  );
}
