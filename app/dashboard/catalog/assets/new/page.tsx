import Link from "next/link";
import { createDigitalAssetAction } from "@/app/dashboard/catalog/assets/actions";
import { DigitalAssetForm } from "@/components/dashboard/DigitalAssetForm";

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
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-950">Creer un asset</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Creation d&apos;une reference `DigitalAsset` privee. Le fichier doit deja exister
          hors du dashboard ; aucun upload n&apos;est effectue ici.
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
        action={createDigitalAssetAction}
        submitLabel="Creer l'asset"
        initialValues={{
          provider: "SUPABASE",
          status: "DRAFT",
        }}
      />
    </section>
  );
}
