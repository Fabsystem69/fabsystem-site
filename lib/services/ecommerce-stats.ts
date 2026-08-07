import { prisma } from "@/lib/prisma";

export type EcommerceStatsSummary = {
  ordersToday: number;
  revenueTodayCents: number;
  freeOrdersToday: number;
  ordersThisMonth: number;
  revenueThisMonthCents: number;
  customersThisMonth: number;
  couponsRedeemedThisMonth: number;
  downloadsThisMonth: number;
};

function getDayBounds(now: Date) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfNextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { startOfDay, startOfNextDay };
}

function getMonthBounds(now: Date) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startOfMonth, startOfNextMonth };
}

export async function getEcommerceStatsSummary(
  now: Date = new Date()
): Promise<EcommerceStatsSummary> {
  const { startOfDay, startOfNextDay } = getDayBounds(now);
  const { startOfMonth, startOfNextMonth } = getMonthBounds(now);

  const [
    paidOrdersToday,
    freeOrdersToday,
    paidOrdersThisMonth,
    couponsRedeemedThisMonth,
    downloadsThisMonth,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: startOfDay, lt: startOfNextDay },
        totalCents: { gt: 0 },
      },
      _count: true,
      _sum: { totalCents: true },
    }),
    prisma.order.count({
      where: {
        status: "PAID",
        paidAt: { gte: startOfDay, lt: startOfNextDay },
        totalCents: 0,
      },
    }),
    prisma.order.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      select: { totalCents: true, customerEmail: true },
    }),
    prisma.discountRedemption.count({
      where: { redeemedAt: { gte: startOfMonth, lt: startOfNextMonth } },
    }),
    prisma.downloadGrant.count({
      where: { lastDownloadedAt: { gte: startOfMonth, lt: startOfNextMonth } },
    }),
  ]);

  const revenueThisMonthCents = paidOrdersThisMonth.reduce(
    (sum, order) => sum + order.totalCents,
    0
  );
  const customersThisMonth = new Set(paidOrdersThisMonth.map((order) => order.customerEmail))
    .size;

  return {
    ordersToday: paidOrdersToday._count,
    revenueTodayCents: paidOrdersToday._sum.totalCents ?? 0,
    freeOrdersToday,
    ordersThisMonth: paidOrdersThisMonth.length,
    revenueThisMonthCents,
    customersThisMonth,
    couponsRedeemedThisMonth,
    downloadsThisMonth,
  };
}
