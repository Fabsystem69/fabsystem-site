import { getNodesBounds, type Node } from "@xyflow/react";
import { toPng } from "html-to-image";
import type { Bom } from "@/lib/electrical-components/bom";

// Export image (CDC §38-40) : capture uniquement le canvas (pas la barre
// d'outils ni les panneaux), cadré automatiquement sur le contenu — pas une
// simple capture d'écran de l'éditeur avec ses boutons (§37).
//
// Zoom fixe plutôt que "zoom pour faire tenir tout le schéma dans un cadre
// de taille donnée" (retour utilisateur : "je voudrais qu'on arrive à
// cette résolution et zoom avec un schéma entier") — l'ancienne approche
// réduisait le zoom d'autant plus que le schéma était grand, donc chaque
// composant devenait minuscule sur un gros schéma. Chaque composant garde
// désormais toujours la même taille réelle ; c'est le canvas exporté qui
// grandit pour contenir tout le schéma, jamais l'inverse.
const EXPORT_ZOOM = 1;
const EXPORT_PADDING_PX = 80;
const DISCLAIMER_BAND_HEIGHT = 44;
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
  tileLabel?: string,
  // Recadrage optionnel dans l'image brute (repère pixels réels, déjà
  // multiplié par `scale`) — sert au mode carrousel, qui découpe ses tuiles
  // dans une unique capture pleine résolution plutôt que de rappeler
  // toPng() plusieurs fois sur le même nœud (source d'un bug constaté :
  // appels répétés en succession rapide qui renvoyaient la même image).
  crop?: { sx: number; sy: number; sw: number; sh: number },
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
  if (crop) {
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h);
  } else {
    ctx.drawImage(img, 0, 0, w, h);
  }

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
  const tilePrefix = tileLabel ? `[${tileLabel}] ` : "";
  const disclaimerLine = `${tilePrefix}Généré par FabSystem pour ${projectName || "ce schéma"} — ${SCHEMA_DISCLAIMER}`;
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

const EXPORT_PIXEL_RATIO = 4;

export interface SchemaCapture {
  dataUrl: string;
  width: number;
  height: number;
}

// Capture brute (non décorée) de tout le schéma, à la résolution
// d'export — une seule fois, réutilisée pour l'aperçu plein format et pour
// découper les tuiles du mode carrousel (au lieu de rappeler toPng()
// plusieurs fois sur le même nœud : source d'un bug constaté où des appels
// successifs rapprochés renvoyaient plusieurs fois la même image).
interface RawCapture {
  dataUrl: string;
  x0: number; // origine logique (repère du schéma) du coin haut-gauche de l'image brute
  y0: number;
  width: number; // taille logique (CSS px, avant pixelRatio)
  height: number;
}

