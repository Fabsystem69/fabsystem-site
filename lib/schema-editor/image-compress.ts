"use client";

// Compresse une photo choisie par l'utilisateur pour tenir sous la limite
// serveur (retour utilisateur : "250 Ko max", voir lib/custom-catalog-image.ts)
// avant l'envoi — redimensionne puis réduit la qualité JPEG par paliers
// jusqu'à passer sous le budget, plutôt que de refuser toute photo qui
// dépasse (l'utilisateur n'a généralement aucune idée du poids réel d'une
// photo prise au téléphone).
const MAX_BYTES = 250 * 1024;
const MAX_DIMENSION = 800;
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4, 0.25];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality);
}

function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.ceil((base64.length * 3) / 4);
}

/** Retourne une data URL JPEG garantie sous 250 Ko, ou lève si même la
 * qualité minimale ne suffit pas (image manifestement trop chargée en
 * détails pour ce budget — cas très rare vu le redimensionnement à 800px). */
export async function compressImageForCustomItem(file: File): Promise<string> {
  const img = await loadImage(file);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Compression indisponible sur ce navigateur");
  ctx.drawImage(img, 0, 0, width, height);

  for (const quality of QUALITY_STEPS) {
    const dataUrl = canvasToDataUrl(canvas, quality);
    if (dataUrlByteLength(dataUrl) <= MAX_BYTES) return dataUrl;
  }

  throw new Error("Impossible de compresser cette image sous 250 Ko, essayez une photo plus simple.");
}
