import { z } from "zod";
import type {
  Cart,
  CartItem,
  Customer,
  DigitalAsset,
  DiscountCode,
  DownloadGrant,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
  Product,
  ProductPrice,
} from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";
import {
  normalizeCustomerEmail,
  normalizeOptionalCustomerName,
} from "@/lib/services/customer-auth";
import {
  addMonths,
  buildAutomaticEbookDiscountCode,
  evaluateDiscountCodeForCart,
  finalizeDiscountRedemptionForOrder,
  AUTOMATIC_EBOOK_DISCOUNT_REASON,
} from "@/lib/services/discounts";
import { DEFAULT_DOWNLOAD_GRANT_MAX_DOWNLOADS } from "@/lib/services/download-grant";

type PrismaClientLike = PrismaClient;

const createOrderFromCartInputSchema = z.object({
  cartId: z.string().trim().min(1),
  customerEmail: z.string().trim().email(),
  customerName: z.string().trim().min(1).optional(),
  discountCode: z.string().trim().min(1).optional(),
});

const orderIdSchema = z.string().trim().min(1);
const orderNumberSchema = z.string().trim().min(1);
const emailSchema = z.string().trim().email();

type CartWithItems = Cart & {
  items: CartItem[];
};

type OrderWithRelations = Order & {
  items: OrderItem[];
  payments: Payment[];
};

type OrderLookup = {
  id?: string;
  orderNumber?: string;
};

type ProductAssetWithAsset = {
  assetId: string;
  asset: Pick<DigitalAsset, "id" | "status">;
};

type ProductWithAssets = Product & {
  assets: ProductAssetWithAsset[];
};

type DiscountCodeRecord = DiscountCode & {
  product: Pick<Product, "id" | "name" | "slug" | "productType" | "status" | "purchaseMode"> | null;
};

type OrderCreateData = {
  orderNumber: string;
  status: OrderStatus;
  customerId?: string | null;
  discountCodeId?: string | null;
  customerEmail: string;
  customerName?: string | null;
  currency: string;
  subtotalCents: number;
  discountTotalCents: number;
  totalCents: number;
  cartId?: string | null;
  paidAt?: Date | null;
};

type OrderItemCreateData = {
  orderId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productType: Product["productType"];
  quantity: number;
  currency: string;
  unitAmountCents: number;
  lineTotalCents: number;
};

type PaymentCreateData = {
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
};

type DownloadGrantCreateData = {
  orderId: string;
  orderItemId: string;
  productId: string;
  assetId: string;
  customerEmail: string;
  status: "ACTIVE";
  downloadCount: number;
  maxDownloads: number;
  expiresAt: Date | null;
};

type OrderServiceDeps = {
  now?: () => Date;
  randomCode?: () => string;
};