async function captureRawSchema(viewportEl: HTMLElement, nodes: Node[]): Promise<RawCapture> {
  const bounds = getNodesBounds(nodes);
  // Zoom fixe (EXPORT_ZOOM) : le canvas exporté fait exactement la taille du
  // schéma (+ marge), jamais rétréci pour tenir dans un cadre — voir le
  // commentaire en tête de fichier.
  const contentWidth = Math.round(bounds.width * EXPORT_ZOOM + EXPORT_PADDING_PX * 2);
  const contentHeight = Math.round(bounds.height * EXPORT_ZOOM + EXPORT_PADDING_PX * 2);
  const width = Math.max(MIN_IMAGE_WIDTH, contentWidth);
  const height = Math.max(MIN_IMAGE_HEIGHT, contentHeight);
  // Centre le contenu si le plancher MIN_IMAGE_* dépasse sa taille naturelle
  // (petit schéma), sinon simple marge EXPORT_PADDING_PX de chaque côté.
  const x0 = bounds.x - ((width - bounds.width * EXPORT_ZOOM) / 2) / EXPORT_ZOOM;
  const y0 = bounds.y - ((height - bounds.height * EXPORT_ZOOM) / 2) / EXPORT_ZOOM;
  const x = -x0 * EXPORT_ZOOM;
  const y = -y0 * EXPORT_ZOOM;

  const dataUrl = await toPng(viewportEl, {
    backgroundColor: "#ffffff",
    width,
    height,
    pixelRatio: EXPORT_PIXEL_RATIO,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${x}px, ${y}px) scale(${EXPORT_ZOOM})`,
    },
  });

  return { dataUrl, x0, y0, width, height };
}

export async function captureSchemaPng(nodes: Node[], projectName: string, showGrid = true): Promise<SchemaCapture | null> {
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl || nodes.length === 0) return null;

  const raw = await captureRawSchema(viewportEl, nodes);
  const dataUrl = await postProcess(raw.dataUrl, raw.width, raw.height, showGrid, projectName, EXPORT_PIXEL_RATIO);
  return { dataUrl, width: raw.width, height: raw.height + DISCLAIMER_BAND_HEIGHT };
}

// Mode carrousel (retour utilisateur : poster un schéma dense en une seule
// image de fil d'actualité le rend illisible même en haute résolution —
// "fais un post en album/carrousel : image 1 = vue d'ensemble, puis
// zooms sur chaque partie") — 1 vue d'ensemble + 3 zooms sur des bandes
// verticales successives (gauche → droite, dans le sens du courant :
// sources/charge → distribution → consommateurs/AC), découpées dans la
// même capture brute que l'aperçu. Léger recouvrement entre bandes pour ne
// pas couper un composant pile à la frontière.
const CAROUSEL_PARTS = 3;
const CAROUSEL_OVERLAP_PX = 100;

export interface CarouselCapture extends SchemaCapture {
  label: string;
}

export async function captureSchemaCarousel(nodes: Node[], projectName: string, showGrid = true): Promise<CarouselCapture[] | null> {
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl || nodes.length === 0) return null;

  const raw = await captureRawSchema(viewportEl, nodes);
  const overviewDataUrl = await postProcess(raw.dataUrl, raw.width, raw.height, showGrid, projectName, EXPORT_PIXEL_RATIO);
  const parts: CarouselCapture[] = [
    { dataUrl: overviewDataUrl, width: raw.width, height: raw.height + DISCLAIMER_BAND_HEIGHT, label: "Vue d'ensemble" },
  ];

  const bounds = getNodesBounds(nodes);
  const partWidth = bounds.width / CAROUSEL_PARTS;

  for (let i = 0; i < CAROUSEL_PARTS; i++) {
    const tileX0 = bounds.x + i * partWidth - (i > 0 ? CAROUSEL_OVERLAP_PX : 0) - EXPORT_PADDING_PX;
    const tileX1 = bounds.x + (i + 1) * partWidth + (i < CAROUSEL_PARTS - 1 ? CAROUSEL_OVERLAP_PX : 0) + EXPORT_PADDING_PX;
    const tileWidth = Math.round(tileX1 - tileX0);
    const tileHeight = raw.height;
    const label = `Partie ${i + 1}/${CAROUSEL_PARTS}`;

    // Repère de l'image brute déjà capturée = tileX0/Y0 relatifs à raw.x0/y0,
    // à l'échelle EXPORT_ZOOM * EXPORT_PIXEL_RATIO.
    const sx = Math.max(0, Math.round((tileX0 - raw.x0) * EXPORT_ZOOM * EXPORT_PIXEL_RATIO));
    const sy = 0;
    const sw = Math.round(tileWidth * EXPORT_ZOOM * EXPORT_PIXEL_RATIO);
    const sh = Math.round(tileHeight * EXPORT_ZOOM * EXPORT_PIXEL_RATIO);

    const dataUrl = await postProcess(raw.dataUrl, tileWidth, tileHeight, showGrid, projectName, EXPORT_PIXEL_RATIO, label, { sx, sy, sw, sh });
    parts.push({ dataUrl, width: tileWidth, height: tileHeight + DISCLAIMER_BAND_HEIGHT, label });
  }

  return parts;
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
