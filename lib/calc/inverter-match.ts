// Correspondance avec le catalogue réel d'onduleurs / onduleurs-chargeurs
// (lib/electrical-components/brand-models.ts) — même principe que
// mppt-match.ts : retour utilisateur ("tu passe a cotter du plus
// important") sur le fait que le calculateur Onduleur recommandait un
// calibre normalisé théorique (STANDARD_INVERTER_SIZES_W) sans jamais le
// confronter à un vrai produit du marché, alors que c'est précisément ce
// qui a été corrigé sur le calculateur MPPT juste avant (findCompatibleMppt)
// — le même écart existait ici et n'avait pas été reporté.

import { BRAND_MODELS } from "@/lib/electrical-components/brand-models";

export type InverterMatch = {
  id: string;
  brand: string;
  model: string;
  powerW: number;
  voltageDC: number;
  hasCharger: boolean;
  chargeAmperage?: number;
  iconPro?: string;
};

/**
 * @param requiredPeakW Puissance de pointe à couvrir (appel de démarrage inclus), en W.
 * @param systemVoltage Tension batterie du système, en V.
 */
export function findCompatibleInverter(requiredPeakW: number, systemVoltage: 12 | 24 | 48): InverterMatch[] {
  return BRAND_MODELS.filter((m) => m.componentType === "inverter" || m.componentType === "inverter-charger")
    .map((m): InverterMatch => {
      const powerW = Number(m.defaults.powerW) || 0;
      const voltageDC = Number(m.defaults.voltageDC) || 12;
      const chargeAmperage = m.defaults.chargeAmperage != null ? Number(m.defaults.chargeAmperage) : undefined;
      return { id: m.id, brand: m.brand, model: m.model, powerW, voltageDC, hasCharger: m.componentType === "inverter-charger", chargeAmperage, iconPro: m.iconPro };
    })
    .filter((m) => m.voltageDC === systemVoltage && m.powerW >= requiredPeakW)
    .sort((a, b) => a.powerW - b.powerW);
}
