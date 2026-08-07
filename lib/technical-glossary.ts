// Definitions factuelles et simples pour le jargon technique affiche sur le
// site public (tags de vocabulaire /prestations, points des prestations
// terrain). Une phrase par terme, pas de jargon supplementaire dans la
// definition elle-meme. A valider par Fabien si une formulation est
// imprecise ou perfectible (voir rapport du sprint ergonomie).
export const TECHNICAL_GLOSSARY: Record<string, string> = {
  "DC-DC": "Convertisseur qui régule la charge entre deux sources en courant continu — par exemple entre l'alternateur du véhicule et la batterie auxiliaire.",
  MPPT: "Type de régulateur solaire qui optimise le rendement des panneaux pour recharger la batterie plus efficacement.",
  VASP: "Véhicule Automoteur Spécialisé — statut administratif du van aménagé, avec des règles d'assurance et de contrôle technique spécifiques.",
  "Isolateur galvanique": "Composant qui protège la coque métallique du bateau contre la corrosion causée par le courant électrique du port.",
  NMEA: "Protocole standard qui permet aux équipements de navigation (GPS, sondeur, pilote...) de communiquer entre eux.",
  Guindeau: "Treuil électrique qui remonte et descend l'ancre du bateau.",
  Sondeur: "Appareil qui mesure la profondeur de l'eau sous le bateau.",
  VHF: "Radio marine utilisée pour communiquer avec les autres bateaux et les secours.",
  "Pompes de cale": "Pompes qui évacuent l'eau qui s'infiltre dans la coque, pour éviter que le bateau ne prenne l'eau.",
  "Lithium retrofit": "Remplacement d'une batterie traditionnelle par une batterie lithium sur une installation déjà existante.",
  Busbars: "Barres de raccordement qui centralisent plusieurs connexions électriques en un seul point, plutôt que de multiplier les fils.",
  "Batterie LiFePO4": "Technologie de batterie lithium fer phosphate, plus sûre et plus durable que les batteries lithium classiques.",
  Convertisseur: "Appareil qui transforme le courant continu de la batterie (12V) en courant alternatif (230V) pour alimenter des prises classiques.",
  Différentiel: "Dispositif de sécurité qui coupe automatiquement le courant en cas de fuite électrique, pour éviter l'électrocution.",
  "Convertisseur-chargeur": "Appareil combiné qui recharge la batterie sur le courant du port et fournit du 230V quand le bateau est débranché.",
};

export function getGlossaryDefinition(term: string): string | null {
  return TECHNICAL_GLOSSARY[term] ?? null;
}
