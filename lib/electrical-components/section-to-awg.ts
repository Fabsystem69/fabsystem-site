import { WIRE_TABLE } from "@/lib/calc/wire-ampacity";

// Équivalent AWG pour une section du schéma (retour utilisateur : "un
// moteur pour passer de mm2 à awg") — réutilise WIRE_TABLE, déjà la seule
// source de vérité validée sur le site pour cette correspondance (utilisée
// par /outils/section-cable), plutôt que dupliquer une seconde table qui
// pourrait diverger.
function parseSectionMm2(section: string): number | null {
  // "3G2,5 mm²" (câble 3 conducteurs) : le gabarit par conducteur est celui
  // annoncé après le "G", identique à "2,5 mm²".
  const withoutConductorCount = section.replace(/^\d+G/i, "");
  const numeric = withoutConductorCount.replace(" mm²", "").replace(",", ".").trim();
  const value = Number(numeric);
  return Number.isFinite(value) ? value : null;
}

export function getAwgEquivalent(section: string): string | null {
  const mm2 = parseSectionMm2(section);
  if (mm2 === null) return null;
  const row = WIRE_TABLE.find((r) => Math.abs(r.mm2 - mm2) < 0.001);
  return row ? row.awg : null;
}
