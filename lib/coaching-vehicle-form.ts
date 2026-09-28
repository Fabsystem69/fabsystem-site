import { badRequest } from "@/lib/http-errors";
import { CLIENT_LEVEL_LABELS } from "@/lib/dashboard-status-labels";
import { projectAssetTypeSchema } from "@/lib/project-payload";
import type { VehicleInfoFields } from "@/lib/services/coaching-van-dossier";

const VEHICLE_TEXT_FIELDS = [
  "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleEngine", "vehicleFormat",
  "vehicleDimensions", "registrationCountry", "usageCountry", "homologationNotes",
  "projectStage", "whoDoesTheWork", "coachingTopics", "threePriorities", "startDeadline",
  // objectifs a rejoint ce formulaire (constat d'audit : ce champ était
  // aussi modifiable via updateCoachingProject, sans aucune verification de
  // version — un ecrasement silencieux entre coach et client etait possible
  // sur ce meme champ par deux chemins non synchronises). Une seule section,
  // un seul marqueur de concurrence (vehicleInfoUpdatedAt).
  "objectifs",
] as const;

const CLIENT_LEVEL_VALUES = Object.keys(CLIENT_LEVEL_LABELS);

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") throw badRequest("Champ de formulaire invalide.");
  return value.trim();
}

export function parseOptionalEuroBudget(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw badRequest("Le budget doit être un montant positif avec au plus deux décimales.");
  }
  const [euros, decimals = ""] = normalized.split(".");
  const cents = Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > 2_147_483_647) {
    throw badRequest("Le budget est trop élevé.");
  }
  return cents;
}

// Absence d'un champ = conserver ; champ explicitement vide = effacer.
export function parseAdminVehicleFields(formData: FormData): VehicleInfoFields {
  const fields: VehicleInfoFields = {};
  if (formData.has("assetType")) {
    const raw = readText(formData, "assetType");
    if (!raw) {
      fields.assetType = null; // "je ne sais pas encore" — jamais une valeur par défaut inventée
    } else {
      const parsed = projectAssetTypeSchema.safeParse(raw);
      if (!parsed.success) throw badRequest("Support invalide.");
      fields.assetType = parsed.data;
    }
  }
  if (formData.has("niveauClient")) {
    const raw = readText(formData, "niveauClient");
    if (!raw) {
      fields.niveauClient = null;
    } else if (!CLIENT_LEVEL_VALUES.includes(raw)) {
      throw badRequest("Niveau du client invalide.");
    } else {
      fields.niveauClient = raw as VehicleInfoFields["niveauClient"];
    }
  }
  for (const key of VEHICLE_TEXT_FIELDS) {
    if (formData.has(key)) fields[key] = readText(formData, key) || null;
  }
  if (formData.has("materialBudgetEuros")) {
    fields.materialBudgetCents = parseOptionalEuroBudget(readText(formData, "materialBudgetEuros"));
  }
  if (formData.has("laborBudgetEuros")) {
    fields.laborBudgetCents = parseOptionalEuroBudget(readText(formData, "laborBudgetEuros"));
  }
  return fields;
}
