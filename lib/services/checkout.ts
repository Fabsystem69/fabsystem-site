import Stripe from "stripe";
import { z } from "zod";
import type {
  Order,
  OrderItem,
  Payment,
  PaymentStatus,
  PaymentProvider,
  PrismaClient,
} from "@/lib/generated/prisma/client";
import { HttpError, badRequest, conflict, internalServerError, notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

const createCheckoutSessionInputSchema = z.object({
  orderId: z.string().trim().min(1),
  baseUrl: z.string().trim().min(1).optional(),
});

type OrderWithRelations = Order & {
  items: OrderItem[];
  payments: Payment[];
};

type PaymentUpdateData = {
  status?: PaymentStatus;
  stripeCheckoutSessionId?: string | null;
  rawProviderStatus?: string | null;
  failedAt?: Date | null;
};

type CheckoutDb = {
  findOrderById(orderId: string): Promise<OrderWithRelations | null>;
  updatePayment(paymentId: string, data: PaymentUpdateData): Promise<Payment>;
  createPayment(data: {
    orderId: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    amountCents: number;
    currency: string;
  }): Promise<Payment>;
  transaction<T>(callback: (db: CheckoutDb) => Promise<T>): Promise<T>;
};

type StripeCheckoutClient = {
  checkout: {
    sessions: {
      create(
        params: Stripe.Checkout.SessionCreateParams
      ): Promise<Pick<Stripe.Checkout.Session, "id" | "url" | "status">>;
      retrieve(
        sessionId: string
      ): Promise<Pick<Stripe.Checkout.Session, "id" | "url" | "status" | "payment_status">>;
    };
  };
};

type CheckoutServiceDeps = {
  stripeClient: StripeCheckoutClient;
  getBaseUrl?: () => string | undefined;
};

export type CheckoutSessionResult = {
  url: string;
};

function getLatestPendingStripePayment(payments: Payment[]) {
  const pendingStripePayments = payments.filter(
    (payment) => payment.provider === "STRIPE" && payment.status === "PENDING"
  );

  if (pendingStripePayments.length === 0) {
    throw conflict("Pending Stripe payment not found for order");
  }

  if (pendingStripePayments.length > 1) {
    throw conflict("Multiple pending Stripe payments found for order");
  }

  const payment = pendingStripePayments[0];

  if (!payment) {
    throw conflict("Pending Stripe payment not found for order");
  }

  return payment;
}

export function buildCheckoutSessionParams(input: {
  order: OrderWithRelations;
  paymentId: string;
  baseUrl: string;
}): Stripe.Checkout.SessionCreateParams {
  const { order, paymentId, baseUrl } = input;

  return {
    mode: "payment",
    customer_email: order.customerEmail,
    success_url: `${baseUrl}/commande/merci?order=${encodeURIComponent(order.orderNumber)}`,
    cancel_url: `${baseUrl}/panier`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId,
    },
    line_items: order.items.map((item) => ({
      price_data: {
        currency: item.currency.toLowerCase(),
        product_data: {
          name: item.productName,
        },
        unit_amount: item.unitAmountCents,
      },
      quantity: item.quantity,
    })),
  };
}

function normalizeBaseUrl(value: string | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    throw internalServerError("Missing NEXT_PUBLIC_BASE_URL");
  }

  return normalized.replace(/\/+$/, "");
}

function assertOrderIsReadyForCheckout(order: OrderWithRelations | null) {
  if (!order) {
    throw notFound("Order not found");
  }

  if (order.status !== "PENDING_PAYMENT") {
    throw conflict("Order is not eligible for checkout");
  }

  if (order.items.length === 0) {
    throw badRequest("Order has no items");
  }

  return order;
}

function assertPaymentCanCreateCheckout(payment: Payment) {
  if (payment.status !== "PENDING") {
    throw conflict("Payment is not eligible for checkout");
  }

  return payment;
}

async function createAndPersistCheckoutSession(input: {
  tx: CheckoutDb;
  stripeClient: StripeCheckoutClient;
  order: OrderWithRelations;
  payment: Payment;
  baseUrl: string;
}) {
  const session = await input.stripeClient.checkout.sessions.create(
    buildCheckoutSessionParams({
      order: input.order,
      paymentId: input.payment.id,
      baseUrl: input.baseUrl,
    })
  );

  if (!session.url) {
    throw internalServerError("Stripe checkout session URL is missing");
  }

  await input.tx.updatePayment(input.payment.id, {
    stripeCheckoutSessionId: session.id,
    rawProviderStatus: session.status ?? null,
  });

  return {
    url: session.url,
  };
}

