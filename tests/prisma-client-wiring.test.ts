import assert from "node:assert/strict";
import test from "node:test";
import { hasRequiredCommerceDelegates } from "@/lib/prisma-client-guards";

test("prisma wiring requires commerce delegates on the cached client", () => {
  assert.equal(
    hasRequiredCommerceDelegates({
      product: {},
      productPrice: {},
      cart: {},
      cartItem: {},
      downloadGrant: {},
      customer: {},
      magicLoginToken: {},
      customerSession: {},
    } as never),
    true
  );

  assert.equal(
    hasRequiredCommerceDelegates({
      product: {},
      productPrice: {},
      cart: undefined,
      cartItem: {},
      downloadGrant: {},
      customer: {},
      magicLoginToken: {},
      customerSession: {},
    } as never),
    false
  );

  assert.equal(
    hasRequiredCommerceDelegates({
      product: {},
      productPrice: {},
      cart: {},
      cartItem: {},
      downloadGrant: undefined,
      customer: {},
      magicLoginToken: {},
      customerSession: {},
    } as never),
    false
  );

  assert.equal(
    hasRequiredCommerceDelegates({
      product: {},
      productPrice: {},
      cart: {},
      cartItem: {},
      downloadGrant: {},
      customer: undefined,
      magicLoginToken: {},
      customerSession: {},
    } as never),
    false
  );

  assert.equal(
    hasRequiredCommerceDelegates({
      product: {},
      productPrice: {},
      cart: {},
      cartItem: {},
      downloadGrant: {},
      customer: {},
      magicLoginToken: undefined,
      customerSession: {},
    } as never),
    false
  );

  assert.equal(
    hasRequiredCommerceDelegates({
      product: {},
      productPrice: {},
      cart: {},
      cartItem: {},
      downloadGrant: {},
      customer: {},
      magicLoginToken: {},
      customerSession: undefined,
    } as never),
    false
  );
});
