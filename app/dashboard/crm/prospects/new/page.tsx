import { AdminAlert, AdminButton, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";
import { createProspectAction } from "../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-12 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

export default async function DashboardCrmNewProspectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <DashboardPageShell maxWidth="2xl">
      <AdminPageHeader title="Nouveau prospect" backHref="/dashboard/crm/prospects" backLabel="Retour aux prospects" />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

      <form action={createProspectAction} className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
        <label className={labelClass}>
          Nom
          <input name="name" required autoFocus placeholder="Prénom Nom" className={fieldClass} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Téléphone <span className="normal-case tracking-normal text-neutral-600">(optionnel)</span>
            <input name="phone" type="tel" placeholder="+33612345678" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Email <span className="normal-case tracking-normal text-neutral-600">(optionnel)</span>
            <input name="email" type="email" placeholder="contact@exemple.fr" className={fieldClass} />
          </label>
        </div>
        <label className={labelClass}>
          Source
          <select name="source" className={fieldClass} defaultValue="MESSENGER">
            <option value="MESSENGER">Messenger</option>
            <option value="PAGE_FACEBOOK">Page Facebook</option>
            <option value="GROUPE_FACEBOOK">Groupe Facebook</option>
            <option value="COMMENTAIRE">Commentaire</option>
            <option value="PUBLICITE">Publicité</option>
            <option value="AUTRE">Autre</option>
          </select>
        </label>
        <label className={labelClass}>
          Lien Facebook <span className="normal-case tracking-normal text-neutral-600">(profil ou conversation)</span>
          <input name="facebookLink" type="url" placeholder="https://facebook.com/…" className={fieldClass} />
        </label>
        <label className={labelClass}>
          Besoin en électricité
          <textarea name="besoinElectricite" rows={3} placeholder="Van, panneaux solaires, batterie lithium…" className={`${fieldClass} h-auto py-2.5`} />
        </label>
        <label className={labelClass}>
          Notes
          <textarea name="notesInternes" rows={3} className={`${fieldClass} h-auto py-2.5`} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Prochaine action <span className="normal-case tracking-normal text-neutral-600">(optionnel)</span>
            <input name="nextAction" placeholder="Relancer par message" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Date de relance <span className="normal-case tracking-normal text-neutral-600">(optionnel)</span>
            <input name="nextActionAt" type="date" className={fieldClass} />
          </label>
        </div>
        <AdminButton type="submit" variant="primary" className="h-12 text-base">Créer le prospect</AdminButton>
      </form>
    </DashboardPageShell>
  );
}
