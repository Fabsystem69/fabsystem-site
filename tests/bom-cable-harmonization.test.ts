import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { computeBom, buildMaterialListCsv } from "@/lib/electrical-components/bom";

function edge(id: string, section: string, cableType: string, length: number): Edge {
  return { id, source: `${id}-a`, target: `${id}-b`, data: { section, cableType, length } } as unknown as Edge;
}

const NO_NODES: Node[] = [];

test("computeBom keeps positive and negative cables of the same section as separate rows", () => {
  const bom = computeBom(NO_NODES, [
    edge("e1", "16 mm²", "power-positive", 5),
    edge("e2", "16 mm²", "power-positive", 3),
    edge("e3", "16 mm²", "power-negative", 4),
  ]);

  assert.equal(bom.cableRows.length, 2);
  const red = bom.cableRows.find((r) => r.cableTypeLabel === "Puissance +");
  const black = bom.cableRows.find((r) => r.cableTypeLabel === "Puissance −");
  assert.equal(red?.totalLengthM, 8);
  assert.equal(red?.count, 2);
  assert.equal(black?.totalLengthM, 4);
  assert.equal(black?.count, 1);
});

test("computeBom surfaces harmonization suggestions from the real per-color totals", () => {
  const bom = computeBom(NO_NODES, [edge("e1", "0,75 mm²", "power-positive", 4)]);

  assert.equal(bom.optimized, false);
  assert.deepEqual(bom.cableHarmonizationSuggestions, [
    { section: "0,75 mm²", cableTypeLabel: "Puissance +", targetSection: "1,5 mm²", totalLengthM: 4 },
  ]);
  // La vue réelle affiche toujours la section réellement choisie.
  assert.equal(bom.cableRows[0]?.section, "0,75 mm²");
});

// Bug corrigé (retour utilisateur : "1mm² 18m mais en fait ça fait une
// bobine de rouge et une noire, la suggestion doit faire attention à la
// couleur pas juste la section") — un total combiné qui dépasse le seuil ne
// doit PAS masquer que chaque couleur, prise seule, reste sous le seuil.
test("computeBom evaluates each color independently, not a combined section total", () => {
  const bom = computeBom(NO_NODES, [
    edge("e1", "1 mm²", "power-positive", 9),
    edge("e2", "1 mm²", "power-negative", 9),
  ]);

  // 9 + 9 = 18m, au-dessus du seuil de 10m si on les combinait à tort — mais
  // chacune des deux couleurs, prise seule, reste bien sous le seuil.
  assert.equal(bom.cableHarmonizationSuggestions.length, 2);
  assert.ok(bom.cableHarmonizationSuggestions.every((s) => s.totalLengthM === 9));
});

test("computeBom redirects only the color actually under threshold", () => {
  const bom = computeBom(
    NO_NODES,
    [edge("e1", "1 mm²", "power-positive", 4), edge("e2", "1 mm²", "power-negative", 15)],
    { harmonizeSmallSections: true }
  );

  const red = bom.cableRows.find((r) => r.cableTypeLabel === "Puissance +");
  const black = bom.cableRows.find((r) => r.cableTypeLabel === "Puissance −");
  assert.equal(red?.section, "1,5 mm²"); // redirigé, sous le seuil
  assert.equal(black?.section, "1 mm²"); // pas redirigé, déjà assez pour sa propre bobine
});

test("computeBom redirects small sections to their target when harmonizeSmallSections is on", () => {
  const bom = computeBom(
    NO_NODES,
    [edge("e1", "0,75 mm²", "power-positive", 4), edge("e2", "1,5 mm²", "power-positive", 2)],
    { harmonizeSmallSections: true }
  );

  assert.equal(bom.optimized, true);
  // Les deux câbles (0,75mm² redirigé + 1,5mm² déjà natif) fusionnent en une
  // seule ligne 1,5mm² / Puissance +.
  assert.equal(bom.cableRows.length, 1);
  assert.equal(bom.cableRows[0]?.section, "1,5 mm²");
  assert.equal(bom.cableRows[0]?.totalLengthM, 6);
  assert.equal(bom.cableRows[0]?.count, 2);
  // La liste des suggestions reste basée sur les sections réelles, que la
  // vue soit optimisée ou non — sert à expliquer ce qui a été regroupé.
  assert.deepEqual(bom.cableHarmonizationSuggestions, [
    { section: "0,75 mm²", cableTypeLabel: "Puissance +", targetSection: "1,5 mm²", totalLengthM: 4 },
  ]);
});

test("computeBom does not redirect a small section once its total clears the threshold", () => {
  const bom = computeBom(NO_NODES, [edge("e1", "0,75 mm²", "power-positive", 20)], { harmonizeSmallSections: true });

  assert.equal(bom.cableRows[0]?.section, "0,75 mm²");
  assert.deepEqual(bom.cableHarmonizationSuggestions, []);
});

test("buildMaterialListCsv includes the cable color/type column and is Excel-safe (semicolons, quoted cells)", () => {
  const bom = computeBom(NO_NODES, [edge("e1", "16 mm²", "power-negative", 4)]);

  const csv = buildMaterialListCsv(bom, "Test");

  assert.match(csv, /"Section";"Couleur \/ type";"Équivalent AWG";"Nombre de câbles";"Métrage total \(m\)"/);
  assert.match(csv, /"16 mm²";"Puissance −";"6";"1";"4"/);
});
