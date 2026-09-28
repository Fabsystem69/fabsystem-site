import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Constat d'audit (défaut n°5, PROMPT_REPRISE_CLAUDE_CRM.md) :
// `createDossierClientForOrder` retournait dès que le `DossierClient`
// existait déjà (idempotence par orderId), AVANT même de tenter l'e-mail de
// confirmation. Un envoi initial en échec ne pouvait donc plus jamais être
// retenté par une redelivery Stripe, puisque le dossier existant coupait
// court avant d'atteindre le code d'envoi. Ce test exécute le vrai service
// transpilé (aucune base réelle, aucun envoi réel) pour prouver : un rejeu
// après succès ne renvoie pas l'e-mail ; un rejeu après échec le retente
// sans dupliquer le dossier.

function loadDossierClientService(deps: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync("lib/services/dossier-client.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = {
    exports: {} as { createDossierClientForOrder: (orderId: string, metadata: unknown, deps: unknown) => Promise<{ status: string; dossierId?: string }> },
  };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    process,
    require: (id: string) => {
      if (id in deps) return deps[id];
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

function makeFakePrisma() {
  const order = {
    id: "order-1",
    customerId: "customer-1",
    customerEmail: "client@example.invalid",
    customerName: "Client",
    items: [{ productSlug: "accompagnement-guide" }],
  };
  let dossier: { id: string; offre: string; confirmationEmailSentAt: Date | null } | null = null;
  const updates: Record<string, unknown>[] = [];

  const prisma = {
    order: { findUnique: async () => order },
    product: { findUnique: async () => ({ includedEditorAccessDays: 0 }) },
    dossierClient: {
      findUnique: async () => (dossier ? { ...dossier } : null),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        dossier = { id: "dossier-1", offre: data.offre as string, confirmationEmailSentAt: null };
        return { ...dossier };
      },
      update: async ({ where, data }: { where: { id: string }; data: { confirmationEmailSentAt: Date } }) => {
        updates.push({ ...where, ...data });
        if (dossier && dossier.id === where.id) dossier.confirmationEmailSentAt = data.confirmationEmailSentAt;
      },
    },
  };

  return { prisma, updates, createCount: () => (dossier ? 1 : 0) };
}

test("dossier confirmation: un rejeu après succès ne renvoie pas l'e-mail", async () => {
  const { prisma, updates } = makeFakePrisma();
  const sentTo: string[] = [];
  const { createDossierClientForOrder } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/server-log": { logServerEvent: () => {} },
    "@/lib/services/email-templates": { renderEmailTemplate: async () => ({ subject: "s", text: "t", html: "h" }) },
  });
  const sendMailImpl = async (opts: { to: string }) => {
    sentTo.push(opts.to);
  };

  const first = await createDossierClientForOrder("order-1", {}, { sendMailImpl });
  assert.equal(first.status, "created");
  assert.deepEqual(sentTo, ["client@example.invalid"]);
  assert.equal(updates.length, 1, "confirmationEmailSentAt recorded after a successful send");

  // Rejeu (redelivery Stripe) : le dossier existe et l'e-mail est déjà confirmé.
  const replay = await createDossierClientForOrder("order-1", {}, { sendMailImpl });
  assert.equal(replay.status, "already_exists");
  assert.deepEqual(sentTo, ["client@example.invalid"], "no duplicate email on replay after success");
});

test("dossier confirmation: un rejeu après échec d'envoi retente l'e-mail sans dupliquer le dossier", async () => {
  const { prisma, updates, createCount } = makeFakePrisma();
  const sentTo: string[] = [];
  let attempt = 0;
  const { createDossierClientForOrder } = loadDossierClientService({
    "@/lib/prisma": { prisma },
    "@/lib/server-log": { logServerEvent: () => {} },
    "@/lib/services/email-templates": { renderEmailTemplate: async () => ({ subject: "s", text: "t", html: "h" }) },
  });
  const sendMailImpl = async (opts: { to: string }) => {
    attempt += 1;
    if (attempt === 1) throw new Error("SMTP down");
    sentTo.push(opts.to);
  };

  const first = await createDossierClientForOrder("order-1", {}, { sendMailImpl });
  assert.equal(first.status, "created");
  assert.deepEqual(sentTo, [], "first attempt failed, nothing recorded as sent");
  assert.equal(updates.length, 0, "no durable proof recorded for a failed send");
  assert.equal(createCount(), 1, "the dossier itself was still created exactly once");

  // Rejeu (redelivery Stripe) : le dossier existe déjà, mais aucune preuve
  // d'envoi réussi — l'e-mail doit être retenté, pas ignoré.
  const replay = await createDossierClientForOrder("order-1", {}, { sendMailImpl });
  assert.equal(replay.status, "already_exists");
  assert.deepEqual(sentTo, ["client@example.invalid"], "retry succeeds on replay");
  assert.equal(updates.length, 1, "durable proof recorded once the retry succeeds");
  assert.equal(createCount(), 1, "still exactly one dossier — no duplicate created by the retry");
});
