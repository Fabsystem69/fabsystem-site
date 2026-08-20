// Moteur pur du calculateur public "Banque de batteries" — même principe
// que les autres moteurs de lib/calc/. Retour utilisateur (comparatif
// Wireframe, "Battery Bank Calculator") : gap identifié, aucun outil du
// site ne dimensionnait une banque de plusieurs batteries (nombre d'unités,
// câblage série/parallèle, câbles et fusible principal) — soc-batterie.ts
// estime un % de charge, autonomie-batterie.ts calcule un temps de tenue,
// aucun des deux ne couvre le câblage d'une banque.

import { calcSection } from "@/lib/calc/section-cable";
import { computeFuseSize, type FuseSizeResult } from "@/lib/calc/fuse-size";

export type BatteryBankChemistry = "lifepo4" | "agm-gel";

/** Profondeur de décharge utile — même convention que les sous-calculateurs
 * d'autonomie déjà ajoutés (MPPT, Onduleur) : LiFePO4 quasi intégralement
 * exploitable (BMS coupe en bas de plage), plomb (AGM/Gel) limité à 50%
 * pour préserver le nombre de cycles. */
export const USABLE_CAPACITY_RATIO: Record<BatteryBankChemistry, number> = {
  lifepo4: 0.9,
  "agm-gel": 0.5,
};

/** Courant de décharge continu max, en multiple de la capacité (C-rate) —
 * valeur prudente par défaut en l'absence de fiche technique précise. Une
 * cellule LiFePO4 de qualité tient souvent 1C en continu ; le plomb (AGM/
 * Gel) s'use vite au-delà de 0,2C en décharge profonde soutenue. */
const MAX_DISCHARGE_C_RATE: Record<BatteryBankChemistry, number> = {
  lifepo4: 1,
  "agm-gel": 0.2,
};

/** Courant de charge max, en C-rate — mêmes valeurs que le reste du site
 * (dcdc-charger-size.ts, charge-secteur.ts) pour rester cohérent. */
const MAX_CHARGE_C_RATE: Record<BatteryBankChemistry, number> = {
  lifepo4: 0.5,
  "agm-gel": 0.2,
};

/** Poids indicatif par 100Ah à 12V, en kg — ordres de grandeur publics du
 * secteur (le LiFePO4 est nettement plus léger à capacité égale que le
 * plomb AGM/Gel). Affiché comme estimation, jamais comme une donnée
 * constructeur exacte. */
const WEIGHT_KG_PER_100AH_12V: Record<BatteryBankChemistry, number> = {
  lifepo4: 13,
  "agm-gel": 30,
};

export type BatteryBankResult = {
  systemVoltage: number;
  totalCapacityAh: number;
  totalEnergyWh: number;
  usableEnergyWh: number;
  usableEnergyRatio: number;
  maxDischargeA: number;
  maxChargeA: number;
  estimatedWeightKg: number;
  mainFuse: FuseSizeResult;
  /** Section de câble inter-batteries (aller simple, très courte distance). */
  interBatteryCableSectionMm2: number;
};

/**
 * @param unitVoltage Tension d'une batterie unitaire, en V.
 * @param unitCapacityAh Capacité d'une batterie unitaire, en Ah.
 * @param series Nombre de batteries en série.
 * @param parallel Nombre de strings en parallèle.
 * @param chemistry Chimie de la banque.
 */
export function computeBatteryBank(
  unitVoltage: number,
  unitCapacityAh: number,
  series: number,
  parallel: number,
  chemistry: BatteryBankChemistry,
): BatteryBankResult {
  const systemVoltage = unitVoltage * series;
  const totalCapacityAh = unitCapacityAh * parallel;
  const totalEnergyWh = systemVoltage * totalCapacityAh;
  const usableEnergyRatio = USABLE_CAPACITY_RATIO[chemistry];
  const usableEnergyWh = totalEnergyWh * usableEnergyRatio;
  const maxDischargeA = totalCapacityAh * MAX_DISCHARGE_C_RATE[chemistry];
  const maxChargeA = totalCapacityAh * MAX_CHARGE_C_RATE[chemistry];
  const estimatedWeightKg = (unitVoltage / 12) * (unitCapacityAh / 100) * WEIGHT_KG_PER_100AH_12V[chemistry] * series * parallel;

  // Fusible principal, au plus près de la borne + de la banque — circuit
  // continu, circuit batterie principale (Classe T au-delà de 100A).
  const mainFuse = computeFuseSize(maxDischargeA, true, true);

  // Câbles inter-batteries : très courte distance (~0,3m), dimensionnés
  // pour le courant de décharge max de la banque — n'importe quel maillon
  // peut se retrouver à porter tout le courant selon le point de charge,
  // mieux vaut les traiter tous au pire cas.
  const { section: interBatteryCableSectionMm2 } = calcSection(maxDischargeA, 0.3, 2, systemVoltage);

  return {
    systemVoltage,
    totalCapacityAh,
    totalEnergyWh,
    usableEnergyWh,
    usableEnergyRatio,
    maxDischargeA,
    maxChargeA,
    estimatedWeightKg,
    mainFuse,
    interBatteryCableSectionMm2,
  };
}
