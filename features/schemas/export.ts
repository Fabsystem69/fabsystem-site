import { getNodesBounds, type Node, type Edge } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";
import JSZip from "jszip";
import type { Bom } from "@/lib/electrical-components/bom";
import { CABLE_TYPES } from "@/lib/electrical-components/cable-types";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

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
const EXPORT_FOOTER_HEIGHT = 64;
const EXPORT_FOOTER_PADDING_PX = 12;
const EXPORT_LOGO_SRC = "/FabSystem-Logo.svg";
const EXPORT_LOGO_TARGET_HEIGHT_PX = 28;
const MIN_IMAGE_WIDTH = 1600;
const MIN_IMAGE_HEIGHT = 1000;

export const SCHEMA_DISCLAIMER =
  "Schéma généré à titre indicatif. Il ne remplace pas la vérification et la validation par un professionnel qualifié avant toute réalisation. FabSystem décline toute responsabilité en cas d'erreur, d'omission ou de mauvaise interprétation.";

let exportLogoImagePromise: Promise<HTMLImageElement | null> | null = null;
let exportLogoDataUrlPromise: Promise<string | null> | null = null;

// Isolement par zone à l'export (retour utilisateur : "dans les zones je
// voudrais pouvoir isoler uniquement la zone pour les imprimer, beaucoup
// plus intelligent que par famille") — contrairement au filtre par
// catégorie (hiddenCategories), qui masque des TYPES de composants dans
// tout le schéma, isoler une zone garde uniquement ce qui se trouve
// GÉOMÉTRIQUEMENT à l'intérieur du rectangle choisi, quels que soient les
// types de composants qu'elle contient. Purement géométrique et calculé à
// l'export (rien de persisté) : cohérent avec le choix de ne pas créer de
// lien de rattachement automatique quand on glisse un composant dans une
// zone — un composant "appartient" à une zone simplement parce qu'il est
// dessus au moment de l'export, ni plus ni moins.
export function filterNodesByZone<T extends Node>(nodes: T[], zoneId: string | null): T[] {
  if (!zoneId) return nodes;
  const zone = nodes.find((n) => n.id === zoneId);
  if (!zone) return nodes;
  const zw = zone.measured?.width ?? zone.width ?? 0;
  const zh = zone.measured?.height ?? zone.height ?? 0;
  const zx1 = zone.position.x;
  const zy1 = zone.position.y;
  const zx2 = zx1 + zw;
  const zy2 = zy1 + zh;
  return nodes.filter((n) => {
    if (n.id === zoneId) return true;
    if (n.type === "zone") return false;
    const w = n.measured?.width ?? n.width ?? 0;
    const h = n.measured?.height ?? n.height ?? 0;
    const cx = n.position.x + w / 2;
    const cy = n.position.y + h / 2;
    return cx >= zx1 && cx <= zx2 && cy >= zy1 && cy <= zy2;
  });
}

export function filterEdgesForNodes<T extends Edge>(edges: T[], nodes: Node[]): T[] {
  const ids = new Set(nodes.map((n) => n.id));
  return edges.filter((e) => ids.has(e.source) && ids.has(e.target));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Lecture du blob impossible"));
    reader.readAsDataURL(blob);
  });
}

function loadExportLogoImage(): Promise<HTMLImageElement | null> {
  if (!exportLogoImagePromise) {
    exportLogoImagePromise = loadImage(EXPORT_LOGO_SRC).catch(() => null);
  }
  return exportLogoImagePromise;
}

async function loadExportLogoDataUrl(): Promise<string | null> {
  if (!exportLogoDataUrlPromise) {
    exportLogoDataUrlPromise = fetch(EXPORT_LOGO_SRC)
      .then(async (response) => {
        if (!response.ok) return null;
        return readBlobAsDataUrl(await response.blob());
      })
      .catch(() => null);
  }
  return exportLogoDataUrlPromise;
}

