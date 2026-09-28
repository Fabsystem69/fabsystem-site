import { badRequest, conflict, forbidden, notFound } from "@/lib/http-errors";
import { computeCoachingProjectTimeBalance } from "@/lib/coaching-time-balance";
import type { CoachingProjectTimeBalance } from "@/lib/coaching-time-balance";
import { buildCustomerVcard, customerVcardFilename } from "@/lib/customer-vcard";
import { prisma } from "@/lib/prisma";
import { logServerEvent } from "@/lib/server-log";
import type { CoachingActor } from "@/lib/services/coaching-actor";
import { logCoachingProjectEvent } from "@/lib/services/coaching-project-events";
import type {
  ClientLevel,
  CoachingActionStatus,
  CoachingPaymentStatus,
  CoachingProjectStatus,
  CoachingProposalStatus,
  CoachingResponsible,
  CoachingSessionStatus,
} from "@/lib/generated/prisma/client";

// "Un client" dans ce CRM coaching = un Customer possedant au moins un
// CoachingProject (voir prisma/schema.prisma, commentaire au-dessus de
// Prospect) — jamais un second modele d'identite.
export async function listCoachingClients(search?: string) {
  const term = search?.trim();

  const customers = await prisma.customer.findMany({
    where: {
      coachingProjects: { some: {} },
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { email: { contains: term, mode: "insensitive" } },
              { phone: { contains: term, mode: "insensitive" } },
              { coachingProjects: { some: { title: { contains: term, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: { coachingProjects: { orderBy: { derniereActivite: "desc" } } },
  });

  return customers
    .map((customer) => ({
      ...customer,
      derniereActivite: customer.coachingProjects.reduce(
        (latest, project) => (project.derniereActivite > latest ? project.derniereActivite : latest),
        customer.coachingProjects[0]?.derniereActivite ?? customer.createdAt
      ),
    }))
    .sort((a, b) => b.derniereActivite.getTime() - a.derniereActivite.getTime());
}

// Inclut le prospect d'origine s'il existe (retour utilisateur : "historique
// accessible après conversion, sans devoir le recopier" — le lien/groupe
// Facebook et les notes de prospection ne sont jamais dupliqués dans
// CoachingProject, seulement retrouvables depuis ici).
export async function getCoachingClient(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      coachingProjects: { orderBy: { derniereActivite: "desc" } },
      convertedFromProspect: { include: { events: { orderBy: { createdAt: "desc" } } } },
    },
  });
  if (!customer) throw notFound("Client introuvable.");
  return customer;
}

async function getDefaultSendMail() {
  const { sendMail } = await import("@/lib/server/nodemailer");
  return sendMail;
}

// Retour utilisateur : "rajoute automatique des contacts à mon téléphone
// si passe en client coaching" — aucune API web ne permet d'écrire
// silencieusement dans le carnet d'adresses d'un téléphone. Le plus proche
// du besoin sans intégration OAuth lourde (Google/Apple Contacts) : un
// e-mail au coach avec la fiche du client en pièce jointe (.vcf), envoyé
// dès la création du premier CoachingProject — un seul geste (ouvrir la
// pièce jointe) suffit alors, au lieu de ressaisir à la main. Best-effort,
// jamais bloquant : un incident SMTP ne doit jamais empêcher la création
// réelle du dossier. Appelée APRÈS la transaction qui crée le projet
// (jamais dedans : un envoi SMTP lent ne doit jamais retenir une
// transaction DB ouverte), depuis les trois points de création d'un
// CoachingProject : createCoachingProject ci-dessous, la conversion d'un
// prospect (lib/services/prospect.ts) et la bascule commande -> dossier
// (lib/services/coaching-dossier-migration.ts).
export async function notifyCoachOfNewCoachingClient(
  customerId: string,
  sendMailImpl?: Awaited<ReturnType<typeof getDefaultSendMail>>
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true, email: true, phone: true },
    });
    if (!customer) return;

    const impl = sendMailImpl ?? (await getDefaultSendMail());
    const to = process.env.CONTACT_TO?.trim() || "contact@fabsystem.fr";
    const from = process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || to;
    const displayName = customer.name?.trim() || customer.email;

    await impl({
      to,
      from,
      subject: `Nouveau client coaching : ${displayName}`,
      text: `${displayName} vient de passer en accompagnement coaching.\n\nSa fiche contact est en pièce jointe (.vcf) — ouvrez-la pour l'ajouter à votre carnet d'adresses.`,
      attachments: [
        {
          filename: customerVcardFilename(customer),
          content: buildCustomerVcard(customer),
          contentType: "text/vcard",
        },
      ],
    });
  } catch (error) {
    logServerEvent("error", "failed to notify coach of new coaching client", { error, customerId });
  }
}

