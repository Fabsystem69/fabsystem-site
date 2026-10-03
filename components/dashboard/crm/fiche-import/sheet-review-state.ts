import type { ActionDraft } from "@/lib/crm/meeting-notes-contract";
import { DEVICE_POWER_SUPPLIES, sheetCommitSchema, type ProposedChange, type SheetProposal, type UnreadField } from "@/lib/crm/sheet-import-contract";

// Etat editable de la proposition : chaque ligne porte `include` (case a
// cocher) et un `id` stable. Toujours copie, jamais mute.

export type ChangeLine = Omit<ProposedChange, "proposed" | "defaultChecked"> & { id: string; include: boolean; value: string };
export type DeviceLine = {
  id: string;
  include: boolean;
  name: string;
  quantity: string;
  powerSupply: (typeof DEVICE_POWER_SUPPLIES)[number];
  duration: string;
  remark: string;
  alreadyExists: boolean;
};
export type TextLine = { id: string; text: string; include: boolean };
export type ActionLine = { id: string; include: boolean } & ActionDraft;

export type SheetReviewState = {
  changes: ChangeLine[];
  sameCount: number;
  unread: UnreadField[];
  devices: DeviceLine[];
  observations: string;
  pointsToCheck: TextLine[];
  decisions: TextLine[];
  actions: ActionLine[];
  uncertainties: string[];
  warnings: string[];
};

export const POWER_LABELS: Record<(typeof DEVICE_POWER_SUPPLIES)[number], string> = {
  DC12: "12 V continu",
  DC24: "24 V continu",
  DC_AUTRE: "Autre continu",
  USB: "USB",
  AC230: "230 V",
  INCONNU: "Inconnue",
};

const newId = () => crypto.randomUUID();
const textLines = (items: readonly string[]): TextLine[] => items.map((text) => ({ id: newId(), text, include: true }));

export function reviewFromProposal(proposal: SheetProposal): SheetReviewState {
  return {
    changes: proposal.changes.map(({ proposed, defaultChecked, ...rest }) => ({ ...rest, id: newId(), include: defaultChecked, value: proposed })),
    sameCount: proposal.sameCount,
    unread: proposal.unread,
    devices: proposal.devices.map((device) => ({
      id: newId(),
      include: !device.alreadyExists,
      name: device.name,
      quantity: String(device.quantity),
      powerSupply: device.powerSupply,
      duration: device.duration ?? "",
      remark: device.remark ?? "",
      alreadyExists: device.alreadyExists,
    })),
    observations: proposal.coach.observations ?? "",
    pointsToCheck: textLines(proposal.coach.pointsToCheck),
    decisions: textLines(proposal.coach.decisions),
    // Actions issues de la fiche cochees ; suggestions IA jamais par defaut.
    actions: proposal.coach.actions.map((action) => ({ ...action, id: newId(), include: action.origin === "NOTES" })),
    uncertainties: proposal.uncertainties,
    warnings: proposal.warnings,
  };
}

export const newActionLine = (): ActionLine => ({
  id: newId(),
  include: true,
  label: "",
  responsible: "COACH",
  dueDate: null,
  dueDateText: null,
  origin: "NOTES",
});

const kept = (lines: readonly TextLine[]) => lines.filter((line) => line.include && line.text.trim()).map((line) => line.text.trim());

export type SheetCommitContext = { submissionKey: string; projectId: string; exchangeDate: string; photoCount: number };

// Ne garde que les lignes cochees et non vides, puis valide cote client ;
// retourne le premier message d'erreur (aucun appel serveur dans ce cas).
export function buildSheetCommit(state: SheetReviewState, context: SheetCommitContext) {
  for (const device of state.devices) {
    if (!device.include) continue;
    const quantity = Number(device.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false as const, error: `Quantité invalide pour « ${device.name || "appareil"} » (1 à 99).` };
    }
  }

  const parsed = sheetCommitSchema.safeParse({
    ...context,
    fields: state.changes.filter((line) => line.include && line.value.trim()).map((line) => ({ fieldKey: line.fieldKey, value: line.value })),
    devices: state.devices
      .filter((device) => device.include && device.name.trim())
      .map((device) => ({
        name: device.name,
        quantity: Number(device.quantity),
        powerSupply: device.powerSupply,
        duration: device.duration || null,
        remark: device.remark || null,
      })),
    coach: {
      observations: state.observations || null,
      pointsToCheck: kept(state.pointsToCheck),
      decisions: kept(state.decisions),
      actions: state.actions
        .filter((action) => action.include && action.label.trim())
        .map(({ label, responsible, dueDate, dueDateText, origin }) => ({ label, responsible, dueDate: dueDate || null, dueDateText, origin })),
    },
  });

  return parsed.success
    ? { ok: true as const, commit: parsed.data }
    : { ok: false as const, error: parsed.error.issues[0]?.message ?? "Fiche invalide." };
}
