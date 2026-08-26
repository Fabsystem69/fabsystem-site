import { z } from "zod";

// Distinct de lib/customer-payload.ts (formulaire Admin, id + email
// modifiables) : ce schema est celui de l'auto-service client sur
// /mon-compte/profil — jamais d'id ni d'email ici, l'email est l'identifiant
// de connexion (magic link) et ne doit pas pouvoir etre change a la volee
// depuis ce formulaire.
const optionalTrimmedString = z.string().trim().optional().or(z.literal(""));

export const customerProfileInputSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  phone: optionalTrimmedString,
  address: optionalTrimmedString,
  assetType: z.enum(["VEHICLE", "BOAT", "OTHER"]).default("OTHER"),
  assetBrand: optionalTrimmedString,
  assetModel: optionalTrimmedString,
  registration: optionalTrimmedString,
  // v2.1 : permet de cibler le mailing par niveau (contenus debutant vs
  // guides avances) — jamais bloquant, laisse vide si non renseigne.
  electricalSkillLevel: z.enum(["DEBUTANT", "INTERMEDIAIRE", "AVANCE", ""]).optional(),
  // Lien vers un espace de partage externe (Google Drive, Dropbox...) —
  // simple URL, jamais de stockage de fichiers cote FabSystem.
  driveLinkUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
});

export type CustomerProfileInput = z.infer<typeof customerProfileInputSchema>;

export function normalizeCustomerProfileData(data: CustomerProfileInput) {
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();

  return {
    firstName,
    lastName,
    // `name` reste synchronise pour tout le code existant qui l'affiche
    // encore (commandes, emails, dashboard admin) — voir schema.prisma.
    name: `${firstName} ${lastName}`.trim(),
    phone: data.phone || null,
    address: data.address || null,
    assetType: data.assetType,
    assetBrand: data.assetBrand || null,
    assetModel: data.assetModel || null,
    registration: data.registration ? data.registration.trim().toUpperCase() : null,
    electricalSkillLevel: data.electricalSkillLevel || null,
    driveLinkUrl: data.driveLinkUrl || null,
  };
}
