import Link from "next/link";
import { formatDate } from "@/lib/format";
import { listEmailTemplates } from "@/lib/services/email-templates";
import { AdminBadge, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

// Retour utilisateur : "je veux visualiser et modifier les templates de
// mail client" — jusqu'ici chaque email etait un texte code en dur reparti
// dans 5 fichiers de service differents, aucun ne pouvait etre ajuste sans
// toucher au code. Liste tous les emails clients "fixes" (hors email de
// connexion, trop sensible pour etre modifiable, et hors alertes internes
// a Fabien, qui n'ont pas leur place ici).
export default async function DashboardEmailTemplatesPage() {
  const templates = await listEmailTemplates();

  return (
    <DashboardPageShell maxWidth="3xl">
      <AdminPageHeader
        title="Modèles d'emails clients"
        backHref="/dashboard"
        backLabel="Retour au dashboard"
        description="Emails envoyés automatiquement aux clients. Les variables entre doubles accolades ({{comme_ceci}}) sont remplacées automatiquement à l'envoi."
      />

      <div className="space-y-3">
        {templates.map((template) => (
          <Link
            key={template.key}
            href={`/dashboard/content/email-templates/${template.key}`}
            className="block rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5 transition-colors hover:border-neutral-700"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-white">{template.label}</h2>
              {template.isCustomized ? (
                <AdminBadge tone="info">Personnalisé</AdminBadge>
              ) : (
                <AdminBadge tone="neutral">Contenu par défaut</AdminBadge>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-400">{template.description}</p>
            <p className="mt-2 text-sm text-neutral-300">
              Sujet : <span className="text-neutral-100">{template.subject}</span>
            </p>
            {template.updatedAt ? (
              <p className="mt-1 text-xs text-neutral-500">Modifié le {formatDate(template.updatedAt)}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </DashboardPageShell>
  );
}
