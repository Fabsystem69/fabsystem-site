import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const DOCUMENTS_PAGE_SIZE = 10;

export function normalizeSearchQuery(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function parsePageParam(value: string | null | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildDocumentSearchWhere(
  search: string
): Prisma.QuoteWhereInput | Prisma.InvoiceWhereInput {
  if (!search) {
    return {};
  }

  return {
    OR: [
      {
        number: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        customer: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        customer: {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ],
  };
}

export async function getQuotesPage(search: string, page: number) {
  const where = buildDocumentSearchWhere(search) as Prisma.QuoteWhereInput;
  const requestedPage = Math.max(page, 1);
  const totalCount = await prisma.quote.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / DOCUMENTS_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * DOCUMENTS_PAGE_SIZE;

  const quotes = await prisma.quote.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: DOCUMENTS_PAGE_SIZE,
  });

  return {
    quotes,
    totalCount,
    totalPages,
    currentPage,
  };
}

export async function getInvoicesPage(search: string, page: number) {
  const where = buildDocumentSearchWhere(search) as Prisma.InvoiceWhereInput;
  const requestedPage = Math.max(page, 1);
  const totalCount = await prisma.invoice.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / DOCUMENTS_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * DOCUMENTS_PAGE_SIZE;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: DOCUMENTS_PAGE_SIZE,
  });

  return {
    invoices,
    totalCount,
    totalPages,
    currentPage,
  };
}
