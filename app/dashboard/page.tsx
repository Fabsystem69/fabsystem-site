import { getSessionFromCookies } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { formatEuroFromCents } from "@/lib/format";
import { getEcommerceStatsSummary } from "@/lib/services/ecommerce-stats";
import { listPendingOrdersForPurge } from "@/lib/services/order-purge";
import { KpiTile } from "@/components/dashboard/shell/KpiTile";
import { AttentionList, type AttentionItem } from "@/components/dashboard/shell/AttentionList";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/shell/ActivityFeed";
import { RevenueChart, type RevenuePoint } from "@/components/dashboard/shell/RevenueChart";
import { QuickActions } from "@/components/dashboard/shell/QuickActions";
import {
  AccountingIcon,
  CustomersIcon,
  DiscountIcon,
  ExternalLinkIcon,
  FilesIcon,
  OrdersIcon,
  ProductsIcon,
} from "@/components/dashboard-preview/icons";

// ---------------------------------------------------------------------------
// Page d'accueil admin (lot d'integration du nouveau dashboard). Uniquement
// des donnees reelles, en lecture seule — aucune donnee mockee, aucune
// donnee fictive presentee comme reelle (voir le rapport d'integration).
//
// Devis et facturation ne sont plus geres operationnellement dans FabSystem
// (Indy) : aucun KPI, "A traiter", activite ou raccourci ne s'appuie sur
// Quote/Invoice ici. Leurs pages restent intactes, accessibles via la
// section "Historique" de la sidebar.
// ---------------------------------------------------------------------------


