// UI-13 — traduction des champs bruts des outils publics vers le contrat
// d'entrée réel des moteurs (lib/engine-payload.ts, ENGINE_INPUT_SCHEMAS).
// Module pur (aucun accès DB, aucun "server-only") : utilisable aussi bien
// depuis un composant client (aperçu d'import avant validation) que
// depuis une route serveur.
//
// Règle absolue (mission §27) : ce fichier ne recalcule JAMAIS un résultat
// — il ne fait que renommer/convertir des champs vers la forme attendue
// par le moteur réel, qui reste seul responsable du calcul (appelé via
// /api/projects/[projectId]/engines/[engineId]/run, jamais dupliqué ici).
//
// Périmètre volontairement limité à 2 outils (voir docs/audits/
// UI-13-GUIDED-PROJECT-TOOLS-BRIDGE.md, "Mapping outils → moteurs") :
// Bilan de consommation → Energy et Section de câble → Circuit/Cable sont
// les deux seuls outils dont les champs correspondent réellement à un
// moteur existant sans inventer de correspondance. Autonomie batterie et
// MPPT n'ont pas d'équivalent fiable (logique inversée / domaine
// différent) — voir le rapport pour la justification détaillée.
import { COPPER_RESISTIVITY_OHM_MM2_PER_M, AVAILABLE_SECTIONS_MM2 } from "@/lib/calc/section-cable";

export type BilanConsoAppareil = { id: number; nom: string; puissance: string; heures: string };

export type EnergyEngineInputPreview = {
  consumers: { name: string; powerW?: number; dailyUsageHours: number; quantity?: number }[];
};

/**
 * Bilan de consommation (outil public) → moteur energy.consumption.
 * Ignore les lignes vides ou incomplètes (nom vide, ou ni puissance ni
 * heures renseignées) plutôt que d'envoyer une entrée invalide au moteur.
 */
export function translateBilanConsoToEnergyInput(
  appareils: BilanConsoAppareil[]
): EnergyEngineInputPreview {
  const consumers = appareils
    .filter((a) => a.nom.trim())
    .map((a) => {
      const powerW = Number(a.puissance);
      const dailyUsageHours = Number(a.heures);
      return {
        name: a.nom.trim(),
        powerW: Number.isFinite(powerW) && powerW > 0 ? powerW : undefined,
        dailyUsageHours: Number.isFinite(dailyUsageHours) ? dailyUsageHours : 0,
        quantity: 1,
      };
    });

  return { consumers };
}

export type SectionCableForm = {
  intensite: string;
  longueur: string;
  chute: string;
  tension: string;
};

export type CableEngineInputPreview = {
  cables: {
    circuitId: string;
    oneWayLengthM: number;
    maxVoltageDropPercentage: number;
    conductorResistivityOhmMm2PerM: number;
    availableSectionsMm2: number[];
  }[];
};

/**
 * Section de câble (outil public) → moteur cable.sizing. `circuitId` doit
 * référencer un circuit déjà retenu (circuit.structure) — le mapping ne
 * décide jamais lui-même de créer un circuit : c'est à l'appelant
 * (composant d'import) de le proposer explicitement si aucun circuit
 * n'existe (mission §17, "Section de câble").
 */
export function translateSectionCableToCableInput(
  circuitId: string,
  form: SectionCableForm
): CableEngineInputPreview {
  return {
    cables: [
      {
        circuitId,
        oneWayLengthM: Number(form.longueur) || 0,
        maxVoltageDropPercentage: Number(form.chute) || 0,
        conductorResistivityOhmMm2PerM: COPPER_RESISTIVITY_OHM_MM2_PER_M,
        availableSectionsMm2: AVAILABLE_SECTIONS_MM2,
      },
    ],
  };
}
