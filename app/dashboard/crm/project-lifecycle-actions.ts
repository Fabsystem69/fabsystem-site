"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { badRequest, isHttpError } from "@/lib/http-errors";
import { requireSession } from "@/lib/require-session";
import { parseOptionalEuroBudget } from "@/lib/coaching-vehicle-form";
import { prisma } from "@/lib/prisma";
import {
  addQuickCoachingNote,
  closeCoachingProject,
  createCoachingProject,
  linkCoachingProjectToSchemaProject,
  reopenCoachingProject,
  unlinkCoachingProjectSchemaProject,
  updateCoachingProject,
  updateEntretienInfo,
} from "@/lib/services/coaching-project";
import type { ClientLevel, CoachingProjectStatus, CoachingResponsible } from "@/lib/generated/prisma/client";

// Cycle de vie d'un accompagnement (création, mise à jour générale,
// clôture/réouverture, rattachement à l'éditeur de schéma, fiche
// d'entretien, note rapide) — extrait de actions.ts (règle de style du
// dépôt : 800 lignes max par fichier) pour garder les deux fichiers dans
// une taille lisible plutôt que d'entasser toutes les actions CRM ensemble.

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown) {
  if (isHttpError(error)) return error.message;
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

export async function createCoachingProjectAction(formData: FormData) {
  await requireSession();

  const customerId = getString(formData, "customerId");
  let target: string;
  try {
    const project = await createCoachingProject({
      customerId,
      title: getString(formData, "title"),
      description: getString(formData, "description") || null,
      objectifs: getString(formData, "objectifs") || null,
      niveauClient: (getString(formData, "niveauClient") || null) as ClientLevel | null,
    });
    revalidatePath(`/dashboard/crm/clients/${customerId}`);
    revalidatePath("/dashboard/crm/clients");
    target = `/dashboard/crm/projects/${project.id}`;
  } catch (error) {
    target = `/dashboard/crm/clients/${customerId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

// Retour utilisateur : "comment je rajoute mes projets en cours" — un
// client déjà accompagné aujourd'hui (hors pipeline Prospect) a déjà un
// Customer (achat, dossier existant...) mais aucun CoachingProject. Même
// principe de recherche par email que createManualDossierAction
// (app/dashboard/accompagnements/actions.ts) : jamais de création de
// Customer ici, seulement une recherche — la création de compte se fait
// ailleurs (achat, inscription, ou fiche client e-commerce).
export async function createCoachingProjectForExistingCustomerAction(formData: FormData) {
  await requireSession();

  let target: string;
  try {
    const email = getString(formData, "email").trim().toLowerCase();
    if (!email) throw badRequest("Email du client requis.");

    const customer = await prisma.customer.findUnique({ where: { email }, select: { id: true } });
    if (!customer) throw badRequest(`Aucun client trouvé avec l'email ${email}. Créez d'abord sa fiche depuis /dashboard/customers.`);

    const project = await createCoachingProject({
      customerId: customer.id,
      title: getString(formData, "title"),
    });
    revalidatePath("/dashboard/crm/clients");
    target = `/dashboard/crm/projects/${project.id}`;
  } catch (error) {
    target = `/dashboard/crm/clients/new?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function updateCoachingProjectAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await updateCoachingProject({
      projectId,
      title: getString(formData, "title"),
      description: getString(formData, "description") || null,
      status: (getString(formData, "status") || undefined) as CoachingProjectStatus | undefined,
      questionsEnAttente: getString(formData, "questionsEnAttente") || null,
      actionsAPreparer: getString(formData, "actionsAPreparer") || null,
      notesInternes: getString(formData, "notesInternes") || null,
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm/clients");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Projet mis à jour.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

// Clôture courte (PLAN_AMELIORATION_CRM_FABSYSTEM.md §4.6) : un résumé
// facultatif, jamais un formulaire disproportionné. Distincte du sélecteur
// de statut générique de la carte "Fiche projet" — celle-ci enregistre en
// plus une synthèse et un horodatage dédiés.
export async function closeCoachingProjectAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await closeCoachingProject({
      projectId,
      resume: getString(formData, "resume") || null,
      bilanCeQuiAAide: getString(formData, "bilanCeQuiAAide") || null,
      bilanCeQuiAPrisDuTemps: getString(formData, "bilanCeQuiAPrisDuTemps") || null,
      bilanAAmeliorer: getString(formData, "bilanAAmeliorer") || null,
      actor: { kind: "coach" },
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Accompagnement clôturé.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function reopenCoachingProjectAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await reopenCoachingProject({ projectId, actor: { kind: "coach" } });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Accompagnement rouvert.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

// Rattachement à l'éditeur de schéma existant (docs/03-DATABASE.md §4) —
// jamais de second éditeur : on relie un Project déjà présent chez ce
// client, ou on l'invite à en créer un depuis la fiche client existante.
export async function linkCoachingProjectSchemaAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await linkCoachingProjectToSchemaProject({
      coachingProjectId: projectId,
      projectId: getString(formData, "schemaProjectId"),
      actor: { kind: "coach" },
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Schéma rattaché.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

export async function unlinkCoachingProjectSchemaAction(formData: FormData) {
  await requireSession();
  const projectId = getString(formData, "projectId");
  let target: string;
  try {
    await unlinkCoachingProjectSchemaProject({ coachingProjectId: projectId, actor: { kind: "coach" } });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Schéma détaché.")}`;
  } catch (error) {
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}`;
  }
  redirect(target);
}

// Fiche d'entretien / accord commercial (FICHE_ENTRETIEN_ET_SUIVI_COACHING.md
// §2) — champs distincts de updateCoachingProjectAction ci-dessus, avec leur
// propre marqueur de concurrence (entretienUpdatedAt) pour ne pas bloquer
// une modification d'une autre section au meme moment.
export async function updateEntretienInfoAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  const preoccupations = getString(formData, "preoccupations");
  const accordPrixEuros = getString(formData, "accordPrixEuros");
  const accordPerimetre = getString(formData, "accordPerimetre");
  const accordMiseAuPropre = getString(formData, "accordMiseAuPropre");
  const resumePartage = getString(formData, "resumePartage");
  let target: string;
  try {
    await updateEntretienInfo({
      projectId,
      expectedEntretienUpdatedAt: new Date(getString(formData, "expectedEntretienUpdatedAt")),
      actor: { kind: "coach" },
      fields: {
        preoccupations: preoccupations || null,
        accordPrixCents: accordPrixEuros ? parseOptionalEuroBudget(accordPrixEuros) : null,
        accordPerimetre: accordPerimetre || null,
        accordMiseAuPropre: accordMiseAuPropre || null,
        resumePartage: resumePartage || null,
      },
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Entretien enregistré.")}`;
  } catch (error) {
    // D13 (audit) : une erreur (ex. prix mal saisi) ne doit jamais faire
    // perdre le reste du texte tapé à côté — la saisie brute est renvoyée
    // dans l'URL, jamais les valeurs déjà en base (celles-ci restent
    // inchangées puisque updateEntretienInfo a échoué avant d'écrire).
    const draft = encodeURIComponent(
      JSON.stringify({ preoccupations, accordPrixEuros, accordPerimetre, accordMiseAuPropre, resumePartage })
    );
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}&entretienDraft=${draft}`;
  }
  redirect(target);
}

// Note rapide WhatsApp/visio (FICHE_ENTRETIEN_ET_SUIVI_COACHING.md §5) : une
// seule action pour une seance deja realisee, jamais un rendez-vous a caler
// puis un compte-rendu separe.
export async function addQuickCoachingNoteAction(formData: FormData) {
  await requireSession();

  const projectId = getString(formData, "projectId");
  const channel = getString(formData, "channel");
  const subject = getString(formData, "subject");
  const conclusion = getString(formData, "conclusion");
  const nextActionLabel = getString(formData, "nextActionLabel");
  const nextActionResponsible = getString(formData, "nextActionResponsible");
  const nextActionDueDate = getString(formData, "nextActionDueDate");
  const sharedWithClient = getString(formData, "sharedWithClient");
  let target: string;
  try {
    await addQuickCoachingNote({
      projectId,
      channel,
      subject,
      conclusion,
      nextAction: nextActionLabel
        ? {
            label: nextActionLabel,
            responsible: (nextActionResponsible || null) as CoachingResponsible | null,
            dueDate: nextActionDueDate ? new Date(nextActionDueDate) : null,
          }
        : null,
      sharedWithClient: sharedWithClient === "true",
      actor: { kind: "coach" },
    });
    revalidatePath(`/dashboard/crm/projects/${projectId}`);
    revalidatePath("/dashboard/crm");
    target = `/dashboard/crm/projects/${projectId}?success=${encodeURIComponent("Note enregistrée.")}`;
  } catch (error) {
    // D13 (audit) : même principe que updateEntretienInfoAction — une note
    // tapée pendant un vrai appel ne doit jamais disparaître derrière un
    // message d'erreur (ex. sujet oublié).
    const draft = encodeURIComponent(
      JSON.stringify({ channel, subject, conclusion, nextActionLabel, nextActionResponsible, nextActionDueDate, sharedWithClient })
    );
    target = `/dashboard/crm/projects/${projectId}?error=${encodeURIComponent(errorMessage(error))}&noteDraft=${draft}`;
  }
  redirect(target);
}