export async function createCoachingProject(input: {
  customerId: string;
  title: string;
  description?: string | null;
  objectifs?: string | null;
  niveauClient?: ClientLevel | null;
  sendMailImpl?: Awaited<ReturnType<typeof getDefaultSendMail>>;
}) {
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId }, select: { id: true } });
  if (!customer) throw notFound("Client introuvable.");

  const title = input.title.trim();
  if (!title) throw badRequest("Titre du projet requis.");

  const project = await prisma.coachingProject.create({
    data: {
      customerId: input.customerId,
      title,
      description: input.description?.trim() || null,
      objectifs: input.objectifs?.trim() || null,
      niveauClient: input.niveauClient ?? null,
    },
  });

  await notifyCoachOfNewCoachingClient(input.customerId, input.sendMailImpl);

  return project;
}

export async function getCoachingProjectForDetail(projectId: string) {
  const project = await prisma.coachingProject.findUnique({
    where: { id: projectId },
    include: {
      customer: true,
      sessions: { orderBy: { scheduledAt: "desc" }, include: { actions: true } },
      actions: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      proposals: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      // "Reprendre le dossier en quelques secondes... éléments ajoutés
      // depuis mon dernier passage" (PLAN_AMELIORATION_CRM_FABSYSTEM.md §6) —
      // ces événements sont déjà journalisés (updateVehicleInfo, note
      // rapide, clôture...) mais jamais relus jusqu'ici.
      events: { orderBy: { createdAt: "desc" }, take: 30 },
      // Éditeur de schéma existant (docs/03-DATABASE.md §4,
      // NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md) — champ additif
      // jusqu'ici jamais lu nulle part côté interface.
      linkedProject: { select: { id: true, name: true, updatedAt: true } },
    },
  });
  if (!project) throw notFound("Projet introuvable.");
  return project;
}

// Rattachement au Project/ProjectSchema existant, sans jamais dupliquer
// l'éditeur (docs/03-DATABASE.md §4) : "si un Project existe déjà pour ce
// client et ce besoin, le proposer au rattachement plutôt que d'en créer un
// second". La cardinalité 1:1 optionnelle est déjà garantie par la
// contrainte @unique sur CoachingProject.linkedProjectId — l'appartenance
// au même client, elle, doit être vérifiée ici (jamais côté client).
export async function linkCoachingProjectToSchemaProject(input: {
  coachingProjectId: string;
  projectId: string;
  actor: CoachingActor;
}) {
  const project = await prisma.coachingProject.findUnique({
    where: { id: input.coachingProjectId },
    select: { id: true, customerId: true },
  });
  if (!project) throw notFound("Accompagnement introuvable.");

  const targetProject = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { id: true, customerId: true, linkedCoachingProject: { select: { id: true } } },
  });
  if (!targetProject) throw notFound("Projet technique introuvable.");
  if (targetProject.customerId !== project.customerId) {
    throw badRequest("Ce projet technique n'appartient pas au même client.");
  }
  if (targetProject.linkedCoachingProject && targetProject.linkedCoachingProject.id !== input.coachingProjectId) {
    throw conflict("Ce projet technique est déjà rattaché à un autre accompagnement.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingProject.update({
      where: { id: input.coachingProjectId },
      data: { linkedProjectId: input.projectId, derniereActivite: new Date() },
    });
    await logCoachingProjectEvent(tx, input.coachingProjectId, "SCHEMA_LIE", input.actor);
    return updated;
  });
}

export async function unlinkCoachingProjectSchemaProject(input: { coachingProjectId: string; actor: CoachingActor }) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.coachingProjectId }, select: { id: true } });
  if (!project) throw notFound("Accompagnement introuvable.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingProject.update({
      where: { id: input.coachingProjectId },
      data: { linkedProjectId: null, derniereActivite: new Date() },
    });
    await logCoachingProjectEvent(tx, input.coachingProjectId, "SCHEMA_DELIE", input.actor);
    return updated;
  });
}

