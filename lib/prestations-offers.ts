// Catalogue commercial des accompagnements actuels. Les montants sont en
// centimes et alimentent Stripe au checkout via les ProductPrice locaux.

export const PRESTATIONS_OFFER_SLUG_PREFIX = "accompagnement-";
export const PRESTATIONS_INCLUDED_EBOOK_SLUG = "ebook-schema-electrique";
export const PRESTATIONS_EDITOR_ACCESS_DAYS = 365;

export type PrestationsOfferDefinition = {
  slug: string;
  name: string;
  priceCents: number;
  shortDescription: string;
  description: string;
};

export const PRESTATIONS_OFFERS: readonly PrestationsOfferDefinition[] = [
  {
    slug: "accompagnement-appel-conseil",
    name: "Appel conseil électrique",
    priceCents: 6900,
    shortDescription: "Un appel d'environ une heure pour débloquer vos questions concrètes.",
    description: "Avis d'expérience sur une installation électrique embarquée. Sans conception complète ni suivi de chantier.",
  },
  {
    slug: "accompagnement-guide",
    name: "Accompagnement guidé électrique",
    priceCents: 19900,
    shortDescription: "90 jours pour vérifier vos choix, corriger votre schéma et avancer aux étapes sensibles.",
    description: "Vous préparez le projet ; FabSystem vérifie la cohérence, corrige le schéma et vous accompagne aux jalons définis.",
  },
  {
    slug: "accompagnement-conception-complete",
    name: "Conception complète électrique",
    priceCents: 49900,
    shortDescription: "Cahier des charges, schéma et liste d'achat structurée pour votre installation.",
    description: "FabSystem conçoit l'installation à partir de vos besoins, puis livre un dossier technique clair avant les achats.",
  },
];

export function isPrestationsOfferSlug(slug: string) {
  return PRESTATIONS_OFFERS.some((offer) => offer.slug === slug);
}

// Decision validee (CDC v3 §3.1) : l'acces inclus (365j editeur + ebook
// offert) est retire de l'Appel conseil (69€, un simple appel), conserve
// pour Guide et Conception. Avant cette decision, grantPrestationsBenefitsForOrder
// utilisait isPrestationsOfferSlug seul et accordait le meme bonus aux 3 offres.
const BONUS_ACCESS_EXCLUDED_SLUGS = new Set(["accompagnement-appel-conseil"]);

export function offerIncludesBonusAccess(slug: string) {
  return isPrestationsOfferSlug(slug) && !BONUS_ACCESS_EXCLUDED_SLUGS.has(slug);
}

export function getPrestationsOfferBySlug(slug: string) {
  return PRESTATIONS_OFFERS.find((offer) => offer.slug === slug) ?? null;
}