function decodeDataUrlToText(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return dataUrl;

  const header = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);
  if (header.includes(";base64")) {
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return decodeURIComponent(payload);
}

function computeLogoSize(logo: { naturalWidth: number; naturalHeight: number }, scale = 1) {
  const maxHeight = EXPORT_LOGO_TARGET_HEIGHT_PX * scale;
  const ratio = logo.naturalHeight > 0 ? logo.naturalWidth / logo.naturalHeight : 1;
  return {
    width: maxHeight * ratio,
    height: maxHeight,
  };
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
interface LegendItem {
  label: string;
  color: string;
}

export interface EquipmentListItem {
  label: string;
  detail: string;
}

// Rappel des équipements installés (V2, retour utilisateur : "surtout le
// choix des boîtiers qui est important, Victron Phoenix etc., pour avoir
// une page avec tout le nécessaire pour lire le schéma") — ajouté sur
// l'export PNG/PDF, utile pour relire d'un coup d'œil ce qui est prévu sans
// rouvrir l'éditeur. Distinct de la « Liste de matériel » (export séparé,
// plus complet : câbles, fusibles, tous composants) : ici seulement ce qui
// aide à identifier le matériel réel — d'abord les composants avec une
// marque/modèle choisi (le plus utile pour retrouver une notice), puis les
// appareils consommateurs avec leur puissance.
const APPLIANCE_TYPES = new Set(["consumer", "bilge-pump"]);

export function buildEquipmentList(nodes: Node[]): EquipmentListItem[] {
  const withBrandModel: EquipmentListItem[] = [];
  const appliances: EquipmentListItem[] = [];

  for (const n of nodes) {
    const data = n.data as ElectricalNodeData;
    const label = String(data.label ?? "Composant");
    const brand = typeof data.brand === "string" ? data.brand : "";
    const model = typeof data.model === "string" ? data.model : "";
    if (brand && model) {
      withBrandModel.push({ label, detail: `${brand} ${model}` });
      continue;
    }
    if (APPLIANCE_TYPES.has(data.componentType)) {
      const powerW = Number(data.powerW) || 0;
      appliances.push({ label, detail: powerW > 0 ? `${powerW} W` : "—" });
    }
  }

  return [...withBrandModel, ...appliances];
}

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
  // Cartouche + légende (retour utilisateur : "petit carré comme en dessin
  // technique avec le nom du projet, et aussi une légende") — legend vide
  // si aucun câble n'a de type reconnu (schéma sans composant).
  legend: LegendItem[] = [],
  // Rappel des équipements installés (retour utilisateur) — vide sur les
  // tuiles zoomées du carrousel, seulement sur la vue d'ensemble.
  equipment: EquipmentListItem[] = [],
): Promise<string> {
  const img = await loadImage(rawDataUrl);
  const logo = await loadExportLogoImage();
  const canvas = document.createElement("canvas");
  const w = width * scale;
  const h = height * scale;
  const footerHeight = EXPORT_FOOTER_HEIGHT * scale;
  const totalHeight = h + footerHeight;
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

  drawLegend(ctx, legend, w, h, scale);
  drawTitleBlock(ctx, projectName, tileLabel, w, h, scale);
  drawEquipmentList(ctx, equipment, w, scale);

  drawFooter(ctx, projectName, tileLabel, w, h, footerHeight, scale, logo);

  return canvas.toDataURL("image/png");
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  projectName: string,
  tileLabel: string | undefined,
  w: number,
  h: number,
  footerHeight: number,
  scale: number,
  logo: HTMLImageElement | null,
) {
  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(0, h, w, footerHeight);
  ctx.strokeStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(0, h + 0.5);
  ctx.lineTo(w, h + 0.5);
  ctx.stroke();

  const padding = EXPORT_FOOTER_PADDING_PX * scale;
  let logoSpace = 0;

  if (logo) {
    const size = computeLogoSize(logo, scale);
    const logoX = w - padding - size.width;
    const logoY = h + (footerHeight - size.height) / 2;
    ctx.drawImage(logo, logoX, logoY, size.width, size.height);
    logoSpace = size.width + padding;
  }

  ctx.fillStyle = "#6b7280";
  ctx.font = `${11 * scale}px -apple-system, 'Space Grotesk', system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  const tilePrefix = tileLabel ? `[${tileLabel}] ` : "";
  const disclaimerLine = `${tilePrefix}Généré par FabSystem pour ${projectName || "ce schéma"} — ${SCHEMA_DISCLAIMER}`;
  wrapText(ctx, disclaimerLine, padding, h + footerHeight / 2, w - padding * 2 - logoSpace, 13 * scale, 2);
}

// Légende des couleurs de câble (retour utilisateur) — coin bas-gauche du
// schéma, une entrée par type de câble effectivement présent (pas la liste
// complète : inutile d'expliquer le "Bus de données" sur un schéma qui n'en
// a pas).
function drawLegend(ctx: CanvasRenderingContext2D, legend: LegendItem[], w: number, h: number, scale: number) {
  if (legend.length === 0) return;

  const pad = 10 * scale;
  const lineHeight = 18 * scale;
  const swatchW = 20 * scale;
  const titleH = 20 * scale;
  ctx.font = `600 ${11 * scale}px -apple-system, 'Space Grotesk', system-ui, sans-serif`;
  const textWidth = Math.max(...legend.map((l) => ctx.measureText(l.label).width));
  const boxW = pad * 2 + swatchW + 8 * scale + textWidth;
  const boxH = titleH + legend.length * lineHeight + pad;
  const x = 16 * scale;
  const y = h - boxH - 16 * scale;

  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = scale;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeRect(x + 0.5, y + 0.5, boxW, boxH);

  ctx.fillStyle = "#374151";
  ctx.font = `700 ${10 * scale}px -apple-system, 'Space Grotesk', system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("LÉGENDE", x + pad, y + titleH / 2 + 2 * scale);

  ctx.font = `${11 * scale}px -apple-system, 'Space Grotesk', system-ui, sans-serif`;
  legend.forEach((item, i) => {
    const rowY = y + titleH + i * lineHeight + lineHeight / 2;
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(x + pad, rowY);
    ctx.lineTo(x + pad + swatchW, rowY);
    ctx.stroke();
    ctx.fillStyle = "#374151";
    ctx.fillText(item.label, x + pad + swatchW + 8 * scale, rowY);
  });
}