// objectifs/niveauClient ne vivent plus ici (constat d'audit — ils
// appartiennent a la section "vehicleInfo", deja protegee par une
// verification de version atomique dans updateVehicleInfo ; les modifier
// aussi depuis cette fonction, sans aucune verification de version,
// permettait un ecrasement silencieux entre coach et client sur le meme
// champ via deux chemins non synchronises). Editer ces deux champs
// exclusivement via updateVehicleInfo/updateVehicleInfoAdminAction.
export async function updateCoachingProject(input: {
  projectId: string;
  title?: string;
  description?: string | null;
  status?: CoachingProjectStatus;
  questionsEnAttente?: string | null;
  actionsAPreparer?: string | null;
  notesInternes?: string | null;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  return prisma.coachingProject.update({
    where: { id: input.projectId },
    data: {
      title: input.title?.trim() || undefined,
      description: input.description !== undefined ? input.description?.trim() || null : undefined,
      status: input.status,
      questionsEnAttente: input.questionsEnAttente !== undefined ? input.questionsEnAttente?.trim() || null : undefined,
      actionsAPreparer: input.actionsAPreparer !== undefined ? input.actionsAPreparer?.trim() || null : undefined,
      notesInternes: input.notesInternes !== undefined ? input.notesInternes?.trim() || null : undefined,
      derniereActivite: new Date(),
    },
  });
}

// Cloture courte (PLAN_AMELIORATION_CRM_FABSYSTEM.md §4.6) : resume
// facultatif, jamais un formulaire disproportionne. "clotureResume"/
// "clotureAt" gardent la DERNIERE synthese meme apres une reprise -
// reouvrir ne les efface jamais retroactivement (l'historique complet vit
// dans CoachingProjectEvent, jamais ecrase).
export async function closeCoachingProject(input: {
  projectId: string;
  resume?: string | null;
  bilanCeQuiAAide?: string | null;
  bilanCeQuiAPrisDuTemps?: string | null;
  bilanAAmeliorer?: string | null;
  actor: CoachingActor;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingProject.update({
      where: { id: input.projectId },
      data: {
        status: "TERMINE",
        clotureAt: new Date(),
        clotureResume: input.resume?.trim() || null,
        bilanCeQuiAAide: input.bilanCeQuiAAide?.trim() || null,
        bilanCeQuiAPrisDuTemps: input.bilanCeQuiAPrisDuTemps?.trim() || null,
        bilanAAmeliorer: input.bilanAAmeliorer?.trim() || null,
        derniereActivite: new Date(),
      },
    });
    await logCoachingProjectEvent(tx, input.projectId, "CLOTURE", input.actor, input.resume?.trim() || undefined);
    return updated;
  });
}

// "Une reprise du meme projet est datee et journalisee ; elle ne doit pas
// modifier retroactivement le livrable final precedent" — clotureResume/
// clotureAt restent tels quels, seul le statut repart en cours.
export async function reopenCoachingProject(input: { projectId: string; actor: CoachingActor }) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true, status: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (project.status !== "TERMINE") throw badRequest("Ce projet n'est pas clôturé.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingProject.update({
      where: { id: input.projectId },
      data: { status: "EN_COURS", derniereActivite: new Date() },
    });
    await logCoachingProjectEvent(tx, input.projectId, "REOUVERTURE", input.actor);
    return updated;
  });
}

// Fiche d'entretien (FICHE_ENTRETIEN_ET_SUIVI_COACHING.md §2 "Synthese et
// proposition") : ce que ce client precis a convenu, distinct de `offre`
// (le produit achete). Section coach — aucune action client n'appelle
// cette fonction aujourd'hui ; l'acteur reste journalise comme les autres
// sections pour rester coherent si un usage partage apparait plus tard.
// Meme garantie d'atomicite que updateVehicleInfo/updateUsagesInfo/
// updateImplantationInfo (coaching-van-dossier.ts, defaut d'audit n°2) :
// verification de version ET ecriture dans la meme requete.
export type EntretienInfoFields = Partial<{
  preoccupations: string | null;
  accordPrixCents: number | null;
  accordPerimetre: string | null;
  accordMiseAuPropre: string | null;
  resumePartage: string | null;
}>;

