import type { Prisma } from "@/lib/generated/prisma/client";
import { type z } from "zod";
import { customerInputSchema, normalizeCustomerData } from "@/lib/customer-payload";
import { badRequest, notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";

const DEFAULT_CUSTOMERS_PAGE_SIZE = 20;
const MAX_CUSTOMERS_PAGE_SIZE = 100;
const MAX_CUSTOMER_OPTIONS = 200;

export type CustomerInput = z.infer<typeof customerInputSchema>;

export function normalizeCustomerSearchQuery(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function parseCustomerPageParam(value: string | null | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseCustomerLimitParam(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_CUSTOMERS_PAGE_SIZE;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CUSTOMERS_PAGE_SIZE;
  }

  return Math.min(parsed, MAX_CUSTOMERS_PAGE_SIZE);
}

function buildCustomerSearchWhere(search: string): Prisma.CustomerWhereInput {
  if (!search) {
    return {};
  }

  return {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { registration: { contains: search, mode: "insensitive" } },
      { assetBrand: { contains: search, mode: "insensitive" } },
      { assetModel: { contains: search, mode: "insensitive" } },
    ],
  };
}

export async function getCustomersPage(options?: {
  search?: string | null;
  page?: number;
  limit?: number;
}) {
  const search = normalizeCustomerSearchQuery(options?.search);
  const requestedPage = Math.max(options?.page ?? 1, 1);
  const pageSize = Math.min(
    Math.max(options?.limit ?? DEFAULT_CUSTOMERS_PAGE_SIZE, 1),
    MAX_CUSTOMERS_PAGE_SIZE
  );
  const where = buildCustomerSearchWhere(search);
  const totalCount = await prisma.customer.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
  });

  return {
    customers,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    search,
  };
}

export async function getCustomerSelectOptions(limit = MAX_CUSTOMER_OPTIONS) {
  return prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, MAX_CUSTOMER_OPTIONS),
  });
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw notFound("Customer not found");
  }

  return customer;
}

export async function assertCustomerExists(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!customer) {
    throw notFound("Customer not found");
  }
}

export async function createCustomer(input: CustomerInput) {
  return prisma.customer.create({
    data: normalizeCustomerData(input),
  });
}

export async function updateCustomer(id: string, input: CustomerInput) {
  await assertCustomerExists(id);

  return prisma.customer.update({
    where: { id },
    data: normalizeCustomerData(input),
  });
}

export function requireCustomerInput<T>(
  parsed:
    | { success: true; data: T }
    | { success: false; error: unknown }
): T {
  if (!parsed.success) {
    throw badRequest("Invalid customer payload");
  }

  return parsed.data;
}
