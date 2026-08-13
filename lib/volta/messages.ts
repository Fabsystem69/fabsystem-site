// UI-14 §21 — messages déterministes, jamais générés : chaque texte vient
// d'une règle fixe (état réel du Project, contenu pédagogique déjà validé),
// jamais d'un diagnostic ou d'une recommandation inventée pour l'occasion.
export const VOLTA_MESSAGES = {
  guidedIntro:
    "Je vais vous aider à avancer étape par étape. Pas besoin de connaître l'électricité : décrivez simplement votre installation. À chaque étape, pensez à cliquer sur « Utiliser pour mon projet » — « Calculer » seul n'enregistre rien.",
  powerUnknown:
    "Vous ne connaissez pas la puissance de cet appareil ? Cherchez une valeur en W sur son étiquette ou sa notice. Si vous ne la trouvez pas, vous pourrez revenir plus tard.",
  batteryUnknown:
    "Sur l'étiquette d'une batterie, un chiffre suivi de V indique la tension (12 V, 24 V) et un chiffre suivi de Ah indique la capacité.",
  mpptExplain:
    "Le régulateur solaire se place entre les panneaux et la batterie. Un modèle MPPT adapte la production des panneaux pour charger la batterie efficacement.",
  cableDistance:
    "Mesurez la distance aller simple entre le tableau et l'appareil : FabSystem double automatiquement cette longueur pour tenir compte du retour du courant.",
  calculateVsRetain:
    "Calculer essaie une valeur sans rien enregistrer. Utiliser pour mon projet retient ce résultat comme décision.",
  obsoleteExplain:
    "Une information utilisée dans ce calcul a changé. FabSystem doit recalculer ce résultat avant de l'utiliser à nouveau.",
  dashboardObsolete: (count: number) =>
    `Une valeur retenue ne correspond plus à vos données récentes. ${count > 1 ? `${count} calculs sont` : "Un calcul est"} à refaire.`,
  dashboardTodo: (count: number) =>
    `Il reste ${count} information${count > 1 ? "s" : ""} à compléter dans votre projet.`,
  cableUndersized:
    "C'est le point sur lequel je vois le plus d'installations partir en fumée. Ne rognez jamais sur la section d'un câble, même « juste pour cette fois ».",
} as const;
