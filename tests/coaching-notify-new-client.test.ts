import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Retour utilisateur : "rajoute automatique des contacts à mon téléphone
// si passe en client coaching" — aucune API web ne permet d'écrire
// silencieusement dans un carnet d'adresses de téléphone, donc le plus
// proche réalisable sans intégration OAuth (Google/Apple Contacts) : un
// e-mail au coach avec la fiche du client en pièce jointe (.vcf), envoyé
// dès la création d'un CoachingProject. Ce test exécute le vrai service
// transpilé (lib/services/coaching-project.ts), aucune base ni SMTP réels.

function loadService(fakePrisma: unknown, sendMailCalls: Record<string, unknown>[]) {
  const source = ts.transpileModule(readFileSync("lib/services/coaching-project.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as Record<string, (...args: unknown[]) => Promise<unknown>> };
  const loggedErrors: unknown[] = [];
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    process,
    require: (id: string) => {
      if (id === "@/lib/prisma") return fakePrisma;
      if (id === "@/lib/http-errors") {
        class HttpError extends Error {
          status: number;
          constructor(status: number, message: string) {
            super(message);
            this.status = status;
          }
        }
        return {
          badRequest: (m: string) => new HttpError(400, m),
          conflict: (m: string) => new HttpError(409, m),
          forbidden: (m: string) => new HttpError(403, m),
          notFound: (m: string) => new HttpError(404, m),
        };
      }
      if (id === "@/lib/server-log") {
        return { logServerEvent: (level: string, message: string, meta?: unknown) => { if (level === "error") loggedErrors.push({ message, meta }); } };
      }
      if (id === "@/lib/server/nodemailer") {
        return {
          sendMail: async (input: Record<string, unknown>) => {
            sendMailCalls.push(input);
          },
        };
      }
      if (id === "@/lib/customer-vcard") {
        return {
          buildCustomerVcard: (customer: { name: string | null; email: string }) => `VCARD-FOR-${customer.name ?? customer.email}`,
          customerVcardFilename: (customer: { name: string | null; email: string }) => `${customer.name ?? customer.email}.vcf`,
        };
      }
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return { service: loadedModule.exports, loggedErrors };
}

function makeFakePrisma(customer: { id: string; name: string | null; email: string; phone: string | null } | null) {
  const projects: Record<string, unknown>[] = [];
  const prisma = {
    customer: {
      findUnique: async () => (customer ? { ...customer } : null),
    },
    coachingProject: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const project = { id: "project-1", ...data };
        projects.push(project);
        return project;
      },
    },
  };
  return { prisma, projects };
}

test("notifyCoachOfNewCoachingClient envoie un e-mail avec la fiche contact (.vcf) en pièce jointe", async () => {
  const sendMailCalls: Record<string, unknown>[] = [];
  const { prisma } = makeFakePrisma({ id: "customer-1", name: "Camille Dupont", email: "camille@example.invalid", phone: "0600000000" });
  const { service } = loadService({ prisma }, sendMailCalls);

  await service.notifyCoachOfNewCoachingClient("customer-1");

  assert.equal(sendMailCalls.length, 1);
  const call = sendMailCalls[0] as { subject: string; attachments: { filename: string; content: string; contentType: string }[] };
  assert.match(call.subject, /Camille Dupont/);
  assert.equal(call.attachments.length, 1);
  assert.equal(call.attachments[0].filename, "Camille Dupont.vcf");
  assert.match(call.attachments[0].content, /VCARD-FOR-Camille Dupont/);
  assert.equal(call.attachments[0].contentType, "text/vcard");
});

test("notifyCoachOfNewCoachingClient ne fait rien si le client est introuvable (jamais de crash)", async () => {
  const sendMailCalls: Record<string, unknown>[] = [];
  const { prisma } = makeFakePrisma(null);
  const { service } = loadService({ prisma }, sendMailCalls);

  await service.notifyCoachOfNewCoachingClient("missing-customer");

  assert.equal(sendMailCalls.length, 0);
});

test("notifyCoachOfNewCoachingClient: un échec d'envoi est journalisé, jamais relancé (best-effort)", async () => {
  const { prisma } = makeFakePrisma({ id: "customer-1", name: "Camille Dupont", email: "camille@example.invalid", phone: null });
  const { service, loggedErrors } = loadService({ prisma }, []);

  // Remplace l'implémentation sendMail par une qui échoue, en passant un
  // sendMailImpl direct plutôt qu'en modifiant le mock require global.
  await service.notifyCoachOfNewCoachingClient("customer-1", async () => {
    throw new Error("SMTP indisponible");
  });

  assert.ok(loggedErrors.some((e) => (e as { message: string }).message.includes("notify coach")));
});

test("createCoachingProject notifie le coach après une création réussie", async () => {
  const sendMailCalls: Record<string, unknown>[] = [];
  const { prisma, projects } = makeFakePrisma({ id: "customer-1", name: "Camille Dupont", email: "camille@example.invalid", phone: "0600000000" });
  const { service } = loadService({ prisma }, sendMailCalls);

  const project = (await service.createCoachingProject({ customerId: "customer-1", title: "Van Sprinter" })) as { id: string };

  assert.equal(projects.length, 1, "the project is still created normally");
  assert.equal(project.id, "project-1");
  assert.equal(sendMailCalls.length, 1, "the coach is notified right after");
});

test("createCoachingProject réussit même si la notification échoue (best-effort, jamais bloquant)", async () => {
  const { prisma, projects } = makeFakePrisma({ id: "customer-1", name: "Camille Dupont", email: "camille@example.invalid", phone: null });
  const { service } = loadService({ prisma }, []);

  const project = (await service.createCoachingProject({
    customerId: "customer-1",
    title: "Van Sprinter",
    sendMailImpl: async () => {
      throw new Error("SMTP indisponible");
    },
  })) as { id: string };

  assert.equal(projects.length, 1, "project creation must succeed regardless of the notification failing");
  assert.equal(project.id, "project-1");
});