export type OrderDb = {
  findCart(where: { id: string }): Promise<CartWithItems | null>;
  findCustomerByEmail(email: string): Promise<Customer | null>;
  findProductWithAssetsById(id: string): Promise<ProductWithAssets | null>;
  findPricesByProductId(productId: string, status?: "ACTIVE" | "ARCHIVED"): Promise<ProductPrice[]>;
  findDiscountCodeByCode(code: string): Promise<DiscountCodeRecord | null>;
  findOrder(where: OrderLookup): Promise<OrderWithRelations | null>;
  listOrdersByEmail(email: string): Promise<OrderWithRelations[]>;
  createCustomer(data: {
    email: string;
    name?: string | null;
    status: "ACTIVE" | "DISABLED";
  }): Promise<Customer>;
  updateCustomer(
    customerId: string,
    data: {
      name?: string | null;
      status?: "ACTIVE" | "DISABLED";
    }
  ): Promise<Customer>;
  createOrder(data: OrderCreateData): Promise<Order>;
  createOrderItem(data: OrderItemCreateData): Promise<OrderItem>;
  createPayment(data: PaymentCreateData): Promise<Payment>;
  createDownloadGrant(data: DownloadGrantCreateData): Promise<DownloadGrant>;
  createDiscountRedemption(data: {
    discountCodeId: string;
    orderId: string;
    customerEmail: string;
    productId: string | null;
    amountDiscountedCents: number;
  }): Promise<unknown>;
  // Les quatre methodes suivantes forment le contrat DiscountRedemptionDb
  // (lib/services/discounts.ts) : elles rendent OrderDb utilisable tel quel
  // par finalizeDiscountRedemptionForOrder dans le chemin gratuit.
  findDiscountRedemption(discountCodeId: string, orderId: string): Promise<{ id: string } | null>;
  findDiscountCodeCapacity(
    discountCodeId: string
  ): Promise<{ maxRedemptions: number; productId: string | null } | null>;
  incrementDiscountCodeRedeemedCountIfCapacity(
    discountCodeId: string,
    maxRedemptions: number
  ): Promise<number>;
  decrementDiscountCodeRedeemedCount(discountCodeId: string): Promise<void>;
  // Upsert par code : ne cree que si absent, jamais d'ecrasement. Utilise
  // pour la generation automatique d'un code coaching a l'achat d'un ebook
  // (voir createAutomaticEbookDiscountCodesForFreeOrder ci-dessous) — le code
  // etant deterministe (derive de l'OrderItem), c'est ce qui garantit qu'un
  // retry de commande ne cree jamais de doublon.
  createDiscountCodeIfAbsent(data: {
    code: string;
    status: DiscountCode["status"];
    type: DiscountCode["type"];
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
  updateCartStatus(cartId: string, status: Cart["status"]): Promise<Cart>;
  updateOrder(
    orderId: string,
    data: {
      status: OrderStatus;
      cancelledAt?: Date | null;
      paidAt?: Date | null;
    }
  ): Promise<Order>;
  transaction<T>(callback: (db: OrderDb) => Promise<T>): Promise<T>;
};

type PreparedOrderLine = {
  product: ProductWithAssets;
  price: ProductPrice;
  quantity: number;
  currency: string;
  lineTotalCents: number;
};

type PreparedDiscount = {
  discountCodeId: string;
  code: string;
  productId: string | null;
  discountTotalCents: number;
  totalCents: number;
};

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase();
}

function normalizeDiscountCode(value: string | undefined) {
  const normalized = value?.trim().toUpperCase();
  return normalized ? normalized : null;
}

function formatOrderDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function normalizeOrderCodeSegment(code: string) {
  const normalized = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();

  if (normalized.length < 6) {
    return normalized.padEnd(6, "0").slice(0, 6);
  }

  return normalized.slice(0, 6);
}

function generateRandomOrderCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0").slice(0, 6);
}

function assertActiveCart(cart: Cart) {
  if (cart.status !== "ACTIVE") {
    throw conflict("Cart is not eligible for order creation");
  }
}

function assertCartIsNotEmpty(cart: CartWithItems) {
  if (cart.items.length === 0) {
    throw badRequest("Cart is empty");
  }
}

function assertProductIsOrderable(product: ProductWithAssets | null) {
  if (!product) {
    throw notFound("Product not found");
  }

  if (product.status !== "ACTIVE" || product.purchaseMode !== "BUY_NOW") {
    throw badRequest("Product is not available for order");
  }

  return product;
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

async function buildPreparedOrderLines(db: OrderDb, cart: CartWithItems) {
  const preparedLines: PreparedOrderLine[] = [];
  let currency: string | null = null;

  for (const item of cart.items) {
    const product = assertProductIsOrderable(await db.findProductWithAssetsById(item.productId));
    const price = assertSingleActivePrice(await db.findPricesByProductId(product.id, "ACTIVE"));
    const normalizedCurrency = normalizeCurrency(price.currency);

    if (normalizedCurrency.length !== 3) {
      throw badRequest("Product currency is invalid");
    }

    if (currency && currency !== normalizedCurrency) {
      throw conflict("Multiple currencies are not supported in a single order");
    }

    currency = normalizedCurrency;
    preparedLines.push({
      product,
      price,
      quantity: 1,
      currency: normalizedCurrency,
      lineTotalCents: price.unitAmountCents,
    });
  }

  if (!currency) {
    throw badRequest("Cart is empty");
  }

  return {
    currency,
    lines: preparedLines,
    subtotalCents: preparedLines.reduce((sum, line) => sum + line.lineTotalCents, 0),
  };
}

async function generateUniqueOrderNumber(db: OrderDb, deps: Required<OrderServiceDeps>) {
  const dateSegment = formatOrderDate(deps.now());

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `FS-${dateSegment}-${normalizeOrderCodeSegment(deps.randomCode())}`;
    const existingOrder = await db.findOrder({ orderNumber: candidate });

    if (!existingOrder) {
      return candidate;
    }
  }

  throw conflict("Unable to generate a unique order number");
}

