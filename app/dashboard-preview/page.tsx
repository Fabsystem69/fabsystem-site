import { getSessionFromCookies } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { formatEuroFromCents, formatCustomerDisplayName } from "@/lib/format";
import { getEcommerceStatsSummary } from "@/lib/services/ecommerce-stats";
import { KpiTile } from "@/components/dashboard-preview/KpiTile";
import { AttentionList, type AttentionItem } from "@/components/dashboard-preview/AttentionList";
import { ActivityFeed } from "@/components/dashboard-preview/ActivityFeed";
import { RevenueChart } from "@/components/dashboard-preview/RevenueChart";
import { QuickActions } from "@/components/dashboard-preview/QuickActions";
import {
  AccountingIcon,
  CustomersIcon,
  ExternalLinkIcon,
  InvoicesIcon,
  OrdersIcon,
  QuotesIcon,
} from "@/components/dashboard-preview/icons";
import { DEMO_ACTIVITY_ITEMS, DEMO_REVENUE_LAST_30_DAYS } from "@/components/dashboard-preview/mock-data";

// ---------------------------------------------------------------------------
// Donnees REELLES (lecture seule, aucune ecriture) : KPI + "A traiter".
// Requetes calquees sur app/dashboard/page.tsx (meme prisma, memes tables),
// dupliquees ici volontairement pour garder la preview totalement isolee du
// dashboard de production — aucun fichier existant n'est modifie.
// ---------------------------------------------------------------------------

