import { notFound } from "next/navigation";
import { formatCustomerDisplayName } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { listCatalogProductsForAdmin } from "@/lib/services/catalog";
import { grantResourceAction } from "../../actions";
import {
  DashboardPageShell, AdminAlert, AdminPageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function GrantCustomerResourcePage({ params, searchParams }: Params) {
  const { id } = await params;
  const { error } = await searchParams;

  const [customer, products] = await Promise.all([
    prisma.customer.findUnique({ where: { id } }),
    listCatalogProductsForAdmin(),
  ]);

  if (!customer) {
    notFound();
  }

  // Seuls les produits telechargeables ont un fichier a offrir directement —
  // BUNDLE/SCHEMA_UNLOCK/COACHING_30MIN n'ont pas d'asset unitaire pertinent
  // pour ce flux (cf. lib/services/download-grant.ts, meme filtrage implicite
  // par la presence d'assets ACTIVE). Retour utilisateur : les anciens packs
  // archives (nomenclature Amarrage/Cap/Passerelle/Grand Large) polluaient
  // ce selecteur — listCatalogProductsForAdmin() ne filtre pas par statut,
  // status === "ACTIVE" exclut donc les produits archives/brouillon ici.
  const options = products
    .filter(
      (product) =>
        product.status === "ACTIVE" &&
        (product.productType === "EBOOK" || product.productType === "DIGITAL_DOWNLOAD")
    )
    .flatMap((product) =>
      product.assets
        .filter((productAsset) => productAsset.asset.status === "ACTIVE")
        .map((productAsset) => ({
          value: `${product.id}:${productAsset.assetId}`,
          label: `${product.name} — ${productAsset.asset.filename}`,
        }))
    );

  return (
    <DashboardPageShell maxWidth="2xl">
        <AdminPageHeader
          title="Offrir une ressource"
          description={`Octroi direct a ${formatCustomerDisplayName(customer)}, sans commande — visible immediatement dans son espace client.`}
          backHref={`/dashboard/customers/${customer.id}`}
          backLabel="Retour a la fiche client"
        />

        {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

        {options.length === 0 ? (
          <AdminAlert tone="warning">
            Aucun produit avec un fichier actif n&apos;est disponible. Ajoutez un ebook ou un
            telechargement numerique actif depuis le catalogue avant de pouvoir l&apos;offrir.
          </AdminAlert>
        ) : (
          <form
            action={grantResourceAction}
            className="space-y-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-6"
          >
            <input type="hidden" name="customerId" value={customer.id} />

            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-200">Ressource</span>
              <select
                name="resource"
                required
                defaultValue=""
                className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              >
                <option value="" disabled>
                  Choisissez une ressource…
                </option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-200">
                Note interne <span className="text-neutral-500">(optionnel)</span>
              </span>
              <input
                name="note"
                type="text"
                className="block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                placeholder="Ex. geste commercial suite a un SAV"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-400 px-4 text-sm font-bold text-neutral-950 hover:bg-brand-300"
            >
              Offrir cette ressource
            </button>
          </form>
        )}
  </DashboardPageShell>
  );
}
