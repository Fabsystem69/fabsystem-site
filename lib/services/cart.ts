import { z } from "zod";
import type {
  Cart,
  CartItem,
  CartStatus,
  PrismaClient,
  Product,
  ProductPrice,
} from "@/lib/generated/prisma/client";
import { badRequest, conflict, notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

const createCartInputSchema = z
  .object({
    sessionId: z.string().trim().min(1).optional(),
    customerEmail: z.string().trim().email().optional(),
  })
  .optional();

const cartIdSchema = z.string().trim().min(1);
const productIdSchema = z.string().trim().min(1);
const sessionIdSchema = z.string().trim().min(1);

type CartLookup = {
  id?: string;
  sessionId?: string;
};

type CartWithItems = Cart & {
  items: CartItem[];
};

type CartCreateData = {
  sessionId?: string;
  customerEmail?: string;
};

type CartItemCreateData = {
  cartId: string;
  productId: string;
  quantity: number;
};

type CartSummaryLine = {
  productId: string;
  name: string;
  slug: string;
  quantity: number;
  unitAmountCents: number;
  totalCents: number;
};

export type CartSummary = {
  cartId: string;
  status: CartStatus;
  itemCount: number;
  currency: string;
  subtotalCents: number;
  lines: CartSummaryLine[];
};

export type CartDb = {
  createCart(data: CartCreateData): Promise<Cart>;
  findCart(where: CartLookup): Promise<CartWithItems | null>;
  findProductById(id: string): Promise<Product | null>;
  findPricesByProductId(productId: string, status?: "ACTIVE" | "ARCHIVED"): Promise<ProductPrice[]>;
  createCartItem(data: CartItemCreateData): Promise<CartItem>;
  deleteCartItem(cartId: string, productId: string): Promise<void>;
  deleteCartItems(cartId: string): Promise<void>;
  updateCartStatus(cartId: string, status: CartStatus): Promise<Cart>;
  transaction<T>(callback: (db: CartDb) => Promise<T>): Promise<T>;
};

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase();
}

