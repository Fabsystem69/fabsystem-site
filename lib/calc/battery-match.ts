// Correspondance avec le catalogue réel de batteries
// (lib/electrical-components/brand-models.ts) — même principe que
// mppt-match.ts et inverter-match.ts. On recommande un vrai modèle
// UNITAIRE (pas la banque entière) : l'utilisateur achète N fois le même
// modèle, câblé selon la configuration choisie.

import { BRAND_MODELS } from "@/lib/electrical-components/brand-models";
import type { BatteryBankChemistry } from "@/lib/calc/battery-bank";

export type BatteryMatch = {
  id: string;
  brand: string;
  model: string;
  voltage: number;
  capacityAh: number;
  technology: string;
  iconPro?: string;
};

/** "agm-gel" du sélecteur simplifié couvre toute la famille plomb du
 * catalogue (agm, gel, lead-carbon, plomb) — un débutant choisit "AGM/Gel"
 * sans distinguer ces sous-familles, la simplification est volontaire et
 * cohérente avec le reste du site (inverter/mppt/dcdc utilisent le même
 * regroupement lithium/plomb à deux options). */
const CHEMISTRY_TECHNOLOGIES: Record<BatteryBankChemistry, string[]> = {
  lifepo4: ["lifepo4"],
  "agm-gel": ["agm", "gel", "lead-carbon", "plomb"],
};

/**
 * @param unitVoltage Tension recherchée pour une batterie unitaire, en V.
 * @param unitCapacityAh Capacité minimale recherchée, en Ah.
 * @param chemistry Chimie recherchée.
 */
export function findCompatibleBattery(unitVoltage: number, unitCapacityAh: number, chemistry: BatteryBankChemistry): BatteryMatch[] {
  const technologies = CHEMISTRY_TECHNOLOGIES[chemistry];
  return BRAND_MODELS.filter((m) => m.componentType === "battery")
    .map((m): BatteryMatch => ({
      id: m.id,
      brand: m.brand,
      model: m.model,
      voltage: Number(m.defaults.voltage) || 0,
      capacityAh: Number(m.defaults.capacityAh) || 0,
      technology: String(m.defaults.technology ?? ""),
      iconPro: m.iconPro,
    }))
    .filter((m) => m.voltage === unitVoltage && m.capacityAh >= unitCapacityAh && technologies.includes(m.technology))
    .sort((a, b) => a.capacityAh - b.capacityAh);
}
