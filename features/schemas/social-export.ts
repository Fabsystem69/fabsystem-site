import type { Edge, Node } from "@xyflow/react";
import type { CableEdgeData } from "@/types/schema";
import { captureSchemaCarousel, captureSchemaPng, type CarouselCapture, type SchemaCapture } from "@/features/schemas/export";
import { computeSocialFrame, type SocialReadability } from "@/lib/schema-editor/social-frame";

// Export "réseaux sociaux" (retour utilisateur : "je veux qu'on ait l'option
// pour partager le schéma sur une photo utilisable Facebook") — image livrée
// directement à 2048 px (voir lib/schema-editor/social-frame.ts) pour que
// Facebook ne la redimensionne ni ne la recompresse.

// Capture à 2x puis réduction progressive : le rendu final est sur-échantillonné
// (traits et textes nets), sans les très grosses images du mode "Maximum".
const SOCIAL_CAPTURE_PIXEL_RATIO = 2;
// Facebook garde un PNG intact sous ~1 Mo ; au-delà il le convertit lui-même
// en JPEG très compressé — mieux vaut fournir un JPEG de bonne qualité.
const PNG_MAX_BYTES = 1_000_000;
const JPEG_QUALITY = 0.92;

export interface SocialImage extends SchemaCapture {
  extension: "png" | "jpg";
  readability: SocialReadability;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image de capture illisible"));
    img.src = src;
  });
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponible");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

// Réduction par moitiés successives : un seul drawImage d'un facteur > 2
// produit des traits crénelés et des textes baveux.
function downscale(source: CanvasImageSource, width: number, height: number, targetWidth: number, targetHeight: number) {
  let current: CanvasImageSource = source;
  let currentWidth = width;
  let currentHeight = height;
  while (currentWidth / 2 > targetWidth && currentHeight / 2 > targetHeight) {
    const nextWidth = Math.round(currentWidth / 2);
    const nextHeight = Math.round(currentHeight / 2);
    const { canvas, ctx } = createCanvas(nextWidth, nextHeight);
    ctx.drawImage(current, 0, 0, nextWidth, nextHeight);
    current = canvas;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }
  return current;
}

function encodeForSocial(canvas: HTMLCanvasElement): { dataUrl: string; extension: "png" | "jpg" } {
  const png = canvas.toDataURL("image/png");
  const pngBytes = Math.round((png.length - png.indexOf(",") - 1) * 0.75);
  if (pngBytes <= PNG_MAX_BYTES) return { dataUrl: png, extension: "png" };
  return { dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY), extension: "jpg" };
}

async function fitToSocialFrame(capture: SchemaCapture): Promise<SocialImage> {
  const img = await loadImage(capture.dataUrl);
  const frame = computeSocialFrame({ width: capture.width, height: capture.height });
  const reduced = downscale(img, img.naturalWidth, img.naturalHeight, frame.drawWidth, frame.drawHeight);
  const { canvas, ctx } = createCanvas(frame.canvasWidth, frame.canvasHeight);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, frame.canvasWidth, frame.canvasHeight);
  ctx.drawImage(reduced, frame.offsetX, frame.offsetY, frame.drawWidth, frame.drawHeight);
  const encoded = encodeForSocial(canvas);
  return { ...encoded, width: frame.canvasWidth, height: frame.canvasHeight, readability: frame.readability };
}

export async function captureSchemaForSocial(
  nodes: Node[],
  edges: Edge<CableEdgeData>[],
  projectName: string,
  showGrid: boolean,
  watermark: boolean,
): Promise<SocialImage | null> {
  const capture = await captureSchemaPng(nodes, edges, projectName, showGrid, { pixelRatio: SOCIAL_CAPTURE_PIXEL_RATIO, watermark });
  return capture ? fitToSocialFrame(capture) : null;
}

// Série pour un carrousel Facebook : vue d'ensemble + 3 parties zoomées,
// chacune au format social — la solution quand le schéma complet est trop
// grand pour rester lisible sur une seule image.
export async function captureSocialCarousel(
  nodes: Node[],
  edges: Edge<CableEdgeData>[],
  projectName: string,
  showGrid: boolean,
  watermark: boolean,
): Promise<CarouselCapture[] | null> {
  const parts = await captureSchemaCarousel(nodes, edges, projectName, showGrid, watermark, SOCIAL_CAPTURE_PIXEL_RATIO);
  if (!parts) return null;
  const framed: CarouselCapture[] = [];
  for (const part of parts) {
    const image = await fitToSocialFrame(part);
    framed.push({ dataUrl: image.dataUrl, width: image.width, height: image.height, label: part.label });
  }
  return framed;
}
