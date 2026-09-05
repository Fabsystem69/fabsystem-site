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
import {
  HttpError,
  badRequest,
  conflict,
  forbidden,
  internalServerError,
  notFound,
} from "@/lib/http-errors";
import {
  PRESTATIONS_NEEDS_PROGRESS_LABELS,
  parsePrestationsNeedsAnswers,
  prestationsNeedsAnswersInputSchema,
  requiresNeedsIntake,
  type PrestationsNeedsAnswers,
} from "@/lib/prestations-needs";

type PrismaClientLike = PrismaClient;

const createCheckoutSessionInputSchema = z.object({
  orderId: z.string().trim().min(1),
  // Optionnel pour ne pas casser les appelants internes/tests qui exercent
  // la logique de checkout hors du flow panier public ; le seul appelant
  // HTTP (app/api/checkout/route.ts) le fournit toujours, dérivé du cookie
  // de session panier — jamais du corps de la requête.
  cartId: z.string().trim().min(1).optional(),
  baseUrl: z.string().trim().min(1).optional(),
  needsAnswers: prestationsNeedsAnswersInputSchema,
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

export type CheckoutDb = {
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
  coupons: {
    create(
      params: Stripe.CouponCreateParams,
      options?: Stripe.RequestOptions
    ): Promise<Pick<Stripe.Coupon, "id">>;
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

// Un point de rendez-vous a 500 caracteres max par valeur de metadata Stripe
// (deja garanti par le schema Zod cote formulaire, secu en profondeur ici).
function truncateForStripeMetadata(value: string) {
  return value.slice(0, 490);
}

function orderRequiresNeedsIntake(order: Pick<OrderWithRelations, "items">) {
  return order.items.some((item) => requiresNeedsIntake(item.productSlug));
}

function buildNeedsAnswersMetadata(
  needsAnswers: PrestationsNeedsAnswers | null
): Record<string, string> {
  if (!needsAnswers) {
    return {};
  }

  return {
    needsVehicle: truncateForStripeMetadata(needsAnswers.vehicle),
    needsDescription: truncateForStripeMetadata(needsAnswers.description),
    needsProgress: needsAnswers.progress,
    needsProgressLabel: PRESTATIONS_NEEDS_PROGRESS_LABELS[needsAnswers.progress],
    needsDeadline: needsAnswers.deadline ? truncateForStripeMetadata(needsAnswers.deadline) : "",
    needsOther: needsAnswers.other ? truncateForStripeMetadata(needsAnswers.other) : "",
    needsWhatsapp: truncateForStripeMetadata(needsAnswers.whatsapp),
  };
}

export function buildCheckoutSessionParams(input: {
  order: OrderWithRelations;
  paymentId: string;
  baseUrl: string;
  needsAnswers?: PrestationsNeedsAnswers | null;
  discountCouponId?: string | null;
}): Stripe.Checkout.SessionCreateParams {
  const { order, paymentId, baseUrl, needsAnswers, discountCouponId } = input;

  return {
    mode: "payment",
    customer_email: order.customerEmail,
    success_url: `${baseUrl}/commande/merci?order=${encodeURIComponent(order.orderNumber)}`,
    cancel_url: `${baseUrl}/panier`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId,
      ...buildNeedsAnswersMetadata(needsAnswers ?? null),
    },
    // Les line_items restent toujours au prix plein : la remise n'est
    // jamais repercutee sur unit_amount (risque d'arrondi si plusieurs
    // lignes). Elle est appliquee au niveau de la session via un coupon
    // Stripe dynamique (cf. ensureDiscountCoupon), pour que le montant
    // facture corresponde exactement a order.totalCents.
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
    ...(discountCouponId ? { discounts: [{ coupon: discountCouponId }] } : {}),
  };
}

// Cree un coupon Stripe a usage unique portant exactement le montant deja
// calcule et fige sur la commande (order.discountTotalCents) : Stripe n'a
// jamais a recalculer un pourcentage ou un montant, il applique tel quel ce
// que le serveur a deja valide. assertStripeAmountMatches() (webhook) verifie
// ensuite que session.amount_total == payment.amountCents == order.totalCents.
async function ensureDiscountCoupon(input: {
  stripeClient: StripeCheckoutClient;
  order: OrderWithRelations;
  paymentId: string;
}): Promise<string | null> {
  const { order, paymentId } = input;

  if (order.discountTotalCents <= 0) {
    return null;
  }

  const coupon = await input.stripeClient.coupons.create(
    {
      amount_off: order.discountTotalCents,
      currency: order.currency.toLowerCase(),
      duration: "once",
      name: `Remise ${order.orderNumber}`,
    },
    {
      idempotencyKey: `discount-coupon-${paymentId}`,
    }
  );

  return coupon.id;
}

// Blocage serveur (Mission 2) : un panier contenant au moins un pack ne peut
// pas generer de session Stripe sans reponses valides au formulaire de
// besoin. C'est la seule barriere qui compte reellement — la redirection
// cote client vers /panier/projet n'est qu'une commodite UX.
function assertNeedsAnswersProvidedIfRequired(
  order: OrderWithRelations,
  needsAnswers: PrestationsNeedsAnswers | null
) {
  if (orderRequiresNeedsIntake(order) && !needsAnswers) {
    throw badRequest(
      "Le formulaire de projet est requis pour valider cette prestation d'accompagnement."
    );
  }
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
  needsAnswers: PrestationsNeedsAnswers | null;
}) {
  const discountCouponId = await ensureDiscountCoupon({
    stripeClient: input.stripeClient,
    order: input.order,
    paymentId: input.payment.id,
  });

  const session = await input.stripeClient.checkout.sessions.create(
    buildCheckoutSessionParams({
      order: input.order,
      paymentId: input.payment.id,
      baseUrl: input.baseUrl,
      needsAnswers: input.needsAnswers,
      discountCouponId,
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
      const needsAnswers = parsePrestationsNeedsAnswers(parsed.needsAnswers);

      return db.transaction(async (tx) => {
        const order = assertOrderIsReadyForCheckout(await tx.findOrderById(parsed.orderId));

        if (parsed.cartId && order.cartId !== parsed.cartId) {
          throw forbidden("Order does not belong to this cart session");
        }

        const payment = assertPaymentCanCreateCheckout(getLatestPendingStripePayment(order.payments));
        assertOrderSnapshotsAreValid(order);
        assertNeedsAnswersProvidedIfRequired(order, needsAnswers);
        const baseUrl = normalizeBaseUrl(parsed.baseUrl ?? deps.getBaseUrl?.());

        if (!payment.stripeCheckoutSessionId) {
          return createAndPersistCheckoutSession({
            tx,
            stripeClient: deps.stripeClient,
            order,
            payment,
            baseUrl,
            needsAnswers,
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
          needsAnswers,
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
