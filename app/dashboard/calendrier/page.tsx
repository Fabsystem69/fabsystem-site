import { AdminAlert, AdminCard, DashboardPageShell, AdminPageHeader } from "@/components/dashboard/ui";
import { getRequiredBaseUrl } from "@/lib/server/env";

export const dynamic = "force-dynamic";

// Page de configuration, pas de donnees a afficher — le flux ICS lui-meme
// (app/api/calendar/accompagnements.ics) reste anonyme cote requete (token
// en query string, pas de session), a l'inverse de tout le reste du
// dashboard.
export default function DashboardCalendarPage() {
  const token = process.env.CALENDAR_FEED_TOKEN?.trim();
  const baseUrl = getRequiredBaseUrl();
  const feedUrl = token ? `${baseUrl}/api/calendar/accompagnements.ics?token=${token}` : null;
  const webcalUrl = feedUrl?.replace(/^https?:\/\//, "webcal://") ?? null;

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title="Calendrier des rendez-vous"
        description="Un abonnement à ajouter une seule fois dans l'app Calendrier de l'iPhone — chaque rendez-vous ajouté depuis une fiche accompagnement y apparaît ensuite automatiquement."
      />

      {!token ? (
        <AdminAlert tone="warning">
          Variable d&apos;environnement CALENDAR_FEED_TOKEN manquante — le flux calendrier est désactivé tant qu&apos;elle
          n&apos;est pas définie.
        </AdminAlert>
      ) : (
        <AdminCard title="Lien d'abonnement" description="À garder secret : quiconque possède ce lien peut voir les rendez-vous.">
          <div className="space-y-3">
            <p className="break-all rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 font-mono text-xs text-neutral-300">
              {webcalUrl}
            </p>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-neutral-300">
              <li>Sur l&apos;iPhone : Réglages → Calendrier → Comptes → Ajouter un compte → Autre.</li>
              <li>« Ajouter un compte calendrier avec abonnement ».</li>
              <li>Coller le lien ci-dessus dans « Serveur », puis Suivant → Enregistrer.</li>
            </ol>
            <p className="text-xs text-neutral-500">
              L&apos;app Calendrier rafraîchit ce flux périodiquement (pas en temps réel) — un rendez-vous ajouté
              depuis le dashboard peut mettre jusqu&apos;à quelques heures avant d&apos;apparaître sur l&apos;iPhone.
            </p>
          </div>
        </AdminCard>
      )}
    </DashboardPageShell>
  );
}
