// Correspondance avec le catalogue réel de régulateurs MPPT
// (lib/electrical-components/brand-models.ts) — retour utilisateur
// ("je veux un vrai equivalent" au calculateur Solar & MPPT de Wireframe) :
// leur outil recommande un vrai produit du marché ("Victron SmartSolar
// 100/30") plutôt qu'un simple "choisissez un MPPT ≥ X A/W". Le catalogue
// existant contient déjà les fiches réelles (maxPvVoltage, amperage)
// collectées lors de l'audit Voc solaire — réutilisées ici plutôt qu'une
// seconde source de données à maintenir.
//
// Le catalogue ne renseigne qu'un ampérage nominal 12V par modèle (aucune
// entrée 24V/48V distincte à ce jour) — on compare donc sur la puissance
// PV supportée (ampérage × 12V), pas sur l'ampérage brut, pour rester
// valide même sur un système 24V/48V (le courant de charge réel y sera
// mécaniquement plus faible à puissance PV égale).

import { BRAND_MODELS } from "@/lib/electrical-components/brand-models";

export type MpptMatch = {
  id: string;
  brand: string;
  model: string;
  amperage: number;
  maxPvVoltage: number;
  ratedW: number;
  iconPro?: string;
};

const MPPT_REFERENCE_VOLTAGE = 12;

/**
 * @param minPvVoltageV Tension max d'entrée PV requise (Voc string à froid), en V.
 * @param requiredArrayW Puissance de l'array à couvrir (avec marge), en W.
 */
export function findCompatibleMppt(minPvVoltageV: number, requiredArrayW: number): MpptMatch[] {
  return BRAND_MODELS.filter((m) => m.componentType === "mppt")
    .map((m): MpptMatch => {
      const amperage = Number(m.defaults.amperage) || 0;
      const maxPvVoltage = Number(m.defaults.maxPvVoltage) || 0;
      return { id: m.id, brand: m.brand, model: m.model, amperage, maxPvVoltage, ratedW: amperage * MPPT_REFERENCE_VOLTAGE, iconPro: m.iconPro };
    })
    .filter((m) => m.maxPvVoltage >= minPvVoltageV && m.ratedW >= requiredArrayW)
    .sort((a, b) => a.ratedW - b.ratedW || a.maxPvVoltage - b.maxPvVoltage);
}
