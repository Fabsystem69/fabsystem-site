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

// Un code sans email nominatif est utilisable par n'importe quel client :
// la validation panier n'exige donc plus d'email que pour identifier la
// commande, jamais pour restreindre un code qui n'a pas de customerEmail.
const createDiscountCodeInputSchema = z.object({
  type: z.enum(["FIXED_AMOUNT", "PERCENTAGE"]),
  amountOffCents: z.number().int().positive().optional(),
  percentOff: z.number().int().min(1).max(100).optional(),
  productId: z.string().trim().min(1).optional(),
  customerEmail: z.string().trim().email().optional(),
  maxRedemptions: z.number().int().positive().optional(),
  unlimitedRedemptions: z.boolean().optional(),
  expiresAt: z.date().optional(),
  codePrefix: z.string().trim().min(1).max(20).optional(),
  reason: z.string().trim().min(1).max(200).optional(),
});

// customerEmail optionnel : un code sans restriction nominative (voir
// evaluateDiscountCodeForCart) doit pouvoir etre valide sans email. Un code
// nominatif exige toujours l'email — verifie explicitement plus bas, une
// fois le code recupere, puisqu'on ne sait pas a l'avance s'il est nominatif.
const validateDiscountCodeForCartInputSchema = z.object({
  code: z.string().trim().min(1),
  customerEmail: z.string().trim().email().optional(),
  cartId: z.string().trim().min(1),
});

// Sentinelle "illimite" pour maxRedemptions (Int Postgres, pas de valeur
// nullable dans le schema pour ce champ) : evaluateDiscountCodeForCart
// compare toujours redeemedCount >= maxRedemptions, donc une tres grande
// valeur se comporte deja comme "jamais atteint" sans logique dediee.
export const UNLIMITED_DISCOUNT_REDEMPTIONS = 2147483647;

// Raison affichee dans le dashboard pour les codes generes automatiquement
// a l'achat d'un ebook, utile pour les distinguer des codes crees a la main.
export const AUTOMATIC_EBOOK_DISCOUNT_REASON = "Achat ebook — à déduire d'un accompagnement";

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

// Code deterministe (derive de l'id de l'OrderItem, jamais aleatoire) : ca
// permet une creation idempotente via upsert (voir createDiscountCodeIfAbsent)
// sans avoir besoin d'un champ orderId sur DiscountCode — une redelivery
// Stripe ou un retry ne genere donc jamais de doublon pour le meme achat.
export function buildAutomaticEbookDiscountCode(orderItemId: string) {
  return normalizeDiscountCode(`COACH-${orderItemId}`);
}

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

type DiscountCodeCreateData = {
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
};

type OrderItemForAutoDiscount = {
  id: string;
  productType: Product["productType"];
  unitAmountCents: number;
  currency: string;
};

