// Installation existante (tri-état) : module pur, sans dépendance serveur.
// Stockée dans CoachingProject.existingInstallation (Json?), forme versionnée :
// { version: 1, items: { battery|solar|driving_charge|shore_power|inverter:
//   { status: "PRESENT"|"ABSENT"|"UNKNOWN", detail: string|null } } }
// Une clé absente = non renseigné (différent de UNKNOWN = « je ne sais pas »).

import { z } from "zod";

export const EXISTING_INSTALLATION_KEYS = ["battery", "solar", "driving_charge", "shore_power", "inverter"] as const;
export type ExistingInstallationKey = (typeof EXISTING_INSTALLATION_KEYS)[number];

export const EXISTING_INSTALLATION_STATUSES = ["PRESENT", "ABSENT", "UNKNOWN"] as const;
export type ExistingInstallationStatus = (typeof EXISTING_INSTALLATION_STATUSES)[number];

export const EXISTING_INSTALLATION_DETAIL_MAX = 300;

export type ExistingInstallationItem = {
  readonly status: ExistingInstallationStatus;
  readonly detail: string | null;
};

export type ExistingInstallationItems = Partial<Record<ExistingInstallationKey, ExistingInstallationItem>>;

export type ExistingInstallation = {
  readonly version: 1;
  readonly items: ExistingInstallationItems;
};

export type ExistingInstallationPatch = ExistingInstallationItems;

export const EXISTING_INSTALLATION_LABELS: Record<ExistingInstallationKey, string> = {
  battery: "Batterie(s)",
  solar: "Panneaux solaires",
  driving_charge: "Recharge en roulant (alternateur / convertisseur DC-DC)",
  shore_power: "Branchement secteur (220 V)",
  inverter: "Convertisseur 12 V → 230 V",
};

export const EXISTING_INSTALLATION_STATUS_LABELS: Record<ExistingInstallationStatus, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  UNKNOWN: "Je ne sais pas",
};

const itemSchema = z.strictObject({
  status: z.enum(EXISTING_INSTALLATION_STATUSES),
  detail: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().max(EXISTING_INSTALLATION_DETAIL_MAX))
    .transform((value) => (value === "" ? null : value))
    .nullable(),
});

// Liste blanche stricte : une clé inconnue est refusée, jamais ignorée.
const itemsSchema = z.strictObject({
  battery: itemSchema.optional(),
  solar: itemSchema.optional(),
  driving_charge: itemSchema.optional(),
  shore_power: itemSchema.optional(),
  inverter: itemSchema.optional(),
});

export const existingInstallationSchema = z.strictObject({
  version: z.literal(1),
  items: itemsSchema,
});

export const existingInstallationPatchSchema = itemsSchema;

// Tolérant : JSON invalide, forme inconnue ou version future => null, jamais d'exception.
export function parseExistingInstallation(json: unknown): ExistingInstallation | null {
  try {
    let value: unknown = json;
    if (typeof value === "string") value = JSON.parse(value);
    const parsed = existingInstallationSchema.safeParse(value);
    return parsed.success ? { version: 1, items: normalizeItems(parsed.data.items) } : null;
  } catch {
    return null;
  }
}

export type PatchParseResult =
  | { readonly success: true; readonly data: ExistingInstallationPatch }
  | { readonly success: false; readonly error: string };

export function parseExistingInstallationPatch(input: unknown): PatchParseResult {
  const parsed = existingInstallationPatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: `Installation existante invalide (statut ou détail de ${EXISTING_INSTALLATION_DETAIL_MAX} caractères maximum).`,
    };
  }
  return { success: true, data: normalizeItems(parsed.data) };
}

function normalizeItems(items: ExistingInstallationItems): ExistingInstallationItems {
  const entries = EXISTING_INSTALLATION_KEYS.flatMap((key) => {
    const item = items[key];
    return item ? [[key, { status: item.status, detail: item.detail ?? null }] as const] : [];
  });
  return Object.fromEntries(entries) as ExistingInstallationItems;
}

// Immutable : ne retire jamais une clé ; seules les clés fournies par le patch
// sont remplacées. Un patch vide renvoie un document équivalent au courant.
export function mergeExistingInstallation(
  current: ExistingInstallation | null,
  patch: ExistingInstallationPatch,
): ExistingInstallation {
  const provided = EXISTING_INSTALLATION_KEYS.flatMap((key) => {
    const item = patch[key];
    return item ? [[key, { status: item.status, detail: item.detail ?? null }] as const] : [];
  });
  return {
    version: 1,
    items: { ...(current?.items ?? {}), ...Object.fromEntries(provided) },
  };
}

type FormReader = { get(name: string): unknown };

export function existingInstallationFieldNames(key: ExistingInstallationKey) {
  return { status: `existing_${key}_status`, detail: `existing_${key}_detail` } as const;
}

// Lit les 5 lignes du formulaire. Une ligne dont le statut n'est pas soumis
// n'entre pas dans le patch (l'existant n'est jamais effacé). Un détail sans
// statut est refusé : on ne devine jamais « Présent ».
export function readExistingInstallationPatchFromForm(form: FormReader): PatchParseResult {
  const raw: Record<string, unknown> = {};
  for (const key of EXISTING_INSTALLATION_KEYS) {
    const names = existingInstallationFieldNames(key);
    const status = form.get(names.status);
    const detail = form.get(names.detail);
    const detailText = typeof detail === "string" ? detail.trim() : "";
    if (typeof status !== "string" || status === "") {
      if (detailText) {
        return { success: false, error: `Choisissez Présent, Absent ou Je ne sais pas pour : ${EXISTING_INSTALLATION_LABELS[key]}.` };
      }
      continue;
    }
    raw[key] = { status, detail: detailText || null };
  }
  return parseExistingInstallationPatch(raw);
}

// Brouillon du formulaire (statut + détail par ligne) à partir du document stocké.
export function existingInstallationItemFor(
  doc: ExistingInstallation | null,
  key: ExistingInstallationKey,
): ExistingInstallationItem | null {
  return doc?.items[key] ?? null;
}
