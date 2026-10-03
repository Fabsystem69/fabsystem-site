import { badRequest, notFound } from "@/lib/http-errors";
import {
  mergeExistingInstallation,
  parseExistingInstallation,
  parseExistingInstallationPatch,
  type ExistingInstallationItems,
  type ExistingInstallationKey,
} from "@/lib/crm/existing-installation";
import { readSheetValueByKey, type SheetProjectSource } from "@/lib/crm/discovery-sheet-values";
import { dueDateToDate } from "@/lib/crm/meeting-notes-format";
import { normalizeText, getImportableField } from "@/lib/crm/sheet-import-fields";
import { sheetCommitSchema, type SheetCommit } from "@/lib/crm/sheet-import-contract";
import {
  appendBlock,
  bulletList,
  buildSheetImportNote,
  ficheImportEventType,
  importHeader,
} from "@/lib/crm/sheet-import-format";
import { translateFields, type FieldWrites } from "@/lib/crm/sheet-import-translate";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { advisoryXactLock } from "@/lib/server/advisory-lock";
import { logCoachingProjectEvent } from "@/lib/services/coaching-project-events";

export type SheetApplyResult = {
  status: "applied" | "already_applied";
  writtenFields: string[];
  devicesCreated: number;
  actionCount: number;
  targetHref: string;
};

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type ProjectRow = Awaited<ReturnType<Tx["coachingProject"]["findUnique"]>> & object;

// Fusionne les lignes « installation existante » sans jamais effacer une
// autre cle. Un detail sans case cochee (ni sur la fiche ni deja enregistree)
// est refuse : on ne devine jamais « Present ».
function mergeInstallation(current: unknown, patches: FieldWrites["installation"]) {
  const parsedCurrent = parseExistingInstallation(current);
  const raw: ExistingInstallationItems = Object.fromEntries(
    (Object.entries(patches) as [ExistingInstallationKey, { status?: "PRESENT" | "ABSENT" | "UNKNOWN"; detail?: string }][]).map(
      ([key, patch]) => {
        const previous = parsedCurrent?.items[key];
        const status = patch.status ?? previous?.status;
        if (!status) throw badRequest("Un détail d'installation existante ne peut pas être écrit sans case Présent / Absent / Je ne sais pas.");
        return [key, { status, detail: patch.detail !== undefined ? patch.detail : (previous?.detail ?? null) }];
      },
    ),
  );
  const validated = parseExistingInstallationPatch(raw);
  if (!validated.success) throw badRequest(validated.error);
  return mergeExistingInstallation(parsedCurrent, validated.data);
}

function buildProjectUpdate(project: ProjectRow, commit: SheetCommit, writes: FieldWrites, now: Date): Prisma.CoachingProjectUpdateInput {
  const header = importHeader(commit.exchangeDate as string, now);
  const questions = [writes.appends.questionsEnAttente, commit.coach.pointsToCheck.length ? bulletList(commit.coach.pointsToCheck) : null]
    .filter(Boolean)
    .join("\n");

  return {
    ...writes.scalars,
    ...(Object.keys(writes.installation).length > 0
      ? { existingInstallation: mergeInstallation(project.existingInstallation, writes.installation) as unknown as Prisma.InputJsonValue }
      : {}),
    ...(commit.coach.observations ? { notesInternes: appendBlock(project.notesInternes, header, commit.coach.observations) } : {}),
    ...(questions ? { questionsEnAttente: appendBlock(project.questionsEnAttente, header, questions) } : {}),
    ...(writes.appends.preoccupations ? { preoccupations: appendBlock(project.preoccupations, header, writes.appends.preoccupations) } : {}),
    // Jetons de concurrence : un onglet client perime detecte le conflit.
    ...Object.fromEntries(writes.tokens.map((token) => [token, now])),
    derniereActivite: now,
  };
}

async function createDevices(tx: Tx, projectId: string, commit: SheetCommit) {
  const existing = await tx.coachingDevice.findMany({ where: { projectId }, select: { name: true } });
  const known = new Set(existing.map((device) => normalizeText(device.name)));
  const created: SheetCommit["devices"] = [];
  const skipped: string[] = [];

  for (const device of commit.devices) {
    const name = normalizeText(device.name);
    if (known.has(name)) {
      skipped.push(device.name);
      continue;
    }
    known.add(name);
    await tx.coachingDevice.create({
      data: {
        projectId,
        name: device.name,
        category: "AUTRE",
        quantity: device.quantity,
        state: "ENVISAGE",
        phase: "ACTUEL",
        powerSupply: device.powerSupply,
        dataOrigin: "ESTIMATION_CLIENT",
      },
    });
    created.push(device);
  }
  return { created, skipped };
}

async function applyInTransaction(tx: Tx, commit: SheetCommit, writes: FieldWrites): Promise<SheetApplyResult> {
  const targetHref = `/dashboard/crm/projects/${commit.projectId}`;
  const project = await tx.coachingProject.findUnique({ where: { id: commit.projectId } });
  if (!project) throw notFound("Projet introuvable.");

  const eventType = ficheImportEventType(commit.submissionKey);
  const already = await tx.coachingProjectEvent.findFirst({ where: { projectId: commit.projectId, type: eventType }, select: { id: true } });
  if (already) return { status: "already_applied", writtenFields: [], devicesCreated: 0, actionCount: 0, targetHref };

  const now = new Date();
  const source = { ...project, devices: [], documents: [] } as unknown as SheetProjectSource;
  const previousValues = writes.writtenFields.map((key) => {
    const info = getImportableField(key);
    return { key, label: info?.label ?? key, previous: info?.target.kind === "append" ? "(ajout, rien remplacé)" : readSheetValueByKey(source, key) };
  });

  await tx.coachingProject.update({ where: { id: commit.projectId }, data: buildProjectUpdate(project, commit, writes, now) });
  const { created, skipped } = await createDevices(tx, commit.projectId, commit);

  if (commit.coach.actions.length > 0) {
    await tx.coachingActionItem.createMany({
      data: commit.coach.actions.map((action) => ({
        projectId: commit.projectId,
        label: action.label,
        responsible: action.responsible,
        dueDate: dueDateToDate(action.dueDate),
      })),
    });
  }

  const note = buildSheetImportNote({
    commit,
    writtenFields: previousValues,
    createdDevices: created,
    skippedDevices: skipped,
    actionCount: commit.coach.actions.length,
  });
  await logCoachingProjectEvent(tx, commit.projectId, eventType, { kind: "coach" }, note);

  return {
    status: "applied",
    writtenFields: [...writes.writtenFields],
    devicesCreated: created.length,
    actionCount: commit.coach.actions.length,
    targetHref,
  };
}

// Enregistre l'import en UNE transaction (verrou sur la cle de soumission,
// idempotence par evenement FICHE_IMPORT:<cle>). Seuls les champs coches du
// commit sont ecrits ; un echec laisse la base inchangee.
export async function applySheetImport(rawCommit: unknown): Promise<SheetApplyResult> {
  const parsed = sheetCommitSchema.safeParse(rawCommit);
  if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? "Données invalides.");
  const commit = parsed.data;
  // Valide toutes les valeurs avant d'ouvrir la transaction.
  const writes = translateFields(commit.fields);

  return prisma.$transaction(async (tx) => {
    await advisoryXactLock(tx, commit.submissionKey);
    return applyInTransaction(tx, commit, writes);
  });
}
