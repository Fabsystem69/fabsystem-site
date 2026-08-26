// Presets d'appareils courants (van/bateau) partagés entre l'outil public
// /outils/bilan-consommation (BilanConsommationCalculator) et le module
// moteur du mode guidé (EnergyModule) — une seule liste à tenir à jour,
// consommateurs affichés uniquement, aucune formule ici.
export type EnergyPresetItem = { nom: string; puissance: string; heures: number };
export type EnergyPresetGroup = { groupe: string; items: EnergyPresetItem[] };

export const PRESETS_APPAREILS: EnergyPresetGroup[] = [
  {
    groupe: "Froid",
    items: [
      { nom: "Frigo 12V compresseur (petit)", puissance: "40", heures: 12 },
      { nom: "Frigo 12V compresseur (grand)", puissance: "75", heures: 14 },
    ],
  },
  {
    groupe: "Éclairage",
    items: [
      { nom: "Éclairage LED cabine (circuit)", puissance: "25", heures: 5 },
      { nom: "Spot LED cockpit", puissance: "10", heures: 4 },
      { nom: "Feux de navigation", puissance: "10", heures: 8 },
      { nom: "Feu de mouillage", puissance: "5", heures: 10 },
    ],
  },
  {
    groupe: "Navigation & électronique",
    items: [
      { nom: "VHF fixe", puissance: "6", heures: 4 },
      { nom: "GPS / traceur de carte", puissance: "15", heures: 8 },
      { nom: "AIS récepteur", puissance: "3", heures: 24 },
      { nom: "Pilote automatique (navigation)", puissance: "20", heures: 8 },
      { nom: "Sondeur / loch", puissance: "5", heures: 8 },
    ],
  },
  {
    groupe: "Confort & divers",
    items: [
      { nom: "Pompe à eau électrique", puissance: "30", heures: 1 },
      { nom: "Chargeur téléphone / USB", puissance: "10", heures: 4 },
      { nom: "Chargeur ordinateur portable", puissance: "45", heures: 3 },
      { nom: "Radio FM / DAB+", puissance: "5", heures: 6 },
      { nom: "Convertisseur 230V (usage ponctuel)", puissance: "150", heures: 1 },
    ],
  },
  {
    groupe: "Manœuvres (usage court)",
    items: [
      { nom: "Guindeau électrique", puissance: "1200", heures: 0.1 },
      { nom: "Winch électrique", puissance: "500", heures: 0.1 },
    ],
  },
  {
    groupe: "Van / camping-car",
    items: [
      { nom: "Chauffage diesel (ventilateur)", puissance: "20", heures: 8 },
      { nom: "Pompe eau (usage)", puissance: "30", heures: 0.5 },
      { nom: "Éclairage habitacle", puissance: "20", heures: 5 },
      { nom: "Chargeur ordi / USB", puissance: "55", heures: 4 },
    ],
  },
];
