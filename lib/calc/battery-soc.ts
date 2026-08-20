// Moteur pur du calculateur public "État de charge batterie" — même
// principe que lib/calc/section-cable.ts : logique de calcul séparée de
// l'UI React, aucune dépendance client.
//
// Tables tension → état de charge (SoC) à vide (batterie au repos, sans
// charge ni décharge, ~20-25°C), valeurs 12V. Les valeurs 24V sont
// dérivées par ×2. Sources : tables constructeur usuelles AGM/Gel plomb
// et LiFePO4 4S — indicatives, la tension seule reste approximative pour
// le lithium dont la courbe est très plate au milieu de charge.

export type BatteryChemistry = "agm-gel" | "lithium";

type SocPoint = { soc: number; voltage12V: number };

const AGM_GEL_TABLE: SocPoint[] = [
  { soc: 100, voltage12V: 12.7 },
  { soc: 90, voltage12V: 12.5 },
  { soc: 80, voltage12V: 12.42 },
  { soc: 70, voltage12V: 12.32 },
  { soc: 60, voltage12V: 12.2 },
  { soc: 50, voltage12V: 12.06 },
  { soc: 40, voltage12V: 11.9 },
  { soc: 30, voltage12V: 11.75 },
  { soc: 20, voltage12V: 11.58 },
  { soc: 10, voltage12V: 11.31 },
  { soc: 0, voltage12V: 10.5 },
];

const LITHIUM_TABLE: SocPoint[] = [
  { soc: 100, voltage12V: 13.6 },
  { soc: 90, voltage12V: 13.35 },
  { soc: 80, voltage12V: 13.3 },
  { soc: 70, voltage12V: 13.25 },
  { soc: 60, voltage12V: 13.2 },
  { soc: 50, voltage12V: 13.15 },
  { soc: 40, voltage12V: 13.05 },
  { soc: 30, voltage12V: 12.9 },
  { soc: 20, voltage12V: 12.8 },
  { soc: 10, voltage12V: 12.5 },
  { soc: 0, voltage12V: 10.0 },
];

export function getSocTable(chemistry: BatteryChemistry): SocPoint[] {
  return chemistry === "lithium" ? LITHIUM_TABLE : AGM_GEL_TABLE;
}

/** SoC minimum recommandé avant risque de coupure/dommage — le
 * complément des profondeurs de décharge déjà établies ailleurs sur le
 * site (USABLE_CAPACITY_RATIO : 90% LiFePO4, 50% AGM/Gel). En dessous, le
 * BMS lithium peut couper pour protéger les cellules ; le plomb perd
 * rapidement en durée de vie. */
export const RECOMMENDED_MIN_SOC: Record<BatteryChemistry, number> = {
  lithium: 10,
  "agm-gel": 50,
};

export type SocResult = {
  /** État de charge estimé, 0-100, arrondi à l'entier. */
  soc: number;
  /** true si la tension saisie est hors de la plage couverte par la table. */
  outOfRange: boolean;
};

/**
 * Estime le SoC (%) par interpolation linéaire sur la table tension/SoC de
 * la chimie choisie, pour une tension mesurée à une tension nominale
 * donnée (12V ou 24V — la table 12V est mise à l'échelle).
 */
export function estimateSoc(
  chemistry: BatteryChemistry,
  nominalVoltage: 12 | 24 | 48,
  measuredVoltage: number
): SocResult {
  const scale = nominalVoltage / 12;
  const table = getSocTable(chemistry).map((p) => ({ soc: p.soc, voltage: p.voltage12V * scale }));

  const vMax = table[0].voltage;
  const vMin = table[table.length - 1].voltage;
  if (measuredVoltage >= vMax) return { soc: 100, outOfRange: measuredVoltage > vMax };
  if (measuredVoltage <= vMin) return { soc: 0, outOfRange: measuredVoltage < vMin };

  for (let i = 0; i < table.length - 1; i++) {
    const hi = table[i];
    const lo = table[i + 1];
    if (measuredVoltage <= hi.voltage && measuredVoltage >= lo.voltage) {
      const ratio = (measuredVoltage - lo.voltage) / (hi.voltage - lo.voltage);
      const soc = lo.soc + ratio * (hi.soc - lo.soc);
      return { soc: Math.round(soc), outOfRange: false };
    }
  }
  return { soc: 0, outOfRange: true };
}

/**
 * Sens inverse : tension à vide attendue pour un SoC (%) donné, par
 * interpolation linéaire sur la même table.
 */
export function estimateVoltageForSoc(chemistry: BatteryChemistry, nominalVoltage: 12 | 24 | 48, targetSoc: number): number {
  const scale = nominalVoltage / 12;
  const table = getSocTable(chemistry).map((p) => ({ soc: p.soc, voltage: p.voltage12V * scale }));

  const clampedSoc = Math.max(0, Math.min(100, targetSoc));
  for (let i = 0; i < table.length - 1; i++) {
    const hi = table[i];
    const lo = table[i + 1];
    if (clampedSoc <= hi.soc && clampedSoc >= lo.soc) {
      const ratio = hi.soc === lo.soc ? 0 : (clampedSoc - lo.soc) / (hi.soc - lo.soc);
      return lo.voltage + ratio * (hi.voltage - lo.voltage);
    }
  }
  return table[table.length - 1].voltage;
}
