import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { getProspectSourceLabel, getProspectStatusLabel } from "@/lib/dashboard-status-labels";
import { getProspect } from "@/lib/services/prospect";
import { AdminAlert, AdminBadge, AdminButton, AdminCard, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";
import { convertProspectAction, logProspectNoteAction, updateProspectAction } from "../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-12 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

function eventLabel(type: string) {
  if (type === "STATUS_CHANGE") return "Changement de statut";
  return "Note";
}

export default async function DashboardCrmProspectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ prospectId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { prospectId } = await params;
  const { error, success } = await searchParams;
  const prospect = await getProspect(prospectId);

  return (
    <DashboardPageShell maxWidth="3xl">
      <AdminPageHeader
        title={prospect.name}
        backHref="/dashboard/crm/prospects"
        backLabel="Retour aux prospects"
        description={`${getProspectSourceLabel(prospect.source)} · ${getProspectStatusLabel(prospect.status)}`}
        actions={
          <Link href={`/dashboard/crm/notes?prospectId=${prospect.id}`} className="inline-flex h-10 items-center rounded-lg border border-neutral-700 px-3 text-sm font-medium text-neutral-200 hover:bg-neutral-800">
            Ajouter des notes manuscrites
          </Link>
        }
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
      {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

      {prospect.convertedCustomerId ? (
        <AdminAlert tone="success">
          Converti en client — <Link href={`/dashboard/crm/clients/${prospect.convertedCustomerId}`} className="underline">voir la fiche client</Link>.
        </AdminAlert>
      ) : null}

      <AdminCard title="Fiche prospect">
        <form action={updateProspectAction} className="grid gap-4">
          <input type="hidden" name="prospectId" value={prospect.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Nom
              <input name="name" defaultValue={prospect.name} required className={fieldClass} />
            </label>
            <label className={labelClass}>
              Statut
              <select name="status" defaultValue={prospect.status} className={fieldClass}>
                <option value="NOUVEAU">Nouveau</option>
                <option value="EN_DISCUSSION">En discussion</option>
                <option value="COACHING_PROPOSE">Coaching proposé</option>
                <option value="RESERVE">Réservé</option>
                <option value="GAGNE">Gagné</option>
                <option value="SANS_SUITE">Sans suite</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Téléphone
              <input name="phone" type="tel" defaultValue={prospect.phone ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Email
              <input name="email" type="email" defaultValue={prospect.email ?? ""} className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Source
              <select name="source" defaultValue={prospect.source} className={fieldClass}>
                <option value="MESSENGER">Messenger</option>
                <option value="PAGE_FACEBOOK">Page Facebook</option>
                <option value="GROUPE_FACEBOOK">Groupe Facebook</option>
                <option value="COMMENTAIRE">Commentaire</option>
                <option value="PUBLICITE">Publicité</option>
                <option value="SITE_WEB">Formulaire du site</option>
                <option value="AUTRE">Autre</option>
              </select>
            </label>
            <label className={labelClass}>
              Lien Facebook
              {prospect.facebookLink ? (
                <a href={prospect.facebookLink} target="_blank" rel="noreferrer" className="text-sm text-brand-300 underline">
                  Ouvrir le profil / la conversation
                </a>
              ) : null}
              <input name="facebookLink" type="url" defaultValue={prospect.facebookLink ?? ""} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            Besoin en électricité
            <textarea name="besoinElectricite" rows={3} defaultValue={prospect.besoinElectricite ?? ""} className={`${fieldClass} h-auto py-2.5`} />
          </label>
          <label className={labelClass}>
            Notes
            <textarea name="notesInternes" rows={3} defaultValue={prospect.notesInternes ?? ""} className={`${fieldClass} h-auto py-2.5`} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Prochaine action
              <input name="nextAction" defaultValue={prospect.nextAction ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Date de relance
              <input
                name="nextActionAt"
                type="date"
                defaultValue={prospect.nextActionAt ? prospect.nextActionAt.toISOString().slice(0, 10) : ""}
                className={fieldClass}
              />
            </label>
          </div>
          <AdminButton type="submit" variant="primary" className="h-12 text-base">Enregistrer</AdminButton>
        </form>
      </AdminCard>

      {!prospect.convertedCustomerId ? (
        <AdminCard title="Convertir en client" description="Crée (ou réutilise) la fiche client et un premier projet, sans perdre l'historique.">
          <form action={convertProspectAction} className="grid gap-4">
            <input type="hidden" name="prospectId" value={prospect.id} />
            <label className={labelClass}>
              Email du client <span className="normal-case tracking-normal text-neutral-600">(requis pour créer le compte)</span>
              <input name="email" type="email" required defaultValue={prospect.email ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Titre du premier projet
              <input name="projectTitle" required placeholder="Installation électrique van" defaultValue={prospect.besoinElectricite ? undefined : ""} className={fieldClass} />
            </label>
            <AdminButton type="submit" variant="primary" className="h-12 text-base">Convertir en client</AdminButton>
          </form>
        </AdminCard>
      ) : null}

      <AdminCard title="Historique">
        <form action={logProspectNoteAction} className="mb-4 grid gap-3 border-b border-neutral-800/80 pb-4">
          <input type="hidden" name="prospectId" value={prospect.id} />
          <label className={labelClass}>
            Ajouter une note
            <textarea name="note" rows={2} required placeholder="A répondu sur Messenger, veut réfléchir…" className={`${fieldClass} h-auto py-2.5`} />
          </label>
          <AdminButton type="submit" variant="secondary" size="sm" className="justify-self-start">Ajouter</AdminButton>
        </form>

        {prospect.events.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun échange enregistré pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-3">
            {prospect.events.map((event) => (
              <li key={event.id} className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <AdminBadge tone="neutral">{eventLabel(event.type)}</AdminBadge>
                  <span className="text-xs text-neutral-500">{formatDateTime(event.createdAt)}</span>
                </div>
                {event.type === "STATUS_CHANGE" && event.toStatus ? (
                  <p className="mt-2 text-sm text-neutral-300">
                    {event.fromStatus ? `${getProspectStatusLabel(event.fromStatus as Parameters<typeof getProspectStatusLabel>[0])} → ` : ""}
                    {getProspectStatusLabel(event.toStatus as Parameters<typeof getProspectStatusLabel>[0])}
                  </p>
                ) : null}
                {event.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{event.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </DashboardPageShell>
  );
}
