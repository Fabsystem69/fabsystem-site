// Mise en page de la planche imprimable (retour utilisateur : "impression
// papier ou pdf la plupart du temps sort 3 pages dont 2 quasiment vides").
// Cause : le format était choisi automatiquement jusqu'en A2 (hauteur fixe
// de 400 mm), alors que l'imprimante est en A4 — la planche débordait sur
// plusieurs feuilles. Le format est désormais choisi par l'utilisateur
// (A4 par défaut), l'orientation suit la forme du schéma, et la planche
// reste toujours un peu plus petite que la zone imprimable.
export type PrintFormat = "A4" | "A3";

const FORMATS_MM: Record<PrintFormat, { short: number; long: number }> = {
  A4: { short: 210, long: 297 },
  A3: { short: 297, long: 420 },
};

const MARGIN_MM = 10;
// Marge de sécurité contre l'arrondi navigateur qui pousse sinon une page
// blanche supplémentaire.
const SAFETY_MM = 2;
// Titre + date + bandeau d'avertissement + pied de page.
const CHROME_HEIGHT_MM = 38;

export interface PrintLayout {
  pageSize: string;
  pageWidthMm: number;
  pageHeightMm: number;
  marginMm: number;
  sheetHeightMm: number;
  imageMaxHeightMm: number;
}

export function computePrintLayout(input: { format: PrintFormat; width: number; height: number }): PrintLayout {
  const { short, long } = FORMATS_MM[input.format];
  const landscape = input.width >= input.height;
  const pageWidthMm = landscape ? long : short;
  const pageHeightMm = landscape ? short : long;
  const sheetHeightMm = pageHeightMm - MARGIN_MM * 2 - SAFETY_MM;

  return {
    pageSize: `${input.format} ${landscape ? "landscape" : "portrait"}`,
    pageWidthMm,
    pageHeightMm,
    marginMm: MARGIN_MM,
    sheetHeightMm,
    imageMaxHeightMm: sheetHeightMm - CHROME_HEIGHT_MM,
  };
}
