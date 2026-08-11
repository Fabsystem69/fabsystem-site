import type { Metadata } from "next";
import Link from "next/link";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";
import { getOrderAccessByNumber } from "@/lib/services/order-access";

export const metadata: Metadata = {
  title: "Merci pour votre commande",
  description: "Retrouvez votre commande FabSystem et les téléchargements numériques disponibles.",
  alternates: {
    canonical: "/commande/merci",
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type MerciPageProps = {
  searchParams: Promise<{
    order?: string;
  }>;
};

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{description}</p>
    </div>
  );
}

export default async function MerciCommandePage({ searchParams }: MerciPageProps) {
  const { order } = await searchParams;
  const orderNumber = order?.trim() ?? "";
  const session = await getCustomerSessionFromCookie();

  let state:
    | { kind: "missing_param" }
    | { kind: "missing_order" }
    | { kind: "pending"; orderNumber: string }
    | {
        kind: "paid";
        orderNumber: string;
        customerEmail: string;
        downloads: Array<{
          grantId: string;
          productName: string;
          filename: string;
          downloadsRemaining: number;
          downloadCount: number;
          maxDownloads: number;
        }>;
      };

  if (!orderNumber) {
    state = { kind: "missing_param" };
  } else {
    const result = await getOrderAccessByNumber(orderNumber);

    if (result.status === "missing") {
      state = { kind: "missing_order" };
    } else if (result.status === "pending") {
      state = {
        kind: "pending",
        orderNumber: result.orderNumber,
      };
    } else {
      state = {
        kind: "paid",
        orderNumber: result.orderNumber,
        customerEmail: result.customerEmail,
        downloads: result.downloads,
      };
    }
  }

  const hasMatchingCustomerSession =
    state.kind === "paid" &&
    !!session &&
    session.customer.email.trim().toLowerCase() === state.customerEmail.trim().toLowerCase();

  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Commande FabSystem
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Merci pour votre commande
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
              Cette page donne un acces minimal a votre commande numerique et a ses fichiers,
              generes de facon securisee et valables uniquement pour vous.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        {state.kind === "missing_param" ? (
          <EmptyState
            title="Commande introuvable"
            description="Aucun numero de commande n'a ete fourni dans l'URL."
          />
        ) : null}

        {state.kind === "missing_order" ? (
          <EmptyState
            title="Commande introuvable"
            description="Nous n'avons pas retrouve cette commande. Verifiez le numero transmis."
          />
        ) : null}

        {state.kind === "pending" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-amber-950">Paiement en cours de confirmation</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              La commande <span className="font-medium">{state.orderNumber}</span> existe bien,
              mais le paiement n&apos;est pas encore confirme. Revenez dans quelques instants.
            </p>
          </div>
        ) : null}

        {state.kind === "paid" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 px-6 py-4">
                <h2 className="text-base font-semibold text-neutral-950">
                  Telechargements disponibles
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Commande <span className="font-medium text-neutral-900">{state.orderNumber}</span>
                </p>
              </div>

              {!hasMatchingCustomerSession ? (
                <div className="px-6 py-6">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-medium text-neutral-950">
                      Connectez-vous pour accéder à vos téléchargements
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                      Les fichiers de cette commande sont désormais disponibles depuis votre espace
                      client sécurisé.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/connexion-client"
                        className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                      >
                        Se connecter à mon compte
                      </Link>
                    </div>
                  </div>
                </div>
              ) : state.downloads.length === 0 ? (
                <div className="px-6 py-6">
                  <EmptyState
                    title="Aucun telechargement disponible"
                    description="Aucun DownloadGrant actif n'est actuellement disponible pour cette commande."
                  />
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {state.downloads.map((download) => (
                    <article
                      key={download.grantId}
                      className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-neutral-950">
                          {download.productName}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-700">{download.filename}</p>
                        <dl className="mt-3 grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
                          <div>
                            <dt className="text-neutral-500">Telechargements restants</dt>
                            <dd className="font-medium text-neutral-900">
                              {download.downloadsRemaining}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-neutral-500">Limite</dt>
                            <dd className="font-medium text-neutral-900">
                              {download.maxDownloads}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <a
                        href={`/api/downloads/${download.grantId}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                      >
                        Telecharger
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <h2 className="text-base font-semibold text-neutral-950">A propos de cet acces</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Cette page repose temporairement sur le numero de commande pour retrouver la
                commande, mais les telechargements passent desormais par une session client
                securisee.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Chaque clic genere un lien de telechargement securise et de courte duree,
                valable uniquement pour vous.
              </p>
              <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-4">
                <p className="text-sm font-semibold text-neutral-950">Besoin d&apos;aide ?</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Si un telechargement n&apos;apparait pas encore, attendez la confirmation du paiement
                  puis rechargez cette page.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/boutique"
                  className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4"
                >
                  Retourner a la boutique
                </Link>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}