type DiscountsDb = {
  findProductById(productId: string): Promise<DiscountProduct | null>;
  findDiscountCodeByCode(code: string): Promise<DiscountCodeRecord | null>;
  createDiscountCode(data: DiscountCodeCreateData): Promise<DiscountCode>;
  // Upsert par code (deterministe pour les codes auto-generes) : ne cree que
  // s'il n'existe pas encore, sans jamais ecraser un code existant. C'est ce
  // qui rend createAutomaticEbookDiscountCodesForOrder idempotent.
  createDiscountCodeIfAbsent(data: DiscountCodeCreateData): Promise<DiscountCode>;
  findOrderItemsForAutoDiscount(orderId: string): Promise<{
    customerEmail: string;
    items: OrderItemForAutoDiscount[];
  } | null>;
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

export function normalizeDiscountCode(input: string) {
  return discountCodeSchema.parse(input).trim().toUpperCase();
}

function normalizeReason(reason: string | undefined) {
  const normalized = reason?.trim();
  return normalized ? normalized : "Code de réduction";
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

// Champs necessaires pour evaluer un code, communs a la lecture cote
// discounts.ts (DiscountCodeRecord) et cote order.ts (son propre type
// equivalent, structurellement identique) : n'importe quel objet qui a ces
// champs peut etre evalue, sans dependre de l'origine exacte de la requete.
export type DiscountCodeForEvaluation = Pick<
  DiscountCode,
  | "status"
  | "type"
  | "amountOffCents"
  | "percentOff"
  | "currency"
  | "maxRedemptions"
  | "redeemedCount"
  | "startsAt"
  | "expiresAt"
  | "productId"
  | "customerEmail"
>;

export type EvaluatedDiscount = {
  amountOffCents: number;
  discountTotalCents: number;
  totalCents: number;
};

// Regle metier unique pour un code deja recupere en base : statut, fenetre
// de validite, usage restant, email, devise, produit cible, puis calcul du
// montant. Utilisee a la fois par l'apercu panier (validateDiscountCodeForCart
// ci-dessous) et par la creation de commande (prepareDiscountForOrder dans
// order.ts) pour qu'il n'existe qu'un seul endroit ou ces regles peuvent
// diverger silencieusement entre l'apercu et la commande reelle.
export function evaluateDiscountCodeForCart(input: {
  discountCode: DiscountCodeForEvaluation;
  customerEmail: string;
  subtotalCents: number;
  currency: string;
  cartProductIds: string[];
  now: Date;
}): EvaluatedDiscount {
  const { discountCode, customerEmail, subtotalCents, currency, cartProductIds, now } = input;

  if (discountCode.status !== "ACTIVE") {
    throw conflict("Discount code is not active");
  }

  if (discountCode.startsAt && discountCode.startsAt.getTime() > now.getTime()) {
    throw conflict("Discount code is not active yet");
  }

  if (discountCode.expiresAt && discountCode.expiresAt.getTime() <= now.getTime()) {
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

  if (normalizeCurrency(discountCode.currency) !== normalizeCurrency(currency)) {
    throw conflict("Discount code currency does not match cart currency");
  }

  if (discountCode.productId && !cartProductIds.includes(discountCode.productId)) {
    throw conflict("Discount code does not apply to this cart");
  }

  const requestedAmountOff =
    discountCode.type === "FIXED_AMOUNT"
      ? discountCode.amountOffCents ?? 0
      : Math.floor(subtotalCents * ((discountCode.percentOff ?? 0) / 100));

  const discountTotalCents = Math.max(0, Math.min(subtotalCents, requestedAmountOff));

  return {
    amountOffCents: requestedAmountOff,
    discountTotalCents,
    totalCents: Math.max(0, subtotalCents - discountTotalCents),
  };
}

// Contrat minimal requis pour finalizeDiscountRedemptionForOrder : n'importe
// quel client tx (OrderDb, CommerceWebhookDb) qui expose ces methodes peut
// etre passe directement a la fonction, sans dependre de son origine exacte
// (meme principe que DiscountCodeForEvaluation plus haut).
export type DiscountRedemptionDb = {
  findDiscountRedemption(discountCodeId: string, orderId: string): Promise<{ id: string } | null>;
  findDiscountCodeCapacity(
    discountCodeId: string
  ): Promise<{ maxRedemptions: number; productId: string | null } | null>;
  // Incremente redeemedCount seulement si redeemedCount < maxRedemptions,
  // au niveau SQL (WHERE) : renvoie le nombre de lignes mises a jour (0 ou 1).
  // C'est ce qui rend la consommation atomique face a deux paiements
  // concurrents sur le meme code.
  incrementDiscountCodeRedeemedCountIfCapacity(
    discountCodeId: string,
    maxRedemptions: number
  ): Promise<number>;
  decrementDiscountCodeRedeemedCount(discountCodeId: string): Promise<void>;
  createDiscountRedemption(data: {
    discountCodeId: string;
    orderId: string;
    customerEmail: string;
    productId: string | null;
    amountDiscountedCents: number;
  }): Promise<unknown>;
};

export type DiscountRedemptionOutcome =
  | { status: "not_applicable" }
  | { status: "already_redeemed" }
  | { status: "redeemed" }
  | { status: "exhausted" };

function isUniqueConstraintViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && (error as { code?: unknown }).code === "P2002";
}

// Point unique de consommation reelle d'un code de reduction, appele au
// moment exact ou une commande devient PAID (jamais avant) :
// - idempotent sur retry webhook / redelivery Stripe grace a l'unicite
//   (discountCodeId, orderId) sur DiscountRedemption ;
// - atomique face a deux paiements concurrents sur le meme code, via
//   l'incrementation conditionnelle incrementDiscountCodeRedeemedCountIfCapacity ;
// - si la creation de la ligne de redemption echoue quand meme sur un
//   conflit d'unicite (course exactement concurrente sur la meme commande),
//   compense la decrementation et traite le cas comme deja redeemed.
// Ne decide jamais comment reagir a "exhausted" : c'est a l'appelant
// (order.ts pour le gratuit, stripe-webhook-commerce.ts pour le paye) de
// choisir, les deux chemins ayant des regles differentes sur ce point.
export async function finalizeDiscountRedemptionForOrder(
  db: DiscountRedemptionDb,
  order: {
    id: string;
    discountCodeId: string | null;
    discountTotalCents: number;
    customerEmail: string;
  }
): Promise<DiscountRedemptionOutcome> {
  if (!order.discountCodeId) {
    return { status: "not_applicable" };
  }

  const existing = await db.findDiscountRedemption(order.discountCodeId, order.id);

  if (existing) {
    return { status: "already_redeemed" };
  }

  const discountCode = await db.findDiscountCodeCapacity(order.discountCodeId);

  if (!discountCode) {
    return { status: "not_applicable" };
  }

  const updatedCount = await db.incrementDiscountCodeRedeemedCountIfCapacity(
    order.discountCodeId,
    discountCode.maxRedemptions
  );

  if (updatedCount === 0) {
    return { status: "exhausted" };
  }

  try {
    await db.createDiscountRedemption({
      discountCodeId: order.discountCodeId,
      orderId: order.id,
      customerEmail: normalizeCustomerEmail(order.customerEmail),
      productId: discountCode.productId,
      amountDiscountedCents: order.discountTotalCents,
    });
  } catch (error) {
    if (!isUniqueConstraintViolation(error)) {
      throw error;
    }

    await db.decrementDiscountCodeRedeemedCount(order.discountCodeId);
    return { status: "already_redeemed" };
  }

  return { status: "redeemed" };
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
    async createDiscountCode(data) {
      return client.discountCode.create({ data });
    },
    async createDiscountCodeIfAbsent(data) {
      return client.discountCode.upsert({
        where: { code: data.code },
        create: data,
        update: {},
      });
    },
    async findOrderItemsForAutoDiscount(orderId) {
      return client.order.findUnique({
        where: { id: orderId },
        select: {
          customerEmail: true,
          items: {
            select: {
              id: true,
              productType: true,
              unitAmountCents: true,
              currency: true,
            },
          },
        },
      });
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
    // Declenche apres un achat d'ebook paye via Stripe (webhook), en miroir
    // de createAutomaticEbookDiscountCodesForFreeOrder (order.ts) pour les
    // commandes gratuites : meme montant que l'ebook, usage unique,
    // nominatif, valable 2 mois. Idempotent (voir createDiscountCodeIfAbsent),
    // donc sans risque sur une redelivery Stripe.
    async createAutomaticEbookDiscountCodesForOrder(orderId: string) {
      const normalizedOrderId = orderId.trim();

      if (!normalizedOrderId) {
        throw badRequest("Order id is required");
      }

      const order = await db.findOrderItemsForAutoDiscount(normalizedOrderId);

      if (!order) {
        throw notFound("Order not found");
      }

      const createdAt = now();
      const customerEmail = normalizeCustomerEmail(order.customerEmail);
      const created: DiscountCode[] = [];

      for (const item of order.items) {
        if (item.productType !== "EBOOK") {
          continue;
        }

        created.push(
          await db.createDiscountCodeIfAbsent({
            code: buildAutomaticEbookDiscountCode(item.id),
            status: "ACTIVE",
            type: "FIXED_AMOUNT",
            amountOffCents: item.unitAmountCents,
            percentOff: null,
            currency: normalizeCurrency(item.currency),
            maxRedemptions: 1,
            redeemedCount: 0,
            startsAt: createdAt,
            expiresAt: addMonths(createdAt, 2),
            productId: null,
            customerEmail,
            reason: AUTOMATIC_EBOOK_DISCOUNT_REASON,
          })
        );
      }

      return created;
    },

    async createDiscountCode(input: z.infer<typeof createDiscountCodeInputSchema>) {
      const parsed = createDiscountCodeInputSchema.parse(input);

      if (parsed.type === "FIXED_AMOUNT" && !parsed.amountOffCents) {
        throw badRequest("A fixed amount discount code requires amountOffCents");
      }

      if (parsed.type === "PERCENTAGE" && !parsed.percentOff) {
        throw badRequest("A percentage discount code requires percentOff");
      }

      let product: DiscountProduct | null = null;

      if (parsed.productId) {
        product = await db.findProductById(parsed.productId.trim());

        if (!product) {
          throw notFound("Product not found");
        }
      }

      const customerEmail = parsed.customerEmail
        ? normalizeCustomerEmail(parsed.customerEmail)
        : null;
      const createdAt = now();
      const prefix = parsed.codePrefix?.trim() || "PROMO";

      return db.createDiscountCode({
        code: generateDiscountCode(prefix, randomCode),
        status: "ACTIVE",
        type: parsed.type,
        amountOffCents: parsed.type === "FIXED_AMOUNT" ? parsed.amountOffCents ?? null : null,
        percentOff: parsed.type === "PERCENTAGE" ? parsed.percentOff ?? null : null,
        currency: "EUR",
        maxRedemptions: parsed.unlimitedRedemptions
          ? UNLIMITED_DISCOUNT_REDEMPTIONS
          : parsed.maxRedemptions ?? 1,
        redeemedCount: 0,
        startsAt: createdAt,
        expiresAt: parsed.expiresAt ?? null,
        productId: product?.id ?? null,
        customerEmail,
        reason: normalizeReason(parsed.reason),
      });
    },

    async validateDiscountCodeForCart(
      input: z.infer<typeof validateDiscountCodeForCartInputSchema>
    ): Promise<ValidatedDiscountForCart> {
      const parsed = validateDiscountCodeForCartInputSchema.parse(input);
      const code = normalizeDiscountCode(parsed.code);
      const customerEmail = parsed.customerEmail
        ? normalizeCustomerEmail(parsed.customerEmail)
        : null;
      const discountCode = await db.findDiscountCodeByCode(code);

      if (!discountCode) {
        throw notFound("Discount code not found");
      }

      if (discountCode.customerEmail && !customerEmail) {
        throw badRequest("Cet email est requis pour utiliser ce code");
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

      const evaluated = evaluateDiscountCodeForCart({
        discountCode,
        customerEmail: customerEmail ?? "",
        subtotalCents,
        currency,
        cartProductIds: cartLines.map((line) => line.product.id),
        now: now(),
      });

      return {
        discountCodeId: discountCode.id,
        code: discountCode.code,
        currency,
        productId: discountCode.productId,
        customerEmail: discountCode.customerEmail,
        amountOffCents: evaluated.amountOffCents,
        subtotalCents,
        discountTotalCents: evaluated.discountTotalCents,
        totalCents: evaluated.totalCents,
        line: {
          code: discountCode.code,
          label: discountCode.reason || `Code ${discountCode.code}`,
          amountCents: evaluated.discountTotalCents,
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

export async function createDiscountCode(
  input: z.infer<typeof createDiscountCodeInputSchema>
) {
  const service = await getDefaultDiscountService();
  return service.createDiscountCode(input);
}

export async function createAutomaticEbookDiscountCodesForOrder(orderId: string) {
  const service = await getDefaultDiscountService();
  return service.createAutomaticEbookDiscountCodesForOrder(orderId);
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