function getMonthBounds(reference: Date, monthsAgo: number) {
  const start = new Date(reference.getFullYear(), reference.getMonth() - monthsAgo, 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

async function getRevenueForMonth(start: Date, end: Date) {
  const result = await prisma.order.aggregate({
    where: {
      status: "PAID",
      paidAt: { gte: start, lt: end },
      totalCents: { gt: 0 },
    },
    _count: true,
    _sum: { totalCents: true },
  });

  return {
    orders: result._count,
    revenueCents: result._sum.totalCents ?? 0,
  };
}

async function getPendingQuotesCount() {
  try {
    return await prisma.quote.count({
      where: { signedAt: null, sourceInvoice: { is: null }, NOT: { status: "REJECTED" } },
    });
  } catch {
    return prisma.quote.count({ where: { signedAt: null, NOT: { status: "REJECTED" } } });
  }
}

async function getTotalCustomersCount() {
  return prisma.customer.count();
}

function computeTrend(current: number, previous: number): { direction: "up" | "down"; label: string } | undefined {
  if (previous <= 0) {
    return undefined;
  }

  const changePercent = Math.round(((current - previous) / previous) * 100);

  if (changePercent === 0) {
    return undefined;
  }

  return {
    direction: changePercent > 0 ? "up" : "down",
    label: `${changePercent > 0 ? "+" : ""}${changePercent}% vs mois dernier`,
  };
}

function daysSince(date: Date, now: Date) {
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function hoursSince(date: Date, now: Date) {
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
}

async function getAttentionItems(now: Date): Promise<AttentionItem[]> {
  const [pendingQuotes, pendingOrders, readyToInvoiceCount] = await Promise.all([
    prisma.quote
      .findMany({
        where: { signedAt: null, sourceInvoice: { is: null }, NOT: { status: "REJECTED" } },
        include: { customer: { select: { name: true, email: true } } },
        orderBy: { updatedAt: "asc" },
        take: 3,
      })
      .catch(() => []),
    prisma.order
      .findMany({
        where: { status: "PENDING_PAYMENT" },
        orderBy: { createdAt: "asc" },
        take: 3,
      })
      .catch(() => []),
    prisma.quote
      .count({
        where: { OR: [{ signedAt: { not: null } }, { status: "ACCEPTED" }], sourceInvoice: { is: null } },
      })
      .catch(() => 0),
  ]);

  const items: AttentionItem[] = [];

  for (const quote of pendingQuotes) {
    const waitingDays = daysSince(quote.updatedAt, now);
    items.push({
      id: `quote-${quote.id}`,
      title: `Devis ${quote.number} en attente`,
      context: `${formatCustomerDisplayName(quote.customer)} — en attente depuis ${waitingDays <= 0 ? "aujourd'hui" : `${waitingDays} j`}`,
      priority: waitingDays >= 3 ? "high" : "medium",
      priorityLabel: waitingDays >= 3 ? "Urgent" : "À suivre",
      actionLabel: "Voir le devis",
      actionHref: `/dashboard/quotes/${quote.id}`,
    });
  }

  for (const order of pendingOrders) {
    const waitingHours = hoursSince(order.createdAt, now);
    items.push({
      id: `order-${order.id}`,
      title: `Paiement à vérifier — ${order.orderNumber}`,
      context: `${order.customerEmail} — en attente depuis ${waitingHours <= 0 ? "moins d'1 h" : `${waitingHours} h`}`,
      priority: waitingHours >= 2 ? "high" : "medium",
      priorityLabel: waitingHours >= 2 ? "Urgent" : "À suivre",
      actionLabel: "Voir la commande",
      actionHref: `/dashboard/orders/${order.id}`,
    });
  }

  if (readyToInvoiceCount > 0) {
    items.push({
      id: "quotes-ready-to-invoice",
      title: `${readyToInvoiceCount} devis signé${readyToInvoiceCount > 1 ? "s" : ""} prêt${readyToInvoiceCount > 1 ? "s" : ""} à facturer`,
      context: "Accepté par le client, aucune facture générée pour l'instant",
      priority: "medium",
      priorityLabel: "À suivre",
      actionLabel: "Voir les devis",
      actionHref: "/dashboard/quotes",
    });
  }

  return items;
}

function getGreetingName(email: string | undefined) {
  if (!email) return "Fabien";
  const localPart = email.split("@")[0] ?? "";
  const firstSegment = localPart.split(/[._-]/)[0] ?? localPart;
  if (!firstSegment) return "Fabien";
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
}

export default async function DashboardPreviewPage() {
  const now = new Date();
  const session = await getSessionFromCookies();

  const currentMonth = getMonthBounds(now, 0);
  const previousMonth = getMonthBounds(now, 1);

  const [
    currentMonthRevenue,
    previousMonthRevenue,
    pendingQuotesCount,
    totalCustomers,
    ecommerceStats,
    attentionItems,
  ] = await Promise.all([
    getRevenueForMonth(currentMonth.start, currentMonth.end),
    getRevenueForMonth(previousMonth.start, previousMonth.end),
    getPendingQuotesCount(),
    getTotalCustomersCount(),
    getEcommerceStatsSummary(now),
    getAttentionItems(now),
  ]);

  const greetingName = getGreetingName(session?.sub);
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* En-tete */}
      <div className="mb-2 rounded-xl border border-brand-400/20 bg-brand-400/5 px-4 py-2.5 text-xs text-brand-300">
        Aperçu de direction visuelle — cette page n&apos;affecte pas le dashboard en production.
        Les 4 indicateurs et la liste « À traiter » sont réels (lecture seule) ; l&apos;activité
        récente et le graphique de chiffre d&apos;affaires sont des données de démonstration.
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Bonjour {greetingName}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Voici ce qui mérite votre attention aujourd&apos;hui.
          </p>
          <p className="mt-1 text-xs capitalize text-neutral-600">{todayLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
          >
            Voir le site
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
          <span className="flex h-9 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 text-sm font-medium text-neutral-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-400 text-[11px] font-bold text-neutral-950">
              {greetingName.charAt(0)}
            </span>
            Admin
          </span>
        </div>
      </div>

      {/* KPI */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="CA du mois"
          value={formatEuroFromCents(currentMonthRevenue.revenueCents)}
          helper="commandes payées"
          trend={computeTrend(currentMonthRevenue.revenueCents, previousMonthRevenue.revenueCents)}
          icon={<AccountingIcon className="h-4 w-4" />}
        />
        <KpiTile
          label="Commandes"
          value={String(currentMonthRevenue.orders)}
          helper={`${ecommerceStats.freeOrdersToday} offerte(s) aujourd'hui via code`}
          trend={computeTrend(currentMonthRevenue.orders, previousMonthRevenue.orders)}
          icon={<OrdersIcon className="h-4 w-4" />}
        />
        <KpiTile
          label="Devis en attente"
          value={String(pendingQuotesCount)}
          helper="non signés et non facturés"
          icon={<QuotesIcon className="h-4 w-4" />}
        />
        <KpiTile
          label="Clients"
          value={String(totalCustomers)}
          helper="au total"
          icon={<CustomersIcon className="h-4 w-4" />}
        />
      </div>

      {/* A traiter */}
      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">
            À traiter
            {attentionItems.length > 0 ? (
              <span className="ml-2 text-sm font-normal text-neutral-500">({attentionItems.length})</span>
            ) : null}
          </h2>
        </div>
        <AttentionList items={attentionItems} />
      </div>

      {/* Activite recente + CA */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Activité récente</h2>
            <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Démonstration
            </span>
          </div>
          <ActivityFeed items={DEMO_ACTIVITY_ITEMS} />
        </div>

        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Activité commerciale</h2>
            <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Démonstration
            </span>
          </div>
          <RevenueChart points={DEMO_REVENUE_LAST_30_DAYS} />
        </div>
      </div>

      {/* Raccourcis */}
      <div className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-white">Raccourcis</h2>
        <QuickActions
          actions={[
            {
              label: "Nouveau client",
              href: "/dashboard/customers?new=1",
              icon: <CustomersIcon className="h-4 w-4" />,
            },
            {
              label: "Nouveau devis",
              href: "/dashboard/quotes/new",
              icon: <QuotesIcon className="h-4 w-4" />,
            },
            {
              label: "Nouvelle facture",
              href: "/dashboard/invoices/new",
              icon: <InvoicesIcon className="h-4 w-4" />,
            },
          ]}
        />
      </div>

      <p className="mt-10 pb-4 text-center text-xs text-neutral-700">
        Aperçu de direction visuelle FabSystem — /dashboard-preview
      </p>
    </div>
  );
}
