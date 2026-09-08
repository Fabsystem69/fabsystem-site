import { NextResponse } from "next/server";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { buildIcsCalendar, type IcsEvent } from "@/lib/server/ics";
import { listCalendarAppointments } from "@/lib/services/dossier-client";
import { getDossierOffreLabel } from "@/lib/dashboard-status-labels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Flux calendrier prive, en abonnement (webcal) — retour utilisateur : "un
// calendrier pour caler les visio et ensuite les avoir directement sur mon
// agenda iPhone". Pas de session cookie possible ici : Calendrier iOS/macOS
// fait une requete anonyme periodique sur cette URL, jamais authentifiee
// comme le reste du dashboard. Le token en query string tient lieu de mot
// de passe pour cette seule URL — a garder secrete, jamais partagee.
export async function GET(request: Request) {
  const token = process.env.CALENDAR_FEED_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "Calendar feed not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("token") !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = getRequiredBaseUrl(request.url);
  const appointments = await listCalendarAppointments();

  const events: IcsEvent[] = appointments.map((appointment) => {
    const end = new Date(appointment.scheduledAt.getTime() + appointment.durationMinutes * 60 * 1000);
    const customerName = appointment.dossier.customer.name || appointment.dossier.customer.email;
    const descriptionLines = [
      `Offre : ${getDossierOffreLabel(appointment.dossier.offre)}`,
      appointment.compteRendu ? `Compte-rendu : ${appointment.compteRendu}` : null,
    ].filter((line): line is string => Boolean(line));

    return {
      uid: `dossier-appointment-${appointment.id}@fabsystem.fr`,
      start: appointment.scheduledAt,
      end,
      summary: `Visio – ${customerName}`,
      description: descriptionLines.join("\n"),
      url: `${baseUrl}/dashboard/accompagnements/${appointment.dossierId}`,
      lastModified: appointment.updatedAt,
    };
  });

  const ics = buildIcsCalendar({ calendarName: "FabSystem — Accompagnement", events });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=accompagnements.ics",
      "Cache-Control": "no-store",
    },
  });
}
