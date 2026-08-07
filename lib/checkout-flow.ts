import { badRequest, internalServerError } from "@/lib/http-errors";
import type { PrestationsNeedsAnswers } from "@/lib/prestations-needs";

export type CheckoutFlowInput = {
  customerEmail: string;
  customerName?: string;
  existingOrderId?: string;
  discountCode?: string;
  needsAnswers?: PrestationsNeedsAnswers;
};

type OrderResponse = {
  orderId?: string;
  orderNumber?: string;
  status?: string;
  totalCents?: number;
  requiresPayment?: boolean;
  error?: string;
};

type CheckoutResponse = {
  url?: string;
  error?: string;
};

type FetchLike = typeof fetch;

async function parseJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

export async function createCheckoutFromCart(
  fetchImpl: FetchLike,
  input: CheckoutFlowInput
) {
  const customerEmail = input.customerEmail.trim();
  const customerName = input.customerName?.trim();
  const existingOrderId = input.existingOrderId?.trim();
  const discountCode = input.discountCode?.trim();

  if (!customerEmail) {
    throw badRequest("Customer email is required");
  }

  let orderId = existingOrderId;
  let orderNumber: string | undefined;
  let requiresPayment = true;

  if (!orderId) {
    const orderResponse = await fetchImpl("/api/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        customerEmail,
        customerName: customerName || undefined,
        discountCode: discountCode || undefined,
      }),
    });

    const orderBody = await parseJson<OrderResponse>(orderResponse);

    if (!orderResponse.ok) {
      throw new Error(orderBody?.error || "Impossible de créer la commande.");
    }

    if (!orderBody?.orderId) {
      throw internalServerError("Order creation response is missing orderId");
    }

    orderId = orderBody.orderId;
    orderNumber = orderBody.orderNumber;
    requiresPayment = orderBody.requiresPayment !== false;
  }

  if (!requiresPayment) {
    if (!orderNumber) {
      throw internalServerError("Order creation response is missing orderNumber");
    }

    return {
      orderId,
      orderNumber,
      checkoutUrl: null,
      requiresPayment: false,
      redirectUrl: `/commande/merci?order=${encodeURIComponent(orderNumber)}`,
    };
  }

  const checkoutResponse = await fetchImpl("/api/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      needsAnswers: input.needsAnswers,
    }),
  });

  const checkoutBody = await parseJson<CheckoutResponse>(checkoutResponse);

  if (!checkoutResponse.ok) {
    throw new Error(checkoutBody?.error || "Impossible de préparer le paiement Stripe.");
  }

  if (!checkoutBody?.url) {
    throw internalServerError("Checkout response is missing url");
  }

  return {
    orderId,
    orderNumber: orderNumber ?? null,
    checkoutUrl: checkoutBody.url,
    requiresPayment: true,
    redirectUrl: checkoutBody.url,
  };
}