function assertOrderSnapshotsAreValid(order: OrderWithRelations) {
  let currency: string | null = null;

  for (const item of order.items) {
    const normalizedCurrency = item.currency.trim().toUpperCase();

    if (normalizedCurrency.length !== 3) {
      throw badRequest("Order item currency is invalid");
    }

    if (!item.productName.trim()) {
      throw badRequest("Order item product name is invalid");
    }

    if (item.quantity < 1) {
      throw badRequest("Order item quantity is invalid");
    }

    if (item.unitAmountCents < 0) {
      throw badRequest("Order item unit amount is invalid");
    }

    if (currency && currency !== normalizedCurrency) {
      throw conflict("Multiple currencies are not supported in a single checkout");
    }

    currency = normalizedCurrency;
  }
}

function createPrismaCheckoutDb(client: PrismaClientLike): CheckoutDb {
  const buildScopedDb = (currentClient: PrismaClientLike): CheckoutDb => ({
    async findOrderById(orderId) {
      return currentClient.order.findUnique({
        where: { id: orderId },
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
    async updatePayment(paymentId, data) {
      return currentClient.payment.update({
        where: { id: paymentId },
        data,
      });
    },
    async createPayment(data) {
      return currentClient.payment.create({
        data,
      });
    },
    async transaction<T>(callback: (db: CheckoutDb) => Promise<T>) {
      return currentClient.$transaction(async (tx) => {
        const transactionDb = createPrismaCheckoutDb(tx as PrismaClientLike);
        return callback(transactionDb);
      });
    },
  });

  return buildScopedDb(client);
}

async function getDefaultCheckoutService() {
  const [{ prisma }, { getServerStripe }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/server/stripe"),
  ]);

  return createCheckoutService(createPrismaCheckoutDb(prisma), {
    stripeClient: getServerStripe(),
    getBaseUrl: () => process.env.NEXT_PUBLIC_BASE_URL,
  });
}

export function createCheckoutService(db: CheckoutDb, deps: CheckoutServiceDeps) {
  return {
    async createCheckoutSessionForOrder(
      input: z.infer<typeof createCheckoutSessionInputSchema>
    ): Promise<CheckoutSessionResult> {
      const parsed = createCheckoutSessionInputSchema.parse(input);

      return db.transaction(async (tx) => {
        const order = assertOrderIsReadyForCheckout(await tx.findOrderById(parsed.orderId));
        const payment = assertPaymentCanCreateCheckout(getLatestPendingStripePayment(order.payments));
        assertOrderSnapshotsAreValid(order);
        const baseUrl = normalizeBaseUrl(parsed.baseUrl ?? deps.getBaseUrl?.());

        if (!payment.stripeCheckoutSessionId) {
          return createAndPersistCheckoutSession({
            tx,
            stripeClient: deps.stripeClient,
            order,
            payment,
            baseUrl,
          });
        }

        const existingSession = await deps.stripeClient.checkout.sessions.retrieve(
          payment.stripeCheckoutSessionId
        );

        if (existingSession.status === "open") {
          if (!existingSession.url) {
            throw internalServerError("Stripe checkout session URL is missing");
          }

          return {
            url: existingSession.url,
          };
        }

        if (existingSession.status === "complete") {
          throw new HttpError(409, "Checkout already completed, waiting for payment confirmation", {
            code: "CHECKOUT_AWAITING_WEBHOOK",
          });
        }

        if (existingSession.status !== "expired") {
          throw new HttpError(409, "Checkout is not reusable", {
            code: "CHECKOUT_UNAVAILABLE",
          });
        }

        const timestamp = new Date();

        await tx.updatePayment(payment.id, {
          status: "FAILED",
          rawProviderStatus: existingSession.status ?? existingSession.payment_status ?? "expired",
          failedAt: timestamp,
        });

        const retryPayment = await tx.createPayment({
          orderId: order.id,
          provider: "STRIPE",
          status: "PENDING",
          amountCents: payment.amountCents,
          currency: payment.currency,
        });

        return createAndPersistCheckoutSession({
          tx,
          stripeClient: deps.stripeClient,
          order,
          payment: retryPayment,
          baseUrl,
        });
      });
    },
  };
}

export async function createCheckoutSessionForOrder(
  input: z.infer<typeof createCheckoutSessionInputSchema>
) {
  const service = await getDefaultCheckoutService();
  return service.createCheckoutSessionForOrder(input);
}
