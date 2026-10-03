import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as httpErrors from "@/lib/http-errors";
import * as reviewEmail from "@/lib/crm/review-notification-email";
import * as advisoryLock from "@/lib/server/advisory-lock";

// Transmission du projet par le client : l'enregistrement durable (readyForReviewAt
// + REVIEW_SUBMITTED) precede la notification, qui est retentable sans doublon.
// Le service est execute transpile dans une VM avec un faux prisma en memoire
// (meme technique que tests/crm-notes.test.ts) : aucun reseau, aucune base.

const { HttpError } = httpErrors;

function transpile(path: string): string {
  return ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function loadModule(path: string, modules: Record<string, unknown>) {
  const loaded = { exports: {} as Record<string, unknown> };
  vm.runInNewContext(transpile(path), {
    module: loaded,
    exports: loaded.exports,
    Error,
    Date,
    process,
    require: (id: string) => {
      if (id in modules) return modules[id];
      throw new Error(`Unexpected import ${id} in ${path}`);
    },
  });
  return loaded.exports;
}

type EventRow = { projectId: string; type: string; authorName: string; createdAt: number; inTx: boolean };
type ProjectRow = Record<string, unknown> & { id: string; customerId: string; readyForReviewAt: Date | null };

function createFakePrisma(initial: ProjectRow[]) {
  const projects = new Map(initial.map((row) => [row.id, { ...row }]));
  const events: EventRow[] = [];
  const locks = new Map<string, Promise<void>>();
  let clock = 0;
  let txDepth = 0;

  const rowFor = (id: string, args: { include?: unknown }) => {
    const row = projects.get(id);
    if (!row) return null;
    if (!args.include) return { ...row };
    return {
      ...row,
      customer: { name: "Marie Martin", email: "marie@example.com", phone: "0600000000" },
      devices: [{ name: "Frigo", quantity: 1, powerSupply: "V12" }],
      documents: [{ filename: "plan.pdf" }],
    };
  };

  const matchesType = (type: string, filter: string | { startsWith: string }) =>
    typeof filter === "string" ? type === filter : type.startsWith(filter.startsWith);

  const store = {
    coachingProject: {
      findUnique: async (args: { where: { id: string }; include?: unknown }) => rowFor(args.where.id, args),
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = projects.get(args.where.id);
        if (!row) throw new Error("not found");
        const updated = { ...row, ...args.data } as ProjectRow;
        projects.set(row.id, updated);
        return updated;
      },
      findMany: async () =>
        [...projects.values()]
          .filter((row) => row.readyForReviewAt !== null)
          .map((row) => ({
            id: row.id,
            title: row.title,
            customer: { name: "Marie Martin", email: "marie@example.com" },
            events: events.filter((e) => e.projectId === row.id && e.type.startsWith("REVIEW_")).map((e) => ({ type: e.type })),
          }))
          .filter((row) => row.events.some((e) => e.type.startsWith("REVIEW_SUBMITTED:"))),
    },
    coachingProjectEvent: {
      create: async (args: { data: { projectId: string; type: string; authorName: string } }) => {
        events.push({ ...args.data, createdAt: ++clock, inTx: txDepth > 0 });
        return args.data;
      },
      findFirst: async (args: { where: { projectId: string; type: string | { startsWith: string } } }) => {
        const found = events
          .filter((e) => e.projectId === args.where.projectId && matchesType(e.type, args.where.type))
          .sort((a, b) => b.createdAt - a.createdAt)[0];
        return found ? { id: String(found.createdAt), type: found.type } : null;
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const held: Array<() => void> = [];
      const tx = {
        ...store,
        $executeRaw: async (_strings: unknown, key: string) => {
          while (locks.has(key)) await locks.get(key);
          let release!: () => void;
          locks.set(key, new Promise<void>((resolve) => (release = resolve)));
          held.push(() => {
            locks.delete(key);
            release();
          });
        },
      };
      txDepth += 1;
      try {
        return await fn(tx);
      } finally {
        txDepth -= 1;
        held.forEach((free) => free());
      }
    },
  };
  return { store, events, projects };
}

type NotifyResult = { status: string; error?: string };
type SubmitResult = { status: string; submittedAt: Date; notified: boolean };
type Service = {
  submitProjectForReview: (id: string, actor: unknown, deps?: unknown) => Promise<SubmitResult>;
  notifyReviewSubmission: (id: string, deps?: unknown) => Promise<NotifyResult>;
  listPendingReviewNotifications: () => Promise<Array<{ projectId: string }>>;
  retryPendingReviewNotifications: (deps?: unknown) => Promise<{ pending: number; attempted: number; sent: number; failed: number }>;
};

function setup(rows?: ProjectRow[]) {
  const fake = createFakePrisma(
    rows ?? [
      {
        id: "p1",
        customerId: "c1",
        title: "Mon van",
        readyForReviewAt: null,
        notesInternes: "SECRET-NOTE-INTERNE",
        questionsEnAttente: "SECRET-QUESTION",
        actionsAPreparer: "SECRET-ACTION",
        usagePattern: "week-ends",
      },
    ]
  );
  const service = loadModule("lib/services/coaching-review-submission.ts", {
    "@/lib/http-errors": httpErrors,
    "@/lib/crm/review-notification-email": reviewEmail,
    "@/lib/crm/discovery-sheet-values": {
      readSheetAnswers: () => [
        { sectionId: "usage", sectionTitle: "Usage", fieldKey: "a", label: "A", display: "x", isUnknown: false },
        { sectionId: "usage", sectionTitle: "Usage", fieldKey: "b", label: "B", display: "Je ne sais pas", isUnknown: true },
        { sectionId: "usage", sectionTitle: "Usage", fieldKey: "c", label: "C", display: null, isUnknown: false },
      ],
      countUnanswered: (answers: Array<{ display: string | null; isUnknown: boolean }>) =>
        answers.filter((a) => a.display === null && !a.isUnknown).length,
    },
    "@/lib/prisma": { prisma: fake.store },
    "@/lib/server/advisory-lock": advisoryLock,
    "@/lib/server/env": { getRequiredBaseUrl: () => "https://example.test" },
    "@/lib/server-log": { logServerEvent: () => undefined },
  }) as Service;
  return { ...fake, service };
}

const owner = { role: "customer" as const, customerId: "c1" };
const baseDeps = (sendMailImpl: (mail: Record<string, string>) => Promise<unknown>) => ({
  sendMailImpl,
  now: () => new Date("2026-10-04T10:00:00.000Z"),
  baseUrl: "https://example.test",
});

test("la transmission pose readyForReviewAt et REVIEW_SUBMITTED dans la meme transaction", async () => {
  const { service, events, projects } = setup();
  const result = await service.submitProjectForReview("p1", owner, baseDeps(async () => undefined));

  assert.equal(result.status, "submitted");
  assert.equal(projects.get("p1")?.readyForReviewAt?.toISOString(), "2026-10-04T10:00:00.000Z");
  const submitted = events.filter((e) => e.type.startsWith("REVIEW_SUBMITTED:"));
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].type, "REVIEW_SUBMITTED:2026-10-04T10:00:00.000Z");
  assert.equal(submitted[0].inTx, true);
  assert.equal(result.notified, true);
});