// Tronque un texte à une largeur max (mesurée avec la police déjà réglée
// sur `ctx`), en ajoutant une ellipse — même principe que le titre du
// cartouche (`drawTitleBlock`), pour éviter qu'une référence de marque
// longue ne fasse exploser la largeur de la boîte.
function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

// Rappel des équipements installés (retour utilisateur : "surtout le choix
// des boîtiers... pour avoir une page avec tout le nécessaire pour lire le
// schéma") — coin haut-droit, seule zone encore libre (légende en
// bas-gauche, cartouche en bas-droit). Nombre de lignes plafonné pour ne
// jamais envahir le schéma : au-delà, une ligne "+N autres" résume le reste
// plutôt que de faire grandir la boîte indéfiniment. Largeur de colonne
// plafonnée aussi (un nom de modèle peut être long) — tronqué avec ellipse.
const EQUIPMENT_LIST_MAX_ROWS = 10;
const EQUIPMENT_LABEL_MAX_WIDTH_PX = 130;
const EQUIPMENT_DETAIL_MAX_WIDTH_PX = 190;

function drawEquipmentList(ctx: CanvasRenderingContext2D, equipment: EquipmentListItem[], w: number, scale: number) {
  if (equipment.length === 0) return;

  const visible = equipment.slice(0, EQUIPMENT_LIST_MAX_ROWS);
  const extra = equipment.length - visible.length;
  const rowCount = visible.length + (extra > 0 ? 1 : 0);
  const labelMaxWidth = EQUIPMENT_LABEL_MAX_WIDTH_PX * scale;
  const detailMaxWidth = EQUIPMENT_DETAIL_MAX_WIDTH_PX * scale;

  const pad = 10 * scale;
  const lineHeight = 18 * scale;
  const titleH = 20 * scale;
  ctx.font = `${11 * scale}px -apple-system, 'Space Grotesk', system-ui, sans-serif`;
  const labelWidth = Math.min(labelMaxWidth, Math.max(...visible.map((d) => ctx.measureText(d.label).width)));
  const detailWidth = Math.min(detailMaxWidth, Math.max(...visible.map((d) => ctx.measureText(d.detail).width)));
  const boxW = pad * 2 + labelWidth + 16 * scale + detailWidth;
  const boxH = titleH + rowCount * lineHeight + pad;
  const x = w - boxW - 16 * scale;
  const y = 16 * scale;

  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = scale;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeRect(x + 0.5, y + 0.5, boxW, boxH);

  ctx.fillStyle = "#374151";
  ctx.font = `700 ${10 * scale}px -apple-system, 'Space Grotesk', system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("ÉQUIPEMENTS INSTALLÉS", x + pad, y + titleH / 2 + 2 * scale);

  ctx.font = `${11 * scale}px -apple-system, 'Space Grotesk', system-ui, sans-serif`;
  visible.forEach((item, i) => {
    const rowY = y + titleH + i * lineHeight + lineHeight / 2;
    ctx.fillStyle = "#374151";
    ctx.textAlign = "left";
    ctx.fillText(truncateToWidth(ctx, item.label, labelMaxWidth), x + pad, rowY);
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "right";
    ctx.fillText(truncateToWidth(ctx, item.detail, detailMaxWidth), x + boxW - pad, rowY);
    ctx.textAlign = "left";
  });
  if (extra > 0) {
    const rowY = y + titleH + visible.length * lineHeight + lineHeight / 2;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(`+${extra} autres`, x + pad, rowY);
  }
}

// Cartouche (retour utilisateur : "petit carré comme en dessin technique
// avec le nom du projet") — coin bas-droit, inspiré des cartouches de plan
// technique (titre, date, mention de la partie si export en carrousel).
function drawTitleBlock(ctx: CanvasRenderingContext2D, projectName: string, tileLabel: string | undefined, w: number, h: number, scale: number) {
  const pad = 10 * scale;
  const boxW = 260 * scale;
  const rowH = 20 * scale;
  const rows = tileLabel ? 3 : 2;
  const boxH = pad * 2 + rows * rowH;
  const x = w - boxW - 16 * scale;
  const y = h - boxH - 16 * scale;

  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = scale;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeRect(x + 0.5, y + 0.5, boxW, boxH);

  ctx.textBaseline = "middle";
  let rowY = y + pad + rowH / 2;

  ctx.fillStyle = "#111827";
  ctx.font = `700 ${13 * scale}px 'Space Grotesk', system-ui, sans-serif`;
  const title = projectName || "Schéma";
  const maxTitleWidth = boxW - pad * 2;
  let displayTitle = title;
  while (ctx.measureText(displayTitle).width > maxTitleWidth && displayTitle.length > 1) {
    displayTitle = displayTitle.slice(0, -1);
  }
  if (displayTitle !== title) displayTitle = `${displayTitle.slice(0, -1)}…`;
  ctx.fillText(displayTitle, x + pad, rowY);
  rowY += rowH;

  ctx.fillStyle = "#6b7280";
  ctx.font = `${11 * scale}px -apple-system, 'Space Grotesk', system-ui, sans-serif`;
  const dateStr = new Date().toLocaleDateString("fr-FR");
  // Petite touche marketing (retour utilisateur) : le nom du site reste
  // visible quand le schéma circule hors du site (réseaux sociaux, impression).
  ctx.fillText(`Créé avec fabsystem.fr · ${dateStr}`, x + pad, rowY);

  if (tileLabel) {
    rowY += rowH;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(tileLabel, x + pad, rowY);
  }
}

// Déduit la légende à partir des types de câble effectivement utilisés
// dans le schéma (ordre = celui de CABLE_TYPES, jamais dupliqué).
export function buildCableLegend(edges: Edge<CableEdgeData>[]): LegendItem[] {
  const used = new Set(edges.map((e) => e.data?.cableType).filter(Boolean));
  return CABLE_TYPES.filter((t) => used.has(t.value)).map((t) => ({ label: t.label, color: t.color }));
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  centerY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
) {
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
  const limitedLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let lastLine = limitedLines[maxLines - 1] ?? "";
    while (lastLine.length > 1 && ctx.measureText(`${lastLine}…`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1);
    }
    limitedLines[maxLines - 1] = `${lastLine}…`;
  }
  const startY = centerY - ((limitedLines.length - 1) * lineHeight) / 2;
  limitedLines.forEach((line, i) => ctx.fillText(line, x, startY + i * lineHeight));
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

// Miniature basse résolution pour la carte projet du dashboard (retour
// utilisateur : "je n'arrive même pas à retrouver mon schéma directement
// dans dashboard") — capture brute sans grille/filigrane/cartouche (inutile
// à cette taille), générée à chaque sauvegarde liée à un projet.
const THUMBNAIL_MAX_WIDTH = 480;
const THUMBNAIL_PIXEL_RATIO = 1;

export async function captureSchemaThumbnail(nodes: Node[]): Promise<string | null> {
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl || nodes.length === 0) return null;

  const bounds = getNodesBounds(nodes);
  const contentWidth = bounds.width + EXPORT_PADDING_PX * 2;
  const contentHeight = bounds.height + EXPORT_PADDING_PX * 2;
  const zoom = Math.min(1, THUMBNAIL_MAX_WIDTH / contentWidth);
  const width = Math.max(1, Math.round(contentWidth * zoom));
  const height = Math.max(1, Math.round(contentHeight * zoom));
  const x = -(bounds.x - EXPORT_PADDING_PX) * zoom;
  const y = -(bounds.y - EXPORT_PADDING_PX) * zoom;

  return toPng(viewportEl, {
    backgroundColor: "#ffffff",
    width,
    height,
    pixelRatio: THUMBNAIL_PIXEL_RATIO,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
  });
}

export async function captureSchemaPng(
  nodes: Node[],
  edges: Edge<CableEdgeData>[],
  projectName: string,
  showGrid = true,
): Promise<SchemaCapture | null> {
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl || nodes.length === 0) return null;

  const raw = await captureRawSchema(viewportEl, nodes);
  const dataUrl = await postProcess(raw.dataUrl, raw.width, raw.height, showGrid, projectName, EXPORT_PIXEL_RATIO, undefined, undefined, buildCableLegend(edges), buildEquipmentList(nodes));
  return { dataUrl, width: raw.width, height: raw.height + EXPORT_FOOTER_HEIGHT };
}

async function decorateSvgExport(dataUrl: string, width: number, height: number): Promise<string> {
  const svgMarkup = decodeDataUrlToText(dataUrl);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgMarkup, "image/svg+xml");
  if (doc.querySelector("parsererror")) return dataUrl;

  const svg = doc.documentElement;
  const svgNamespace = "http://www.w3.org/2000/svg";
  const xlinkNamespace = "http://www.w3.org/1999/xlink";
  const totalHeight = height + EXPORT_FOOTER_HEIGHT;

  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(totalHeight));
  svg.setAttribute("viewBox", `0 0 ${width} ${totalHeight}`);
  svg.setAttribute("xmlns:xlink", xlinkNamespace);

  const footerBg = doc.createElementNS(svgNamespace, "rect");
  footerBg.setAttribute("x", "0");
  footerBg.setAttribute("y", String(height));
  footerBg.setAttribute("width", String(width));
  footerBg.setAttribute("height", String(EXPORT_FOOTER_HEIGHT));
  footerBg.setAttribute("fill", "#f9fafb");
  svg.appendChild(footerBg);

  const footerLine = doc.createElementNS(svgNamespace, "line");
  footerLine.setAttribute("x1", "0");
  footerLine.setAttribute("y1", String(height + 0.5));
  footerLine.setAttribute("x2", String(width));
  footerLine.setAttribute("y2", String(height + 0.5));
  footerLine.setAttribute("stroke", "#e5e7eb");
  footerLine.setAttribute("stroke-width", "1");
  svg.appendChild(footerLine);

  const footerText = doc.createElementNS(svgNamespace, "text");
  footerText.setAttribute("x", String(EXPORT_FOOTER_PADDING_PX));
  footerText.setAttribute("y", String(height + EXPORT_FOOTER_HEIGHT / 2 + 4));
  footerText.setAttribute("fill", "#6b7280");
  footerText.setAttribute("font-size", "11");
  footerText.setAttribute("font-family", "-apple-system, system-ui, sans-serif");
  footerText.textContent = "Genere avec FabSystem - fabsystem.fr";
  svg.appendChild(footerText);

  const logoDataUrl = await loadExportLogoDataUrl();
  if (logoDataUrl) {
    const logoHeight = EXPORT_LOGO_TARGET_HEIGHT_PX;
    const logoWidth = logoHeight * (843 / 400);
    const logoX = width - EXPORT_FOOTER_PADDING_PX - logoWidth;
    const logoY = height + (EXPORT_FOOTER_HEIGHT - logoHeight) / 2;
    const image = doc.createElementNS(svgNamespace, "image");
    image.setAttribute("x", String(logoX));
    image.setAttribute("y", String(logoY));
    image.setAttribute("width", String(logoWidth));
    image.setAttribute("height", String(logoHeight));
    image.setAttribute("preserveAspectRatio", "xMidYMid meet");
    image.setAttribute("href", logoDataUrl);
    image.setAttributeNS(xlinkNamespace, "xlink:href", logoDataUrl);
    svg.appendChild(image);
  }

  const serialized = new XMLSerializer().serializeToString(doc);
  return readBlobAsDataUrl(new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }));
}

// Export SVG (V2 — inspiré de Wireframe qui propose PNG/PDF/SVG). Le rendu
// garde son principe actuel (capture via <foreignObject>) mais reçoit
// désormais un pied de page de marque avec le logo FabSystem pour rester
// cohérent avec les exports raster.
export async function captureSchemaSvg(nodes: Node[]): Promise<SchemaCapture | null> {
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl || nodes.length === 0) return null;

  const bounds = getNodesBounds(nodes);
  const width = Math.round(bounds.width + EXPORT_PADDING_PX * 2);
  const height = Math.round(bounds.height + EXPORT_PADDING_PX * 2);
  const x = -(bounds.x - EXPORT_PADDING_PX);
  const y = -(bounds.y - EXPORT_PADDING_PX);

  const dataUrl = await toSvg(viewportEl, {
    backgroundColor: "#ffffff",
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${x}px, ${y}px) scale(1)`,
    },
  });

  return { dataUrl: await decorateSvgExport(dataUrl, width, height), width, height: height + EXPORT_FOOTER_HEIGHT };
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

