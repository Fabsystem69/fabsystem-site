import Link from "next/link";
import { getUrssafSummary, parseAccountingYear } from "@/lib/accounting";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { getDatabaseErrorMessage } from "@/lib/prisma-errors";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export default async function DashboardAccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = parseAccountingYear(params.year);
  let summary: Awaited<ReturnType<typeof getUrssafSummary>> | null = null;
  let databaseError: string | null = null;

  try {
    summary = await getUrssafSummary(year);
  } catch (error) {
    databaseError = getDatabaseErrorMessage(error);
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Récap URSSAF</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Chiffre d&apos;affaires encaissé et livre des recettes pour la micro-entreprise.
          </p>
        </div>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="year" className="mb-2 block text-sm font-medium text-neutral-700">
              Année
            </label>
            <input
              id="year"
              name="year"
              type="number"
              min="2000"
              max="2100"
              defaultValue={year}
              className="h-11 rounded-md border border-neutral-300 px-3 text-base"
            />
          </div>
          <button
            type="submit"
            className="h-11 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white"
          >
            Charger
          </button>
        </form>
      </div>

      {databaseError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {databaseError}
        </div>
      ) : null}

      {summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">CA encaissé</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                {formatEuroFromCents(summary.totals.paidCents)}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Nb encaissements</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                {summary.totals.paidCount}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">CA facturé</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                {formatEuroFromCents(summary.totals.billedCents)}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Exports</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/api/internal/accounting/urssaf.csv?year=${year}`}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
                >
                  CSV livre des recettes
                </Link>
                <Link
                  href={`/api/internal/accounting/urssaf-quarters.csv?year=${year}`}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
                >
                  CSV trimestres
                </Link>
                <Link
                  href={`/api/internal/accounting/urssaf.pdf?year=${year}`}
                  target="_blank"
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  PDF récap
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              CA encaissé (URSSAF) par trimestre
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {summary.quarters.map((quarter) => (
                <article key={quarter.quarter} className="rounded-lg border border-neutral-200 p-4">
                  <p className="text-sm text-neutral-500">T{quarter.quarter}</p>
                  <p className="mt-2 text-lg font-semibold text-neutral-900">
                    {formatEuroFromCents(quarter.paidCents)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {quarter.paidCount} encaissement{quarter.paidCount > 1 ? "s" : ""}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-neutral-900">CA encaissé par type</h2>
              <div className="mt-4 space-y-3">
                {summary.totalsByServiceType.map((item) => (
                  <div
                    key={item.serviceType}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{item.serviceType}</p>
                      <p className="text-sm text-neutral-500">{item.paidCount} encaissement(s)</p>
                    </div>
                    <p className="font-semibold text-neutral-900">
                      {formatEuroFromCents(item.paidCents)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-neutral-900">CA encaissé par mode</h2>
              <div className="mt-4 space-y-3">
                {summary.totalsByDeliveryMode.map((item) => (
                  <div
                    key={item.deliveryMode}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{item.deliveryMode}</p>
                      <p className="text-sm text-neutral-500">{item.paidCount} encaissement(s)</p>
                    </div>
                    <p className="font-semibold text-neutral-900">
                      {formatEuroFromCents(item.paidCents)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-neutral-900">Mensuel</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Mois</th>
                    <th className="px-4 py-3 font-medium">CA encaissé</th>
                    <th className="px-4 py-3 font-medium">Nb encaissements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {summary.months.map((month, index) => (
                    <tr key={month.month}>
                      <td className="px-4 py-3 text-neutral-700">{MONTH_LABELS[index]}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        {formatEuroFromCents(month.paidCents)}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{month.paidCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-neutral-900">Livre des recettes</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date encaissement</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">N° facture</th>
                    <th className="px-4 py-3 font-medium">Montant encaissé</th>
                    <th className="px-4 py-3 font-medium">Mode</th>
                    <th className="px-4 py-3 font-medium">Référence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {summary.receipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-neutral-500">
                        Aucun encaissement pour cette année.
                      </td>
                    </tr>
                  ) : (
                    summary.receipts.map((receipt) => (
                      <tr key={`${receipt.invoiceNumber}-${receipt.paidAt.toISOString()}`}>
                        <td className="px-4 py-3 text-neutral-700">{formatDate(receipt.paidAt)}</td>
                        <td className="px-4 py-3 text-neutral-700">{receipt.customerName}</td>
                        <td className="px-4 py-3 text-neutral-700">{receipt.invoiceNumber}</td>
                        <td className="px-4 py-3 text-neutral-700">
                          {formatEuroFromCents(receipt.totalCents)}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {receipt.paymentMethod || "-"}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{receipt.paymentRef || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
