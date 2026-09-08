import type Stripe from "stripe";
import { badRequest, notFound } from "@/lib/http-errors";
import { getDossierSteps } from "@/lib/dossier-client";
import { prisma } from "@/lib/prisma";
import { PRESTATIONS_BENEFIT_REASON } from "@/lib/services/prestations-benefits";
import { renderEmailTemplate } from "@/lib/services/email-templates";
import { logServerEvent } from "@/lib/server-log";

const OFFER_SLUG_TO_DOSSIER_OFFRE: Record<string, "CONSEIL" | "GUIDE" | "CONCEPTION"> = {
  "accompagnement-appel-conseil": "CONSEIL",
  "accompagnement-guide": "GUIDE",
  "accompagnement-conception-complete": "CONCEPTION",
};

function metadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key]?.trim();
  return value && value.length > 0 ? value : null;
}

function resolveFromAddress() {
  return process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || "fabien.lages@fabsystem.fr";
}

async function getDefaultSendMail() {
  const { sendMail } = await import("@/lib/server/nodemailer");
  return sendMail;
}

async function sendDossierConfirmationEmail(
  dossier: { id: string; offre: string; customerEmail: string; customerName: string | null },
  includesBonusAccess: boolean,
  sendMailImpl: Awaited<ReturnType<typeof getDefaultSendMail>>
) {
  const offerLabel =
    dossier.offre === "CONSEIL" ? "Appel conseil" : dossier.offre === "GUIDE" ? "Accompagnement guidé" : "Conception complète";
  const greeting = dossier.customerName ? `Bonjour ${dossier.customerName},` : "Bonjour,";

  const bonusAccessBlock = includesBonusAccess
    ? "\n\nVotre commande inclut un an d'accès complet à l'éditeur de schéma FabSystem ainsi que l'ebook correspondant à votre catégorie — vous trouverez le détail dans votre espace client."
    : "";

  const { subject, text, html } = await renderEmailTemplate("dossier-confirmation", {
    greeting,
    offer_label: offerLabel,
    bonus_access_block: bonusAccessBlock,
  });

  await sendMailImpl({
    to: dossier.customerEmail,
    from: resolveFromAddress(),
    subject,
    text,
    html,
  });
}

export type CreateDossierClientForOrderResult =
  | { status: "not_applicable" }
  | { status: "already_exists"; dossierId: string }
  | { status: "created"; dossierId: string };

// Declenche a chaque checkout.session.completed (voir stripe-webhook-commerce.ts),
// idempotent par orderId (DossierClient.orderId est @unique) — memes garanties
// que grantPrestationsBenefitsForOrder pour les redeliveries Stripe.
export async function createDossierClientForOrder(
  orderId: string,
  sessionMetadata?: Stripe.Metadata | null,
  deps?: { sendMailImpl?: Awaited<ReturnType<typeof getDefaultSendMail>> }
): Promise<CreateDossierClientForOrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      customerId: true,
      customerEmail: true,
      customerName: true,
      items: { select: { productSlug: true } },
    },
  });

  if (!order || !order.customerId) {
    return { status: "not_applicable" };
  }

  const offerItem = order.items.find((item) => item.productSlug in OFFER_SLUG_TO_DOSSIER_OFFRE);
  if (!offerItem) {
    return { status: "not_applicable" };
  }

  const existing = await prisma.dossierClient.findUnique({ where: { orderId: order.id }, select: { id: true } });
  if (existing) {
    return { status: "already_exists", dossierId: existing.id };
  }

  const offre = OFFER_SLUG_TO_DOSSIER_OFFRE[offerItem.productSlug];

  const dossier = await prisma.dossierClient.create({
    data: {
      customerId: order.customerId,
      orderId: order.id,
      offre,
      statutSimple: offre === "CONSEIL" ? "A_VENIR" : null,
      whatsapp: metadataValue(sessionMetadata, "needsWhatsapp"),
      besoinVehicule: metadataValue(sessionMetadata, "needsVehicle"),
      besoinDescription: metadataValue(sessionMetadata, "needsDescription"),
      besoinProgress: metadataValue(sessionMetadata, "needsProgress"),
      besoinDeadline: metadataValue(sessionMetadata, "needsDeadline"),
      besoinAutre: metadataValue(sessionMetadata, "needsOther"),
    },
  });

  const sendMailImpl = deps?.sendMailImpl ?? (await getDefaultSendMail());
  try {
    const purchasedProduct = await prisma.product.findUnique({
      where: { slug: offerItem.productSlug },
      select: { includedEditorAccessDays: true },
    });
    await sendDossierConfirmationEmail(
      { id: dossier.id, offre, customerEmail: order.customerEmail, customerName: order.customerName },
      Boolean(purchasedProduct?.includedEditorAccessDays && purchasedProduct.includedEditorAccessDays > 0),
      sendMailImpl
    );
  } catch (error) {
    logServerEvent("error", "failed to send dossier confirmation email", { error, dossierId: dossier.id });
  }

  return { status: "created", dossierId: dossier.id };
}

