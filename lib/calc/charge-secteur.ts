// Moteur pur du calculateur public "Chargeur secteur / borne électrique" —
// même principe que lib/calc/section-cable.ts. Dimensionne le courant de
// charge DC recommandé, la puissance chargeur nécessaire, le courant tiré
// côté secteur 230V et compare au calibre de la borne disponible
// (camping, port de plaisance).

import { AVAILABLE_FUSES_A } from "@/lib/calc/section-cable";

export type ChargeChemistry = "agm-gel" | "lithium";

/** Rendement moyen d'un chargeur secteur (AC→DC) correctement dimensionné. */
export const CHARGER_EFFICIENCY = 0.87;

/** Tension secteur monophasé standard en France/UE. */
export const MAINS_VOLTAGE_V = 230;

/** Taux de charge (C-rate) conseillé par chimie — valeur prudente en
 * l'absence de spécification constructeur (un BMS lithium peut souvent
 * accepter plus, mais 0,5C reste un défaut sûr sans info complémentaire). */
const RECOMMENDED_C_RATE: Record<ChargeChemistry, number> = {
  "agm-gel": 0.2,
  lithium: 0.5,
};

export type ChargeSecteurResult = {
  /** Courant de charge DC recommandé, en A. */
  chargeCurrentA: number;
  /** Puissance chargeur nécessaire côté DC, en W. */
  dcPowerW: number;
  /** Courant tiré côté secteur 230V, en A. */
  mainsCurrentA: number;
  /** La borne/prise disponible suffit-elle ? */
  fitsAvailable: boolean;
  /** Courant de charge max atteignable avec la borne disponible, en A. */
  maxChargeCurrentForAvailableA: number;
  /** Calibre de fusible/disjoncteur DC conseillé en sortie chargeur. */
  dcFuseA: string;
};

export function computeChargeSecteur(
  chemistry: ChargeChemistry,
  batteryVoltage: 12 | 24,
  capacityAh: number,
  availableMainsA: number
): ChargeSecteurResult {
  const chargeCurrentA = capacityAh * RECOMMENDED_C_RATE[chemistry];
  const dcPowerW = chargeCurrentA * batteryVoltage;
  const mainsPowerW = dcPowerW / CHARGER_EFFICIENCY;
  const mainsCurrentA = mainsPowerW / MAINS_VOLTAGE_V;

  const fitsAvailable = mainsCurrentA <= availableMainsA;
  const maxMainsPowerW = availableMainsA * MAINS_VOLTAGE_V * CHARGER_EFFICIENCY;
  const maxChargeCurrentForAvailableA = maxMainsPowerW / batteryVoltage;

  const dcFuseTarget = chargeCurrentA * 1.25;
  const dcFuse = AVAILABLE_FUSES_A.find((f) => f >= dcFuseTarget);

  return {
    chargeCurrentA,
    dcPowerW,
    mainsCurrentA,
    fitsAvailable,
    maxChargeCurrentForAvailableA,
    dcFuseA: dcFuse ? `${dcFuse} A` : "> 125 A — prévoir un disjoncteur",
  };
}
