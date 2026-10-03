import type { CoachingActionStatus, CoachingResponsible, CoachingSessionStatus, PrismaClient } from "@/lib/generated/prisma/client";

type PrismaClientLike = PrismaClient;

// Lot 2 (PROMPT_CLAUDE_DASHBOARD_CLIENT_V1.md) : "prochaine action réelle"
// et "prochain rendez-vous non annulé" pour l'accueil client. Logique de
// priorité/filtrage séparée en fonctions PURES (aucun accès base) pour
// rester testable sur fixtures — la lecture Prisma reste un fetch simple,
// jamais de tri par nom/date hasardeux côté requête.

export interface ClientActionRow {
  id: string;
  label: string;
  dueDate: Date | null;
  createdAt: Date;
}

// Priorité demandée par le prompt : "échéance puis ancienneté". Une action
// avec échéance passe toujours avant une action sans échéance (jamais
// l'inverse) ; parmi deux échéances, la plus proche d'abord ; sans échéance,
// la plus ancienne (createdAt) d'abord. Ne mélange jamais les actions
// privées du coach : l'appelant doit déjà avoir filtré responsible=CLIENT,
// status=A_FAIRE (ownership/visibilité vérifiés côté appelant, pas ici).
export function sortClientActionsByPriority<T extends ClientActionRow>(actions: T[]): T[] {
  return [...actions].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export interface AppointmentRow {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: CoachingSessionStatus;
  channel: string | null;
}

// "Prochain rendez-vous non annulé" (recette minimale, scénario 7 : "séance
// annulée exclue du prochain rendez-vous"). Revue (02/10/2026) : le premier
// jet acceptait aussi REALISEE dès que la date était future (donnée
// incohérente en pratique, mais jamais explicitement exclue) — ne retient
// désormais QUE PREVUE, jamais REALISEE ni ANNULEE. Une séance "tout juste
// commencée" (scheduledAt déjà passé, mais la durée prévue n'est pas encore
// écoulée) reste volontairement affichée comme le rendez-vous courant —
// sinon elle disparaîtrait de l'écran au moment précis où le client en a le
// plus besoin, pile à l'heure du rendez-vous. `now` est un paramètre
// explicite (jamais `new Date()` interne) pour rester testable de façon
// déterministe.
export function resolveNextAppointment<T extends AppointmentRow>(sessions: T[], now: Date): T | null {
  const relevant = sessions.filter((session) => {
    if (session.status !== "PREVUE") return false;
    const endsAt = session.scheduledAt.getTime() + session.durationMinutes * 60_000;
    return endsAt >= now.getTime();
  });
  if (relevant.length === 0) return null;
  return [...relevant].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];
}

export interface CoachingNextStepsDb {
  listOpenClientActions(coachingProjectId: string): Promise<ClientActionRow[]>;
  listUpcomingAppointments(coachingProjectId: string): Promise<AppointmentRow[]>;
}

export interface CoachingNextSteps {
  nextClientAction: ClientActionRow | null;
  nextAppointment: AppointmentRow | null;
}

export function createCoachingNextStepsService(db: CoachingNextStepsDb) {
  return {
    async getNextSteps(coachingProjectId: string, now: Date = new Date()): Promise<CoachingNextSteps> {
      const [openActions, upcomingAppointments] = await Promise.all([
        db.listOpenClientActions(coachingProjectId),
        db.listUpcomingAppointments(coachingProjectId),
      ]);

      const sortedActions = sortClientActionsByPriority(openActions);

      return {
        nextClientAction: sortedActions[0] ?? null,
        nextAppointment: resolveNextAppointment(upcomingAppointments, now),
      };
    },
  };
}

const OPEN_STATUS: CoachingActionStatus = "A_FAIRE";
const CLIENT_RESPONSIBLE: CoachingResponsible = "CLIENT";

export function createPrismaCoachingNextStepsDb(prisma: PrismaClientLike): CoachingNextStepsDb {
  return {
    async listOpenClientActions(coachingProjectId) {
      return prisma.coachingActionItem.findMany({
        where: { projectId: coachingProjectId, responsible: CLIENT_RESPONSIBLE, status: OPEN_STATUS },
        select: { id: true, label: true, dueDate: true, createdAt: true },
      });
    },
    async listUpcomingAppointments(coachingProjectId) {
      // Pas de filtre de date ici : une séance "tout juste commencée" (déjà
      // passée au sens scheduledAt, mais pas encore terminée) doit rester
      // candidate — c'est resolveNextAppointment (logique pure, testée) qui
      // tranche, jamais la requête elle-même. Seul le statut PREVUE est
      // filtré ici, c'est la seule condition jamais ambiguë.
      return prisma.coachingSession.findMany({
        where: { projectId: coachingProjectId, status: "PREVUE" },
        select: { id: true, scheduledAt: true, durationMinutes: true, status: true, channel: true },
      });
    },
  };
}

export async function getCoachingNextSteps(coachingProjectId: string, now: Date = new Date()): Promise<CoachingNextSteps> {
  const { prisma } = await import("@/lib/prisma");
  const service = createCoachingNextStepsService(createPrismaCoachingNextStepsDb(prisma));
  return service.getNextSteps(coachingProjectId, now);
}
