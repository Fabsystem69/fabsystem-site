// Moteur pur du calculateur public "Bilan de consommation" — fusion de
// l'ancien bilan-consommation (liste d'appareils → Wh/j) et de
// l'ancien autonomie-batterie (capacité + conso → autonomie), retour
// utilisateur (comparatif Wireframe, "Energy Budget Calculator") : les
// deux anciens outils se passaient le relais via un pont localStorage
// manuel (bouton "Utiliser ↗") — Wireframe les traite comme un seul écran
// avec la banque de batteries et les sources de charge visibles en même
// temps que la liste d'appareils. Gap identifié en plus : notre version
// solaire ne couvrait que le solaire, jamais le DC-DC/alternateur ni le
// secteur/quai comme source de recharge journalière.

import { CHARGER_EFFICIENCY } from "@/lib/calc/charge-secteur";

export type EnergyBudgetChemistry = "lifepo4" | "agm-gel";

/** Profondeur de décharge utile — même convention que les autres
 * sous-calculateurs d'autonomie du site (MPPT, Onduleur, Banque de
 * batteries) : LiFePO4 quasi intégralement exploitable, plomb (AGM/Gel)
 * limité à 50% pour préserver le nombre de cycles. */
export const USABLE_CAPACITY_RATIO: Record<EnergyBudgetChemistry, number> = {
  lifepo4: 0.9,
  "agm-gel": 0.5,
};

/** Perte réelle moyenne de la chaîne solaire (angle, température, ombre) —
 * même valeur que les autres calculateurs solaires du site. */
const SOLAR_DERATING = 0.75;

/** Rendement d'un chargeur DC-DC — pertes de conversion réelles, valeur
 * prudente en l'absence de fiche technique précise. */
const DCDC_EFFICIENCY = 0.92;

export type ChargingSourceInput = { on: boolean; wattsOrAmps: number; hoursOrPsh: number };

export type EnergyBudgetInput = {
  consoWh: number;
  systemVoltage: number;
  capacityAh: number;
  chemistry: EnergyBudgetChemistry;
  solar: { on: boolean; panelsWc: number; peakSunHours: number };
  dcdc: { on: boolean; chargerA: number; drivingHoursPerDay: number };
  shore: { on: boolean; chargerA: number; hoursConnectedPerDay: number };
};

export type EnergyBudgetResult = {
  consoW: number;
  usableEnergyWh: number;
  solarProductionWh: number;
  dcdcProductionWh: number;
  shoreProductionWh: number;
  totalProductionWh: number;
  netConsoW: number;
  fullyCovered: boolean;
  autonomyHoursNoCharging: number;
  autonomyHoursWithCharging: number;
  batteryUsageRatioPerDay: number;
};

export function computeEnergyBudget(input: EnergyBudgetInput): EnergyBudgetResult {
  const { consoWh, systemVoltage, capacityAh, chemistry, solar, dcdc, shore } = input;
  const consoW = consoWh / 24;
  const usableEnergyWh = capacityAh * systemVoltage * USABLE_CAPACITY_RATIO[chemistry];

  const solarProductionWh = solar.on ? solar.panelsWc * solar.peakSunHours * SOLAR_DERATING : 0;
  const dcdcProductionWh = dcdc.on ? dcdc.chargerA * systemVoltage * dcdc.drivingHoursPerDay * DCDC_EFFICIENCY : 0;
  const shoreProductionWh = shore.on ? shore.chargerA * systemVoltage * shore.hoursConnectedPerDay * CHARGER_EFFICIENCY : 0;
  const totalProductionWh = solarProductionWh + dcdcProductionWh + shoreProductionWh;

  const netConsoWh = Math.max(0, consoWh - totalProductionWh);
  const netConsoW = netConsoWh / 24;
  const fullyCovered = totalProductionWh > 0 && netConsoWh <= 0 && consoWh > 0;

  const autonomyHoursNoCharging = consoW > 0 ? usableEnergyWh / consoW : 0;
  const autonomyHoursWithCharging = fullyCovered ? Infinity : netConsoW > 0 ? usableEnergyWh / netConsoW : autonomyHoursNoCharging;

  const batteryUsageRatioPerDay = usableEnergyWh > 0 ? Math.min(1, consoWh / usableEnergyWh) : 0;

  return {
    consoW,
    usableEnergyWh,
    solarProductionWh,
    dcdcProductionWh,
    shoreProductionWh,
    totalProductionWh,
    netConsoW,
    fullyCovered,
    autonomyHoursNoCharging,
    autonomyHoursWithCharging,
    batteryUsageRatioPerDay,
  };
}
