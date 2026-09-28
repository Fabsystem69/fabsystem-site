import { badRequest, notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import type { DossierOffre } from "@/lib/generated/prisma/client";

// Reprise DossierClient -> CoachingProject (plan de consolidation,
// docs/03-DATABASE.md, "Plan de consolidation CRM"). Ce module PREPARE la
// reprise (etape 3 de PROMPT_REPRISE_CLAUDE_CRM.md) : simulation a blanc,
// correspondances explicites, comptages, cas ambigus signales. Il ne bascule
// AUCUNE ecriture applicative existante (webhook, actions CRM) — c'est une
// etape separee (etape 4), volontairement non faite ici.
//
// Regle d'or, reprise dans chaque decision ci-dessous : ne jamais fusionner
// par nom/email, ne jamais inventer une correspondance quand un identifiant
// fort manque. Un cas ambigu est SIGNALE, jamais resolu automatiquement.

const OFFRE_TITLE: Record<DossierOffre, string> = {
  DECOUVERTE: "Découverte",
  CONSEIL: "Appel conseil",
  GUIDE: "Accompagnement guidé",
  CONCEPTION: "Conception complète",
};

type DossierMigrationStatus =
  | "already_migrated"
  | "would_create"
  | "created"
  | "ambiguous_no_order"
  | "ambiguous_existing_candidates";

export type DossierMigrationOutcome = {
  dossierId: string;
  customerId: string;
  status: DossierMigrationStatus;
  coachingProjectId?: string;
  candidateIds?: string[];
  documentConflicts?: string[];
};

export type DossierMigrationReport = {
  dryRun: boolean;
  outcomes: DossierMigrationOutcome[];
  counts: Record<DossierMigrationStatus, number>;
};

function emptyCounts(): Record<DossierMigrationStatus, number> {
  return {
    already_migrated: 0,
    would_create: 0,
    created: 0,
    ambiguous_no_order: 0,
    ambiguous_existing_candidates: 0,
  };
}

// Reprise d'UN SEUL dossier — reutilisee par le comptage en masse
// (planOrRunDossierClientMigration) et par le rattachement au fil de l'eau
// depuis createDossierClientForOrder (une seule logique de correspondance,
// jamais deux versions qui pourraient diverger).
export async function migrateOneDossierClient(dossierId: string, options: { dryRun: boolean }): Promise<DossierMigrationOutcome> {
  const dossier = await prisma.dossierClient.findUnique({
    where: { id: dossierId },
    include: { events: true, documents: true, appointments: true },
  });
  if (!dossier) throw notFound("Dossier introuvable.");

  // Cas "decouverte" (jamais de commande, cree manuellement depuis le
  // dashboard) : aucun identifiant fort ne distingue ce dossier d'un
  // CoachingProject deja cree pour le meme client depuis le CRM. Toujours
  // signale, jamais fusionne ni recree automatiquement.
  if (!dossier.orderId) {
    return { dossierId: dossier.id, customerId: dossier.customerId, status: "ambiguous_no_order" };
  }

  const alreadyLinked = await prisma.coachingProject.findUnique({
    where: { orderId: dossier.orderId },
    select: { id: true },
  });
  if (alreadyLinked) {
    return { dossierId: dossier.id, customerId: dossier.customerId, status: "already_migrated", coachingProjectId: alreadyLinked.id };
  }

  // Un CoachingProject deja existant pour ce client, sans commande liee,
  // pourrait etre le meme accompagnement (cree depuis le CRM avant/pendant
  // l'achat) ou un accompagnement totalement distinct. Impossible a
  // trancher sans lecture humaine — jamais un rattachement automatique.
  const candidates = await prisma.coachingProject.findMany({
    where: { customerId: dossier.customerId, orderId: null },
    select: { id: true },
  });
  if (candidates.length > 0) {
    return {
      dossierId: dossier.id,
      customerId: dossier.customerId,
      status: "ambiguous_existing_candidates",
      candidateIds: candidates.map((c) => c.id),
    };
  }

  if (options.dryRun) {
    return { dossierId: dossier.id, customerId: dossier.customerId, status: "would_create" };
  }

  const { coachingProjectId, documentConflicts } = await createCoachingProjectFromDossier(dossier);
  return {
    dossierId: dossier.id,
    customerId: dossier.customerId,
    status: "created",
    coachingProjectId,
    ...(documentConflicts.length > 0 ? { documentConflicts } : {}),
  };
}

// Point d'entree en masse : dryRun=true ne fait AUCUNE ecriture (ni
// CoachingProject, ni satellites) — uniquement de la lecture et du comptage.
export async function planOrRunDossierClientMigration(options: { dryRun: boolean }): Promise<DossierMigrationReport> {
  const dossiers = await prisma.dossierClient.findMany({ select: { id: true }, orderBy: { createdAt: "asc" } });

  const outcomes: DossierMigrationOutcome[] = [];
  for (const dossier of dossiers) {
    outcomes.push(await migrateOneDossierClient(dossier.id, options));
  }

  const counts = outcomes.reduce((acc, outcome) => {
    acc[outcome.status] += 1;
    return acc;
  }, emptyCounts());

  return { dryRun: options.dryRun, outcomes, counts };
}

type DossierWithSatellites = Awaited<ReturnType<typeof prisma.dossierClient.findMany>>[number] & {
  events: { type: string; fromEtape: string | null; toEtape: string | null; note: string | null; authorName: string; createdAt: Date }[];
  documents: {
    id: string;
    filename: string;
    bucket: string;
    path: string;
    contentType: string | null;
    sizeBytes: number;
    uploadedBy: string;
    createdAt: Date;
  }[];
  appointments: { id: string; scheduledAt: Date; durationMinutes: number; compteRendu: string | null; createdAt: Date; updatedAt: Date }[];
};

// Reprend evenements/documents/rendez-vous d'un DossierClient dans le
// CoachingProject cible — factorise car reutilise a l'identique par la
// creation (cas limpide) ET par le rattachement a un projet existant (cas
// ambigu resolu manuellement, voir resolveAmbiguousDossierMigration).
async function copyDossierSatellitesInto(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  dossier: DossierWithSatellites,
  targetProjectId: string
) {
  if (dossier.events.length > 0) {
    await tx.coachingProjectEvent.createMany({
      data: dossier.events.map((event) => ({
        projectId: targetProjectId,
        // Prefixe explicite : distingue a l'audit un evenement repris de
        // DossierEvent d'un evenement natif CoachingProjectEvent, sans
        // perdre le type d'origine.
        type: `LEGACY_DOSSIER:${event.type}`,
        note: [event.fromEtape || event.toEtape ? `${event.fromEtape ?? "?"} -> ${event.toEtape ?? "?"}` : null, event.note]
          .filter(Boolean)
          .join(" — ") || null,
        authorName: event.authorName,
        createdAt: event.createdAt,
      })),
    });
  }

  // bucket+path est unique TOUTE LA TABLE CoachingProjectDocument (meme
  // contrainte que DossierDocument) : une collision est possible si les
  // deux circuits ont deja stocke un fichier au meme chemin. On ne fusionne
  // jamais silencieusement — le document en conflit est ignore et signale,
  // jamais recopie ni ecrase.
  const documentConflicts: string[] = [];
  for (const document of dossier.documents) {
    const collision = await tx.coachingProjectDocument.findUnique({
      where: { bucket_path: { bucket: document.bucket, path: document.path } },
      select: { id: true },
    });
    if (collision) {
      documentConflicts.push(document.id);
      continue;
    }
    await tx.coachingProjectDocument.create({
      data: {
        projectId: targetProjectId,
        filename: document.filename,
        bucket: document.bucket,
        path: document.path,
        contentType: document.contentType,
        sizeBytes: document.sizeBytes,
        uploadedBy: document.uploadedBy,
        createdAt: document.createdAt,
      },
    });
  }

  if (dossier.appointments.length > 0) {
    await tx.coachingSession.createMany({
      data: dossier.appointments.map((appointment) => ({
        projectId: targetProjectId,
        scheduledAt: appointment.scheduledAt,
        durationMinutes: appointment.durationMinutes,
        // Heuristique documentee (docs/03-DATABASE.md §2) : un compte-rendu
        // rempli signifie que le rendez-vous a eu lieu. Aucune preuve
        // d'annulation n'existe cote DossierAppointment, jamais deduite.
        status: appointment.compteRendu ? "REALISEE" : "PREVUE",
        prochaineEtape: appointment.compteRendu,
        // UID stable : ne jamais dupliquer un abonnement webcal deja
        // installe sur le calendrier d'un client (accompagnements.ics). La
        // contrainte @unique fait echouer un rejeu par erreur plutot que de
        // dupliquer silencieusement.
        legacyDossierAppointmentId: appointment.id,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      })),
    });
  }

  return { documentConflicts };
}

// Un seul dossier a la fois (jamais toute la reprise dans une transaction
// géante) : permet une progression et une reprise partielles sur un vrai
// volume, sans tout bloquer sur un seul cas.
async function createCoachingProjectFromDossier(dossier: DossierWithSatellites) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.coachingProject.create({
      data: {
        customerId: dossier.customerId,
        title: OFFRE_TITLE[dossier.offre],
        orderId: dossier.orderId,
        offre: dossier.offre,
        whatsapp: dossier.whatsapp,
        statutSimple: dossier.statutSimple,
        compteRendu: dossier.compteRendu,
        etapeActuelle: dossier.etapeActuelle,
        etapeOverride: dossier.etapeOverride,
        iterationCount: dossier.iterationCount,
        dateLivraison: dossier.dateLivraison,
        consentementPartage: dossier.consentementPartage,
        consentementPartageAt: dossier.consentementPartageAt,
        temoignageDemande: dossier.temoignageDemande,
        temoignageRecu: dossier.temoignageRecu,
        j30MessageEnvoye: dossier.j30MessageEnvoye,
        purgeWarningSentAt: dossier.purgeWarningSentAt,
        confirmationEmailSentAt: dossier.confirmationEmailSentAt,
        besoinVehicule: dossier.besoinVehicule,
        besoinDescription: dossier.besoinDescription,
        besoinProgress: dossier.besoinProgress,
        besoinDeadline: dossier.besoinDeadline,
        besoinAutre: dossier.besoinAutre,
        notesInternes: dossier.notesInternes,
        derniereActivite: dossier.derniereActivite,
        createdAt: dossier.createdAt,
      },
    });

    const { documentConflicts } = await copyDossierSatellitesInto(tx, dossier, project.id);
    return { coachingProjectId: project.id, documentConflicts };
  });
}

