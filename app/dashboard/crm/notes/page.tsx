import Link from "next/link";
import { NotesVracForm } from "@/components/dashboard/crm/NotesVracForm";
import { SheetImportFlow } from "@/components/dashboard/crm/fiche-import/SheetImportFlow";
import { MeetingNotesFlow } from "@/components/dashboard/crm/meeting-notes/MeetingNotesFlow";
import { AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";
import { listMeetingTargets } from "@/lib/services/meeting-notes-targets";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mode?: string; projectId?: string; prospectId?: string }>;

const tabClass = (active: boolean) =>
  `flex h-11 flex-1 items-center justify-center rounded-lg px-3 text-center text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand-400 ${active ? "bg-brand-400 text-neutral-900" : "border border-neutral-700 text-neutral-300 hover:border-brand-400"}`;

export default async function DashboardCrmNotesPage({ searchParams }: { searchParams: SearchParams }) {
  const { mode, projectId, prospectId } = await searchParams;
  const newContacts = mode === "nouveaux-contacts";
  const sheet = mode === "fiche";

  // Un lien profond (projectId / prospectId) verrouille le dossier ; sinon
  // Fabien choisit toujours lui-meme.
  const initialTarget = projectId
    ? ({ kind: "coaching_project", id: projectId } as const)
    : prospectId
      ? ({ kind: "prospect", id: prospectId } as const)
      : null;
  const targets = newContacts ? [] : await listMeetingTargets();
  const projects = targets.filter((target) => target.kind === "coaching_project").map(({ id, label, sublabel }) => ({ id, label, sublabel }));

  return (
    <DashboardPageShell maxWidth="3xl">
      <AdminPageHeader
        title={newContacts ? "Nouveaux contacts" : sheet ? "Fiche manuscrite" : "Compte rendu d'un échange"}
        backHref="/dashboard/crm"
        backLabel="Retour au CRM"
        description={
          newContacts
            ? "Collez vos notes ou photographiez vos notes manuscrites : elles sont transformées en fiches prospects propres. Rien n'est enregistré avant votre validation."
            : sheet
            ? "Photographiez la fiche de découverte remplie à la main : une proposition à relire vous est soumise. Rien n'est enregistré avant votre validation et l'IA ne choisit jamais le dossier."
            : "Choisissez le dossier, ajoutez vos notes (texte ou photos) : une proposition structurée vous est soumise. Rien n'est enregistré avant votre validation et aucun message n'est envoyé au client."
        }
      />
      <nav aria-label="Type de notes" className="mb-5 flex gap-2">
        <Link href="/dashboard/crm/notes" aria-current={newContacts || sheet ? undefined : "page"} className={tabClass(!newContacts && !sheet)}>
          Compte rendu d&apos;un dossier
        </Link>
        <Link href="/dashboard/crm/notes?mode=nouveaux-contacts" aria-current={newContacts ? "page" : undefined} className={tabClass(newContacts)}>
          Nouveaux contacts
        </Link>
        <Link href="/dashboard/crm/notes?mode=fiche" aria-current={sheet ? "page" : undefined} className={tabClass(sheet)}>
          Fiche manuscrite
        </Link>
      </nav>
      {newContacts ? (
        <NotesVracForm />
      ) : sheet ? (
        <SheetImportFlow projects={projects} initialProjectId={projectId ?? null} locked={Boolean(projectId)} />
      ) : (
        <MeetingNotesFlow targets={targets} initialTarget={initialTarget} lockedTarget={initialTarget !== null} />
      )}
    </DashboardPageShell>
  );
}