async function prepareDiscountForOrder(
  db: OrderDb,
  input: {
    cart: CartWithItems;
    customerEmail: string;
    code: string | null;
    subtotalCents: number;
    currency: string;
  }
): Promise<PreparedDiscount | null> {
  if (!input.code) {
    return null;
  }

  const discountCode = await db.findDiscountCodeByCode(input.code);

  if (!discountCode) {
    throw notFound("Discount code not found");
  }

  // Regles de validation (statut, fenetre de validite, usage restant, email,
  // devise, produit cible) et calcul du montant partages avec l'apercu panier
  // via evaluateDiscountCodeForCart (lib/services/discounts.ts), pour qu'un
  // seul endroit definisse ces regles.
  const evaluated = evaluateDiscountCodeForCart({
    discountCode,
    customerEmail: input.customerEmail,
    subtotalCents: input.subtotalCents,
    currency: input.currency,
    cartProductIds: input.cart.items.map((item) => item.productId),
    now: new Date(),
  });

  return {
    discountCodeId: discountCode.id,
    code: discountCode.code,
    productId: discountCode.productId,
    discountTotalCents: evaluated.discountTotalCents,
    totalCents: evaluated.totalCents,
  };
}

async function createDownloadGrantsForFreeOrder(
  tx: OrderDb,
  order: Order,
  lines: Array<{ orderItem: OrderItem; product: ProductWithAssets }>,
  customerEmail: string
) {
  for (const line of lines) {
    const activeAssets = line.product.assets.filter(
      (productAsset) => productAsset.asset.status === "ACTIVE"
    );

    for (const productAsset of activeAssets) {
      await tx.createDownloadGrant({
        orderId: order.id,
        orderItemId: line.orderItem.id,
        productId: line.product.id,
        assetId: productAsset.assetId,
        customerEmail,
        status: "ACTIVE",
        downloadCount: 0,
        maxDownloads: DEFAULT_DOWNLOAD_GRANT_MAX_DOWNLOADS,
        expiresAt: null,
      });
    }
  }
}

// A chaque ebook d'une commande gratuite (totalCents=0, donc deja PAID),
// genere automatiquement un code coaching : meme montant que l'ebook,
// usage unique, nominatif sur l'acheteur, valable 2 mois, utilisable sur
// n'importe quel produit du catalogue (typiquement un pack d'accompagnement
// — cf. le texte deja affiche sur la fiche produit ebook). Miroir exact,
// pour le chemin gratuit, de createAutomaticEbookDiscountCodesForOrder
// (lib/services/discounts.ts) qui gere le chemin paye via Stripe.
async function createAutomaticEbookDiscountCodesForFreeOrder(
  tx: OrderDb,
  lines: Array<{ orderItem: OrderItem; product: ProductWithAssets }>,
  customerEmail: string,
  createdAt: Date
) {
  for (const line of lines) {
    if (line.product.productType !== "EBOOK") {
      continue;
    }

    await tx.createDiscountCodeIfAbsent({
      code: buildAutomaticEbookDiscountCode(line.orderItem.id),
      status: "ACTIVE",
      type: "FIXED_AMOUNT",
      amountOffCents: line.orderItem.unitAmountCents,
      percentOff: null,
      currency: line.orderItem.currency,
      maxRedemptions: 1,
      redeemedCount: 0,
      startsAt: createdAt,
      expiresAt: addMonths(createdAt, 2),
      productId: null,
      customerEmail,
      reason: AUTOMATIC_EBOOK_DISCOUNT_REASON,
    });
  }
}

