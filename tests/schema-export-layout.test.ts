import assert from "node:assert/strict";
import test from "node:test";
import { computeSocialFrame, SOCIAL_LONG_EDGE_PX } from "@/lib/schema-editor/social-frame";
import { computePrintLayout } from "@/lib/schema-editor/print-layout";

// Retour utilisateur : "quand je partage le png sur facebook la résolution
// est mauvaise car l'image est trop grande" — Facebook redimensionne tout
// au-delà de 2048 px et recompresse : on livre directement la bonne taille.

test("computeSocialFrame: le grand côté vaut exactement 2048 px", () => {
  const frame = computeSocialFrame({ width: 6000, height: 3000 });
  assert.equal(Math.max(frame.canvasWidth, frame.canvasHeight), SOCIAL_LONG_EDGE_PX);
});

test("computeSocialFrame: un schéma très large est cadré en 1.91:1 maximum (format paysage Facebook)", () => {
  const frame = computeSocialFrame({ width: 8000, height: 1000 });
  assert.equal(frame.canvasWidth, 2048);
  assert.equal(frame.canvasHeight, Math.round(2048 / 1.91));
  assert.ok(frame.drawWidth <= frame.canvasWidth && frame.drawHeight <= frame.canvasHeight);
});

test("computeSocialFrame: un schéma très haut est cadré en 4:5 minimum (format portrait Facebook)", () => {
  const frame = computeSocialFrame({ width: 1000, height: 5000 });
  assert.equal(frame.canvasHeight, 2048);
  assert.equal(frame.canvasWidth, Math.round(2048 * 0.8));
});

test("computeSocialFrame: l'image est centrée dans le cadre", () => {
  const frame = computeSocialFrame({ width: 8000, height: 1000 });
  assert.equal(frame.offsetY, Math.round((frame.canvasHeight - frame.drawHeight) / 2));
  assert.equal(frame.offsetX, Math.round((frame.canvasWidth - frame.drawWidth) / 2));
});

test("computeSocialFrame: lisibilité faible quand le schéma est fortement réduit", () => {
  assert.equal(computeSocialFrame({ width: 1600, height: 1000 }).readability, "good");
  assert.equal(computeSocialFrame({ width: 9000, height: 3000 }).readability, "poor");
});

// Retour utilisateur : "impression papier ou pdf la plupart du temps sort 3
// pages dont 2 quasiment vides" — la planche était dimensionnée en A2 alors
// que l'imprimante est en A4.

test("computePrintLayout: A4 par défaut, paysage pour un schéma large", () => {
  const layout = computePrintLayout({ format: "A4", width: 4000, height: 2000 });
  assert.equal(layout.pageSize, "A4 landscape");
  assert.equal(layout.pageWidthMm, 297);
  assert.equal(layout.pageHeightMm, 210);
});

test("computePrintLayout: portrait pour un schéma plus haut que large", () => {
  const layout = computePrintLayout({ format: "A3", width: 1000, height: 1800 });
  assert.equal(layout.pageSize, "A3 portrait");
  assert.equal(layout.pageWidthMm, 297);
  assert.equal(layout.pageHeightMm, 420);
});

test("computePrintLayout: la planche reste strictement plus petite que la zone imprimable (jamais de 2e page)", () => {
  const layout = computePrintLayout({ format: "A4", width: 4000, height: 2000 });
  assert.ok(layout.sheetHeightMm < layout.pageHeightMm - layout.marginMm * 2);
  assert.ok(layout.imageMaxHeightMm > 0 && layout.imageMaxHeightMm < layout.sheetHeightMm);
});
