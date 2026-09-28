import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Constats d'audit repris dans PROMPT_REPRISE_CLAUDE_CRM.md (défaut n°4,
// "purge dangereuse") : (1) la purge effective ne vérifiait que
// `dateLivraison`, jamais si l'avertissement avait réellement été envoyé
// avec succès — un envoi échoué n'empêchait pas la purge ; (2) un document
// dont la suppression physique échouait perdait quand même sa référence en
// base (deleteMany portait sur tout le dossier, pas seulement les fichiers
// réellement supprimés). Ce test exécute le vrai service transpilé, sans
// base de données réelle ni envoi réel, pour prouver les deux corrections.

function loadDossierNotifications(deps: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync("lib/services/dossier-notifications.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as { runDossierNotifications: (now: Date, deps: unknown) => Promise<Record<string, number>> } };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    process, // resolveFromAddress() lit process.env — absent du contexte vm par défaut.
    require: (id: string) => {
      if (id in deps) return deps[id];
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

type FakeDossier = {
  id: string;
  dateLivraison: Date;
  purgeWarningSentAt: Date | null;
  documents: { id: string; path: string }[];
  customer: { email: string; name: string | null };
};

function makeFakePrisma(dossiers: FakeDossier[]) {
  const updates: { id: string; data: Record<string, unknown> }[] = [];
  const deletedDocumentIds: string[] = [];
  const events: { dossierId: string; note: string }[] = [];

  const prisma = {
    dossierClient: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        // Étapes 1-3 (inactivité/J+30/témoignage) : hors périmètre de ce test.
        if ("derniereActivite" in where || "j30MessageEnvoye" in where || "temoignageDemande" in where) return [];
        // 4a : candidats à l'avertissement, jamais encore confirmé envoyé.
        if (where.purgeWarningSentAt === null) {
          return dossiers.filter((d) => d.purgeWarningSentAt === null && d.documents.length > 0);
        }
        // 4b : candidats à la purge effective, avertissement confirmé et ancien.
        // Clone du tableau `documents` : comme un vrai `include` Prisma, c'est
        // un instantané — muter la table source via deleteMany plus bas ne
        // doit pas changer sous les pieds le compte que le service a déjà lu.
        const versionFilter = where.purgeWarningSentAt as { lte: Date };
        return dossiers
          .filter((d) => d.purgeWarningSentAt !== null && d.purgeWarningSentAt.getTime() <= versionFilter.lte.getTime() && d.documents.length > 0)
          .map((d) => ({ ...d, documents: [...d.documents] }));
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        updates.push({ id: where.id, data });
        const dossier = dossiers.find((d) => d.id === where.id);
        if (dossier && "purgeWarningSentAt" in data) dossier.purgeWarningSentAt = data.purgeWarningSentAt as Date;
      },
    },
    dossierDocument: {
      deleteMany: async ({ where }: { where: { id: { in: string[] }; dossierId: string } }) => {
        deletedDocumentIds.push(...where.id.in);
        const dossier = dossiers.find((d) => d.id === where.dossierId);
        if (dossier) dossier.documents = dossier.documents.filter((doc) => !where.id.in.includes(doc.id));
        return { count: where.id.in.length };
      },
    },
    dossierEvent: {
      create: async ({ data }: { data: { dossierId: string; note: string } }) => {
        events.push({ dossierId: data.dossierId, note: data.note });
      },
    },
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
  };

  return { prisma, updates, deletedDocumentIds, events };
}

test("purge: un avertissement jamais confirmé bloque la purge effective, même si dateLivraison est ancienne", async () => {
  const now = new Date("2027-01-01T00:00:00Z");
  const oldDelivery = new Date("2026-01-01T00:00:00Z"); // > 365 jours avant `now`
  const dossiers: FakeDossier[] = [
    {
      id: "dossier-no-warning",
      dateLivraison: oldDelivery,
      purgeWarningSentAt: null, // l'avertissement n'a jamais été confirmé envoyé
      documents: [{ id: "doc-1", path: "doc-1.pdf" }],
      customer: { email: "client@example.invalid", name: "Client" },
    },
  ];
  const { prisma, deletedDocumentIds, events } = makeFakePrisma(dossiers);
  const sentEmails: string[] = [];

  const { runDossierNotifications } = loadDossierNotifications({
    "@/lib/prisma": { prisma },
    "@/lib/rate-limit": { tryAcquireCooldown: async () => true },
    "@/lib/server-log": { logServerEvent: () => {} },
    "@/lib/services/email-templates": { renderEmailTemplate: async () => ({ subject: "s", text: "t", html: "h" }) },
    "@/lib/server/dossier-storage": { deleteDossierDocumentFile: async (path: string) => { deletedDocumentIds.push(`file:${path}`); } },
  });

  const result = await runDossierNotifications(now, { sendMailImpl: async (opts: { to: string }) => { sentEmails.push(opts.to); } });

  // L'avertissement est envoyé (dossier livré depuis assez longtemps)...
  assert.equal(result.purgeWarningsSent, 1);
  assert.deepEqual(sentEmails, ["client@example.invalid"]);
  // ...mais la purge de CE cycle ne le concerne pas encore : purgeWarningSentAt
  // vient tout juste d'être posé par ce même cycle, donc pas "suffisamment
  // ancien" pour la requête de purge — aucun fichier ni document ne bouge.
  assert.equal(result.dossiersPurged, 0);
  assert.deepEqual(deletedDocumentIds, []);
  assert.deepEqual(events, []);
});

test("purge: un fichier dont la suppression physique échoue garde sa référence en base", async () => {
  const now = new Date("2027-01-01T00:00:00Z");
  const oldDelivery = new Date("2026-01-01T00:00:00Z");
  const oldWarning = new Date("2026-12-01T00:00:00Z"); // confirmé et assez ancien
  const dossiers: FakeDossier[] = [
    {
      id: "dossier-partial",
      dateLivraison: oldDelivery,
      purgeWarningSentAt: oldWarning,
      documents: [
        { id: "doc-ok", path: "ok.pdf" },
        { id: "doc-fails", path: "fails.pdf" },
      ],
      customer: { email: "client@example.invalid", name: "Client" },
    },
  ];
  const { prisma, deletedDocumentIds, events } = makeFakePrisma(dossiers);

  const { runDossierNotifications } = loadDossierNotifications({
    "@/lib/prisma": { prisma },
    "@/lib/rate-limit": { tryAcquireCooldown: async () => true },
    "@/lib/server-log": { logServerEvent: () => {} },
    "@/lib/services/email-templates": { renderEmailTemplate: async () => ({ subject: "s", text: "t", html: "h" }) },
    "@/lib/server/dossier-storage": {
      deleteDossierDocumentFile: async (path: string) => {
        if (path === "fails.pdf") throw new Error("disk unavailable");
      },
    },
  });

  const result = await runDossierNotifications(now, { sendMailImpl: async () => {} });

  // Seul le document réellement supprimé du stockage perd sa ligne en base.
  assert.deepEqual(deletedDocumentIds, ["doc-ok"]);
  assert.equal(dossiers[0].documents.length, 1);
  assert.equal(dossiers[0].documents[0].id, "doc-fails", "the failed file keeps its DB reference for retry");
  // Purge partielle : ne compte pas comme un dossier totalement purgé, et
  // l'événement le dit explicitement pour la relecture humaine.
  assert.equal(result.dossiersPurged, 0);
  assert.equal(events.length, 1);
  assert.match(events[0].note, /1\/2/);
  assert.match(events[0].note, /retenté/);
});
