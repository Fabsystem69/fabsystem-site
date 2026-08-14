import { getNodesBounds, getViewportForBounds, type Node } from "@xyflow/react";
import { toPng } from "html-to-image";
import type { Bom } from "@/lib/electrical-components/bom";

// Export image (CDC §38-40) : capture uniquement le canvas (pas la barre
// d'outils ni les panneaux), cadré automatiquement sur le contenu — pas une
// simple capture d'écran de l'éditeur avec ses boutons (§37).
const EXPORT_PADDING = 0.15;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const DISCLAIMER_BAND_HEIGHT = 44;

export const SCHEMA_DISCLAIMER =
  "Schéma généré à titre indicatif. Il ne remplace pas la vérification et la validation par un professionnel qualifié avant toute réalisation. FabSystem décline toute responsabilité en cas d'erreur, d'omission ou de mauvaise interprétation.";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Grille discrète (option désactivable) + filigrane répété à faible opacité
// (retour utilisateur : "protéger les conceptions") + bandeau de mention
// légale — appliqués sur un canvas hors-écran après la capture brute.
async function postProcess(rawDataUrl: string, width: number, height: number, showGrid: boolean, projectName: string): Promise<string> {
  const img = await loadImage(rawDataUrl);
  const canvas = document.createElement("canvas");
  const totalHeight = height + DISCLAIMER_BAND_HEIGHT;
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawDataUrl;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  if (showGrid) {
    ctx.strokeStyle = "rgba(17, 24, 39, 0.05)";
    ctx.lineWidth = 1;
    const step = 20;
    for (let gx = 0; gx <= width; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx + 0.5, 0);
      ctx.lineTo(gx + 0.5, height);
      ctx.stroke();
    }
    for (let gy = 0; gy <= height; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy + 0.5);
      ctx.lineTo(width, gy + 0.5);
      ctx.stroke();
    }
  }

  ctx.drawImage(img, 0, 0);

  // Filigrane diagonal répété, peu visible.
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#111827";
  ctx.font = "600 18px 'Space Grotesk', system-ui, sans-serif";
  ctx.textBaseline = "middle";
  const watermarkText = "FabSystem Schéma";
  const stepX = 420;
  const stepY = 280;
  ctx.rotate((-25 * Math.PI) / 180);
  // Repère élargi pour couvrir le canvas malgré la rotation.
  for (let wy = -height; wy < height * 1.5; wy += stepY) {
    for (let wx = -width; wx < width * 1.5; wx += stepX) {
      ctx.fillText(watermarkText, wx, wy);
    }
  }
  ctx.restore();

  // Bandeau de mention légale.
  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(0, height, width, DISCLAIMER_BAND_HEIGHT);
  ctx.strokeStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(0, height + 0.5);
  ctx.lineTo(width, height + 0.5);
  ctx.stroke();
  ctx.fillStyle = "#6b7280";
  ctx.font = "11px -apple-system, 'Space Grotesk', system-ui, sans-serif";
  ctx.textBaseline = "middle";
  const disclaimerLine = `Généré par FabSystem pour ${projectName || "ce schéma"} — ${SCHEMA_DISCLAIMER}`;
  wrapText(ctx, disclaimerLine, 12, height + DISCLAIMER_BAND_HEIGHT / 2, width - 24, 13);

  return canvas.toDataURL("image/png");
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, centerY: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  const startY = centerY - ((lines.length - 1) * lineHeight) / 2;
  lines.slice(0, 2).forEach((line, i) => ctx.fillText(line, x, startY + i * lineHeight));
}