// Creation manuelle depuis le dashboard : seul chemin pour "decouverte"
// (jamais de commande, CTA vers /contact) et filet de rattrapage pour les
// offres payantes si le webhook a echoue.
export async function createManualDossierClient(input: {
  customerId: string;
  offre: "DECOUVERTE" | "CONSEIL" | "GUIDE" | "CONCEPTION";
  whatsapp?: string | null;
}) {
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId }, select: { id: true } });
  if (!customer) throw notFound("Client introuvable.");

  return prisma.dossierClient.create({
    data: {
      customerId: input.customerId,
      offre: input.offre,
      statutSimple: input.offre === "DECOUVERTE" || input.offre === "CONSEIL" ? "A_VENIR" : null,
      whatsapp: input.whatsapp?.trim() || null,
    },
  });
}

export async function updateDossierSimpleStatus(input: {
  dossierId: string;
  statutSimple: "A_VENIR" | "FAIT";
  compteRendu?: string;
}) {
  const dossier = await prisma.dossierClient.findUnique({ where: { id: input.dossierId }, select: { id: true, offre: true } });
  if (!dossier) throw notFound("Dossier introuvable.");
  if (dossier.offre !== "DECOUVERTE" && dossier.offre !== "CONSEIL") {
    throw badRequest("Ce dossier utilise une timeline à étapes, pas un statut simple.");
  }

  return prisma.dossierClient.update({
    where: { id: input.dossierId },
    data: {
      statutSimple: input.statutSimple,
      compteRendu: input.compteRendu?.trim() || null,
      derniereActivite: new Date(),
    },
  });
}

export async function advanceDossierStep(input: { dossierId: string; stepKey: string; note?: string }) {
  const dossier = await prisma.dossierClient.findUnique({ where: { id: input.dossierId } });
  if (!dossier) throw notFound("Dossier introuvable.");
  if (dossier.offre !== "GUIDE" && dossier.offre !== "CONCEPTION") {
    throw badRequest("Ce dossier n'a pas de timeline à étapes.");
  }

  const validKeys = getDossierSteps(dossier.offre).map((step) => step.key);
  if (!validKeys.includes(input.stepKey)) throw badRequest("Étape invalide.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.dossierClient.update({
      where: { id: input.dossierId },
      data: { etapeActuelle: input.stepKey, derniereActivite: new Date() },
    });

    await tx.dossierEvent.create({
      data: {
        dossierId: input.dossierId,
        type: "STEP_CHANGE",
        fromEtape: dossier.etapeActuelle,
        toEtape: input.stepKey,
        note: input.note?.trim() || null,
      },
    });

    return updated;
  });
}

export async function addDossierIteration(input: { dossierId: string; note: string }) {
  const dossier = await prisma.dossierClient.findUnique({ where: { id: input.dossierId } });
  if (!dossier) throw notFound("Dossier introuvable.");

  const note = input.note.trim();
  if (!note) throw badRequest("La note d'itération est requise.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.dossierClient.update({
      where: { id: input.dossierId },
      data: { iterationCount: { increment: 1 }, derniereActivite: new Date() },
    });

    await tx.dossierEvent.create({
      data: { dossierId: input.dossierId, type: "ITERATION", note },
    });

    return updated;
  });
}

export async function updateDossierNotesInternes(input: { dossierId: string; notesInternes: string }) {
  const dossier = await prisma.dossierClient.findUnique({ where: { id: input.dossierId }, select: { id: true } });
  if (!dossier) throw notFound("Dossier introuvable.");

  return prisma.dossierClient.update({
    where: { id: input.dossierId },
    data: { notesInternes: input.notesInternes.trim() || null },
  });
}

export async function setDossierWhatsapp(input: { dossierId: string; whatsapp: string }) {
  const dossier = await prisma.dossierClient.findUnique({ where: { id: input.dossierId }, select: { id: true } });
  if (!dossier) throw notFound("Dossier introuvable.");

  return prisma.dossierClient.update({
    where: { id: input.dossierId },
    data: { whatsapp: input.whatsapp.trim() || null },
  });
}

