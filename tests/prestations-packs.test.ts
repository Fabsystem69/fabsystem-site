import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPrestationsPackSlug,
  findPrestationsPackIncludingEbook,
  getPrestationsPackDefinitionBySlug,
  getPrestationsPackPriceCents,
  isPrestationsPackSlug,
  listPrestationsPackDefinitions,
} from "@/lib/prestations-packs";

test("listPrestationsPackDefinitions returns exactly 12 packs (4 paliers x 3 categories)", () => {
  const definitions = listPrestationsPackDefinitions();
  assert.equal(definitions.length, 12);

  const slugs = new Set(definitions.map((def) => def.slug));
  assert.equal(slugs.size, 12);
});

test("pricing table matches the exact mission 5 price table", () => {
  const expected: Record<string, Record<string, number>> = {
    van: { amarrage: 8900, cap: 19900, passerelle: 49900, "grand-large": 74900 },
    "camping-car": { amarrage: 10900, cap: 27900, passerelle: 59900, "grand-large": 89900 },
    bateau: { amarrage: 12900, cap: 34900, passerelle: 74900, "grand-large": 109900 },
  };

  for (const [categorie, paliers] of Object.entries(expected)) {
    for (const [palier, priceCents] of Object.entries(paliers)) {
      assert.equal(
        getPrestationsPackPriceCents(
          categorie as "van" | "camping-car" | "bateau",
          palier as "amarrage" | "cap" | "passerelle" | "grand-large"
        ),
        priceCents,
        `${categorie}/${palier}`
      );
    }
  }
});

test("Amarrage never grants an ebook, for any category", () => {
  for (const categorie of ["van", "camping-car", "bateau"] as const) {
    const definition = getPrestationsPackDefinitionBySlug(
      buildPrestationsPackSlug("amarrage", categorie)
    );
    assert.equal(definition?.grantsEbookSlug, null, categorie);
  }
});

test("Camping-car never grants an ebook, for any palier", () => {
  for (const palier of ["amarrage", "cap", "passerelle", "grand-large"] as const) {
    const definition = getPrestationsPackDefinitionBySlug(
      buildPrestationsPackSlug(palier, "camping-car")
    );
    assert.equal(definition?.grantsEbookSlug, null, palier);
  }
});

test("Cap/Passerelle/Grand Large grant the van ebook for van packs", () => {
  for (const palier of ["cap", "passerelle", "grand-large"] as const) {
    const definition = getPrestationsPackDefinitionBySlug(buildPrestationsPackSlug(palier, "van"));
    assert.equal(definition?.grantsEbookSlug, "ebook-electricite-van", palier);
  }
});

test("Cap/Passerelle/Grand Large grant the bateau ebook for bateau packs", () => {
  for (const palier of ["cap", "passerelle", "grand-large"] as const) {
    const definition = getPrestationsPackDefinitionBySlug(
      buildPrestationsPackSlug(palier, "bateau")
    );
    assert.equal(definition?.grantsEbookSlug, "ebook-electricite-bateau", palier);
  }
});

test("isPrestationsPackSlug distinguishes pack slugs from ebook slugs", () => {
  assert.equal(isPrestationsPackSlug("pack-amarrage-van"), true);
  assert.equal(isPrestationsPackSlug("ebook-electricite-van"), false);
});

test("getPrestationsPackDefinitionBySlug returns null for a non-pack slug", () => {
  assert.equal(getPrestationsPackDefinitionBySlug("ebook-electricite-van"), null);
});

test("buildPrestationsPackSlug round-trips through getPrestationsPackDefinitionBySlug", () => {
  const slug = buildPrestationsPackSlug("grand-large", "camping-car");
  const definition = getPrestationsPackDefinitionBySlug(slug);
  assert.equal(definition?.palier, "grand-large");
  assert.equal(definition?.categorie, "camping-car");
});

test("findPrestationsPackIncludingEbook finds a pack for the van ebook", () => {
  const definition = findPrestationsPackIncludingEbook("ebook-electricite-van");
  assert.equal(definition?.categorie, "van");
  assert.notEqual(definition?.palier, "amarrage");
});

test("findPrestationsPackIncludingEbook finds a pack for the bateau ebook", () => {
  const definition = findPrestationsPackIncludingEbook("ebook-electricite-bateau");
  assert.equal(definition?.categorie, "bateau");
  assert.notEqual(definition?.palier, "amarrage");
});

test("findPrestationsPackIncludingEbook returns undefined for a product with no matching pack", () => {
  assert.equal(findPrestationsPackIncludingEbook("ebook-electricite-camping-car"), undefined);
  assert.equal(findPrestationsPackIncludingEbook("some-unrelated-product"), undefined);
});
