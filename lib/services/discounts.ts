import { z } from "zod";
import type {
  DiscountCode,
  DiscountCodeStatus,
  DiscountCodeType,
  DiscountRedemption,
  Order,
  PrismaClient,
  Product,
  ProductPrice,
} from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";
import { normalizeCustomerEmail } from "@/lib/services/customer-auth";

type PrismaClientLike = PrismaClient;

const discountCodeSchema = z.string().trim().min(1);

const createCoachingEbookDiscountCodeInputSchema = z.object({
  customerEmail: z.string().trim().email(),
  productId: z.string().trim().min(1),
  reason: z.string().trim().min(1).max(200).optional(),
});

const validateDiscountCodeForCartInputSchema = z.object({
  code: z.string().trim().min(1),
  customerEmail: z.string().trim().email(),
  cartId: z.string().trim().min(1),
});

type DiscountProduct = Pick<Product, "id" | "name" | "slug" | "productType" | "status" | "purchaseMode">;

type DiscountCodeRecord = DiscountCode & {
  product: DiscountProduct | null;
};

type CartProductLine = {
  product: DiscountProduct;
  price: Pick<ProductPrice, "id" | "currency" | "unitAmountCents" | "status">;
  quantity: number;
  lineTotalCents: number;
};

type DiscountsDb = {
  findProductById(productId: string): Promise<DiscountProduct | null>;
  findActivePricesByProductId(productId: string): Promise<ProductPrice[]>;
  findDiscountCodeByCode(code: string): Promise<DiscountCodeRecord | null>;
  findCoachingCodeForCustomerProduct(input: {
    customerEmail: string;
    productId: string;
  }): Promise<DiscountCodeRecord | null>;
  createDiscountCode(data: {
    code: string;
    status: DiscountCodeStatus;
    type: DiscountCodeType;
    amountOffCents: number | null;
    percentOff: number | null;
    currency: string;
    maxRedemptions: number;
    redeemedCount: number;
    startsAt: Date | null;
    expiresAt: Date | null;
    productId: string | null;
    customerEmail: string | null;
    reason: string | null;
  }): Promise<DiscountCode>;
  updateDiscountCode(
    discountCodeId: string,
    data: Partial<{
      status: DiscountCodeStatus;
      redeemedCount: number;
    }>
  ): Promise<DiscountCode>;
  createDiscountRedemption(data: {
    discountCodeId: string;
    orderId: string;
    customerEmail: string;
    productId: string | null;
    amountDiscountedCents: number;
  }): Promise<DiscountRedemption>;
  listDiscountCodes(): Promise<DiscountCodeRecord[]>;
  findOrderById(orderId: string): Promise<Pick<Order, "id" | "customerEmail"> | null>;
  findCartLines(cartId: string): Promise<CartProductLine[]>;
};

type DiscountServiceDeps = {
  now?: () => Date;
  randomCode?: () => string;
};

export type AppliedDiscountLine = {
  code: string;
  label: string;
  amountCents: number;
  currency: string;
};

export type ValidatedDiscountForCart = {
  discountCodeId: string;
  code: string;
  currency: string;
  productId: string | null;
  customerEmail: string | null;
  amountOffCents: number;
  subtotalCents: number;
  discountTotalCents: number;
  totalCents: number;
  line: AppliedDiscountLine;
};

export type DiscountedCartSummary = {
  subtotalCents: number;
  discountTotalCents: number;
  totalCents: number;
  currency: string;
  appliedCode: string | null;
  discountLines: AppliedDiscountLine[];
};

export type DashboardDiscountCodeSummary = DiscountCodeRecord & {
  product: DiscountProduct | null;
};

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function normalizeDiscountCode(input: string) {
  return discountCodeSchema.parse(input).trim().toUpperCase();
}

function normalizeReason(reason: string | undefined) {
  const normalized = reason?.trim();
  return normalized ? normalized : "Prestation coaching";
}

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase();
}

function generateRandomCodeSegment() {
  return Math.random().toString(36).slice(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, "X");
}

export function generateDiscountCode(prefix: string, randomCode = generateRandomCodeSegment) {
  const normalizedPrefix = prefix.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

  if (!normalizedPrefix) {
    throw badRequest("Discount code prefix is required");
  }

  return `${normalizedPrefix}${randomCode()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "X")
    .slice(0, 6)
    .padEnd(6, "X")}`;
}

function assertSingleActivePrice(prices: ProductPrice[]) {
  if (prices.length === 0) {
    throw notFound("Active price not found for product");
  }

  if (prices.length > 1) {
    throw conflict("Multiple active prices found for product");
  }

  return prices[0];
}

function assertCoachingProduct(product: DiscountProduct | null) {
  if (!product) {
    throw notFound("Product not found");
  }

  if (product.productType !== "EBOOK") {
    throw badRequest("Coaching discount codes only support ebooks");
  }

  return product;
}