test("une double transmission renvoie already_submitted sans nouvel evenement", async () => {
  const { service, events } = setup();
  const deps = baseDeps(async () => undefined);
  await service.submitProjectForReview("p1", owner, deps);
  const count = events.length;
  const second = await service.submitProjectForReview("p1", owner, deps);

  assert.equal(second.status, "already_submitted");
  assert.equal(events.length, count);
});

test("mail en echec : projet transmis, aucun marqueur, puis retry reussi, puis already_notified", async () => {
  const { service, events, projects } = setup();
  let attempts = 0;
  let failing = true;
  const deps = baseDeps(async () => {
    attempts += 1;
    if (failing) throw new Error("SMTP down");
  });

  const submit = await service.submitProjectForReview("p1", owner, deps);
  assert.equal(submit.status, "submitted");
  assert.equal(submit.notified, false);
  assert.notEqual(projects.get("p1")?.readyForReviewAt, null);
  assert.equal(events.some((e) => e.type.startsWith("REVIEW_NOTIFIED:")), false);
  assert.equal((await service.listPendingReviewNotifications()).length, 1);

  const failed = await service.notifyReviewSubmission("p1", deps);
  assert.equal(failed.status, "failed");
  assert.match(failed.error ?? "", /SMTP down/);

  failing = false;
  const sent = await service.notifyReviewSubmission("p1", deps);
  assert.equal(sent.status, "sent");
  assert.equal(events.filter((e) => e.type === "REVIEW_NOTIFIED:2026-10-04T10:00:00.000Z").length, 1);
  assert.equal((await service.listPendingReviewNotifications()).length, 0);

  const before = attempts;
  const again = await service.notifyReviewSubmission("p1", deps);
  assert.equal(again.status, "already_notified");
  assert.equal(attempts, before);
});

