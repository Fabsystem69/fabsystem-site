import { getNodesBounds, getViewportForBounds, type Node } from "@xyflow/react";
import { toPng } from "html-to-image";
import type { Bom } from "@/lib/electrical-components/bom";

// Export image (CDC §38-40) : capture uniquement le canvas (pas la barre
// d'outils ni les panneaux), cadré automatiquement sur le contenu — pas une
// simple capture d'écran de l'éditeur avec ses boutons (§37).
const EXPORT_PADDING = 0.15;
const MIN_ZOOM = 0.2;
// Relevé de 2 à 3 : avec un plancher de canvas plus grand (MIN_IMAGE_*),
// un petit schéma a besoin de plus de zoom pour remplir raisonnablement
// l'image plutôt que de flotter dans une grande zone blanche.
const MAX_ZOOM = 3;
const DISCLAIMER_BAND_HEIGHT = 44;
// Plancher de taille (retour utilisateur : export PNG "beaucoup trop petit
// et illisible" une fois posté sur Facebook) — un schéma avec peu de
// composants donnait une image minuscule (bounds + 160px de marge
// seulement). Facebook recompresse et réduit les images à l'affichage :
// partir d'une résolution confortable évite qu'un schéma simple devienne
// illisible après ce traitement.
const MIN_IMAGE_WIDTH = 1600;
const MIN_IMAGE_HEIGHT = 1000;

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
//
// `scale` doit correspondre au `pixelRatio` passé à toPng() : la capture
// brute fait `width*scale` × `height*scale` pixels réels malgré un style
// CSS logique de `width`×`height` — dessiner sans tenir compte de `scale`
// ne redessine que le coin haut-gauche de l'image sur un canvas trop petit
// et coupe tout le reste (bug corrigé : export PNG/PDF tronqué).
async function postProcess(
  rawDataUrl: string,
  width: number,
  height: number,
  showGrid: boolean,
  projectName: string,
  scale: number,
): Promise<string> {
  const img = await loadImage(rawDataUrl);
  const canvas = document.createElement("canvas");
  const w = width * scale;
  const h = height * scale;
  const bandHeight = DISCLAIMER_BAND_HEIGHT * scale;
  const totalHeight = h + bandHeight;
  canvas.width = w;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawDataUrl;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, totalHeight);

  if (showGrid) {
    ctx.strokeStyle = "rgba(17, 24, 39, 0.05)";
    ctx.lineWidth = scale;
    const step = 20 * scale;
    for (let gx = 0; gx <= w; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx + 0.5, 0);
      ctx.lineTo(gx + 0.5, h);
      ctx.stroke();
    }
    for (let gy = 0; gy <= h; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy + 0.5);
      ctx.lineTo(w, gy + 0.5);
      ctx.stroke();
    }
  }

  // Taille explicite (plutôt que drawImage(img, 0, 0)) : garantit un mapping
  // 1:1 avec le canvas même si la résolution réelle de l'image capturée
  // diverge légèrement de width*scale/height*scale (arrondis navigateur).
  ctx.drawImage(img, 0, 0, w, h);

  // Filigrane diagonal répété, peu visible.
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#111827";
  ctx.font = `600 ${18 * scale}px 'Space Grotesk', system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  const watermarkText = "FabSystem Schéma";
  const stepX = 420 * scale;
  const stepY = 280 * scale;
  ctx.rotate((-25 * Math.PI) / 180);
  // Repère élargi pour couvrir le canvas malgré la rotation.
  for (let wy = -h; wy < h * 1.5; wy += stepY) {
    for (let wx = -w; wx < w * 1.5; wx += stepX) {
      ctx.fillText(watermarkText, wx, wy);
    }
  }
  ctx.restore();

  // Bandeau de mention légale.
  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(0, h, w, bandHeight);
  ctx.strokeStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(0, h + 0.5);
  ctx.lineTo(w, h + 0.5);
  ctx.stroke();
  ctx.fillStyle = "#6b7280";
  ctx.font = `${11 * scale}px -apple-system, 'Space Grotesk', system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  const disclaimerLine = `Généré par FabSystem pour ${projectName || "ce schéma"} — ${SCHEMA_DISCLAIMER}`;
  wrapText(ctx, disclaimerLine, 12 * scale, h + bandHeight / 2, w - 24 * scale, 13 * scale);

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

const EXPORT_PIXEL_RATIO = 3;

