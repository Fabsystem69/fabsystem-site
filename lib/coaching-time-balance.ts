// Calcul pur du temps de coaching acheté/consommé/restant — jamais stocké
// (voir prisma/schema.prisma, commentaire sur CoachingProposal : retour
// utilisateur explicite "sans double comptage"). Séparé de
// lib/services/coaching-project.ts (qui va chercher les sommes en base)
// pour rester testable sans base de données, même convention que
// lib/calc/section-cable.ts.
export type CoachingProjectTimeBalance = {
  purchasedMinutes: number;
  consumedMinutes: number;
  remainingMinutes: number;
};

export function computeCoachingProjectTimeBalance(purchasedMinutes: number, consumedMinutes: number): CoachingProjectTimeBalance {
  return { purchasedMinutes, consumedMinutes, remainingMinutes: purchasedMinutes - consumedMinutes };
}
