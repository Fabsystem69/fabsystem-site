// Correspondance avec le catalogue réel de chargeurs secteur
// (lib/electrical-components/brand-models.ts, componentType "ac-charger")
// — même principe que mppt-match.ts / inverter-match.ts / battery-match.ts.
// Retour utilisateur (comparatif Wireframe, picker de vrais chargeurs
// Victron/Renogy) : notre version ne demandait que le calibre de la borne
// disponible, jamais de proposer un vrai produit à choisir.

import { BRAND_MODELS } from "@/lib/electrical-components/brand-models";

export type ChargeMatch = {
  id: string;
  brand: string;
  model: string;
  chargeAmperage: number;
  voltage: 12 | 24;
};

export function findCompatibleCharger(minAmperage: number, systemVoltage: 12 | 24): ChargeMatch[] {
  return BRAND_MODELS.filter((m) => m.componentType === "ac-charger")
    .map((m): ChargeMatch => ({
      id: m.id,
      brand: m.brand,
      model: m.model,
      chargeAmperage: Number(m.defaults.chargeAmperage) || 0,
      voltage: Number(m.defaults.voltageDC) as 12 | 24,
    }))
    .filter((m) => m.voltage === systemVoltage && m.chargeAmperage >= minAmperage)
    .sort((a, b) => a.chargeAmperage - b.chargeAmperage);
}
