import { listDueProspectFollowUps } from "@/lib/services/prospect";
import { listOverdueActions, listProjectsRunningLowOnTime, listSessionsInRange } from "@/lib/services/coaching-project";
import { listProjectsAwaitingReview, listProjectsWithIncompleteBilan } from "@/lib/services/coaching-van-dossier";

// Agrégation pour /dashboard/crm ("Aujourd'hui") — retour utilisateur :
// "prospects à relancer, séances du jour et à venir, actions en retard,
// dossiers nécessitant une réponse, clients dont le temps arrive à
// épuisement". Une seule fonction composée plutôt que 5 appels dispersés
// dans la page, pour garder page.tsx lisible.
export async function getCoachingDashboardData(now: Date = new Date()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfUpcomingWindow = new Date(now);
  endOfUpcomingWindow.setDate(endOfUpcomingWindow.getDate() + 7);

  const [prospectsToFollowUp, sessionsToday, upcomingSessions, overdueActions, projectsLowOnTime, projectsAwaitingReview, projectsWithIncompleteBilan] =
    await Promise.all([
      listDueProspectFollowUps(now),
      listSessionsInRange(startOfToday, endOfToday),
      listSessionsInRange(new Date(endOfToday.getTime() + 1), endOfUpcomingWindow),
      listOverdueActions(now),
      listProjectsRunningLowOnTime(),
      listProjectsAwaitingReview(),
      listProjectsWithIncompleteBilan(),
    ]);

  return {
    prospectsToFollowUp,
    sessionsToday,
    upcomingSessions,
    overdueActions,
    projectsLowOnTime,
    projectsAwaitingReview,
    projectsWithIncompleteBilan,
  };
}
