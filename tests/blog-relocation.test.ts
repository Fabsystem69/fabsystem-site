import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// Refonte SEO (hub /blog) : les 3 guides van vivaient à la racine, sans URL
// ni navigation dédiées — relocalisés sous /blog avec redirections
// permanentes pour préserver le référencement déjà acquis.

const root = join(__dirname, "..");

const oldPaths = [
  "app/installation-electrique-van/page.tsx",
  "app/installation-electrique-van-victron-legere/page.tsx",
  "app/installation-van-batterie-tout-en-un-aferiy-p280/page.tsx",
];

const newPaths = [
  "app/blog/installation-electrique-van/page.tsx",
  "app/blog/installation-electrique-van-victron-legere/page.tsx",
  "app/blog/installation-van-batterie-tout-en-un-aferiy-p280/page.tsx",
];

test("the 3 guide pages no longer exist at their old root-level paths", () => {
  for (const relativePath of oldPaths) {
    assert.equal(existsSync(join(root, relativePath)), false, `${relativePath} should have been moved under app/blog`);
  }
});

test("the 3 guide pages exist under app/blog", () => {
  for (const relativePath of newPaths) {
    assert.equal(existsSync(join(root, relativePath)), true, `${relativePath} should exist`);
  }
});

test("next.config.ts redirects the 3 old paths to their new /blog location", () => {
  const config = readFileSync(join(root, "next.config.ts"), "utf8");

  assert.match(config, /source: "\/installation-electrique-van",\s*\n\s*destination: "\/blog\/installation-electrique-van"/);
  assert.match(
    config,
    /source: "\/installation-electrique-van-victron-legere",\s*\n\s*destination: "\/blog\/installation-electrique-van-victron-legere"/
  );
  assert.match(
    config,
    /source: "\/installation-van-batterie-tout-en-un-aferiy-p280",\s*\n\s*destination: "\/blog\/installation-van-batterie-tout-en-un-aferiy-p280"/
  );
});

test("none of the moved pages still self-reference their old absolute URL", () => {
  for (const relativePath of newPaths) {
    const content = readFileSync(join(root, relativePath), "utf8");
    const oldSlug = relativePath.split("/")[2];
    assert.doesNotMatch(content, new RegExp(`fabsystem\\.fr/${oldSlug}"`), `${relativePath} still references its old absolute URL`);
  }
});
