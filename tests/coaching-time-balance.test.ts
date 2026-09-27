import assert from "node:assert/strict";
import test from "node:test";
import { computeCoachingProjectTimeBalance } from "@/lib/coaching-time-balance";

test("computes remaining time as purchased minus consumed", () => {
  const balance = computeCoachingProjectTimeBalance(300, 60);
  assert.deepEqual(balance, { purchasedMinutes: 300, consumedMinutes: 60, remainingMinutes: 240 });
});

test("allows a negative remaining time when consumed exceeds purchased (no silent clamp to zero)", () => {
  const balance = computeCoachingProjectTimeBalance(60, 90);
  assert.equal(balance.remainingMinutes, -30);
});

test("zero purchased and zero consumed gives zero remaining, never a divide/NaN", () => {
  const balance = computeCoachingProjectTimeBalance(0, 0);
  assert.deepEqual(balance, { purchasedMinutes: 0, consumedMinutes: 0, remainingMinutes: 0 });
});
