import { AdminAlert, AdminButton, AdminCard, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";
import { listProspectMessageTemplates } from "@/lib/services/prospect";
import { updateProspectMessageTemplateAction } from "../actions";
import { CopyTemplateButton } from "./CopyTemplateButton";

export const dynamic = "force-dynamic";

const fieldClass =
  "rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-base normal-case tracking-normal text-white outline-none focus:border-brand-400";

export default async function DashboardCrmProspectTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const templates = await listProspectMessageTemplates();

  return (
    <DashboardPageShell maxWidth="3xl">
      <AdminPageHeader
        title="Modèles de messages"
        backHref="/dashboard/crm/prospects"
        backLabel="Retour aux prospects"
        description="Réponses Messenger prêtes à copier-coller, modifiables ici."
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
      {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

      <div className="space-y-4">
        {templates.map((template) => (
          <AdminCard key={template.id} title={template.label} actions={<CopyTemplateButton text={template.body} />}>
            <form action={updateProspectMessageTemplateAction} className="grid gap-3">
              <input type="hidden" name="templateId" value={template.id} />
              <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Libellé
                <input name="label" defaultValue={template.label} required className={fieldClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Message
                <textarea name="body" defaultValue={template.body} rows={4} required className={fieldClass} />
              </label>
              <AdminButton type="submit" variant="secondary" size="sm" className="justify-self-start">Enregistrer</AdminButton>
            </form>
          </AdminCard>
        ))}
      </div>
    </DashboardPageShell>
  );
}
