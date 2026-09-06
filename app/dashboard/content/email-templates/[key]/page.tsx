import { notFound } from "next/navigation";
import { getEmailTemplateForEdit } from "@/lib/services/email-templates";
import { saveEmailTemplateAction, resetEmailTemplateAction } from "../actions";
import { AdminAlert, AdminBadge, AdminButton, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function DashboardEmailTemplateEditPage({ params, searchParams }: Params) {
  const { key } = await params;
  const { error, success } = await searchParams;

  let template;
  try {
    template = await getEmailTemplateForEdit(key);
  } catch {
    notFound();
  }

  return (
    <DashboardPageShell maxWidth="2xl">
      <AdminPageHeader
        title={template.label}
        backHref="/dashboard/content/email-templates"
        backLabel="Retour aux modèles"
        description={template.description}
      />

      {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}
      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}

      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-neutral-100">Variables disponibles</h2>
          {template.isCustomized ? (
            <AdminBadge tone="info">Personnalisé</AdminBadge>
          ) : (
            <AdminBadge tone="neutral">Contenu par défaut</AdminBadge>
          )}
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-neutral-400">
          {template.variables.map((variable) => (
            <li key={variable.name}>
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-brand-300">
                {`{{${variable.name}}}`}
              </code>{" "}
              — {variable.description}
            </li>
          ))}
        </ul>
      </div>

      <form action={saveEmailTemplateAction} className="space-y-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-6">
        <input type="hidden" name="key" value={template.key} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Sujet</span>
          <input
            name="subject"
            required
            defaultValue={template.subject}
            className="block h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-200">Corps du message</span>
          <textarea
            name="bodyText"
            required
            rows={14}
            defaultValue={template.bodyText}
            className="block w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <AdminButton type="submit" variant="primary">
            Enregistrer
          </AdminButton>
        </div>
      </form>

      {template.isCustomized ? (
        <form action={resetEmailTemplateAction}>
          <input type="hidden" name="key" value={template.key} />
          <AdminButton type="submit" variant="secondary" size="sm">
            Réinitialiser au contenu par défaut
          </AdminButton>
        </form>
      ) : null}
    </DashboardPageShell>
  );
}