function createPrismaOrderDb(client: PrismaClientLike): OrderDb {
  const buildScopedDb = (currentClient: PrismaClientLike): OrderDb => ({
    async findCart(where) {
      return currentClient.cart.findUnique({
        where,
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
        },
      }) as Promise<CartWithItems | null>;
    },
    async findCustomerByEmail(email) {
      return currentClient.customer.findUnique({
        where: { email },
      });
    },
    async findProductWithAssetsById(id) {
      return currentClient.product.findUnique({
        where: { id },
        include: {
          assets: {
            include: {
              asset: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      }) as Promise<ProductWithAssets | null>;
    },
    async findPricesByProductId(productId, status) {
      return currentClient.productPrice.findMany({
        where: {
          productId,
          status,
        },
        orderBy: { createdAt: "desc" },
      });
    },
    async findDiscountCodeByCode(code) {
      return currentClient.discountCode.findUnique({
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
      }) as Promise<DiscountCodeRecord | null>;
    },
    async findOrder(where) {
      return currentClient.order.findFirst({
        where,
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
          payments: {
            orderBy: { createdAt: "asc" },
          },
        },
      }) as Promise<OrderWithRelations | null>;
    },
    async listOrdersByEmail(email) {
      return currentClient.order.findMany({
        where: { customerEmail: email },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
          payments: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }) as Promise<OrderWithRelations[]>;
    },
    async createCustomer(data) {
      return currentClient.customer.create({ data });
    },
    async updateCustomer(customerId, data) {
      return currentClient.customer.update({
        where: { id: customerId },
        data,
      });
    },
    async createOrder(data) {
      const {
        customerId,
        cartId,
        discountCodeId,
        ...orderData
      } = data;

      const createData: Record<string, unknown> = {
        ...orderData,
      };

      if (customerId) {
        createData.customer = {
          connect: { id: customerId },
        };
      }

      if (cartId) {
        createData.cart = {
          connect: { id: cartId },
        };
      }

      if (discountCodeId) {
        createData.discountCode = {
          connect: { id: discountCodeId },
        };
      }

      return currentClient.order.create({
        data: createData as never,
      });
    },
    async createOrderItem(data) {
      return currentClient.orderItem.create({ data });
    },
    async createPayment(data) {
      return currentClient.payment.create({ data });
    },
    async createDownloadGrant(data) {
      return currentClient.downloadGrant.create({ data });
    },
    async createDiscountRedemption(data) {
      return currentClient.discountRedemption.create({ data });
    },
    async findDiscountRedemption(discountCodeId, orderId) {
      return currentClient.discountRedemption.findUnique({
        where: {
          discountCodeId_orderId: {
            discountCodeId,
            orderId,
          },
        },
        select: { id: true },
      });
    },
    async findDiscountCodeCapacity(discountCodeId) {
      return currentClient.discountCode.findUnique({
        where: { id: discountCodeId },
        select: { maxRedemptions: true, productId: true },
      });
    },
    async incrementDiscountCodeRedeemedCountIfCapacity(discountCodeId, maxRedemptions) {
      const result = await currentClient.discountCode.updateMany({
        where: {
          id: discountCodeId,
          redeemedCount: { lt: maxRedemptions },
        },
        data: {
          redeemedCount: { increment: 1 },
        },
      });

      return result.count;
    },
    async decrementDiscountCodeRedeemedCount(discountCodeId) {
      await currentClient.discountCode.update({
        where: { id: discountCodeId },
        data: {
          redeemedCount: { decrement: 1 },
        },
      });
    },
    async createDiscountCodeIfAbsent(data) {
      return currentClient.discountCode.upsert({
        where: { code: data.code },
        create: data,
        update: {},
      });
    },
    async updateCartStatus(cartId, status) {
      return currentClient.cart.update({
        where: { id: cartId },
        data: { status },
      });
    },
    async updateOrder(orderId, data) {
      return currentClient.order.update({
        where: { id: orderId },
        data,
      });
    },
    async transaction<T>(callback: (db: OrderDb) => Promise<T>) {
      return currentClient.$transaction(async (tx) => {
        const transactionDb = createPrismaOrderDb(tx as PrismaClientLike);
        return callback(transactionDb);
      });
    },
  });

  return buildScopedDb(client);
}

async function getDefaultOrderService() {
  const { prisma } = await import("@/lib/prisma");
  return createOrderService(createPrismaOrderDb(prisma));
}

export function createOrderService(db: OrderDb, providedDeps?: OrderServiceDeps) {
  const deps: Required<OrderServiceDeps> = {
    now: providedDeps?.now ?? (() => new Date()),
    randomCode: providedDeps?.randomCode ?? generateRandomOrderCode,
  };

  return {
    async createOrderFromCart(input: z.infer<typeof createOrderFromCartInputSchema>) {
      const parsed = createOrderFromCartInputSchema.parse(input);

      return db.transaction(async (tx) => {
        const cart = await tx.findCart({ id: parsed.cartId });

        if (!cart) {
          throw notFound("Cart not found");
        }

        assertActiveCart(cart);
        assertCartIsNotEmpty(cart);

        const preparedOrder = await buildPreparedOrderLines(tx, cart);
        const orderNumber = await generateUniqueOrderNumber(tx, deps);
        const normalizedEmail = normalizeCustomerEmail(parsed.customerEmail);
        const normalizedCustomerName = normalizeOptionalCustomerName(parsed.customerName);
        const normalizedDiscountCode = normalizeDiscountCode(parsed.discountCode);
        const preparedDiscount = await prepareDiscountForOrder(tx, {
          cart,
          customerEmail: normalizedEmail,
          code: normalizedDiscountCode,
          subtotalCents: preparedOrder.subtotalCents,
          currency: preparedOrder.currency,
        });
        const existingCustomer = await tx.findCustomerByEmail(normalizedEmail);

        if (existingCustomer?.status === "DISABLED") {
          throw conflict("Customer is not allowed to order");
        }

        let customer = existingCustomer;

        if (!customer) {
          customer = await tx.createCustomer({
            email: normalizedEmail,
            name: normalizedCustomerName ?? null,
            status: "ACTIVE",
          });
        } else if (!customer.name && normalizedCustomerName) {
          customer = await tx.updateCustomer(customer.id, {
            name: normalizedCustomerName,
          });
        }

        const discountTotalCents = preparedDiscount?.discountTotalCents ?? 0;
        const totalCents = preparedDiscount?.totalCents ?? preparedOrder.subtotalCents;
        const isFreeOrder = totalCents === 0;
        const order = await tx.createOrder({
          orderNumber,
          status: isFreeOrder ? "PAID" : "PENDING_PAYMENT",
          customerId: customer.id,
          discountCodeId: preparedDiscount?.discountCodeId ?? null,
          customerEmail: normalizedEmail,
          customerName: normalizedCustomerName ?? null,
          currency: preparedOrder.currency,
          subtotalCents: preparedOrder.subtotalCents,
          discountTotalCents,
          totalCents,
          cartId: cart.id,
          paidAt: isFreeOrder ? deps.now() : null,
        });

        const createdOrderLines: Array<{ orderItem: OrderItem; product: ProductWithAssets }> = [];

        for (const line of preparedOrder.lines) {
          const orderItem = await tx.createOrderItem({
            orderId: order.id,
            productId: line.product.id,
            productSlug: line.product.slug,
            productName: line.product.name,
            productType: line.product.productType,
            quantity: line.quantity,
            currency: line.currency,
            unitAmountCents: line.price.unitAmountCents,
            lineTotalCents: line.lineTotalCents,
          });

          createdOrderLines.push({
            orderItem,
            product: line.product,
          });
        }

        if (isFreeOrder) {
          // Une commande gratuite est deja PAID a la creation (voir plus
          // haut) : le code doit donc etre reellement consomme ici, pas
          // seulement pre-verifie par evaluateDiscountCodeForCart. S'il ne
          // peut plus etre consomme (course concurrente ayant epuise
          // maxRedemptions entre le pre-check et maintenant), on annule tout
          // — aucune commande PAID, aucun telechargement — en jetant avant
          // toute creation de download grant, pour que la transaction
          // Prisma fasse un rollback complet.
          if (preparedDiscount) {
            const redemptionOutcome = await finalizeDiscountRedemptionForOrder(tx, {
              id: order.id,
              discountCodeId: preparedDiscount.discountCodeId,
              discountTotalCents: preparedDiscount.discountTotalCents,
              customerEmail: normalizedEmail,
            });

            if (redemptionOutcome.status === "exhausted") {
              throw conflict("Discount code has already been used");
            }
          }

          await createDownloadGrantsForFreeOrder(tx, order, createdOrderLines, normalizedEmail);
          await createAutomaticEbookDiscountCodesForFreeOrder(
            tx,
            createdOrderLines,
            normalizedEmail,
            deps.now()
          );
        } else {
          // Commande payante : le code n'est ni consomme ni comptabilise
          // ici. Il ne sera reellement consomme qu'au passage effectif de
          // la commande a PAID, dans handleCommerceCheckoutCompleted
          // (stripe-webhook-commerce.ts) — un checkout abandonne ne
          // consomme donc rien.
          await tx.createPayment({
            orderId: order.id,
            provider: "STRIPE",
            status: "PENDING",
            amountCents: totalCents,
            currency: preparedOrder.currency,
          });
        }

        await tx.updateCartStatus(cart.id, "CONVERTED");

        const createdOrder = await tx.findOrder({ id: order.id });

        if (!createdOrder) {
          throw notFound("Order not found after creation");
        }

        return createdOrder;
      });
    },

    async getOrderById(orderId: string) {
      const normalizedOrderId = orderIdSchema.parse(orderId);
      const order = await db.findOrder({ id: normalizedOrderId });

      if (!order) {
        throw notFound("Order not found");
      }

      return order;
    },

    async getOrderByNumber(orderNumber: string) {
      const normalizedOrderNumber = orderNumberSchema.parse(orderNumber);
      const order = await db.findOrder({ orderNumber: normalizedOrderNumber });

      if (!order) {
        throw notFound("Order not found");
      }

      return order;
    },

    async listOrdersForEmail(email: string) {
      const normalizedEmail = emailSchema.parse(email).trim().toLowerCase();
      return db.listOrdersByEmail(normalizedEmail);
    },

    async cancelPendingOrder(orderId: string) {
      const normalizedOrderId = orderIdSchema.parse(orderId);
      const order = await db.findOrder({ id: normalizedOrderId });

      if (!order) {
        throw notFound("Order not found");
      }

      if (order.status !== "PENDING_PAYMENT") {
        throw conflict("Only pending payment orders can be cancelled");
      }

      await db.updateOrder(order.id, {
        status: "CANCELLED",
        cancelledAt: deps.now(),
      });

      const updatedOrder = await db.findOrder({ id: order.id });

      if (!updatedOrder) {
        throw notFound("Order not found after update");
      }

      return updatedOrder;
    },
  };
}

export async function createOrderFromCart(input: z.infer<typeof createOrderFromCartInputSchema>) {
  const service = await getDefaultOrderService();
  return service.createOrderFromCart(input);
}

export async function getOrderById(orderId: string) {
  const service = await getDefaultOrderService();
  return service.getOrderById(orderId);
}

export async function getOrderByNumber(orderNumber: string) {
  const service = await getDefaultOrderService();
  return service.getOrderByNumber(orderNumber);
}

export async function listOrdersForEmail(email: string) {
  const service = await getDefaultOrderService();
  return service.listOrdersForEmail(email);
}

export async function cancelPendingOrder(orderId: string) {
  const service = await getDefaultOrderService();
  return service.cancelPendingOrder(orderId);
}
