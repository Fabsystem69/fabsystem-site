// Longueurs moyennes plausibles par section (retour utilisateur : "des
// longueurs moyennes automatiquement quand on rajoute quelque chose, pour
// éviter qu'un débutant ait à le faire") — préremplit le champ Longueur dès
// qu'une section est choisie, sans écraser une valeur déjà saisie. Plus la
// section est grosse, plus le tronçon type est court (câbles batterie/busbar
// courts et épais vs branches consommateurs fines et plus longues jusqu'au
// poste) — juste une estimation de départ, à ajuster par l'utilisateur.
export const AVERAGE_CABLE_LENGTH_BY_SECTION_M: Record<string, number> = {
  "0,5 mm²": 2,
  "0,75 mm²": 2.5,
  "1 mm²": 2.5,
  "1,5 mm²": 3,
  "2,5 mm²": 2,
  "4 mm²": 1.5,
  "6 mm²": 1.5,
  "10 mm²": 1.5,
  "16 mm²": 1,
  "25 mm²": 1,
  "35 mm²": 1,
  "50 mm²": 0.5,
  "70 mm²": 0.5,
};

export function getAverageCableLength(section: string): number | undefined {
  return AVERAGE_CABLE_LENGTH_BY_SECTION_M[section];
}