export interface SchemaCapture {
  dataUrl: string;
  width: number;
  height: number;
}

export async function captureSchemaPng(nodes: Node[], projectName: string, showGrid = true): Promise<SchemaCapture | null> {
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl || nodes.length === 0) return null;

  const bounds = getNodesBounds(nodes);
  const imageWidth = Math.max(MIN_IMAGE_WIDTH, Math.round(bounds.width + 160));
  const imageHeight = Math.max(MIN_IMAGE_HEIGHT, Math.round(bounds.height + 160));
  const { x, y, zoom } = getViewportForBounds(bounds, imageWidth, imageHeight, MIN_ZOOM, MAX_ZOOM, EXPORT_PADDING);

  const rawDataUrl = await toPng(viewportEl, {
    backgroundColor: "#ffffff",
    width: imageWidth,
    height: imageHeight,
    pixelRatio: EXPORT_PIXEL_RATIO,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
  });

  const dataUrl = await postProcess(rawDataUrl, imageWidth, imageHeight, showGrid, projectName, EXPORT_PIXEL_RATIO);
  return { dataUrl, width: imageWidth, height: imageHeight + DISCLAIMER_BAND_HEIGHT };
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

// Format de page (retour utilisateur : "ne pas hésiter à changer les formats
// de page en A3 ou A2 si besoin") — un schéma large écrasé sur une A4
// portrait fixe devient illisible à l'impression. On choisit le plus petit
// format A-série (toujours paysage, les schémas sont presque toujours plus
// larges que hauts) dans lequel le rendu tient à une échelle raisonnable
// (~2 px CSS par mm, cohérent avec le pixelRatio 2 de la capture), sinon A2.
const PAGE_FORMATS: { name: string; widthMm: number; heightMm: number }[] = [
  { name: "A4", widthMm: 297, heightMm: 210 },
  { name: "A3", widthMm: 420, heightMm: 297 },
  { name: "A2", widthMm: 594, heightMm: 420 },
];
const CSS_PX_PER_MM = 2;

function pickPageFormat(width: number, height: number): { name: string; widthMm: number; heightMm: number } {
  const fit = PAGE_FORMATS.find((f) => width <= f.widthMm * CSS_PX_PER_MM && height <= f.heightMm * CSS_PX_PER_MM);
  return fit ?? PAGE_FORMATS[PAGE_FORMATS.length - 1];
}

// PDF (CDC §39) : titre, schéma, date, mention légale, mention FabSystem
// discrète — via l'impression navigateur ("Enregistrer en PDF"), sans
// dépendance PDF supplémentaire côté client.
export function openPrintablePdf(capture: SchemaCapture, projectName: string): void {
  const win = window.open("", "_blank");
  if (!win) return;
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const title = escapeHtml(projectName || "Schéma");
  const page = pickPageFormat(capture.width, capture.height);

  win.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: ${page.name} landscape; margin: 10mm; }
  ${PRINT_STYLE}
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Généré le ${dateStr} · format ${page.name} paysage</div>
  <div class="disclaimer">${escapeHtml(SCHEMA_DISCLAIMER)}</div>
  <img src="${capture.dataUrl}" alt="${title}" />
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

  // Câbles de bus de données à part (retour utilisateur) : préconfectionnés,
  // achetés à l'unité — longueur moyenne + nombre plutôt qu'un métrage total.
  const dataBusTable =
    bom.dataBusRows.length === 0
      ? ""
      : `
    <h2>Câbles de données</h2>
    <table>
      <thead><tr><th>Type</th><th>Nombre de câbles</th><th>Longueur moyenne</th></tr></thead>
      <tbody>
        ${bom.dataBusRows
          .map((row) => {
            const longueur =
              row.averageLengthM !== null
                ? `${String(row.averageLengthM).replace(".", ",")} m${row.missingLengthCount > 0 ? ` (+ ${row.missingLengthCount} câble${row.missingLengthCount > 1 ? "s" : ""} sans longueur)` : ""}`
                : `Longueur non renseignée (${row.missingLengthCount} câble${row.missingLengthCount > 1 ? "s" : ""})`;
            return `<tr><td>${escapeHtml(row.label)}</td><td>${row.count}</td><td>${escapeHtml(longueur)}</td></tr>`;
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
  ${dataBusTable}
  <footer>Généré par FabSystem pour ${title} — fabsystem.fr</footer>
</body>
</html>`);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}