export async function captureSchemaCarousel(
  nodes: Node[],
  edges: Edge<CableEdgeData>[],
  projectName: string,
  showGrid = true,
): Promise<CarouselCapture[] | null> {
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl || nodes.length === 0) return null;

  const legend = buildCableLegend(edges);
  const raw = await captureRawSchema(viewportEl, nodes);
  const overviewDataUrl = await postProcess(
    raw.dataUrl,
    raw.width,
    raw.height,
    showGrid,
    projectName,
    EXPORT_PIXEL_RATIO,
    "Vue d'ensemble",
    undefined,
    legend,
    buildEquipmentList(nodes),
  );
  const parts: CarouselCapture[] = [
    { dataUrl: overviewDataUrl, width: raw.width, height: raw.height + EXPORT_FOOTER_HEIGHT, label: "Vue d'ensemble" },
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

    const dataUrl = await postProcess(raw.dataUrl, tileWidth, tileHeight, showGrid, projectName, EXPORT_PIXEL_RATIO, label, { sx, sy, sw, sh }, legend);
    parts.push({ dataUrl, width: tileWidth, height: tileHeight + EXPORT_FOOTER_HEIGHT, label });
  }

  return parts;
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

// Regroupe les images du carrousel dans une seule archive (retour
// utilisateur : "pour le carrousel il serait pas mieux de faire un zip ?")
// plutôt que 4 téléchargements séparés — plus simple à récupérer, et évite
// les navigateurs qui bloquent les téléchargements multiples déclenchés
// d'affilée.
export async function downloadCarouselZip(parts: CarouselCapture[], projectName: string): Promise<void> {
  const zip = new JSZip();
  const base = slugify(projectName);
  parts.forEach((part, i) => {
    const base64 = part.dataUrl.split(",")[1];
    const slugLabel = slugify(part.label);
    zip.file(`${String(i + 1).padStart(2, "0")}-${slugLabel}.png`, base64, { base64: true });
  });
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${base}_carrousel.zip`);
  // Révocation différée : le navigateur doit avoir le temps de lire le blob
  // pour démarrer le téléchargement avant que l'URL ne devienne invalide.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
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

// Bug corrigé : le calcul ne déduisait ni les marges de @page (10mm de
// chaque côté) ni la place prise par le titre, la date, le bandeau
// d'avertissement et le pied de page (PRINT_STYLE) — le schéma "tenait"
// selon ce calcul mais débordait quand même sur une 2e page à l'impression
// réelle, qui elle inclut ce contenu autour de l'image.
const PAGE_MARGIN_MM = 10;
// Estimation prudente (titre + date + bandeau d'avertissement sur 2 lignes
// + pied de page + padding du corps), en mm à ~2 px CSS/mm — mieux vaut
// changer de format un cran plus tôt que reproduire le bug à l'envers.
const PRINT_CHROME_HEIGHT_MM = 55;

function pickPageFormat(width: number, height: number): { name: string; widthMm: number; heightMm: number } {
  const fit = PAGE_FORMATS.find((f) => {
    const usableWidthPx = (f.widthMm - PAGE_MARGIN_MM * 2) * CSS_PX_PER_MM;
    const usableHeightPx = (f.heightMm - PAGE_MARGIN_MM * 2 - PRINT_CHROME_HEIGHT_MM) * CSS_PX_PER_MM;
    return width <= usableWidthPx && height <= usableHeightPx;
  });
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
  // Filet de sécurité au-delà du choix de format : même au format A2 (le
  // plus grand disponible), un schéma très dense peut rester plus haut que
  // la place restante une fois le titre/disclaimer/pied de page comptés —
  // contraindre l'image en mm (même espace que @page, pas de conversion
  // px/mm approximative) garantit qu'elle tient toujours sur une page,
  // quitte à être affichée plus petite.
  const imgMaxHeightMm = Math.max(60, page.heightMm - PAGE_MARGIN_MM * 2 - PRINT_CHROME_HEIGHT_MM);

  win.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: ${page.name} landscape; margin: 10mm; }
  ${PRINT_STYLE}
  img { max-width: 100%; max-height: ${imgMaxHeightMm}mm; width: auto; height: auto; object-fit: contain; }
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
