import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubmissionPreview } from "@/components/customer/mon-van/SubmissionPreview";
import { SubmissionReceipt } from "@/components/customer/mon-van/SubmissionReceipt";
import { SubmitProjectButton } from "@/components/customer/mon-van/SubmitProjectButton";
import { countUnanswered, readSheetAnswers } from "@/lib/crm/discovery-sheet-values";
import { prisma } from "@/lib/prisma";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { notifyReviewSubmission } from "@/lib/services/coaching-review-submission";
import { submitProjectAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TransmettreProjetPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await requireCustomerActor();
  if (actor.role !== "customer") redirect("/mon-compte");

  const { projectId } = await params;
  const { error } = await searchParams;

  const project = await prisma.coachingProject.findUnique({
    where: { id: projectId },
    include: {
      devices: { select: { name: true, quantity: true, powerSupply: true } },
      documents: { select: { filename: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!project || project.customerId !== actor.customerId) notFound();

  // Nouvelle visite d'un projet deja transmis : relance silencieuse d'une
  // notification restee en echec (idempotente, ne leve jamais).
  if (project.readyForReviewAt) {
    await notifyReviewSubmission(projectId);
  }

  const answers = readSheetAnswers(project);
  const unanswered = countUnanswered(answers);
  const unknown = answers.filter((answer) => answer.isUnknown).length;
  const backHref = `/mon-compte/mon-van/${projectId}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <Link href={backHref} className="text-sm font-medium text-neutral-600 underline underline-offset-2">
          ← Retour à mon projet
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Aperçu avant transmission</h1>
        <p className="mt-1 text-sm text-neutral-600">{project.title}</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <SubmissionReceipt readyForReviewAt={project.readyForReviewAt} inReview={project.readyForReviewAt !== null} />

      <section aria-labelledby="preview-summary" className="rounded-card border border-neutral-200 bg-white p-4 shadow-card sm:p-5">
        <h2 id="preview-summary" className="text-base font-semibold text-neutral-900">
          Ce que Fabien recevra
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-neutral-700">
          <li>{unknown} réponse{unknown > 1 ? "s" : ""} « Je ne sais pas » (aucun problème, c&apos;est une réponse valable)</li>
          <li>{unanswered} question{unanswered > 1 ? "s" : ""} pas encore répondue{unanswered > 1 ? "s" : ""}</li>
          <li>{project.devices.length} appareil{project.devices.length > 1 ? "s" : ""} déclaré{project.devices.length > 1 ? "s" : ""}</li>
        </ul>
        <h3 className="mt-4 text-sm font-semibold text-neutral-900">Pièces jointes</h3>
        {project.documents.length === 0 ? (
          <p className="mt-1 text-sm text-neutral-600">Aucune pièce jointe.</p>
        ) : (
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-neutral-700">
            {project.documents.map((document, index) => (
              <li key={`${document.filename}-${index}`}>{document.filename}</li>
            ))}
          </ul>
        )}
      </section>

      <SubmissionPreview projectId={projectId} answers={answers} />

      <section aria-labelledby="preview-next" className="rounded-card border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
        <h2 id="preview-next" className="text-base font-semibold text-neutral-900">
          Ce que devient votre projet
        </h2>
        <p className="mt-1 text-sm text-neutral-700">
          Fabien reçoit un e-mail avec un résumé, étudie votre fiche puis revient vers vous. Vous pouvez compléter les
          réponses manquantes à tout moment, y compris après la transmission : rien n&apos;est bloquant.
        </p>
        <p className="mt-2 text-sm font-medium text-neutral-800">
          Cette transmission n&apos;est ni une commande ni un paiement : rien n&apos;est facturé.
        </p>
        {project.readyForReviewAt ? (
          <p className="mt-4 text-sm text-neutral-700">Votre projet est déjà transmis. Il n&apos;y a rien d&apos;autre à faire.</p>
        ) : (
          <form action={submitProjectAction} className="mt-4">
            <input type="hidden" name="projectId" value={projectId} />
            <SubmitProjectButton />
          </form>
        )}
      </section>
    </div>
  );
}
