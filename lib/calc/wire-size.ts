// Moteur pur du calculateur "Section de câble" fusionné avec l'AWG —
// retour utilisateur (comparatif Wireframe) : recommande la section la
// PLUS GRANDE entre ce qu'exige l'ampacité (courant admissible sans
// surchauffe) et ce qu'exige la chute de tension — jamais l'un sans
// l'autre, une section peut passer l'un et échouer l'autre.

import { COPPER_RESISTIVITY_OHM_MM2_PER_M } from "@/lib/calc/section-cable";
import {
  WIRE_TABLE,
  findMinimumSectionForAmpacity,
  getDeratedAmpacity,
  type InsulationRating,
  type AmbientTemp,
  type CableBundling,
} from "@/lib/calc/wire-ampacity";

/** Marge réglementaire sur un circuit continu ≥3h — même convention que
 * fuse-size.ts, appliquée ici au courant de dimensionnement du câble. */
const CONTINUOUS_MARGIN = 1.25;

export type WireSizeComparisonRow = {
  mm2: number;
  awg: string;
  baseAmpacityA: number;
  deratedAmpacityA: number;
  ampacityPass: boolean;
  voltageDropV: number;
  voltageDropPct: number;
  voltageDropPass: boolean;
};

export type WireSizeResult = {
  designCurrentA: number;
  recommendedMm2: number;
  recommendedAwg: string;
  deratedAmpacityA: number;
  voltageDropV: number;
  voltageDropPct: number;
  limitingFactor: "ampacité" | "chute de tension";
  comparison: WireSizeComparisonRow[];
};

export function computeWireSize(
  loadCurrentA: number,
  continuous: boolean,
  lengthOneWayM: number,
  systemVoltageV: number,
  maxVoltageDropPct: number,
  insulation: InsulationRating,
  ambient: AmbientTemp,
  bundling: CableBundling,
): WireSizeResult | null {
  const designCurrentA = continuous ? loadCurrentA * CONTINUOUS_MARGIN : loadCurrentA;

  const ampacityRow = findMinimumSectionForAmpacity(designCurrentA, insulation, ambient, bundling);
  if (!ampacityRow) return null;

  // Section minimale pour la chute de tension — même formule que calcSection
  // (section-cable.ts), reprise ici pour construire le tableau comparatif
  // sur toute la table WIRE_TABLE (plus large que AVAILABLE_SECTIONS_MM2).
  const dropAllowedV = (maxVoltageDropPct / 100) * systemVoltageV;
  const minSectionForDropMm2 = dropAllowedV > 0 ? (2 * lengthOneWayM * loadCurrentA * COPPER_RESISTIVITY_OHM_MM2_PER_M) / dropAllowedV : 0;
  const dropRow = WIRE_TABLE.find((row) => row.mm2 >= minSectionForDropMm2) ?? WIRE_TABLE[WIRE_TABLE.length - 1];

  const recommendedRow = ampacityRow.mm2 >= dropRow.mm2 ? ampacityRow : dropRow;
  const limitingFactor: WireSizeResult["limitingFactor"] = ampacityRow.mm2 >= dropRow.mm2 ? "ampacité" : "chute de tension";

  const comparison: WireSizeComparisonRow[] = WIRE_TABLE.filter((row) => row.mm2 >= 0.5 && row.mm2 <= 50).map((row) => {
    const deratedAmpacityA = getDeratedAmpacity(row, insulation, ambient, bundling);
    const voltageDropV = (2 * lengthOneWayM * loadCurrentA * COPPER_RESISTIVITY_OHM_MM2_PER_M) / row.mm2;
    const voltageDropPct = systemVoltageV > 0 ? (voltageDropV / systemVoltageV) * 100 : 0;
    return {
      mm2: row.mm2,
      awg: row.awg,
      baseAmpacityA: row.ampacityA,
      deratedAmpacityA,
      ampacityPass: deratedAmpacityA >= designCurrentA,
      voltageDropV,
      voltageDropPct,
      voltageDropPass: voltageDropPct <= maxVoltageDropPct,
    };
  });

  const recommendedDeratedAmpacity = getDeratedAmpacity(recommendedRow, insulation, ambient, bundling);
  const recommendedDropV = (2 * lengthOneWayM * loadCurrentA * COPPER_RESISTIVITY_OHM_MM2_PER_M) / recommendedRow.mm2;
  const recommendedDropPct = systemVoltageV > 0 ? (recommendedDropV / systemVoltageV) * 100 : 0;

  return {
    designCurrentA,
    recommendedMm2: recommendedRow.mm2,
    recommendedAwg: recommendedRow.awg,
    deratedAmpacityA: recommendedDeratedAmpacity,
    voltageDropV: recommendedDropV,
    voltageDropPct: recommendedDropPct,
    limitingFactor,
    comparison,
  };
}
