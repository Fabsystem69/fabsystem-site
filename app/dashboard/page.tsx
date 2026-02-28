import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatEuroFromCents(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

async function getPendingQuotesCount() {
  try {
    return await prisma.quote.count({
      where: {
        signedAt: null,
        sourceInvoice: { is: null },
        NOT: { status: "REJECTED" },
      },
    });
  } catch {
    try {
      return await prisma.quote.count({
        where: {
          signedAt: null,
          NOT: { status: "REJECTED" },
        },
      });
    } catch {
      return 0;
    }
  }
}

async function getSignedQuotesCount() {
  try {
    return await prisma.quote.count({
      where: {
        OR: [{ signedAt: { not: null } }, { status: "ACCEPTED" }],
        sourceInvoice: { is: null },
      },
    });
  } catch {
    try {
      return await prisma.quote.count({
        where: {
          OR: [{ signedAt: { not: null } }, { status: "ACCEPTED" }],
        },
      });
    } catch {
      return 0;
    }
  }
}

async function getInvoicedQuotesCount() {
  try {
    const linkedInvoices = await prisma.invoice.findMany({
      where: {
        sourceQuoteId: { not: null },
      },
      select: {
        sourceQuoteId: true,
      },
      distinct: ["sourceQuoteId"],
    });

    return linkedInvoices.length;
  } catch {
    try {
      return await prisma.invoice.count({
        where: {
          sourceQuoteId: { not: null },
        },
      });
    } catch {
      // TODO: fallback to quote-side detection if invoice linkage differs in a legacy schema.
      return 0;
    }
  }
}

async function getMonthlyRevenueSummary(startOfMonth: Date, startOfNextMonth: Date) {
  try {
    const paidInvoices = await prisma.invoice.aggregate({
      where: {
        paidAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    return {
      cents: paidInvoices._sum.total ?? 0,
      helper: "encaissé ce mois",
    };
  } catch {
    try {
      const paidStatusInvoices = await prisma.invoice.aggregate({
        where: {
          status: "PAID",
          issueDate: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
        _sum: {
          total: true,
        },
      });

      return {
        cents: paidStatusInvoices._sum.total ?? 0,
        helper: "payées (statut) ce mois",
      };
    } catch {
      try {
        const issuedInvoices = await prisma.invoice.aggregate({
          where: {
            issueDate: {
              gte: startOfMonth,
              lt: startOfNextMonth,
            },
          },
          _sum: {
            total: true,
          },
        });

        return {
          cents: issuedInvoices._sum.total ?? 0,
          helper: "émis ce mois",
        };
      } catch {
        return {
          cents: 0,
          helper: "mois en cours",
        };
      }
    }
  }
}

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [
    pendingQuotesCount,
    signedQuotesCount,
    invoicedQuotesCount,
    monthlyRevenueSummary,
  ] = await Promise.all([
    getPendingQuotesCount(),
    getSignedQuotesCount(),
    getInvoicedQuotesCount(),
    getMonthlyRevenueSummary(startOfMonth, startOfNextMonth),
  ]);

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold text-neutral-900">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Vue rapide des devis et du chiffre d&apos;affaires en cours.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm font-medium text-neutral-600">Devis en attente</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {pendingQuotesCount}
          </p>
          <p className="mt-1 text-xs text-neutral-500">non signés et non facturés</p>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm font-medium text-neutral-600">Devis signés</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {signedQuotesCount}
          </p>
          <p className="mt-1 text-xs text-neutral-500">prêts à facturer</p>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm font-medium text-neutral-600">Devis facturés</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {invoicedQuotesCount}
          </p>
          <p className="mt-1 text-xs text-neutral-500">au moins 1 facture liée</p>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm font-medium text-neutral-600">CA du mois</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {formatEuroFromCents(monthlyRevenueSummary.cents)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {monthlyRevenueSummary.helper}
          </p>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/quotes/new"
          className="rounded-lg border border-neutral-200 bg-white p-4"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Créer un devis</h2>
          <p className="mt-2 text-sm text-neutral-600">Démarrer un nouveau devis.</p>
        </Link>

        <Link
          href="/dashboard/invoices/new"
          className="rounded-lg border border-neutral-200 bg-white p-4"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Créer une facture</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Créer une facture manuellement ou après devis.
          </p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/customers"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Clients</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Gérer le répertoire client utilisé par les devis et factures.
          </p>
        </Link>

        <Link
          href="/dashboard/quotes"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Devis</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Créer des devis simples avec lignes et totaux stockés en centimes.
          </p>
        </Link>

        <Link
          href="/dashboard/invoices"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Factures</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Créer, modifier, supprimer et exporter les factures en PDF.
          </p>
        </Link>

        <Link
          href="/dashboard/accounting"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Récap URSSAF</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Suivre le CA encaissé, les trimestres et exporter le livre des recettes.
          </p>
        </Link>
      </div>
    </main>
  );
}
