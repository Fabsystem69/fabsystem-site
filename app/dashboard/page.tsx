import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEuroFromCents } from "@/lib/format";

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
    return {
      cents: 0,
      helper: "mois en cours",
    };
  }
}

function DashboardCard({
  href,
  title,
  description,
  secondary = false,
}: {
  href?: string;
  title: string;
  description: string;
  secondary?: boolean;
}) {
  const className = secondary
    ? "rounded-xl border border-neutral-200 bg-white p-5 hover:bg-neutral-50"
    : "rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:bg-neutral-50";

  const content = (
    <>
      <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600">{description}</p>
    </>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [pendingQuotesCount, signedQuotesCount, monthlyRevenueSummary] = await Promise.all([
    getPendingQuotesCount(),
    getSignedQuotesCount(),
    getMonthlyRevenueSummary(startOfMonth, startOfNextMonth),
  ]);

  return (
    <main className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-neutral-900">Dashboard FabSystem</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Accueil admin reorganise pour mettre le catalogue et l&apos;e-commerce en premier,
          tout en conservant l&apos;ancien administratif en second plan.
        </p>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Indy reste la source officielle pour la comptabilite et les factures.
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-neutral-950">Catalogue / e-commerce</h2>
          <p className="text-sm text-neutral-600">
            Gestion des produits vendus sur FabSystem, commandes, paiements et acces
            numeriques.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            href="/dashboard/catalog"
            title="Catalogue produits"
            description="Consulter, creer et modifier les produits, prix et statuts du commerce."
          />
          <DashboardCard
            href="/dashboard/catalog/assets"
            title="Assets numeriques"
            description="Gerer les references DigitalAsset privees et leurs liaisons aux produits."
          />
          <DashboardCard
            href="/dashboard/orders"
            title="Commandes"
            description="Consulter les commandes e-commerce, leurs items, paiements et acces."
          />
          <DashboardCard
            href="/dashboard/discounts"
            title="Codes réduction"
            description="Créer et piloter les codes coaching ebook à usage unique."
          />
          <DashboardCard
            href="/dashboard/orders"
            title="Paiements"
            description="Suivre l'etat local des tentatives Stripe et la preparation du futur remboursement."
          />
          <DashboardCard
            href="/dashboard/customers"
            title="Clients"
            description="Repertoire client partage entre e-commerce, devis et factures."
          />
          <DashboardCard
            title="Telechargements"
            description="Vue dashboard dediee aux DownloadGrants prevue dans un sprint suivant."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-neutral-950">Compta / administratif</h2>
          <p className="text-sm text-neutral-600">
            Ancien suivi administratif interne. La comptabilite officielle reste geree dans
            Indy.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium text-neutral-600">Devis en attente</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">{pendingQuotesCount}</p>
            <p className="mt-1 text-xs text-neutral-500">non signes et non factures</p>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium text-neutral-600">Devis signes</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">{signedQuotesCount}</p>
            <p className="mt-1 text-xs text-neutral-500">prets a facturer</p>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium text-neutral-600">CA du mois</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatEuroFromCents(monthlyRevenueSummary.cents)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{monthlyRevenueSummary.helper}</p>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            href="/dashboard/quotes"
            title="Devis"
            description="Suivre les devis existants et les parcours de signature."
            secondary
          />
          <DashboardCard
            href="/dashboard/invoices"
            title="Factures"
            description="Consulter les factures, remises et exports PDF historiques."
            secondary
          />
          <DashboardCard
            href="/dashboard/accounting"
            title="Recap URSSAF"
            description="Suivre le recap administratif historique et les exports internes."
            secondary
          />
          <DashboardCard
            href="/dashboard/customers"
            title="Clients administratifs"
            description="Acceder au repertoire client utilise par les devis et factures."
            secondary
          />
          <DashboardCard
            href="/dashboard/quotes/new"
            title="Creer un devis"
            description="Demarrer un nouveau document commercial hors flux e-commerce."
            secondary
          />
          <DashboardCard
            href="/dashboard/invoices/new"
            title="Creer une facture"
            description="Creation manuelle historique conservee pour l'administratif interne."
            secondary
          />
        </div>
      </section>
    </main>
  );
}
