import assert from "node:assert/strict";
import test from "node:test";
import { hasValueChanged, isStructurallyEqual } from "@/lib/engines/value-diff";

test("primitives identiques sont égales", () => {
  assert.equal(isStructurallyEqual(1, 1), true);
  assert.equal(isStructurallyEqual("a", "a"), true);
  assert.equal(isStructurallyEqual(true, true), true);
  assert.equal(isStructurallyEqual(null, null), true);
});

test("primitives différentes ne sont pas égales", () => {
  assert.equal(isStructurallyEqual(1, 2), false);
  assert.equal(isStructurallyEqual("a", "b"), false);
  assert.equal(isStructurallyEqual(null, undefined), false);
});

test("objets aux mêmes clés et valeurs sont égaux, indépendamment de l'ordre", () => {
  assert.equal(isStructurallyEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
});

test("objets avec une valeur différente ne sont pas égaux", () => {
  assert.equal(isStructurallyEqual({ a: 1 }, { a: 2 }), false);
});

test("objets avec un nombre de clés différent ne sont pas égaux", () => {
  assert.equal(isStructurallyEqual({ a: 1 }, { a: 1, b: 2 }), false);
  assert.equal(isStructurallyEqual({ a: 1, b: 2 }, { a: 1 }), false);
});

test("tableaux identiques élément par élément sont égaux", () => {
  assert.equal(isStructurallyEqual([1, 2, 3], [1, 2, 3]), true);
});

test("tableaux de longueur différente ne sont pas égaux", () => {
  assert.equal(isStructurallyEqual([1, 2], [1, 2, 3]), false);
});

test("tableaux dans un ordre différent ne sont pas égaux (l'ordre compte pour un tableau)", () => {
  assert.equal(isStructurallyEqual([1, 2], [2, 1]), false);
});

test("objets imbriqués comparés récursivement", () => {
  const a = { consumers: [{ name: "Frigo", dailyWh: 500 }], meta: { complete: true } };
  const b = { consumers: [{ name: "Frigo", dailyWh: 500 }], meta: { complete: true } };
  const c = { consumers: [{ name: "Frigo", dailyWh: 600 }], meta: { complete: true } };

  assert.equal(isStructurallyEqual(a, b), true);
  assert.equal(isStructurallyEqual(a, c), false);
});

test("hasValueChanged est l'exact inverse de isStructurallyEqual", () => {
  assert.equal(hasValueChanged({ n: 1 }, { n: 1 }), false);
  assert.equal(hasValueChanged({ n: 1 }, { n: 2 }), true);
});
