import assert from "node:assert/strict";
import test from "node:test";
import { getAwgEquivalent } from "@/lib/electrical-components/section-to-awg";

test("getAwgEquivalent maps every CABLE_SECTIONS entry to the WIRE_TABLE equivalent", () => {
  assert.equal(getAwgEquivalent("0,5 mm²"), "20");
  assert.equal(getAwgEquivalent("0,75 mm²"), "18");
  assert.equal(getAwgEquivalent("1 mm²"), "17");
  assert.equal(getAwgEquivalent("1,5 mm²"), "16");
  assert.equal(getAwgEquivalent("2,5 mm²"), "14");
  assert.equal(getAwgEquivalent("4 mm²"), "12");
  assert.equal(getAwgEquivalent("6 mm²"), "10");
  assert.equal(getAwgEquivalent("10 mm²"), "8");
  assert.equal(getAwgEquivalent("16 mm²"), "6");
  assert.equal(getAwgEquivalent("25 mm²"), "4");
  assert.equal(getAwgEquivalent("35 mm²"), "2");
  assert.equal(getAwgEquivalent("50 mm²"), "1/0");
  assert.equal(getAwgEquivalent("70 mm²"), "2/0");
});

test("getAwgEquivalent resolves a 3-conductor cable (3G...) from its per-conductor gauge", () => {
  assert.equal(getAwgEquivalent("3G2,5 mm²"), getAwgEquivalent("2,5 mm²"));
});

test("getAwgEquivalent returns null for an unknown or missing section", () => {
  assert.equal(getAwgEquivalent("Section non renseignée"), null);
  assert.equal(getAwgEquivalent(""), null);
  assert.equal(getAwgEquivalent("100 mm²"), null);
});
