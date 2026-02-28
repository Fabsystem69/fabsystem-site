import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const CLIENT_FORBIDDEN_IMPORTS = [
  "@/lib/server/",
  "@/lib/prisma",
  "@/lib/rate-limit",
  "@/lib/signature-image",
  "@/lib/document-number",
  "@/lib/server-log",
  "@react-pdf/renderer",
  "nodemailer",
  "qrcode",
  "@prisma/adapter-pg",
  "pg",
  "node:fs",
  "fs",
  "node:crypto",
  "crypto",
];

function collectSourceFiles(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "generated") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, files);
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function getClientModules() {
  return collectSourceFiles(path.join(process.cwd(), "app")).concat(
    collectSourceFiles(path.join(process.cwd(), "components")),
    collectSourceFiles(path.join(process.cwd(), "lib"))
  ).filter((file) => {
    const source = fs.readFileSync(file, "utf8");
    return source.startsWith('"use client"') || source.startsWith("'use client'");
  });
}

test("client modules do not import server-only dependencies", () => {
  const offenders: Array<{ file: string; marker: string }> = [];

  for (const file of getClientModules()) {
    const source = fs.readFileSync(file, "utf8");

    for (const marker of CLIENT_FORBIDDEN_IMPORTS) {
      const importPattern = new RegExp(
        `from\\s+["']${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
      );

      if (importPattern.test(source) || source.includes(`"${marker}`) || source.includes(`'${marker}`)) {
        offenders.push({
          file: path.relative(process.cwd(), file),
          marker,
        });
      }
    }
  }

  assert.deepEqual(offenders, []);
});
