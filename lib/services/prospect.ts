import { badRequest, notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import type { ProspectSource, ProspectStatus } from "@/lib/generated/prisma/client";

export async function listProspects(filters?: { status?: ProspectStatus; search?: string }) {
  const search = filters?.search?.trim();

  return prisma.prospect.findMany({
    where: {
      status: filters?.status,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { derniereActivite: "desc" },
  });
}

// Relances dues aujourd'hui ou en retard — alimente le tableau de bord
// "Aujourd'hui" (retour utilisateur : "prospects à relancer").
export async function listDueProspectFollowUps(now: Date = new Date()) {
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  return prisma.prospect.findMany({
    where: {
      nextActionAt: { lte: endOfToday },
      status: { notIn: ["GAGNE", "SANS_SUITE"] },
    },
    orderBy: { nextActionAt: "asc" },
  });
}

export async function getProspect(prospectId: string) {
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: { events: { orderBy: { createdAt: "desc" } }, convertedCustomer: { select: { id: true, name: true, email: true } } },
  });
  if (!prospect) throw notFound("Prospect introuvable.");
  return prospect;
}

export async function createProspect(input: {
  name: string;
  phone?: string | null;
  email?: string | null;
  source: ProspectSource;
  facebookLink?: string | null;
  besoinElectricite?: string | null;
  notesInternes?: string | null;
  nextAction?: string | null;
  nextActionAt?: Date | null;
}) {
  const name = input.name.trim();
  if (!name) throw badRequest("Nom requis.");

  return prisma.prospect.create({
    data: {
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      source: input.source,
      facebookLink: input.facebookLink?.trim() || null,
      besoinElectricite: input.besoinElectricite?.trim() || null,
      notesInternes: input.notesInternes?.trim() || null,
      nextAction: input.nextAction?.trim() || null,
      nextActionAt: input.nextActionAt ?? null,
    },
  });
}

// Changement de statut + champs modifiables depuis la fiche prospect. Logue
// systematiquement un ProspectEvent "STATUS_CHANGE" si le statut change,
// jamais sinon (evite de noyer l'historique d'un simple correctif de
// telephone).
export async function updateProspect(input: {
  prospectId: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  source?: ProspectSource;
  facebookLink?: string | null;
  besoinElectricite?: string | null;
  notesInternes?: string | null;
  status?: ProspectStatus;
  nextAction?: string | null;
  nextActionAt?: Date | null;
}) {
  const prospect = await prisma.prospect.findUnique({ where: { id: input.prospectId }, select: { id: true, status: true } });
  if (!prospect) throw notFound("Prospect introuvable.");

  const statusChanged = input.status !== undefined && input.status !== prospect.status;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.prospect.update({
      where: { id: input.prospectId },
      data: {
        name: input.name?.trim() || undefined,
        phone: input.phone !== undefined ? input.phone?.trim() || null : undefined,
        email: input.email !== undefined ? input.email?.trim().toLowerCase() || null : undefined,
        source: input.source,
        facebookLink: input.facebookLink !== undefined ? input.facebookLink?.trim() || null : undefined,
        besoinElectricite: input.besoinElectricite !== undefined ? input.besoinElectricite?.trim() || null : undefined,
        notesInternes: input.notesInternes !== undefined ? input.notesInternes?.trim() || null : undefined,
        status: input.status,
        nextAction: input.nextAction !== undefined ? input.nextAction?.trim() || null : undefined,
        nextActionAt: input.nextActionAt !== undefined ? input.nextActionAt : undefined,
        derniereActivite: new Date(),
      },
    });

    if (statusChanged) {
      await tx.prospectEvent.create({
        data: {
          prospectId: input.prospectId,
          type: "STATUS_CHANGE",
          fromStatus: prospect.status,
          toStatus: input.status,
        },
      });
    }

    return updated;
  });
}

// Note manuelle d'echange (retour utilisateur : "historique des echanges
// saisi manuellement") — jamais un changement de statut, juste une trace.
export async function logProspectNote(input: { prospectId: string; note: string }) {
  const prospect = await prisma.prospect.findUnique({ where: { id: input.prospectId }, select: { id: true } });
  if (!prospect) throw notFound("Prospect introuvable.");

  const note = input.note.trim();
  if (!note) throw badRequest("Note requise.");

  return prisma.$transaction(async (tx) => {
    await tx.prospect.update({ where: { id: input.prospectId }, data: { derniereActivite: new Date() } });
    return tx.prospectEvent.create({ data: { prospectId: input.prospectId, type: "NOTE", note } });
  });
}

