import { badRequest, notFound } from "@/lib/http-errors";
import {
  buildImportNote,
  buildNextMeetingText,
  buildSessionReport,
  dueDateToDate,
  importEventType,
} from "@/lib/crm/meeting-notes-format";
import { meetingCommitSchema, type MeetingCommit } from "@/lib/crm/meeting-notes-contract";
import { prisma } from "@/lib/prisma";
import { advisoryXactLock } from "@/lib/server/advisory-lock";
import { logCoachingProjectEvent } from "@/lib/services/coaching-project-events";

export type MeetingApplyResult = {
  status: "created" | "already_applied";
  targetHref: string;
  actionCount: number;
};

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function applyToCoachingProject(tx: Tx, commit: MeetingCommit, projectId: string): Promise<MeetingApplyResult> {
  const href = `/dashboard/crm/projects/${projectId}`;
  const project = await tx.coachingProject.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const existing = await tx.coachingProjectEvent.findFirst({
    where: { projectId, type: importEventType("NOTES_IMPORT", commit.submissionKey) },
    select: { id: true },
  });
  if (existing) return { status: "already_applied", targetHref: href, actionCount: commit.actions.length };

  // Midi UTC de la date de l'echange : la date calendaire reste juste a Paris.
  const session = await tx.coachingSession.create({
    data: {
      projectId,
      scheduledAt: dueDateToDate(commit.exchangeDate) as Date,
      durationMinutes: commit.durationMinutes,
      status: "REALISEE",
      channel: commit.channel,
      sujetsAbordes: buildSessionReport(commit),
      prochaineEtape: buildNextMeetingText(commit.nextMeetingTopics),
      // Jamais partage automatiquement avec le client.
      sharedWithClient: false,
    },
  });

  if (commit.actions.length > 0) {
    await tx.coachingActionItem.createMany({
      data: commit.actions.map((action) => ({
        projectId,
        sessionId: session.id,
        label: action.label,
        dueDate: dueDateToDate(action.dueDate),
        responsible: action.responsible,
      })),
    });
  }

  await tx.coachingProject.update({ where: { id: projectId }, data: { derniereActivite: new Date() } });
  await logCoachingProjectEvent(tx, projectId, importEventType("NOTES_IMPORT", commit.submissionKey), { kind: "coach" }, buildImportNote(commit));

  return { status: "created", targetHref: href, actionCount: commit.actions.length };
}

async function applyToProspect(tx: Tx, commit: MeetingCommit, prospectId: string): Promise<MeetingApplyResult> {
  const href = `/dashboard/crm/prospects/${prospectId}`;
  const prospect = await tx.prospect.findUnique({
    where: { id: prospectId },
    select: { id: true, nextAction: true, nextActionAt: true },
  });
  if (!prospect) throw notFound("Prospect introuvable.");

  const existing = await tx.prospectEvent.findFirst({
    where: { prospectId, type: importEventType("NOTE", commit.submissionKey) },
    select: { id: true },
  });
  if (existing) return { status: "already_applied", targetHref: href, actionCount: commit.actions.length };

  // Le prospect n'a qu'une "prochaine action" : on retient la premiere
  // action de Fabien (les autres restent dans la note) et on garde trace de
  // celle qu'elle remplace plutot que de l'ecraser silencieusement.
  const nextCoachAction = commit.actions.find((action) => action.responsible === "COACH" && action.origin === "NOTES")
    ?? commit.actions.find((action) => action.responsible === "COACH");
  const replaced =
    nextCoachAction && prospect.nextAction ? `\n\nProchaine action précédente remplacée : ${prospect.nextAction}` : "";

  await tx.prospectEvent.create({
    data: { prospectId, type: importEventType("NOTE", commit.submissionKey), note: `${buildImportNote(commit)}${replaced}` },
  });
  await tx.prospect.update({
    where: { id: prospectId },
    data: {
      derniereActivite: new Date(),
      ...(nextCoachAction
        ? { nextAction: nextCoachAction.label, nextActionAt: dueDateToDate(nextCoachAction.dueDate) }
        : {}),
    },
  });

  return { status: "created", targetHref: href, actionCount: commit.actions.length };
}

// Enregistre tout le compte rendu en UNE transaction : seance, actions,
// trace d'origine. Un echec laisse la base inchangee (pas d'etat partiel),
// et rejouer la meme cle de soumission ne cree rien de plus.
export async function applyMeetingNotes(rawCommit: unknown): Promise<MeetingApplyResult> {
  const parsed = meetingCommitSchema.safeParse(rawCommit);
  if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? "Données invalides.");
  const commit = parsed.data;

  return prisma.$transaction(async (tx) => {
    await advisoryXactLock(tx, commit.submissionKey);

    return commit.target.kind === "coaching_project"
      ? applyToCoachingProject(tx, commit, commit.target.projectId)
      : applyToProspect(tx, commit, commit.target.prospectId);
  });
}
