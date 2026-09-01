import assert from "node:assert/strict";
import test from "node:test";
import { createCheckoutFromCart } from "@/lib/checkout-flow";

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

test("createCheckoutFromCart orchestrates order then checkout and returns the Stripe URL", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];

  const result = await createCheckoutFromCart(
    async (input, init) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      calls.push({ url, body });

      if (url === "/api/orders") {
        return createJsonResponse({
          orderId: "order_123",
          orderNumber: "FS-20260806-AAA111",
          requiresPayment: true,
        });
      }

      if (url === "/api/checkout") {
        return createJsonResponse({ url: "https://checkout.stripe.com/c/pay/cs_test_123" });
      }

      throw new Error(`Unexpected URL ${url}`);
    },
    {
      customerEmail: " Buyer@Example.com ",
      customerName: " Fabien ",
      acceptsCgv: true,
      acknowledgesImmediateDigitalDelivery: true,
    }
  );

  assert.deepEqual(calls, [
    {
      url: "/api/orders",
      body: {
        customerEmail: "Buyer@Example.com",
        customerName: "Fabien",
        acceptsCgv: true,
        acknowledgesImmediateDigitalDelivery: true,
      },
    },
    {
      url: "/api/checkout",
      body: {
        orderId: "order_123",
      },
    },
  ]);
  assert.deepEqual(result, {
    orderId: "order_123",
    orderNumber: "FS-20260806-AAA111",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_123",
    requiresPayment: true,
    redirectUrl: "https://checkout.stripe.com/c/pay/cs_test_123",
  });
});

test("createCheckoutFromCart surfaces order creation errors", async () => {
  await assert.rejects(
    () =>
      createCheckoutFromCart(
        async () => createJsonResponse({ error: "Cart not found" }, 404),
        {
          customerEmail: "buyer@example.com",
          acceptsCgv: true,
          acknowledgesImmediateDigitalDelivery: true,
        }
      ),
    (error: unknown) => error instanceof Error && error.message === "Cart not found"
  );
});

test("createCheckoutFromCart surfaces checkout errors", async () => {
  let callCount = 0;

  await assert.rejects(
    () =>
      createCheckoutFromCart(
        async (input) => {
          callCount += 1;

          if (String(input) === "/api/orders") {
            return createJsonResponse({
              orderId: "order_123",
              orderNumber: "FS-20260806-AAA111",
              requiresPayment: true,
            });
          }

          return createJsonResponse({ error: "Checkout already created" }, 409);
        },
        {
          customerEmail: "buyer@example.com",
          acceptsCgv: true,
          acknowledgesImmediateDigitalDelivery: true,
        }
      ),
    (error: unknown) =>
      error instanceof Error && error.message === "Checkout already created"
  );

  assert.equal(callCount, 2);
});

test("createCheckoutFromCart reuses an existing orderId without recreating the order", async () => {
  const calls: string[] = [];

  const result = await createCheckoutFromCart(
    async (input) => {
      calls.push(String(input));
      return createJsonResponse({ url: "https://checkout.stripe.com/c/pay/cs_retry_123" });
    },
    {
      customerEmail: "buyer@example.com",
      existingOrderId: "order_existing",
      acceptsCgv: true,
      acknowledgesImmediateDigitalDelivery: true,
    }
  );

  assert.deepEqual(calls, ["/api/checkout"]);
  assert.deepEqual(result, {
    orderId: "order_existing",
    orderNumber: null,
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_retry_123",
    requiresPayment: true,
    redirectUrl: "https://checkout.stripe.com/c/pay/cs_retry_123",
  });
});

test("createCheckoutFromCart forwards the discount code during order creation", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];

  await createCheckoutFromCart(
    async (input, init) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      calls.push({ url, body });

      if (url === "/api/orders") {
        return createJsonResponse({
          orderId: "order_discounted",
          orderNumber: "FS-20260806-DISC01",
          requiresPayment: true,
        });
      }

      if (url === "/api/checkout") {
        return createJsonResponse({ url: "https://checkout.stripe.com/c/pay/cs_discounted" });
      }

      throw new Error(`Unexpected URL ${url}`);
    },
    {
      customerEmail: "buyer@example.com",
      discountCode: " coach-abc123 ",
      acceptsCgv: true,
      acknowledgesImmediateDigitalDelivery: true,
    }
  );

  assert.deepEqual(calls[0], {
    url: "/api/orders",
    body: {
      customerEmail: "buyer@example.com",
      discountCode: "coach-abc123",
      acceptsCgv: true,
      acknowledgesImmediateDigitalDelivery: true,
    },
  });
});

test("createCheckoutFromCart skips Stripe checkout for a free order and redirects to the thank-you page", async () => {
  const calls: string[] = [];

  const result = await createCheckoutFromCart(
    async (input) => {
      const url = String(input);
      calls.push(url);

      if (url === "/api/orders") {
        return createJsonResponse({
          orderId: "order_free",
          orderNumber: "FS-20260806-FREE01",
          requiresPayment: false,
        });
      }

      throw new Error(`Unexpected URL ${url}`);
    },
    {
      customerEmail: "buyer@example.com",
      discountCode: "COACH-FREE01",
      acceptsCgv: true,
      acknowledgesImmediateDigitalDelivery: true,
    }
  );

  assert.deepEqual(calls, ["/api/orders"]);
  assert.deepEqual(result, {
    orderId: "order_free",
    orderNumber: "FS-20260806-FREE01",
    checkoutUrl: null,
    requiresPayment: false,
    redirectUrl: "/commande/merci?order=FS-20260806-FREE01",
  });
});
