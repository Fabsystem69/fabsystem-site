// Gabarits de parcours par offre (CDC v3 §"Timeline pour..."), même principe
// que STEP_TEMPLATES dans lib/project-follow-up.ts : étapes fixes, texte
// affiché tel quel, aucune configuration dynamique en V1. Distinct de
// project-follow-up.ts — DossierClient suit une prestation d'accompagnement
// achetée (Order-driven), jamais un Project d'éditeur de schéma.

export type DossierStepStatus = "done" | "current" | "upcoming";

export type DossierStep = {
  key: string;
  title: string;
  isIterative?: boolean;
};

const GUIDE_STEPS: DossierStep[] = [
  { key: "schema_recu", title: "1. Schéma initial reçu du client" },
  { key: "verification", title: "2. Vérification", isIterative: true },
  { key: "points_valides", title: "3. Points sensibles validés" },
  { key: "materiel", title: "4. Matériel arbitré" },
  { key: "chantier", title: "5. Chantier sécurisé — suivi clos" },
];

const CONCEPTION_STEPS: DossierStep[] = [
  { key: "cadrage", title: "1. Prise de besoin" },
  { key: "cahier_des_charges", title: "2. Cahier des charges validé avec le client" },
  { key: "schema", title: "3. Schéma", isIterative: true },
  { key: "schema_valide", title: "4. Schéma validé par le client" },
  { key: "livraison", title: "5. Liste d'achat finalisée — dossier livré" },
];

export function getDossierSteps(offre: "GUIDE" | "CONCEPTION"): DossierStep[] {
  return offre === "GUIDE" ? GUIDE_STEPS : CONCEPTION_STEPS;
}

export function getDossierStepStatuses(
  offre: "GUIDE" | "CONCEPTION",
  currentStepKey: string | null
): Array<DossierStep & { status: DossierStepStatus }> {
  const steps = getDossierSteps(offre);
  const currentIndex = currentStepKey ? steps.findIndex((step) => step.key === currentStepKey) : -1;

  return steps.map((step, index) => ({
    ...step,
    status: currentIndex < 0 ? "upcoming" : index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
  }));
}

export function getNextDossierStepKey(offre: "GUIDE" | "CONCEPTION", currentStepKey: string | null) {
  const steps = getDossierSteps(offre);
  if (!currentStepKey) return steps[0]?.key ?? null;
  const currentIndex = steps.findIndex((step) => step.key === currentStepKey);
  if (currentIndex < 0 || currentIndex >= steps.length - 1) return null;
  return steps[currentIndex + 1].key;
}

export function isTimelineOffre(offre: string): offre is "GUIDE" | "CONCEPTION" {
  return offre === "GUIDE" || offre === "CONCEPTION";
}

// Lien WhatsApp pré-rempli (wa.me exige des chiffres purs, sans "+").
export function buildWhatsAppLink(whatsapp: string, message: string) {
  const digitsOnly = whatsapp.replace(/[^\d]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
