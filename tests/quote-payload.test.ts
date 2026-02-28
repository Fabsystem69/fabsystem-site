import assert from "node:assert/strict";
import test from "node:test";
import { createQuoteTotals, quoteUpsertSchema } from "@/lib/quote-payload";

test("quote payload schema accepts a minimal valid payload", () => {
  const payload = quoteUpsertSchema.parse({
    customerId: "cus_123",
    issueDate: new Date("2026-02-28T10:00:00.000Z").toISOString(),
    items: [
      {
        description: "Audit électrique",
        quantity: 2,
        unitPrice: 12_500,
      },
    ],
  });

  assert.equal(payload.customerId, "cus_123");
  assert.equal(payload.items.length, 1);
});

test("quote totals compute subtotal and total from line items", () => {
  const totals = createQuoteTotals([
    {
      description: "Audit",
      quantity: 2,
      unitPrice: 12_500,
    },
    {
      description: "Formation",
      quantity: 1,
      unitPrice: 50_000,
    },
  ]);

  assert.equal(totals.subtotal, 75_000);
  assert.equal(totals.total, 75_000);
  assert.equal(totals.normalizedItems[0]?.lineTotal, 25_000);
  assert.equal(totals.normalizedItems[1]?.lineTotal, 50_000);
});