// Marque le dossier comme livré (ou annule ce marquage) — retour utilisateur
// (bug réel : un client déjà en accompagnement a reçu la relance "vous
// n'avez pas souscrit Éditeur Plus" automatisée) : ce champ était utilisé
// par plusieurs jobs (dossier-notifications.ts, editor-crm.ts) sans jamais
// pouvoir être renseigné nulle part dans l'interface.
export async function setDossierDelivered(input: { dossierId: string; delivered: boolean }) {
  const dossier = await prisma.dossierClient.findUnique({ where: { id: input.dossierId }, select: { id: true } });
  if (!dossier) throw notFound("Dossier introuvable.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.dossierClient.update({
      where: { id: input.dossierId },
      data: { dateLivraison: input.delivered ? new Date() : null, derniereActivite: new Date() },
    });

    await tx.dossierEvent.create({
      data: {
        dossierId: input.dossierId,
        type: "NOTE",
        note: input.delivered ? "Dossier marqué comme livré." : "Marquage \"livré\" annulé.",
      },
    });

    return updated;
  });
}

export async function listDossiers() {
  return prisma.dossierClient.findMany({
    include: { customer: { select: { id: true, name: true, email: true } } },
    orderBy: { derniereActivite: "desc" },
  });
}

export async function getDossierForDetail(dossierId: string) {
  const dossier = await prisma.dossierClient.findUnique({
    where: { id: dossierId },
    include: {
      customer: true,
      events: { orderBy: { createdAt: "desc" }, take: 30 },
      appointments: { orderBy: { scheduledAt: "desc" } },
    },
  });
  if (!dossier) throw notFound("Dossier introuvable.");
  return dossier;
}

// Quota cumule par dossier (voir DOSSIER_STORAGE_QUOTA_BYTES,
// lib/server/dossier-storage.ts) — verifie AVANT l'upload Supabase pour ne
// jamais gaspiller un transfert qui serait de toute facon refuse.
export async function assertDossierStorageQuota(dossierId: string, incomingSizeBytes: number) {
  const { DOSSIER_STORAGE_QUOTA_BYTES } = await import("@/lib/server/dossier-storage");
  const existing = await prisma.dossierDocument.aggregate({
    where: { dossierId },
    _sum: { sizeBytes: true },
  });
  const usedBytes = existing._sum.sizeBytes ?? 0;

  if (usedBytes + incomingSizeBytes > DOSSIER_STORAGE_QUOTA_BYTES) {
    const remainingMb = Math.max(0, (DOSSIER_STORAGE_QUOTA_BYTES - usedBytes) / (1024 * 1024));
    throw badRequest(
      `Quota de stockage du dossier atteint (${(DOSSIER_STORAGE_QUOTA_BYTES / (1024 * 1024)).toFixed(0)} Mo max) — encore ${remainingMb.toFixed(1)} Mo disponible(s).`
    );
  }
}

export async function addDossierDocument(input: {
  dossierId: string;
  filename: string;
  bucket: string;
  path: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
}) {
  const dossier = await prisma.dossierClient.findUnique({ where: { id: input.dossierId }, select: { id: true } });
  if (!dossier) throw notFound("Dossier introuvable.");

  return prisma.$transaction(async (tx) => {
    const document = await tx.dossierDocument.create({
      data: {
        dossierId: input.dossierId,
        filename: input.filename,
        bucket: input.bucket,
        path: input.path,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        uploadedBy: input.uploadedBy,
      },
    });

    await tx.dossierClient.update({ where: { id: input.dossierId }, data: { derniereActivite: new Date() } });

    return document;
  });
}

export async function listDossierDocuments(dossierId: string) {
  return prisma.dossierDocument.findMany({ where: { dossierId }, orderBy: { createdAt: "desc" } });
}

export async function getDossierDocumentById(documentId: string) {
  const document = await prisma.dossierDocument.findUnique({ where: { id: documentId } });
  if (!document) throw notFound("Document introuvable.");
  return document;
}

export async function deleteDossierDocumentRecord(documentId: string) {
  const document = await prisma.dossierDocument.findUnique({ where: { id: documentId } });
  if (!document) throw notFound("Document introuvable.");
  await prisma.dossierDocument.delete({ where: { id: documentId } });
  return document;
}