export async function updateEntretienInfo(input: {
  projectId: string;
  expectedEntretienUpdatedAt: Date;
  fields: EntretienInfoFields;
  actor: CoachingActor;
}) {
  if (input.fields.accordPrixCents != null && (!Number.isInteger(input.fields.accordPrixCents) || input.fields.accordPrixCents < 0)) {
    throw badRequest("Prix convenu invalide.");
  }

  return prisma.$transaction(async (tx) => {
    const result = await tx.coachingProject.updateMany({
      where: { id: input.projectId, entretienUpdatedAt: input.expectedEntretienUpdatedAt },
      data: { ...input.fields, entretienUpdatedAt: new Date(), derniereActivite: new Date() },
    });
    if (result.count === 0) {
      const project = await tx.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
      if (!project) throw notFound("Projet introuvable.");
      throw conflict("Cette section a été modifiée entre-temps — rechargez la page pour voir les derniers changements.");
    }
    const updated = await tx.coachingProject.findUniqueOrThrow({ where: { id: input.projectId } });
    await logCoachingProjectEvent(tx, input.projectId, "ENTRETIEN", input.actor);
    return updated;
  });
}

// --- Séances ---------------------------------------------------------------

export async function createCoachingSession(input: {
  projectId: string;
  scheduledAt: Date;
  durationMinutes: number;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (Number.isNaN(input.scheduledAt.getTime())) throw badRequest("Date de séance invalide.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) throw badRequest("Durée invalide.");

  return prisma.$transaction(async (tx) => {
    const session = await tx.coachingSession.create({
      data: { projectId: input.projectId, scheduledAt: input.scheduledAt, durationMinutes: input.durationMinutes },
    });
    await tx.coachingProject.update({ where: { id: input.projectId }, data: { derniereActivite: new Date() } });
    return session;
  });
}

// Compte-rendu + statut — jamais un libellé qui laisserait entendre une
// validation de sécurité/conformité à distance (retour utilisateur
// explicite) : ce sont des notes de suivi pédagogique, pas un contrôle.
export async function updateCoachingSessionReport(input: {
  sessionId: string;
  status?: CoachingSessionStatus;
  sujetsAbordes?: string | null;
  explicationsDonnees?: string | null;
  difficultes?: string | null;
  prochaineEtape?: string | null;
}) {
  const session = await prisma.coachingSession.findUnique({ where: { id: input.sessionId }, select: { id: true, projectId: true } });
  if (!session) throw notFound("Séance introuvable.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingSession.update({
      where: { id: input.sessionId },
      data: {
        status: input.status,
        sujetsAbordes: input.sujetsAbordes !== undefined ? input.sujetsAbordes?.trim() || null : undefined,
        explicationsDonnees: input.explicationsDonnees !== undefined ? input.explicationsDonnees?.trim() || null : undefined,
        difficultes: input.difficultes !== undefined ? input.difficultes?.trim() || null : undefined,
        prochaineEtape: input.prochaineEtape !== undefined ? input.prochaineEtape?.trim() || null : undefined,
      },
    });
    await tx.coachingProject.update({ where: { id: session.projectId }, data: { derniereActivite: new Date() } });
    return updated;
  });
}

// Note rapide WhatsApp/visio (FICHE_ENTRETIEN_ET_SUIVI_COACHING.md §5,
// PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md §6) : "une visio de 2-3 minutes
// ne doit nécessiter ni création préalable de rendez-vous ni long
// compte-rendu". Une seule opération crée une CoachingSession déjà
// REALISEE (jamais un rendez-vous fictif à venir) et, si fournie, l'action
// suivante qui en découle — jamais deux écrans à remplir séparément.
export async function addQuickCoachingNote(input: {
  projectId: string;
  channel: string;
  subject: string;
  conclusion: string;
  nextAction?: { label: string; responsible?: CoachingResponsible | null; dueDate?: Date | null } | null;
  sharedWithClient?: boolean;
  actor: CoachingActor;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const channel = input.channel.trim();
  if (!channel) throw badRequest("Canal requis.");
  const subject = input.subject.trim();
  if (!subject) throw badRequest("Sujet requis.");
  const conclusion = input.conclusion.trim();
  if (!conclusion) throw badRequest("Conclusion requise.");
  const actionLabel = input.nextAction?.label.trim();

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const session = await tx.coachingSession.create({
      data: {
        projectId: input.projectId,
        scheduledAt: now,
        durationMinutes: 5,
        status: "REALISEE",
        channel,
        sujetsAbordes: subject,
        prochaineEtape: conclusion,
        sharedWithClient: input.sharedWithClient ?? false,
      },
    });

    const action = actionLabel
      ? await tx.coachingActionItem.create({
          data: {
            projectId: input.projectId,
            sessionId: session.id,
            label: actionLabel,
            dueDate: input.nextAction?.dueDate ?? null,
            responsible: input.nextAction?.responsible ?? null,
          },
        })
      : null;

    await tx.coachingProject.update({ where: { id: input.projectId }, data: { derniereActivite: now } });
    await logCoachingProjectEvent(tx, input.projectId, "QUICK_NOTE", input.actor, `${channel} — ${subject}`);

    return { session, action };
  });
}