test("deux notifications simultanees sont serialisees : un seul envoi", async () => {
  const { service, events } = setup();
  await service.submitProjectForReview("p1", owner, baseDeps(async () => {
    throw new Error("down");
  }));

  let sends = 0;
  const slow = baseDeps(async () => {
    sends += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const results = await Promise.all([service.notifyReviewSubmission("p1", slow), service.notifyReviewSubmission("p1", slow)]);

  assert.equal(sends, 1);
  assert.deepEqual(results.map((r) => r.status).sort(), ["already_notified", "sent"]);
  assert.equal(events.filter((e) => e.type.startsWith("REVIEW_NOTIFIED:")).length, 1);
});

test("le rejeu planifie renvoie les notifications en attente et rapporte", async () => {
  const { service } = setup();
  await service.submitProjectForReview("p1", owner, baseDeps(async () => {
    throw new Error("down");
  }));
  const report = await service.retryPendingReviewNotifications(baseDeps(async () => undefined));
  assert.deepEqual({ ...report }, { pending: 1, attempted: 1, sent: 1, failed: 0 });
  const empty = await service.retryPendingReviewNotifications(baseDeps(async () => undefined));
  assert.deepEqual({ ...empty }, { pending: 0, attempted: 0, sent: 0, failed: 0 });
});

test("le mail ne contient aucun champ coach et pointe vers le dashboard protege", async () => {
  const { service } = setup();
  const mails: Array<Record<string, string>> = [];
  await service.submitProjectForReview("p1", owner, baseDeps(async (mail) => {
    mails.push(mail);
  }));

  assert.equal(mails.length, 1);
  const blob = JSON.stringify(mails[0]);
  for (const secret of ["SECRET-NOTE-INTERNE", "SECRET-QUESTION", "SECRET-ACTION"]) {
    assert.equal(blob.includes(secret), false, secret);
  }
  assert.equal(mails[0].subject, "Projet transmis : Marie Martin — Mon van");
  assert.match(mails[0].text, /https:\/\/example\.test\/dashboard\/crm\/projects\/p1/);
  assert.match(mails[0].text, /Questions non renseignées : 1/);
  assert.match(mails[0].text, /« Je ne sais pas » : 1/);
  assert.match(mails[0].text, /Pièces jointes : 1 fichier/);
});

test("le HTML du mail est echappe", () => {
  const email = reviewEmail.buildReviewNotificationEmail({
    projectId: "p1",
    title: 'Van <b>"A"</b> & Cie',
    customerName: "<script>alert(1)</script>",
    customerEmail: "x@example.com",
    customerPhone: null,
    assetType: null,
    vehicleBrand: null,
    vehicleModel: null,
    vehicleYear: null,
    projectStage: "<img src=x onerror=1>",
    usagePattern: null,
    startDeadline: null,
    materialBudgetCents: null,
    laborBudgetCents: null,
    deviceCount: 0,
    documentCount: 0,
    unknownCount: 0,
    unansweredCount: 0,
    submittedAt: new Date("2026-10-04T10:00:00.000Z"),
    baseUrl: "https://example.test/",
  });
  assert.equal(email.html.includes("<script>"), false);
  assert.equal(email.html.includes("<img"), false);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.html, /&quot;A&quot;/);
  assert.equal(/\n/.test(email.subject), false);
});

test("le projet d'un autre client est refuse, un projet inconnu est introuvable", async () => {
  const { service, events, projects } = setup();
  const deps = baseDeps(async () => undefined);

  await assert.rejects(
    () => service.submitProjectForReview("p1", { role: "customer", customerId: "autre" }, deps),
    (error: unknown) => error instanceof HttpError && error.status === 403
  );
  await assert.rejects(
    () => service.submitProjectForReview("inconnu", owner, deps),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
  await assert.rejects(
    () => service.submitProjectForReview("p1", { role: "admin" }, deps),
    (error: unknown) => error instanceof HttpError && error.status === 403
  );
  assert.equal(events.length, 0);
  assert.equal(projects.get("p1")?.readyForReviewAt, null);
});
