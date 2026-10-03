import Link from "next/link";
import { sendPurchaseLinkAction } from "@/app/dashboard/purchase-links/actions";
import { AdminAlert, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";
import { formatEuroFromCents } from "@/lib/format";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { listActiveBuyNowProducts } from "@/lib/services/catalog";
import { buildPurchaseLink, listCustomersForPurchaseLink } from "@/lib/services/purchase-link-email";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-2 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white";

export default async function DashboardPurchaseLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const [products, customers] = await Promise.all([listActiveBuyNowProducts(), listCustomersForPurchaseLink()]);
  const baseUrl = getRequiredBaseUrl();

  const rows = products.map((product) => {
    const price = product.prices.find((candidate) => candidate.status === "ACTIVE");
    return {
      slug: product.slug,
      name: product.name,
      price: price ? formatEuroFromCents(price.unitAmountCents) : "—",
      link: buildPurchaseLink(baseUrl, product.slug),
    };
  });

  return (
    <DashboardPageShell maxWidth="3xl">
      <AdminPageHeader
        title="Liens d'achat"
        backHref="/dashboard"
        backLabel="Retour au dashboard"
        description="Envoyez à un client un lien qui ajoute le produit à son panier, avec un mail qui explique toute la démarche de paiement. Aucune fiche à remplir."
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
      {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

      <form
        action={sendPurchaseLinkAction}
        className="space-y-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-6"
      >
        <label className="block text-sm font-medium text-neutral-200">
          Produit
          <select name="productSlug" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Choisir un produit ou un pack…
            </option>
            {rows.map((row) => (
              <option key={row.slug} value={row.slug}>
                {row.name} — {row.price}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-200">
            E-mail du client
            <input
              name="customerEmail"
              type="email"
              required
              list="purchase-link-customers"
              autoComplete="off"
              placeholder="Tapez pour chercher un client existant…"
              className={inputClass}
            />
            <datalist id="purchase-link-customers">
              {customers.map((customer) => (
                <option key={customer.email} value={customer.email}>
                  {customer.name ?? customer.email}
                </option>
              ))}
            </datalist>
          </label>
          <label className="block text-sm font-medium text-neutral-200">
            Prénom / nom (repris de la fiche client si vide)
            <input name="customerName" type="text" maxLength={120} className={inputClass} />
          </label>
        </div>

        <label className="block text-sm font-medium text-neutral-200">
          Message personnel (facultatif, ajouté sous le lien)
          <textarea name="personalNote" rows={3} maxLength={1000} className={inputClass} />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-bold text-neutral-900 hover:bg-brand-300"
          >
            Envoyer le mail
          </button>
          <Link
            href="/dashboard/content/email-templates/purchase-link"
            className="text-sm text-neutral-300 underline underline-offset-2"
          >
            Modifier le texte du mail
          </Link>
        </div>
      </form>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold text-white">Liens directs (à copier)</h2>
        {rows.map((row) => (
          <div key={row.slug} className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4">
            <p className="text-sm font-medium text-white">
              {row.name} <span className="text-neutral-400">— {row.price}</span>
            </p>
            <input
              readOnly
              value={row.link}
              aria-label={`Lien d'achat ${row.name}`}
              className="mt-2 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-300"
            />
          </div>
        ))}
      </section>
    </DashboardPageShell>
  );
}