function assertActiveCart(cart: Cart) {
  if (cart.status !== "ACTIVE") {
    throw conflict("Cart is not modifiable");
  }
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

function assertProductIsPurchasable(product: Product | null) {
  if (!product) {
    throw notFound("Product not found");
  }

  if (product.status !== "ACTIVE" || product.purchaseMode !== "BUY_NOW") {
    throw badRequest("Product is not available for cart");
  }

  // v2.1 : SCHEMA_UNLOCK exige un Project cible et ne passe jamais par le
  // panier generique — voir la meme garde dans lib/services/order.ts.
  if (product.productType === "SCHEMA_UNLOCK") {
    throw badRequest("Product requires the dedicated schema unlock checkout");
  }

  return product;
}

function createPrismaCartDb(client: PrismaClientLike): CartDb {
  const buildScopedDb = (currentClient: PrismaClientLike): CartDb => ({
    async createCart(data) {
      return currentClient.cart.create({
        data: {
          sessionId: data.sessionId,
          customerEmail: data.customerEmail,
        },
      });
    },
    async findCart(where) {
      return currentClient.cart.findFirst({
        where,
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
        },
      }) as Promise<CartWithItems | null>;
    },
    async findProductById(id) {
      return currentClient.product.findUnique({
        where: { id },
      });
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
    async createCartItem(data) {
      return currentClient.cartItem.create({
        data,
      });
    },
    async deleteCartItem(cartId, productId) {
      await currentClient.cartItem.deleteMany({
        where: {
          cartId,
          productId,
        },
      });
    },
    async deleteCartItems(cartId) {
      await currentClient.cartItem.deleteMany({
        where: { cartId },
      });
    },
    async updateCartStatus(cartId, status) {
      return currentClient.cart.update({
        where: { id: cartId },
        data: { status },
      });
    },
    async transaction<T>(callback: (db: CartDb) => Promise<T>) {
      return currentClient.$transaction(async (tx) => {
        const transactionDb = createPrismaCartDb(tx as PrismaClientLike);
        return callback(transactionDb);
      });
    },
  });

  return buildScopedDb(client);
}

async function getDefaultCartService() {
  const { prisma } = await import("@/lib/prisma");
  return createCartService(createPrismaCartDb(prisma));
}

export function createCartService(db: CartDb) {
  return {
    async createCart(input?: z.infer<typeof createCartInputSchema>) {
      const parsed = createCartInputSchema.parse(input);

      return db.createCart({
        sessionId: normalizeOptionalString(parsed?.sessionId),
        customerEmail: normalizeOptionalString(parsed?.customerEmail),
      });
    },

    async getCartById(cartId: string) {
      const normalizedCartId = cartIdSchema.parse(cartId);
      const cart = await db.findCart({ id: normalizedCartId });

      if (!cart) {
        throw notFound("Cart not found");
      }

      return cart;
    },

    async getCartBySessionId(sessionId: string) {
      const normalizedSessionId = sessionIdSchema.parse(sessionId);
      const cart = await db.findCart({ sessionId: normalizedSessionId });

      if (!cart) {
        throw notFound("Cart not found");
      }

      return cart;
    },

    async addProductToCart(cartId: string, productId: string) {
      const normalizedCartId = cartIdSchema.parse(cartId);
      const normalizedProductId = productIdSchema.parse(productId);

      return db.transaction(async (tx) => {
        const cart = await tx.findCart({ id: normalizedCartId });

        if (!cart) {
          throw notFound("Cart not found");
        }

        assertActiveCart(cart);

        const product = assertProductIsPurchasable(
          await tx.findProductById(normalizedProductId)
        );
        const activePrice = assertSingleActivePrice(
          await tx.findPricesByProductId(product.id, "ACTIVE")
        );

        const existingItem = cart.items.find((item) => item.productId === product.id);

        if (!existingItem) {
          await tx.createCartItem({
            cartId: cart.id,
            productId: product.id,
            quantity: 1,
          });
        }

        if (activePrice.currency.trim().length !== 3) {
          throw badRequest("Product currency is invalid");
        }

        const updatedCart = await tx.findCart({ id: cart.id });

        if (!updatedCart) {
          throw notFound("Cart not found after update");
        }

        return updatedCart;
      });
    },

    async removeProductFromCart(cartId: string, productId: string) {
      const normalizedCartId = cartIdSchema.parse(cartId);
      const normalizedProductId = productIdSchema.parse(productId);

      return db.transaction(async (tx) => {
        const cart = await tx.findCart({ id: normalizedCartId });

        if (!cart) {
          throw notFound("Cart not found");
        }

        assertActiveCart(cart);

        await tx.deleteCartItem(cart.id, normalizedProductId);

        const updatedCart = await tx.findCart({ id: cart.id });

        if (!updatedCart) {
          throw notFound("Cart not found after update");
        }

        return updatedCart;
      });
    },

    async clearCart(cartId: string) {
      const normalizedCartId = cartIdSchema.parse(cartId);

      return db.transaction(async (tx) => {
        const cart = await tx.findCart({ id: normalizedCartId });

        if (!cart) {
          throw notFound("Cart not found");
        }

        assertActiveCart(cart);
        await tx.deleteCartItems(cart.id);

        const updatedCart = await tx.findCart({ id: cart.id });

        if (!updatedCart) {
          throw notFound("Cart not found after update");
        }

        return updatedCart;
      });
    },

    async getCartSummary(cartId: string): Promise<CartSummary> {
      const normalizedCartId = cartIdSchema.parse(cartId);
      const cart = await db.findCart({ id: normalizedCartId });

      if (!cart) {
        throw notFound("Cart not found");
      }

      let currency: string | null = null;
      let subtotalCents = 0;
      const lines: CartSummaryLine[] = [];

      for (const item of cart.items) {
        const product = assertProductIsPurchasable(await db.findProductById(item.productId));
        const price = assertSingleActivePrice(await db.findPricesByProductId(product.id, "ACTIVE"));
        const normalizedCurrency = normalizeCurrency(price.currency);

        if (!currency) {
          currency = normalizedCurrency;
        } else if (currency !== normalizedCurrency) {
          throw conflict("Multiple currencies are not supported in a single cart");
        }

        const quantity = 1;
        const totalCents = price.unitAmountCents * quantity;
        subtotalCents += totalCents;

        lines.push({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          quantity,
          unitAmountCents: price.unitAmountCents,
          totalCents,
        });
      }

      return {
        cartId: cart.id,
        status: cart.status,
        itemCount: lines.length,
        currency: currency ?? "EUR",
        subtotalCents,
        lines,
      };
    },

    async abandonCart(cartId: string) {
      const normalizedCartId = cartIdSchema.parse(cartId);
      const cart = await db.findCart({ id: normalizedCartId });

      if (!cart) {
        throw notFound("Cart not found");
      }

      if (cart.status !== "ACTIVE") {
        throw conflict("Only an active cart can be abandoned");
      }

      return db.updateCartStatus(cart.id, "ABANDONED");
    },

    async markCartConverted(cartId: string) {
      const normalizedCartId = cartIdSchema.parse(cartId);
      const cart = await db.findCart({ id: normalizedCartId });

      if (!cart) {
        throw notFound("Cart not found");
      }

      if (cart.status !== "ACTIVE") {
        throw conflict("Only an active cart can be converted");
      }

      return db.updateCartStatus(cart.id, "CONVERTED");
    },
  };
}

export async function createCart(input?: z.infer<typeof createCartInputSchema>) {
  const service = await getDefaultCartService();
  return service.createCart(input);
}

export async function getCartById(cartId: string) {
  const service = await getDefaultCartService();
  return service.getCartById(cartId);
}

export async function getCartBySessionId(sessionId: string) {
  const service = await getDefaultCartService();
  return service.getCartBySessionId(sessionId);
}

export async function addProductToCart(cartId: string, productId: string) {
  const service = await getDefaultCartService();
  return service.addProductToCart(cartId, productId);
}

export async function removeProductFromCart(cartId: string, productId: string) {
  const service = await getDefaultCartService();
  return service.removeProductFromCart(cartId, productId);
}

export async function clearCart(cartId: string) {
  const service = await getDefaultCartService();
  return service.clearCart(cartId);
}

export async function getCartSummary(cartId: string) {
  const service = await getDefaultCartService();
  return service.getCartSummary(cartId);
}

export async function abandonCart(cartId: string) {
  const service = await getDefaultCartService();
  return service.abandonCart(cartId);
}

export async function markCartConverted(cartId: string) {
  const service = await getDefaultCartService();
  return service.markCartConverted(cartId);
}