export async function getDossierForCustomer(customerId: string) {
  return prisma.dossierClient.findFirst({
    where: { customerId },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 30 },
      appointments: { orderBy: { scheduledAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Rendez-vous visio/telephone (retour utilisateur : "un calendrier pour
// caler les visio... avec date et duree et un espace pour ecrire un
// resume"). Un dossier peut en avoir plusieurs au fil du suivi.
export async function createDossierAppointment(input: {
  dossierId: string;
  scheduledAt: Date;
  durationMinutes: number;
}) {
  const dossier = await prisma.dossierClient.findUnique({ where: { id: input.dossierId }, select: { id: true } });
  if (!dossier) throw notFound("Dossier introuvable.");
  if (Number.isNaN(input.scheduledAt.getTime())) throw badRequest("Date de rendez-vous invalide.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    throw badRequest("Durée invalide.");
  }

  return prisma.$transaction(async (tx) => {
    const appointment = await tx.dossierAppointment.create({
      data: {
        dossierId: input.dossierId,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
      },
    });

    await tx.dossierClient.update({
      where: { id: input.dossierId },
      data: { derniereActivite: new Date() },
    });

    await tx.dossierEvent.create({
      data: {
        dossierId: input.dossierId,
        type: "NOTE",
        note: `Rendez-vous calé le ${input.scheduledAt.toLocaleString("fr-FR")} (${input.durationMinutes} min).`,
      },
    });

    return appointment;
  });
}

export async function updateDossierAppointment(input: {
  appointmentId: string;
  scheduledAt: Date;
  durationMinutes: number;
}) {
  const appointment = await prisma.dossierAppointment.findUnique({ where: { id: input.appointmentId } });
  if (!appointment) throw notFound("Rendez-vous introuvable.");
  if (Number.isNaN(input.scheduledAt.getTime())) throw badRequest("Date de rendez-vous invalide.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    throw badRequest("Durée invalide.");
  }

  return prisma.dossierAppointment.update({
    where: { id: input.appointmentId },
    data: { scheduledAt: input.scheduledAt, durationMinutes: input.durationMinutes },
  });
}

export async function setDossierAppointmentSummary(input: { appointmentId: string; compteRendu: string }) {
  const appointment = await prisma.dossierAppointment.findUnique({ where: { id: input.appointmentId } });
  if (!appointment) throw notFound("Rendez-vous introuvable.");

  return prisma.dossierAppointment.update({
    where: { id: input.appointmentId },
    data: { compteRendu: input.compteRendu.trim() || null },
  });
}

export async function deleteDossierAppointment(appointmentId: string) {
  const appointment = await prisma.dossierAppointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw notFound("Rendez-vous introuvable.");

  return prisma.dossierAppointment.delete({ where: { id: appointmentId } });
}

// Alimente le flux ICS prive (app/api/calendar/accompagnements.ics) — fenetre
// large (passe recent + futur) pour que Calendrier iPhone retrouve aussi les
// rendez-vous tout juste passes sans compte-rendu.
export async function listCalendarAppointments(now: Date = new Date()) {
  const windowStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  return prisma.dossierAppointment.findMany({
    where: { scheduledAt: { gte: windowStart } },
    include: {
      dossier: { include: { customer: { select: { name: true, email: true } } } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export type IncludedAccessSummary = {
  hasEditorAccess: boolean;
  editorExpiresAt: Date | null;
  hasEbookOffer: boolean;
};

// Correction validee (CDC v3 §4) : ne jamais dupliquer l'etat d'acces sur
// DossierClient — toujours relire CustomerCapability/DiscountCode, seules
// sources de verite (deja ecrites par grantPrestationsBenefitsForOrder,
// lib/services/prestations-benefits.ts). Scope volontairement restreint aux
// octrois "prestations:*" : un abonnement Editeur Plus separe (souscrit par
// ailleurs) n'est pas ce que cette page annonce comme "inclus avec votre
// accompagnement".
export async function getIncludedAccessForCustomer(
  customerId: string,
  customerEmail: string
): Promise<IncludedAccessSummary> {
  const [capability, discountCode] = await Promise.all([
    prisma.customerCapability.findFirst({
      where: {
        customerId,
        status: "ACTIVE",
        source: { startsWith: "prestations:" },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { expiresAt: "desc" },
      select: { expiresAt: true },
    }),
    prisma.discountCode.findFirst({
      where: {
        customerEmail: customerEmail.trim().toLowerCase(),
        reason: PRESTATIONS_BENEFIT_REASON,
        status: "ACTIVE",
      },
      select: { id: true },
    }),
  ]);

  return {
    hasEditorAccess: Boolean(capability),
    editorExpiresAt: capability?.expiresAt ?? null,
    hasEbookOffer: Boolean(discountCode),
  };
}