export type ResolveAmbiguousDecision = { kind: "create_new" } | { kind: "attach_to"; coachingProjectId: string };

export type ResolveAmbiguousResult = {
  dossierId: string;
  coachingProjectId: string;
  fieldConflicts: string[];
  documentConflicts: string[];
};

// Resout un cas signale "ambiguous_no_order"/"ambiguous_existing_candidates"
// — jamais appele automatiquement par planOrRunDossierClientMigration,
// uniquement sur decision humaine explicite passee en parametre.
export async function resolveAmbiguousDossierMigration(
  dossierId: string,
  decision: ResolveAmbiguousDecision
): Promise<ResolveAmbiguousResult> {
  const dossier = await prisma.dossierClient.findUnique({
    where: { id: dossierId },
    include: { events: true, documents: true, appointments: true },
  });
  if (!dossier) throw notFound("Dossier introuvable.");

  if (decision.kind === "create_new") {
    const { coachingProjectId, documentConflicts } = await createCoachingProjectFromDossier(dossier);
    return { dossierId: dossier.id, coachingProjectId, fieldConflicts: [], documentConflicts };
  }

  const target = await prisma.coachingProject.findUnique({ where: { id: decision.coachingProjectId } });
  if (!target) throw notFound("Projet cible introuvable.");
  if (dossier.orderId && target.orderId && target.orderId !== dossier.orderId) {
    throw badRequest("Le projet cible est déjà rattaché à une autre commande.");
  }

  return prisma.$transaction(async (tx) => {
    const fieldConflicts: string[] = [];
    const patch: Record<string, unknown> = {};

    // Ne jamais ecraser une valeur deja presente et differente sur le
    // projet cible — seulement completer ce qui manque, et signaler les
    // divergences pour relecture humaine (regle du plan de consolidation §2).
    function mergeIfEmpty(field: string, dossierValue: unknown, targetValue: unknown) {
      if (dossierValue === null || dossierValue === undefined) return;
      if (targetValue === null || targetValue === undefined || targetValue === "") {
        patch[field] = dossierValue;
      } else if (targetValue !== dossierValue) {
        fieldConflicts.push(field);
      }
    }

    if (!target.orderId && dossier.orderId) patch.orderId = dossier.orderId;
    mergeIfEmpty("offre", dossier.offre, target.offre);
    mergeIfEmpty("whatsapp", dossier.whatsapp, target.whatsapp);
    mergeIfEmpty("statutSimple", dossier.statutSimple, target.statutSimple);
    mergeIfEmpty("compteRendu", dossier.compteRendu, target.compteRendu);
    mergeIfEmpty("etapeActuelle", dossier.etapeActuelle, target.etapeActuelle);
    mergeIfEmpty("etapeOverride", dossier.etapeOverride, target.etapeOverride);
    if (dossier.dateLivraison) {
      if (!target.dateLivraison) patch.dateLivraison = dossier.dateLivraison;
      else if (target.dateLivraison.getTime() !== dossier.dateLivraison.getTime()) fieldConflicts.push("dateLivraison");
    }
    mergeIfEmpty("besoinVehicule", dossier.besoinVehicule, target.besoinVehicule);
    mergeIfEmpty("besoinDescription", dossier.besoinDescription, target.besoinDescription);
    mergeIfEmpty("besoinProgress", dossier.besoinProgress, target.besoinProgress);
    mergeIfEmpty("besoinDeadline", dossier.besoinDeadline, target.besoinDeadline);
    mergeIfEmpty("besoinAutre", dossier.besoinAutre, target.besoinAutre);
    if (dossier.purgeWarningSentAt && !target.purgeWarningSentAt) patch.purgeWarningSentAt = dossier.purgeWarningSentAt;
    if (dossier.confirmationEmailSentAt && !target.confirmationEmailSentAt) patch.confirmationEmailSentAt = dossier.confirmationEmailSentAt;
    if (dossier.consentementPartage && !target.consentementPartage) {
      patch.consentementPartage = true;
      patch.consentementPartageAt = dossier.consentementPartageAt;
    }
    if (dossier.temoignageDemande) patch.temoignageDemande = true;
    if (dossier.temoignageRecu) patch.temoignageRecu = true;
    if (dossier.j30MessageEnvoye) patch.j30MessageEnvoye = true;
    if (dossier.iterationCount > target.iterationCount) patch.iterationCount = dossier.iterationCount;

    // notesInternes : concatenation explicite et horodatee, jamais un
    // ecrasement silencieux — les deux sources peuvent legitimement differer.
    if (dossier.notesInternes) {
      patch.notesInternes = target.notesInternes
        ? `${target.notesInternes}\n\n--- Notes reprises de l'ancien dossier (${dossier.id}) le ${new Date().toISOString()} ---\n${dossier.notesInternes}`
        : dossier.notesInternes;
    }

    if (Object.keys(patch).length > 0) {
      patch.derniereActivite = new Date();
      await tx.coachingProject.update({ where: { id: target.id }, data: patch });
    }

    const { documentConflicts } = await copyDossierSatellitesInto(tx, dossier, target.id);

    return { dossierId: dossier.id, coachingProjectId: target.id, fieldConflicts, documentConflicts };
  });
}
