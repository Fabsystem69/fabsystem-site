import { prisma } from "@/lib/prisma";
import { formatDeliveryMode, formatServiceType } from "@/lib/service-meta";

export type UrssafReceipt = {
  paidAt: Date;
  customerName: string;
  invoiceNumber: string;
  totalCents: number;
  paymentMethod: string | null;
  paymentRef: string | null;
};

export type UrssafSummary = {
  year: number;
  totals: {
    paidCents: number;
    paidCount: number;
    billedCents: number;
  };
  months: Array<{
    month: number;
    paidCents: number;
    paidCount: number;
  }>;
  quarters: Array<{
    quarter: number;
    paidCents: number;
    paidCount: number;
  }>;
  totalsByServiceType: Array<{
    serviceType: string;
    paidCents: number;
    paidCount: number;
  }>;
  totalsByDeliveryMode: Array<{
    deliveryMode: string;
    paidCents: number;
    paidCount: number;
  }>;
  receipts: UrssafReceipt[];
};

export function parseAccountingYear(value: string | null | undefined) {
  const currentYear = new Date().getFullYear();
  const parsed = Number.parseInt(value ?? String(currentYear), 10);
  return Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100
    ? parsed
    : currentYear;
}

export function formatCentsForCsv(value: number) {
  return (value / 100).toFixed(2);
}

export function getYearDateRange(year: number) {
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)),
  };
}

export async function getUrssafSummary(year: number): Promise<UrssafSummary> {
  const { start, end } = getYearDateRange(year);

  const [paidInvoices, billedInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        paidAt: true,
        total: true,
        paymentMethod: true,
        paymentRef: true,
        number: true,
        serviceType: true,
        deliveryMode: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { paidAt: "asc" },
    }),
    prisma.invoice.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
        issueDate: {
          gte: start,
          lt: end,
        },
      },
      select: {
        total: true,
      },
    }),
  ]);

  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    paidCents: 0,
    paidCount: 0,
  }));

  const quarters = Array.from({ length: 4 }, (_, index) => ({
    quarter: index + 1,
    paidCents: 0,
    paidCount: 0,
  }));

  const receipts: UrssafReceipt[] = paidInvoices
    .filter((invoice): invoice is typeof invoice & { paidAt: Date } => Boolean(invoice.paidAt))
    .map((invoice) => {
      const monthIndex = invoice.paidAt.getUTCMonth();
      months[monthIndex].paidCents += invoice.total;
      months[monthIndex].paidCount += 1;

      const quarterIndex = Math.floor(monthIndex / 3);
      quarters[quarterIndex].paidCents += invoice.total;
      quarters[quarterIndex].paidCount += 1;

      return {
        paidAt: invoice.paidAt,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.number,
        totalCents: invoice.total,
        paymentMethod: invoice.paymentMethod,
        paymentRef: invoice.paymentRef,
      };
    });

  const paidCents = receipts.reduce((sum, receipt) => sum + receipt.totalCents, 0);
  const billedCents = billedInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const serviceTypeMap = new Map<string, { paidCents: number; paidCount: number }>();
  const deliveryModeMap = new Map<string, { paidCents: number; paidCount: number }>();

  for (const invoice of paidInvoices) {
    if (!invoice.paidAt) continue;

    const serviceKey = formatServiceType(invoice.serviceType);
    const modeKey = formatDeliveryMode(invoice.deliveryMode);
    const serviceEntry = serviceTypeMap.get(serviceKey) ?? { paidCents: 0, paidCount: 0 };
    serviceEntry.paidCents += invoice.total;
    serviceEntry.paidCount += 1;
    serviceTypeMap.set(serviceKey, serviceEntry);

    const modeEntry = deliveryModeMap.get(modeKey) ?? { paidCents: 0, paidCount: 0 };
    modeEntry.paidCents += invoice.total;
    modeEntry.paidCount += 1;
    deliveryModeMap.set(modeKey, modeEntry);
  }

  return {
    year,
    totals: {
      paidCents,
      paidCount: receipts.length,
      billedCents,
    },
    months,
    quarters,
    totalsByServiceType: Array.from(serviceTypeMap.entries()).map(([serviceType, values]) => ({
      serviceType,
      paidCents: values.paidCents,
      paidCount: values.paidCount,
    })),
    totalsByDeliveryMode: Array.from(deliveryModeMap.entries()).map(
      ([deliveryMode, values]) => ({
        deliveryMode,
        paidCents: values.paidCents,
        paidCount: values.paidCount,
      })
    ),
    receipts,
  };
}