function getMonthBounds(reference: Date, monthsAgo: number) {
  const start = new Date(reference.getFullYear(), reference.getMonth() - monthsAgo, 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

async function getRevenueForMonth(start: Date, end: Date) {
  const result = await prisma.order.aggregate({
    where: { status: "PAID", paidAt: { gte: start, lt: end }, totalCents: { gt: 0 } },
    _count: true,
    _sum: { totalCents: true },
  });

  return { orders: result._count, revenueCents: result._sum.totalCents ?? 0 };
}

function computeTrend(current: number, previous: number): { direction: "up" | "down"; label: string } | undefined {
  if (previous <= 0) return undefined;
  const changePercent = Math.round(((current - previous) / previous) * 100);
  if (changePercent === 0) return undefined;
  return {
    direction: changePercent > 0 ? "up" : "down",
    label: `${changePercent > 0 ? "+" : ""}${changePercent}% vs mois dernier`,
  };
}

async function getPendingTestimonialAttentionItems(): Promise<AttentionItem[]> {
  const pending = await prisma.testimonial
    .findMany({
      where: { isPublished: false },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id: true, displayName: true, quote: true, createdAt: true },
    })
    .catch(() => []);

  return pending.map((testimonial) => ({
    id: `testimonial-${testimonial.id}`,
    title: `Témoignage à valider — ${testimonial.displayName}`,
    context: testimonial.quote.length > 90 ? `${testimonial.quote.slice(0, 90)}…` : testimonial.quote,
    priority: "info",
    priorityLabel: "À faire",
    actionLabel: "Voir le témoignage",
    actionHref: "/dashboard/content/testimonials",
  }));
}

// Lecture seule : compte les commandes PENDING_PAYMENT reellement purgeables
// (memes garde-fous que la purge elle-meme — voir lib/services/order-purge.ts),
// pour la zone "Entretien / Systeme". Ne modifie ni ne supprime rien.
async function getPurgeableStalePendingOrdersCount() {
  const summaries = await listPendingOrdersForPurge().catch(() => []);
  return summaries.filter((summary) => summary.isPurgeTier && summary.eligibility.eligible).length;
}

function formatRelativeTime(date: Date, now: Date) {
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 1) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} j`;

  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(date);
}

async function getRecentActivity(now: Date): Promise<ActivityItem[]> {
  const [recentOrders, recentCustomers, recentDownloads, recentTestimonials] = await Promise.all([
    prisma.order
      .findMany({
        where: { status: "PAID", paidAt: { not: null } },
        orderBy: { paidAt: "desc" },
        take: 5,
        select: { id: true, orderNumber: true, paidAt: true },
      })
      .catch(() => []),
    prisma.customer
      .findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, email: true, createdAt: true } })
      .catch(() => []),
    prisma.downloadGrant
      .findMany({
        where: { lastDownloadedAt: { not: null } },
        orderBy: { lastDownloadedAt: "desc" },
        take: 5,
        select: { id: true, lastDownloadedAt: true, orderItem: { select: { productName: true } } },
      })
      .catch(() => []),
    prisma.testimonial
      .findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, displayName: true, createdAt: true } })
      .catch(() => []),
  ]);

  const items: Array<ActivityItem & { timestamp: number }> = [];

  for (const order of recentOrders) {
    if (!order.paidAt) continue;
    items.push({
      id: `order-${order.id}`,
      label: "Commande payée",
      detail: order.orderNumber,
      time: formatRelativeTime(order.paidAt, now),
      kind: "order",
      timestamp: order.paidAt.getTime(),
    });
  }

  for (const customer of recentCustomers) {
    items.push({
      id: `customer-${customer.id}`,
      label: "Nouveau client",
      detail: customer.email,
      time: formatRelativeTime(customer.createdAt, now),
      kind: "customer",
      timestamp: customer.createdAt.getTime(),
    });
  }

  for (const grant of recentDownloads) {
    if (!grant.lastDownloadedAt) continue;
    items.push({
      id: `download-${grant.id}`,
      label: "Téléchargement",
      detail: grant.orderItem.productName,
      time: formatRelativeTime(grant.lastDownloadedAt, now),
      kind: "download",
      timestamp: grant.lastDownloadedAt.getTime(),
    });
  }

  for (const testimonial of recentTestimonials) {
    items.push({
      id: `testimonial-${testimonial.id}`,
      label: "Nouveau témoignage",
      detail: testimonial.displayName,
      time: formatRelativeTime(testimonial.createdAt, now),
      kind: "testimonial",
      timestamp: testimonial.createdAt.getTime(),
    });
  }

  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
}

async function getRevenueLast30Days(now: Date): Promise<RevenuePoint[]> {
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const orders = await prisma.order
    .findMany({
      where: { status: "PAID", paidAt: { gte: start }, totalCents: { gt: 0 } },
      select: { paidAt: true, totalCents: true },
    })
    .catch(() => []);

  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }

  for (const order of orders) {
    if (!order.paidAt) continue;
    const key = order.paidAt.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + order.totalCents);
    }
  }

  return Array.from(buckets.entries()).map(([day, amountCents]) => ({ day, amountCents }));
}

function getGreetingName(email: string | undefined) {
  if (!email) return "Fabien";
  const localPart = email.split("@")[0] ?? "";
  const firstSegment = localPart.split(/[._-]/)[0] ?? localPart;
  if (!firstSegment) return "Fabien";
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
}

export default async function DashboardPage() {
  const now = new Date();
  const session = await getSessionFromCookies();

  const currentMonth = getMonthBounds(now, 0);
  const previousMonth = getMonthBounds(now, 1);

  const [
    currentMonthRevenue,
    previousMonthRevenue,
    totalCustomers,
    ecommerceStats,
    attentionItems,
    purgeableStalePendingOrdersCount,
    recentActivity,
    revenuePoints,
  ] = await Promise.all([
    getRevenueForMonth(currentMonth.start, currentMonth.end),
    getRevenueForMonth(previousMonth.start, previousMonth.end),
    prisma.customer.count(),
    getEcommerceStatsSummary(now),
    getPendingTestimonialAttentionItems(),
    getPurgeableStalePendingOrdersCount(),
    getRecentActivity(now),
    getRevenueLast30Days(now),
  ]);

  const greetingName = getGreetingName(session?.sub);
  const todayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(now);

  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        {/* En-tete */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
              Bonjour {greetingName}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Voici ce qui mérite votre attention aujourd&apos;hui.{" "}
              <span className="text-neutral-600">·</span>{" "}
              <span className="capitalize text-neutral-600">{todayLabel}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
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

        {/* KPI — activite boutique reelle */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="CA boutique"
            value={formatEuroFromCents(currentMonthRevenue.revenueCents)}
            helper="commandes payées, ce mois"
            trend={computeTrend(currentMonthRevenue.revenueCents, previousMonthRevenue.revenueCents)}
            comparison={{ previous: previousMonthRevenue.revenueCents, current: currentMonthRevenue.revenueCents }}
            icon={<AccountingIcon className="h-4 w-4" />}
          />
          <KpiTile
            label="Commandes"
            value={String(currentMonthRevenue.orders)}
            helper={`${ecommerceStats.freeOrdersToday} offerte(s) aujourd'hui via code`}
            trend={computeTrend(currentMonthRevenue.orders, previousMonthRevenue.orders)}
            comparison={{ previous: previousMonthRevenue.orders, current: currentMonthRevenue.orders }}
            icon={<OrdersIcon className="h-4 w-4" />}
          />
          <KpiTile
            label="Clients"
            value={String(totalCustomers)}
            helper={`au total · +${ecommerceStats.customersThisMonth} ce mois`}
            icon={<CustomersIcon className="h-4 w-4" />}
          />
          <KpiTile
            label="Téléchargements"
            value={String(ecommerceStats.downloadsThisMonth)}
            helper="ce mois, tous produits numériques"
            icon={<FilesIcon className="h-4 w-4" />}
          />
        </div>

        {/* A traiter */}
        <div className="mt-7">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-white">
              À traiter
              {attentionItems.length > 0 ? (
                <span className="ml-2 text-sm font-normal text-neutral-500">({attentionItems.length})</span>
              ) : null}
            </h2>
          </div>
          <AttentionList items={attentionItems} />
        </div>

        {/* Entretien / Systeme — discret, non urgent : uniquement si des
            commandes sont reellement purgeables (memes garde-fous que la
            purge elle-meme, pas un simple compte par anciennete). */}
        {purgeableStalePendingOrdersCount > 0 ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-800/60 bg-neutral-900/30 px-4 py-2.5 text-sm text-neutral-500">
            <span>
              Entretien / Système · {purgeableStalePendingOrdersCount} commande(s) en attente à
              purger
            </span>
            <a href="/dashboard/orders#purge" className="font-medium text-neutral-400 underline-offset-4 hover:text-neutral-200 hover:underline">
              Purger
            </a>
          </div>
        ) : null}

        {/* Activite recente + CA */}
        <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 sm:p-5">
            <h2 className="mb-4 text-base font-semibold text-white">Activité récente</h2>
            <ActivityFeed items={recentActivity} />
          </div>

          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 sm:p-5">
            <h2 className="mb-1 text-base font-semibold text-white">Activité commerciale</h2>
            <RevenueChart points={revenuePoints} referenceDate={now} />
          </div>
        </div>

        {/* Raccourcis */}
        <div className="mt-7">
          <h2 className="mb-3 text-base font-semibold text-white">Raccourcis</h2>
          <QuickActions
            actions={[
              {
                label: "Nouveau client",
                description: "Créer une fiche client",
                href: "/dashboard/customers?new=1",
                icon: <CustomersIcon className="h-4 w-4" />,
              },
              {
                label: "Commandes",
                description: "Consulter les commandes",
                href: "/dashboard/orders",
                icon: <OrdersIcon className="h-4 w-4" />,
              },
              {
                label: "Produits",
                description: "Gérer la boutique",
                href: "/dashboard/catalog",
                icon: <ProductsIcon className="h-4 w-4" />,
              },
              {
                label: "Codes réduction",
                description: "Créer ou gérer une réduction",
                href: "/dashboard/discounts",
                icon: <DiscountIcon className="h-4 w-4" />,
              },
            ]}
          />
        </div>

        <p className="mt-10 pb-4 text-center text-xs text-neutral-700">FabSystem Admin — /dashboard</p>
      </div>
    </div>
  );
}