export async function captureSchemaPng(nodes: Node[], projectName: string, showGrid = true): Promise<string | null> {
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl || nodes.length === 0) return null;

  const bounds = getNodesBounds(nodes);
  const imageWidth = Math.max(640, Math.round(bounds.width + 160));
  const imageHeight = Math.max(480, Math.round(bounds.height + 160));
  const { x, y, zoom } = getViewportForBounds(bounds, imageWidth, imageHeight, MIN_ZOOM, MAX_ZOOM, EXPORT_PADDING);

  const rawDataUrl = await toPng(viewportEl, {
    backgroundColor: "#ffffff",
    width: imageWidth,
    height: imageHeight,
    pixelRatio: 2,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
  });

  return postProcess(rawDataUrl, imageWidth, imageHeight, showGrid, projectName);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "schema"
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const PRINT_STYLE = `
  body { font-family: -apple-system, "Space Grotesk", system-ui, sans-serif; padding: 32px; color: #111827; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; color: #374151; }
  .meta { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
  .disclaimer { color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 11px; margin: 12px 0 20px; }
  img { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 4px; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  th { color: #6b7280; font-weight: 600; font-size: 10px; text-transform: uppercase; }
  footer { margin-top: 20px; font-size: 10px; color: #9ca3af; }
`;

// PDF (CDC §39) : titre, schéma, date, mention légale, mention FabSystem
// discrète — via l'impression navigateur ("Enregistrer en PDF"), sans
// dépendance PDF supplémentaire côté client.
export function openPrintablePdf(dataUrl: string, projectName: string): void {
  const win = window.open("", "_blank");
  if (!win) return;
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const title = escapeHtml(projectName || "Schéma");

  win.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>${PRINT_STYLE}</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Généré le ${dateStr}</div>
  <div class="disclaimer">${escapeHtml(SCHEMA_DISCLAIMER)}</div>
  <img src="${dataUrl}" alt="${title}" />
  <footer>Généré par FabSystem pour ${title} — fabsystem.fr</footer>
</body>
</html>`);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
}

// Récapitulatif matériel / liste de courses (retour utilisateur : "un
// dossier récap des éléments... pour faire la liste de courses par
// catégorie"), même mécanisme d'impression que le PDF du schéma.
export function openPrintableBom(bom: Bom, projectName: string): void {
  const win = window.open("", "_blank");
  if (!win) return;
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const title = escapeHtml(projectName || "Schéma");

  const componentTables = bom.componentGroups
    .map(
      (group) => `
    <h2>${escapeHtml(group.category)}</h2>
    <table>
      <thead><tr><th>Élément</th><th>Caractéristiques</th><th>Quantité</th></tr></thead>
      <tbody>
        ${group.rows
          .map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.spec || "—")}</td><td>${row.count}</td></tr>`)
          .join("")}
      </tbody>
    </table>`,
    )
    .join("");

  const cableTable = `
    <h2>Câbles</h2>
    <table>
      <thead><tr><th>Section</th><th>Nombre de câbles</th><th>Métrage total</th></tr></thead>
      <tbody>
        ${bom.cableRows
          .map((row) => {
            const metrage =
              row.totalLengthM !== null
                ? `${String(row.totalLengthM).replace(".", ",")} m${row.missingLengthCount > 0 ? ` (+ ${row.missingLengthCount} câble${row.missingLengthCount > 1 ? "s" : ""} sans longueur)` : ""}`
                : `Longueur non renseignée (${row.missingLengthCount} câble${row.missingLengthCount > 1 ? "s" : ""})`;
            return `<tr><td>${escapeHtml(row.section)}</td><td>${row.count}</td><td>${escapeHtml(metrage)}</td></tr>`;
          })
          .join("")}
      </tbody>
    </table>`;

  win.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title} — Liste de matériel</title>
<style>${PRINT_STYLE}</style>
</head>
<body>
  <h1>${title} — Liste de matériel</h1>
  <div class="meta">Généré le ${dateStr} · ${bom.totalComponents} composants · ${bom.totalCables} câbles</div>
  <div class="disclaimer">${escapeHtml(SCHEMA_DISCLAIMER)} Les quantités et métrages sont calculés à partir du schéma et doivent être vérifiés avant commande.</div>
  ${componentTables}
  ${cableTable}
  <footer>Généré par FabSystem pour ${title} — fabsystem.fr</footer>
</body>
</html>`);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}
