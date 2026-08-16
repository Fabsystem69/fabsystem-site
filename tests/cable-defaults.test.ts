import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_BATTERY_TRUNK_SECTION,
  getEdgeDefaultLength,
  getEdgeDefaultPreset,
  getEdgeDefaultSection,
} from "@/lib/electrical-components/cable-lengths";

test("preset tronc batterie : 25 mm² et 1 m entre composants batterie/protection/distribution/shunt", () => {
  const preset = getEdgeDefaultPreset("battery", "shunt", "power-negative");

  assert.equal(preset.section, DEFAULT_BATTERY_TRUNK_SECTION);
  assert.equal(preset.length, 1);
});

test("preset tronc batterie : s'applique aussi entre protection et distribution sur un câble de puissance", () => {
  assert.equal(getEdgeDefaultSection("fuse", "busbar", "power-positive"), DEFAULT_BATTERY_TRUNK_SECTION);
  assert.equal(getEdgeDefaultLength("fuse", "busbar", DEFAULT_BATTERY_TRUNK_SECTION, "power-positive"), 1);
});

test("preset tronc batterie : ne s'applique pas aux branches consommateurs", () => {
  assert.equal(getEdgeDefaultSection("battery", "consumer", "power-positive"), undefined);
  assert.equal(getEdgeDefaultLength("battery", "consumer", "1,5 mm²", "power-positive"), 3);
});