function createPrismaDiscountsDb(client: PrismaClientLike): DiscountsDb {
  return {
    async findProductById(productId) {
      return client.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          slug: true,
          productType: true,
          status: true,
          purchaseMode: true,
        },
      });
    },
    async findActivePricesByProductId(productId) {
      return client.productPrice.findMany({
        where: {
          productId,
          status: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
      });
    },
    async findDiscountCodeByCode(code) {
      return client.discountCode.findUnique({
        where: { code },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              productType: true,
              status: true,
              purchaseMode: true,
            },
          },
        },
      });
    },
    async findCoachingCodeForCustomerProduct(input) {
      return client.discountCode.findFirst({
        where: {
          customerEmail: input.customerEmail,
          productId: input.productId,
          code: {
            startsWith: "COACH-",
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              productType: true,
              status: true,
              purchaseMode: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },
    async createDiscountCode(data) {
      return client.discountCode.create({ data });
    },
    async updateDiscountCode(discountCodeId, data) {
      return client.discountCode.update({
        where: { id: discountCodeId },
        data,
      });
    },
    async createDiscountRedemption(data) {
      return client.discountRedemption.create({ data });
    },
    async listDiscountCodes() {
      return client.discountCode.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              productType: true,
              status: true,
              purchaseMode: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },
    async findOrderById(orderId) {
      return client.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          customerEmail: true,
        },
      });
    },
    async findCartLines(cartId) {
      const items = await client.cartItem.findMany({
        where: { cartId },
        include: {
          product: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const lines: CartProductLine[] = [];

      for (const item of items) {
        const prices = await client.productPrice.findMany({
          where: {
            productId: item.productId,
            status: "ACTIVE",
          },
          orderBy: { createdAt: "desc" },
        });
        const price = assertSingleActivePrice(prices);
        lines.push({
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            productType: item.product.productType,
            status: item.product.status,
            purchaseMode: item.product.purchaseMode,
          },
          price: {
            id: price.id,
            currency: price.currency,
            unitAmountCents: price.unitAmountCents,
            status: price.status,
          },
          quantity: item.quantity,
          lineTotalCents: price.unitAmountCents * item.quantity,
        });
      }

      return lines;
    },
  };
}

async function getDefaultDiscountService() {
  const { prisma } = await import("@/lib/prisma");
  return createDiscountService(createPrismaDiscountsDb(prisma));
}

export function createDiscountService(db: DiscountsDb, deps?: DiscountServiceDeps) {
  const now = deps?.now ?? (() => new Date());
  const randomCode = deps?.randomCode ?? generateRandomCodeSegment;

  return {
    async createCoachingEbookDiscountCode(
      input: z.infer<typeof createCoachingEbookDiscountCodeInputSchema>
    ) {
      const parsed = createCoachingEbookDiscountCodeInputSchema.parse(input);
      const customerEmail = normalizeCustomerEmail(parsed.customerEmail);
      const product = assertCoachingProduct(await db.findProductById(parsed.productId.trim()));
      const existingCode = await db.findCoachingCodeForCustomerProduct({
        customerEmail,
        productId: product.id,
      });

      if (existingCode) {
        throw conflict("A coaching discount code already exists for this customer and ebook");
      }

      const activePrice = assertSingleActivePrice(await db.findActivePricesByProductId(product.id));
      const createdAt = now();
      const currency = normalizeCurrency(activePrice.currency);

      return db.createDiscountCode({
        code: generateDiscountCode("COACH-", randomCode),
        status: "ACTIVE",
        type: "FIXED_AMOUNT",
        amountOffCents: activePrice.unitAmountCents,
        percentOff: null,
        currency,
        maxRedemptions: 1,
        redeemedCount: 0,
        startsAt: createdAt,
        expiresAt: addMonths(createdAt, 2),
        productId: product.id,
        customerEmail,
        reason: normalizeReason(parsed.reason),
      });
    },

    async validateDiscountCodeForCart(
      input: z.infer<typeof validateDiscountCodeForCartInputSchema>
    ): Promise<ValidatedDiscountForCart> {
      const parsed = validateDiscountCodeForCartInputSchema.parse(input);
      const code = normalizeDiscountCode(parsed.code);
      const customerEmail = normalizeCustomerEmail(parsed.customerEmail);
      const discountCode = await db.findDiscountCodeByCode(code);

      if (!discountCode) {
        throw notFound("Discount code not found");
      }

      if (discountCode.status !== "ACTIVE") {
        throw conflict("Discount code is not active");
      }

      const currentNow = now();

      if (discountCode.startsAt && discountCode.startsAt.getTime() > currentNow.getTime()) {
        throw conflict("Discount code is not active yet");
      }

      if (discountCode.expiresAt && discountCode.expiresAt.getTime() <= currentNow.getTime()) {
        throw conflict("Discount code has expired");
      }

      if (discountCode.redeemedCount >= discountCode.maxRedemptions) {
        throw conflict("Discount code has already been used");
      }

      if (
        discountCode.customerEmail &&
        normalizeCustomerEmail(discountCode.customerEmail) !== customerEmail
      ) {
        throw conflict("Discount code is not valid for this customer");
      }

      const cartLines = await db.findCartLines(parsed.cartId.trim());

      if (cartLines.length === 0) {
        throw badRequest("Cart is empty");
      }

      const subtotalCents = cartLines.reduce((sum, line) => sum + line.lineTotalCents, 0);
      const currency = normalizeCurrency(cartLines[0]?.price.currency ?? discountCode.currency);

      for (const line of cartLines) {
        if (normalizeCurrency(line.price.currency) !== currency) {
          throw conflict("Multiple currencies are not supported with discount codes");
        }
      }

      if (normalizeCurrency(discountCode.currency) !== currency) {
        throw conflict("Discount code currency does not match cart currency");
      }

      if (discountCode.productId) {
        const matchingLine = cartLines.find((line) => line.product.id === discountCode.productId);

        if (!matchingLine) {
          throw conflict("Discount code does not apply to this cart");
        }
      }

      const requestedAmountOff =
        discountCode.type === "FIXED_AMOUNT"
          ? discountCode.amountOffCents ?? 0
          : Math.floor(subtotalCents * ((discountCode.percentOff ?? 0) / 100));

      const discountTotalCents = Math.max(0, Math.min(subtotalCents, requestedAmountOff));
      const totalCents = Math.max(0, subtotalCents - discountTotalCents);

      return {
        discountCodeId: discountCode.id,
        code: discountCode.code,
        currency,
        productId: discountCode.productId,
        customerEmail: discountCode.customerEmail,
        amountOffCents: requestedAmountOff,
        subtotalCents,
        discountTotalCents,
        totalCents,
        line: {
          code: discountCode.code,
          label: discountCode.reason || `Code ${discountCode.code}`,
          amountCents: discountTotalCents,
          currency,
        },
      };
    },

    async applyDiscountToCartSummary(input: z.infer<typeof validateDiscountCodeForCartInputSchema>) {
      const validated = await this.validateDiscountCodeForCart(input);

      return {
        subtotalCents: validated.subtotalCents,
        discountTotalCents: validated.discountTotalCents,
        totalCents: validated.totalCents,
        currency: validated.currency,
        appliedCode: validated.code,
        discountLines: [validated.line],
      } satisfies DiscountedCartSummary;
    },

    async redeemDiscountForOrder(input: {
      discountCodeId: string;
      orderId: string;
      customerEmail: string;
      productId: string | null;
      amountDiscountedCents: number;
    }) {
      const normalizedDiscountCodeId = input.discountCodeId.trim();
      const normalizedOrderId = input.orderId.trim();
      const normalizedCustomerEmail = normalizeCustomerEmail(input.customerEmail);

      if (!normalizedDiscountCodeId || !normalizedOrderId) {
        throw badRequest("Discount redemption input is invalid");
      }

      const order = await db.findOrderById(normalizedOrderId);

      if (!order) {
        throw notFound("Order not found");
      }

      return db.createDiscountRedemption({
        discountCodeId: normalizedDiscountCodeId,
        orderId: normalizedOrderId,
        customerEmail: normalizedCustomerEmail,
        productId: input.productId,
        amountDiscountedCents: input.amountDiscountedCents,
      });
    },

    async listDashboardDiscountCodes(): Promise<DashboardDiscountCodeSummary[]> {
      return db.listDiscountCodes();
    },

    async disableDiscountCode(id: string) {
      const normalizedId = id.trim();

      if (!normalizedId) {
        throw badRequest("Discount code id is required");
      }

      return db.updateDiscountCode(normalizedId, {
        status: "DISABLED",
      });
    },

    async activateDiscountCode(id: string) {
      const normalizedId = id.trim();

      if (!normalizedId) {
        throw badRequest("Discount code id is required");
      }

      return db.updateDiscountCode(normalizedId, {
        status: "ACTIVE",
      });
    },
  };
}

export async function createCoachingEbookDiscountCode(
  input: z.infer<typeof createCoachingEbookDiscountCodeInputSchema>
) {
  const service = await getDefaultDiscountService();
  return service.createCoachingEbookDiscountCode(input);
}

export async function validateDiscountCodeForCart(
  input: z.infer<typeof validateDiscountCodeForCartInputSchema>
) {
  const service = await getDefaultDiscountService();
  return service.validateDiscountCodeForCart(input);
}

export async function applyDiscountToCartSummary(
  input: z.infer<typeof validateDiscountCodeForCartInputSchema>
) {
  const service = await getDefaultDiscountService();
  return service.applyDiscountToCartSummary(input);
}

export async function listDashboardDiscountCodes() {
  const service = await getDefaultDiscountService();
  return service.listDashboardDiscountCodes();
}

export async function disableDiscountCode(id: string) {
  const service = await getDefaultDiscountService();
  return service.disableDiscountCode(id);
}

export async function activateDiscountCode(id: string) {
  const service = await getDefaultDiscountService();
  return service.activateDiscountCode(id);
}
