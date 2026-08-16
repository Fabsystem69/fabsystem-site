#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node scripts/extract-drawio-library.mjs <input-dir> <output-dir> [--png]",
      "",
      "Examples:",
      "  node scripts/extract-drawio-library.mjs tmp/drawio-xml tmp/drawio-extracted",
      "  node scripts/extract-drawio-library.mjs tmp/drawio-xml tmp/drawio-extracted --png",
    ].join("\n"),
  );
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function decodeDataUri(dataUri) {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUri);

  if (!match) {
    throw new Error("Unsupported data URI");
  }

  const [, mimeType, base64Flag, payload] = match;

  if (base64Flag) {
    return {
      mimeType,
      buffer: Buffer.from(payload, "base64"),
    };
  }

  return {
    mimeType,
    buffer: Buffer.from(decodeURIComponent(payload), "utf8"),
  };
}

function extractLibraryJson(xmlContent) {
  const match = xmlContent.match(/<mxlibrary[^>]*>([\s\S]*?)<\/mxlibrary>/i);

  if (!match) {
    throw new Error("No <mxlibrary> node found");
  }

  return JSON.parse(match[1].trim());
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function convertSvgToPng(svgPath, pngPath) {
  try {
    await execFileAsync("sips", ["-s", "format", "png", svgPath, "--out", pngPath], {
      maxBuffer: 20 * 1024 * 1024,
    });
    return;
  } catch (sipsError) {
    const outputDir = path.dirname(pngPath);
    const quickLookPath = path.join(outputDir, `${path.basename(svgPath)}.png`);

    await execFileAsync("qlmanage", ["-t", "-s", "2048", "-o", outputDir, svgPath], {
      maxBuffer: 20 * 1024 * 1024,
    });

    if (quickLookPath !== pngPath) {
      await fs.rename(quickLookPath, pngPath);
    }

    if (!(await fileExists(pngPath))) {
      throw sipsError;
    }
  }
}

async function processLibraryFile(filePath, outputRoot, withPng) {
  const xmlContent = await fs.readFile(filePath, "utf8");
  const entries = extractLibraryJson(xmlContent);
  const libraryName = slugify(path.basename(filePath, path.extname(filePath))) || "library";
  const libraryOutputDir = path.join(outputRoot, libraryName);
  const svgDir = path.join(libraryOutputDir, "svg");
  const pngDir = path.join(libraryOutputDir, "png");
  const rawDir = path.join(libraryOutputDir, "raw");

  await ensureDir(svgDir);
  await ensureDir(rawDir);

  if (withPng) {
    await ensureDir(pngDir);
  }

  const summary = {
    library: libraryName,
    source: filePath,
    totalEntries: entries.length,
    svgCount: 0,
    pngCount: 0,
    pngErrorCount: 0,
    rawXmlCount: 0,
    skippedCount: 0,
    items: [],
  };

  for (const [index, entry] of entries.entries()) {
    const titleBase = slugify(entry.title || `${libraryName}-${index + 1}`) || `${libraryName}-${index + 1}`;
    const fileStem = `${String(index + 1).padStart(3, "0")}-${titleBase}`;
    const item = {
      index: index + 1,
      title: entry.title || null,
      fileStem,
      kind: null,
      outputs: [],
      error: null,
    };

    try {
      if (typeof entry.data === "string") {
        const { mimeType, buffer } = decodeDataUri(entry.data);

        if (mimeType === "image/svg+xml") {
          const svgPath = path.join(svgDir, `${fileStem}.svg`);
          await fs.writeFile(svgPath, buffer);
          item.kind = "svg";
          item.outputs.push(svgPath);
          summary.svgCount += 1;

          if (withPng) {
            try {
              const pngPath = path.join(pngDir, `${fileStem}.png`);
              await convertSvgToPng(svgPath, pngPath);
              item.outputs.push(pngPath);
              summary.pngCount += 1;
            } catch (error) {
              item.error = error instanceof Error ? error.message : String(error);
              summary.pngErrorCount += 1;
            }
          }
        } else if (mimeType === "image/png") {
          const pngPath = path.join(pngDir, `${fileStem}.png`);

          if (!withPng) {
            await ensureDir(pngDir);
          }

          await fs.writeFile(pngPath, buffer);
          item.kind = "png";
          item.outputs.push(pngPath);
          summary.pngCount += 1;
        } else {
          throw new Error(`Unsupported embedded MIME type: ${mimeType}`);
        }
      } else if (typeof entry.xml === "string") {
        const rawXmlPath = path.join(rawDir, `${fileStem}.xml`);
        await fs.writeFile(rawXmlPath, entry.xml, "utf8");
        item.kind = "raw-xml";
        item.outputs.push(rawXmlPath);
        summary.rawXmlCount += 1;
      } else {
        summary.skippedCount += 1;
        item.kind = "skipped";
      }
    } catch (error) {
      item.error = error instanceof Error ? error.message : String(error);
      summary.skippedCount += 1;
    }

    summary.items.push(item);
  }

  await fs.writeFile(
    path.join(libraryOutputDir, "summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );

  return summary;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const withPng = args.includes("--png");
  const positionalArgs = args.filter((arg) => arg !== "--png");
  const [inputDir, outputDir] = positionalArgs;

  if (!inputDir || !outputDir) {
    printUsage();
    process.exit(1);
  }

  const resolvedInputDir = path.resolve(inputDir);
  const resolvedOutputDir = path.resolve(outputDir);

  if (!(await fileExists(resolvedInputDir))) {
    throw new Error(`Input directory not found: ${resolvedInputDir}`);
  }

  await ensureDir(resolvedOutputDir);

  const entries = await fs.readdir(resolvedInputDir, { withFileTypes: true });
  const xmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))
    .map((entry) => path.join(resolvedInputDir, entry.name))
    .sort((a, b) => a.localeCompare(b));

  if (xmlFiles.length === 0) {
    throw new Error(`No .xml files found in ${resolvedInputDir}`);
  }

  const summaries = [];

  for (const xmlFile of xmlFiles) {
    summaries.push(await processLibraryFile(xmlFile, resolvedOutputDir, withPng));
  }

  const aggregate = {
    generatedAt: new Date().toISOString(),
    inputDir: resolvedInputDir,
    outputDir: resolvedOutputDir,
    libraries: summaries,
    totals: summaries.reduce(
      (acc, summary) => {
        acc.libraryCount += 1;
        acc.totalEntries += summary.totalEntries;
        acc.svgCount += summary.svgCount;
        acc.pngCount += summary.pngCount;
        acc.pngErrorCount += summary.pngErrorCount;
        acc.rawXmlCount += summary.rawXmlCount;
        acc.skippedCount += summary.skippedCount;
        return acc;
      },
      {
        libraryCount: 0,
        totalEntries: 0,
        svgCount: 0,
        pngCount: 0,
        pngErrorCount: 0,
        rawXmlCount: 0,
        skippedCount: 0,
      },
    ),
  };

  await fs.writeFile(
    path.join(resolvedOutputDir, "summary.json"),
    JSON.stringify(aggregate, null, 2),
    "utf8",
  );

  console.log(JSON.stringify(aggregate, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