export async function updateCoachingSessionSchedule(input: { sessionId: string; scheduledAt: Date; durationMinutes: number }) {
  const session = await prisma.coachingSession.findUnique({ where: { id: input.sessionId }, select: { id: true } });
  if (!session) throw notFound("Séance introuvable.");
  if (Number.isNaN(input.scheduledAt.getTime())) throw badRequest("Date de séance invalide.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) throw badRequest("Durée invalide.");

  return prisma.coachingSession.update({
    where: { id: input.sessionId },
    data: { scheduledAt: input.scheduledAt, durationMinutes: input.durationMinutes },
  });
}

export async function deleteCoachingSession(sessionId: string) {
  const session = await prisma.coachingSession.findUnique({ where: { id: sessionId }, select: { id: true } });
  if (!session) throw notFound("Séance introuvable.");
  return prisma.coachingSession.delete({ where: { id: sessionId } });
}

// --- Actions à suivre --------------------------------------------------------

export async function createCoachingActionItem(input: {
  projectId: string;
  sessionId?: string | null;
  label: string;
  dueDate?: Date | null;
  // Qui doit agir (retour utilisateur : "une action comporte un libelle,
  // une personne attendue — vous ou le client —, une date eventuelle et un
  // etat") — facultatif : une attente peut rester sans responsable explicite.
  responsible?: CoachingResponsible | null;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const label = input.label.trim();
  if (!label) throw badRequest("Libellé de l'action requis.");

  return prisma.coachingActionItem.create({
    data: {
      projectId: input.projectId,
      sessionId: input.sessionId ?? null,
      label,
      dueDate: input.dueDate ?? null,
      responsible: input.responsible ?? null,
    },
  });
}

export async function updateCoachingActionStatus(input: { actionId: string; status: CoachingActionStatus }) {
  const action = await prisma.coachingActionItem.findUnique({ where: { id: input.actionId }, select: { id: true } });
  if (!action) throw notFound("Action introuvable.");
  return prisma.coachingActionItem.update({ where: { id: input.actionId }, data: { status: input.status } });
}

// Le client peut cocher ses propres actions ("Ce qu'il vous reste à faire",
// app/mon-compte/mon-van/[projectId]/page.tsx) — jusqu'ici en lecture seule,
// il fallait prévenir le coach par un autre canal pour qu'il coche à sa
// place. Contrairement à updateCoachingActionStatus ci-dessus (coach,
// aucune vérification nécessaire — appel admin authentifié), ici l'ownership
// ET le champ `responsible` doivent être revérifiés côté serveur : un
// client ne doit jamais pouvoir cocher l'action d'un autre client, ni une
// action interne du coach, même en devinant un actionId.
export async function updateCoachingActionStatusByClient(input: {
  actionId: string;
  customerId: string;
  status: CoachingActionStatus;
}) {
  const action = await prisma.coachingActionItem.findUnique({
    where: { id: input.actionId },
    select: { id: true, label: true, responsible: true, project: { select: { id: true, customerId: true } } },
  });
  if (!action) throw notFound("Action introuvable.");
  if (action.project.customerId !== input.customerId) {
    throw forbidden("Cette action n'appartient pas à votre dossier.");
  }
  if (action.responsible !== "CLIENT") {
    throw forbidden("Cette action n'est pas modifiable depuis votre espace.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coachingActionItem.update({ where: { id: input.actionId }, data: { status: input.status } });
    await logCoachingProjectEvent(
      tx,
      action.project.id,
      "ACTION_CLIENT",
      { kind: "client" },
      `« ${action.label} » marquée ${input.status === "FAIT" ? "faite" : "à faire"}`
    );
    return updated;
  });
}

export async function deleteCoachingActionItem(actionId: string) {
  const action = await prisma.coachingActionItem.findUnique({ where: { id: actionId }, select: { id: true } });
  if (!action) throw notFound("Action introuvable.");
  return prisma.coachingActionItem.delete({ where: { id: actionId } });
}

// Actions en retard, toutes projets confondus — alimente "Aujourd'hui".
export async function listOverdueActions(now: Date = new Date()) {
  return prisma.coachingActionItem.findMany({
    where: { status: "A_FAIRE", dueDate: { lt: now } },
    include: { project: { include: { customer: { select: { id: true, name: true, email: true } } } } },
    orderBy: { dueDate: "asc" },
  });
}

// "Une liste sans prochaine action permet de repérer les oublis"
// (PLAN_AMELIORATION_CRM_FABSYSTEM.md §5) — distinct de listOverdueActions :
// ici aucune échéance dépassée n'est nécessaire, c'est l'ABSENCE de toute
// action A_FAIRE sur un projet actif qui est le signal (le suivi s'est
// arrêté sans que personne ne s'en aperçoive).
export async function listActiveProjectsWithoutNextAction() {
  return prisma.coachingProject.findMany({
    where: {
      status: { in: ["A_DEMARRER", "EN_COURS"] },
      actions: { none: { status: "A_FAIRE" } },
    },
    include: { customer: { select: { id: true, name: true, email: true } } },
    orderBy: { derniereActivite: "asc" },
  });
}

// "Quels rendez-vous, échéances et règlements approchent ?"
// (PLAN_AMELIORATION_CRM_FABSYSTEM.md §5) — un accord accepté par le client
// dont le règlement n'est pas (encore) complet. La facturation/le paiement
// gardent leur propre état ; "accepté" ne veut jamais dire "payé".
export async function listAcceptedProposalsAwaitingPayment() {
  return prisma.coachingProposal.findMany({
    where: { status: "ACCEPTEE", paymentStatus: { not: "PAYE" } },
    include: { project: { include: { customer: { select: { id: true, name: true, email: true } } } } },
    orderBy: { updatedAt: "asc" },
  });
}

// --- Propositions commerciales ----------------------------------------------

export async function createCoachingProposal(input: {
  projectId: string;
  intitule: string;
  montantCents: number;
  dureeMinutes: number;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");

  const intitule = input.intitule.trim();
  if (!intitule) throw badRequest("Intitulé requis.");
  if (!Number.isInteger(input.montantCents) || input.montantCents < 0) throw badRequest("Montant invalide.");
  if (!Number.isInteger(input.dureeMinutes) || input.dureeMinutes <= 0) throw badRequest("Durée invalide.");

  return prisma.coachingProposal.create({
    data: { projectId: input.projectId, intitule, montantCents: input.montantCents, dureeMinutes: input.dureeMinutes },
  });
}

export async function updateCoachingProposal(input: {
  proposalId: string;
  status?: CoachingProposalStatus;
  paymentStatus?: CoachingPaymentStatus;
  montantRecuCents?: number;
}) {
  const proposal = await prisma.coachingProposal.findUnique({ where: { id: input.proposalId }, select: { id: true, montantCents: true } });
  if (!proposal) throw notFound("Proposition introuvable.");
  if (input.montantRecuCents !== undefined && (!Number.isInteger(input.montantRecuCents) || input.montantRecuCents < 0)) {
    throw badRequest("Montant reçu invalide.");
  }

  return prisma.coachingProposal.update({
    where: { id: input.proposalId },
    data: { status: input.status, paymentStatus: input.paymentStatus, montantRecuCents: input.montantRecuCents },
  });
}

// Acheté = propositions ACCEPTEE (le paiement est un suivi séparé, ne
// conditionne pas les heures engagées) ; consommé = séances REALISEE
// uniquement. L'arithmétique elle-même vit dans lib/coaching-time-balance.ts
// (testable sans base de données) — ici on ne fait que rassembler les sommes.
export async function getCoachingProjectTimeBalance(projectId: string): Promise<CoachingProjectTimeBalance> {
  const [proposals, sessions] = await Promise.all([
    prisma.coachingProposal.findMany({ where: { projectId, status: "ACCEPTEE" }, select: { dureeMinutes: true } }),
    prisma.coachingSession.findMany({ where: { projectId, status: "REALISEE" }, select: { durationMinutes: true } }),
  ]);

  const purchasedMinutes = proposals.reduce((sum, p) => sum + p.dureeMinutes, 0);
  const consumedMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return computeCoachingProjectTimeBalance(purchasedMinutes, consumedMinutes);
}

// Clients dont le temps restant s'épuise (retour utilisateur : "clients dont
// le temps de coaching arrive à épuisement") — seuil d'1h, pour les projets
// ayant réellement un temps acheté (sinon "0 restant" ne veut rien dire).
const LOW_TIME_THRESHOLD_MINUTES = 60;

export async function listProjectsRunningLowOnTime() {
  const projects = await prisma.coachingProject.findMany({
    where: { status: { in: ["EN_COURS", "A_DEMARRER"] }, proposals: { some: { status: "ACCEPTEE" } } },
    include: { customer: { select: { id: true, name: true, email: true } } },
  });

  const withBalance = await Promise.all(
    projects.map(async (project) => ({ project, balance: await getCoachingProjectTimeBalance(project.id) }))
  );

  return withBalance
    .filter(({ balance }) => balance.purchasedMinutes > 0 && balance.remainingMinutes <= LOW_TIME_THRESHOLD_MINUTES)
    .sort((a, b) => a.balance.remainingMinutes - b.balance.remainingMinutes);
}

// --- Séances (vues transverses pour l'agenda / le tableau de bord) ---------

export async function listSessionsInRange(start: Date, end: Date) {
  return prisma.coachingSession.findMany({
    where: { scheduledAt: { gte: start, lte: end } },
    include: { project: { include: { customer: { select: { id: true, name: true, email: true } } } } },
    orderBy: { scheduledAt: "asc" },
  });
}

// --- Documents ---------------------------------------------------------------

export async function assertCoachingProjectStorageQuota(projectId: string, incomingSizeBytes: number) {
  const { COACHING_PROJECT_STORAGE_QUOTA_BYTES } = await import("@/lib/server/coaching-project-storage");
  const existing = await prisma.coachingProjectDocument.aggregate({ where: { projectId }, _sum: { sizeBytes: true } });
  const usedBytes = existing._sum.sizeBytes ?? 0;

  if (usedBytes + incomingSizeBytes > COACHING_PROJECT_STORAGE_QUOTA_BYTES) {
    const remainingMb = Math.max(0, (COACHING_PROJECT_STORAGE_QUOTA_BYTES - usedBytes) / (1024 * 1024));
    throw badRequest(
      `Quota de stockage du projet atteint (${(COACHING_PROJECT_STORAGE_QUOTA_BYTES / (1024 * 1024)).toFixed(0)} Mo max) — encore ${remainingMb.toFixed(1)} Mo disponible(s).`
    );
  }
}

export async function addCoachingProjectDocument(input: {
  projectId: string;
  filename: string;
  bucket: string;
  path: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
  // Classement optionnel "par appareil ou projet" (étape 4) — au plus un
  // des deux à la fois.
  deviceId?: string | null;
  materialId?: string | null;
}) {
  const project = await prisma.coachingProject.findUnique({ where: { id: input.projectId }, select: { id: true } });
  if (!project) throw notFound("Projet introuvable.");
  if (input.deviceId && input.materialId) throw badRequest("Un document ne peut être classé que sous un appareil OU un matériel, pas les deux.");

  return prisma.$transaction(async (tx) => {
    const document = await tx.coachingProjectDocument.create({ data: input });
    await tx.coachingProject.update({ where: { id: input.projectId }, data: { derniereActivite: new Date() } });
    return document;
  });
}

export async function getCoachingProjectDocumentById(documentId: string) {
  const document = await prisma.coachingProjectDocument.findUnique({ where: { id: documentId } });
  if (!document) throw notFound("Document introuvable.");
  return document;
}

export async function deleteCoachingProjectDocumentRecord(documentId: string) {
  const document = await prisma.coachingProjectDocument.findUnique({ where: { id: documentId } });
  if (!document) throw notFound("Document introuvable.");
  await prisma.coachingProjectDocument.delete({ where: { id: documentId } });
  return document;
}