export type ConvertProspectResult = { customerId: string; projectId: string };

// "Transformation d'un prospect en client sans ressaisir ni perdre son
// historique" — reutilise le Customer existant si l'email correspond deja a
// un compte, sinon en cree un (origin ADMIN). Un email est necessaire ici
// (Customer.email est unique et obligatoire dans tout le reste de l'appli) :
// si le prospect n'en a pas encore, il doit etre fourni au moment de la
// conversion plutot que d'assouplir cette contrainte globale.
export async function convertProspectToClient(input: {
  prospectId: string;
  email: string;
  projectTitle: string;
}): Promise<ConvertProspectResult> {
  const prospect = await prisma.prospect.findUnique({ where: { id: input.prospectId } });
  if (!prospect) throw notFound("Prospect introuvable.");
  if (prospect.convertedCustomerId) throw badRequest("Ce prospect a déjà été converti.");

  const email = input.email.trim().toLowerCase();
  if (!email) throw badRequest("Email requis pour créer le client.");

  const projectTitle = input.projectTitle.trim();
  if (!projectTitle) throw badRequest("Titre du projet requis.");

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: prospect.name,
        phone: prospect.phone,
        origin: "ADMIN",
      },
    });

    const project = await tx.coachingProject.create({
      data: {
        customerId: customer.id,
        title: projectTitle,
        description: prospect.besoinElectricite,
      },
    });

    await tx.prospect.update({
      where: { id: input.prospectId },
      data: { status: "GAGNE", convertedCustomerId: customer.id, derniereActivite: new Date() },
    });

    await tx.prospectEvent.create({
      data: {
        prospectId: input.prospectId,
        type: "STATUS_CHANGE",
        fromStatus: prospect.status,
        toStatus: "GAGNE",
        note: "Converti en client coaching.",
      },
    });

    return { customerId: customer.id, projectId: project.id };
  });
}

const DEFAULT_PROSPECT_MESSAGE_TEMPLATES: { key: string; label: string; body: string }[] = [
  {
    key: "premier-contact",
    label: "Premier contact",
    body: "Bonjour ! Merci pour votre message, je suis Fabien de FabSystem, je vous accompagne en électricité embarquée (van/bateau/camping-car). Racontez-moi un peu votre projet ?",
  },
  {
    key: "qualification-besoin",
    label: "Qualification du besoin",
    body: "Pour bien cerner votre besoin : quel est votre véhicule (marque/modèle), où en êtes-vous du projet électrique, et qu'est-ce qui vous bloque le plus aujourd'hui ?",
  },
  {
    key: "presentation-coaching",
    label: "Présentation du coaching",
    body: "Je propose un accompagnement personnalisé pour vous aider à concevoir et sécuriser votre installation électrique, à votre rythme, avec des points réguliers. Ça vous intéresse d'en discuter par téléphone ?",
  },
  {
    key: "relance",
    label: "Relance",
    body: "Petit message pour prendre de vos nouvelles — où en êtes-vous de votre réflexion sur l'accompagnement électrique ? Je reste disponible si vous avez des questions.",
  },
];

// Cree les 4 modeles par defaut au premier acces si la table est vide —
// jamais via une migration de donnees (retour utilisateur : "modifiables"),
// pour que la mise a jour de ces textes reste possible sans redeploiement.
export async function listProspectMessageTemplates() {
  const count = await prisma.prospectMessageTemplate.count();
  if (count === 0) {
    await prisma.prospectMessageTemplate.createMany({ data: DEFAULT_PROSPECT_MESSAGE_TEMPLATES, skipDuplicates: true });
  }
  return prisma.prospectMessageTemplate.findMany({ orderBy: { createdAt: "asc" } });
}

export async function updateProspectMessageTemplate(input: { templateId: string; label: string; body: string }) {
  const label = input.label.trim();
  const body = input.body.trim();
  if (!label) throw badRequest("Libellé requis.");
  if (!body) throw badRequest("Message requis.");

  const template = await prisma.prospectMessageTemplate.findUnique({ where: { id: input.templateId }, select: { id: true } });
  if (!template) throw notFound("Modèle introuvable.");

  return prisma.prospectMessageTemplate.update({ where: { id: input.templateId }, data: { label, body } });
}
