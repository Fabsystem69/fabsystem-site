import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as httpErrors from "@/lib/http-errors";
import * as meetingContract from "@/lib/crm/meeting-notes-contract";
import * as meetingFormat from "@/lib/crm/meeting-notes-format";
import * as advisoryLock from "@/lib/server/advisory-lock";
import type { MeetingCommit, MeetingExtraction, MeetingExtractRequest } from "@/lib/crm/meeting-notes-contract";

// "Compte rendu d'échange -> dossier existant (projet coaching ou prospect)".
// meeting-notes-extract.ts et meeting-notes-apply.ts importent des modules
// "server-only" (client Anthropic, prisma) : on les exécute transpilés dans
// une VM avec ces dépendances remplacées par des stubs (même technique que
// tests/crm-notes.test.ts). Aucun appel réseau ni base.

const { HttpError } = httpErrors;
const { actionDraftSchema, meetingExtractionSchema, meetingExtractRequestSchema, meetingCommitSchema } = meetingContract;
const { dueDateToDate, formatIsoDateFr, buildSessionReport, buildImportNote, detectTargetMismatch } = meetingFormat;

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
    require: (id: string) => {
      if (id in modules) return modules[id];
      throw new Error(`Unexpected import ${id} in ${path}`);
    },
  });
  return loaded.exports;
}

const SUBMISSION_KEY = "3f1c2a4e-8b7d-4c1e-9a2b-5d6e7f8a9b0c";

function isHttpStatus(status: number) {
  return (error: unknown) => error instanceof HttpError && error.status === status;
}

// ---------------------------------------------------------------- contrat

test("contrat: action sans origin -> SUGGESTION, responsible invalide -> COACH", () => {
  const parsed = actionDraftSchema.parse({ label: "Envoyer le schéma", responsible: "VOISIN", dueDate: "2026-10-10" });
  assert.equal(parsed.origin, "SUGGESTION");
  assert.equal(parsed.responsible, "COACH");
  assert.equal(parsed.dueDate, "2026-10-10");
  assert.equal(parsed.dueDateText, null);

  const unknownOrigin = actionDraftSchema.parse({ label: "x", responsible: "CLIENT", origin: "INVENTE" });
  assert.equal(unknownOrigin.origin, "SUGGESTION");
  assert.equal(unknownOrigin.responsible, "CLIENT");
  assert.equal(unknownOrigin.dueDate, null);
});

test("contrat: éléments de liste mal formés écartés sans casser le reste", () => {
  const parsed = meetingExtractionSchema.parse({
    summary: "Point sur le fourgon",
    newInfo: ["Batterie 200 Ah", 42, "   ", null, "Panneau 400 W"],
    decisions: [{ texte: "objet" }, "Passer en lithium"],
    actions: [
      { label: "Envoyer devis", responsible: "COACH", origin: "NOTES", dueDate: "2026-10-10" },
      { responsible: "CLIENT" },
      "pas une action",
      { label: "   ", responsible: "COACH" },
      { label: "Mesurer le coffre", responsible: "CLIENT", origin: "NOTES" },
    ],
    mentionedPeople: ["Jérôme", ""],
  });

  assert.deepEqual(parsed.newInfo, ["Batterie 200 Ah", "Panneau 400 W"]);
  assert.deepEqual(parsed.decisions, ["Passer en lithium"]);
  assert.deepEqual(
    parsed.actions.map((action) => action.label),
    ["Envoyer devis", "Mesurer le coffre"]
  );
  assert.deepEqual(parsed.mentionedPeople, ["Jérôme"]);
  assert.deepEqual(parsed.nextMeetingTopics, []);
  assert.deepEqual(parsed.uncertainties, []);
});

test("contrat: summary vide ou absent refusé", () => {
  assert.equal(meetingExtractionSchema.safeParse({ summary: "   " }).success, false);
  assert.equal(meetingExtractionSchema.safeParse({}).success, false);
});

function validCommit(overrides: Record<string, unknown> = {}) {
  return {
    submissionKey: SUBMISSION_KEY,
    target: { kind: "coaching_project", projectId: "proj-1" },
    exchangeDate: "2026-10-02",
    summary: "Point sur l'installation",
    source: { kind: "text", photoCount: 0 },
    ...overrides,
  };
}

test("contrat commit: submissionKey non-uuid refusé, uuid accepté avec valeurs par défaut", () => {
  assert.equal(meetingCommitSchema.safeParse(validCommit({ submissionKey: "pas-un-uuid" })).success, false);
  const parsed = meetingCommitSchema.parse(validCommit());
  assert.equal(parsed.channel, "Échange");
  assert.equal(parsed.durationMinutes, 5);
  assert.deepEqual(parsed.actions, []);
});

test("contrat commit: exchangeDate requise (absente ou non ISO refusée)", () => {
  assert.equal(meetingCommitSchema.safeParse(validCommit({ exchangeDate: undefined })).success, false);
  assert.equal(meetingCommitSchema.safeParse(validCommit({ exchangeDate: "02/10/2026" })).success, false);
  assert.equal(meetingCommitSchema.safeParse(validCommit({ summary: "  " })).success, false);
});

function validExtractRequest(overrides: Record<string, unknown> = {}) {
  return { text: "Notes", exchangeDate: "2026-10-02", targetKind: "prospect", targetId: "p1", ...overrides };
}

test("contrat extraction: exchangeDate requise, texte ou photo requis", () => {
  assert.equal(meetingExtractRequestSchema.safeParse(validExtractRequest()).success, true);
  assert.equal(meetingExtractRequestSchema.safeParse(validExtractRequest({ exchangeDate: undefined })).success, false);
  assert.equal(meetingExtractRequestSchema.safeParse(validExtractRequest({ exchangeDate: "demain" })).success, false);
  assert.equal(meetingExtractRequestSchema.safeParse(validExtractRequest({ text: "  " })).success, false);
});

test("contrat extraction: plus de 5 images refusées", () => {
  const image = { mediaType: "image/jpeg", data: "aGVsbG8=" };
  const five = Array.from({ length: 5 }, () => image);
  assert.equal(meetingExtractRequestSchema.safeParse(validExtractRequest({ text: "", images: five })).success, true);
  assert.equal(
    meetingExtractRequestSchema.safeParse(validExtractRequest({ text: "", images: [...five, image] })).success,
    false
  );
  assert.equal(meetingCommitSchema.safeParse(validCommit({ source: { kind: "photos", photoCount: 6 } })).success, false);
});

// ---------------------------------------------------------------- format

function withTimeZone<T>(timeZone: string, run: () => T): T {
  const previous = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

const parisDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

for (const timeZone of ["UTC", "Pacific/Auckland", "America/Los_Angeles"]) {
  test(`dueDateToDate: midi UTC du même jour avec TZ=${timeZone}`, () => {
    withTimeZone(timeZone, () => {
      const date = dueDateToDate("2026-03-29");
      assert.ok(date);
      assert.equal(date.toISOString(), "2026-03-29T12:00:00.000Z");
      assert.equal(parisDay.format(date), "2026-03-29");
      const winter = dueDateToDate("2026-12-31");
      assert.ok(winter);
      assert.equal(winter.toISOString(), "2026-12-31T12:00:00.000Z");
    });
  });
}

test("dueDateToDate: null / undefined / vide -> null", () => {
  assert.equal(dueDateToDate(null), null);
  assert.equal(dueDateToDate(undefined), null);
  assert.equal(dueDateToDate(""), null);
});

test("formatIsoDateFr: AAAA-MM-JJ -> JJ/MM/AAAA, vide -> null", () => {
  assert.equal(formatIsoDateFr("2026-10-02"), "02/10/2026");
  assert.equal(formatIsoDateFr(null), null);
  assert.equal(formatIsoDateFr(undefined), null);
});

test("buildSessionReport: résumé + décisions, sans section vide", () => {
  assert.equal(
    buildSessionReport({ summary: "Résumé", decisions: ["Lithium", "Onduleur 2000 W"] }),
    "Résumé\n\nDécisions :\n• Lithium\n• Onduleur 2000 W"
  );
  assert.equal(buildSessionReport({ summary: "Résumé", decisions: [] }), "Résumé");
});

function fullCommit(overrides: Partial<MeetingCommit> = {}): MeetingCommit {
  return meetingCommitSchema.parse({
    ...validCommit(),
    newInfo: ["Fourgon L2H2"],
    decisions: ["Passer en lithium"],
    actions: [
      { label: "Envoyer le devis", responsible: "COACH", dueDate: "2026-10-10", origin: "NOTES" },
      { label: "Vérifier le fusible", responsible: "CLIENT", dueDate: null, origin: "SUGGESTION" },
    ],
    nextMeetingTopics: ["Câblage"],
    uncertainties: ["Mot illisible"],
    source: { kind: "mixed", photoCount: 2 },
    ...overrides,
  });
}

test("buildImportNote: marque ref, source, photos non conservées, actions suggestion", () => {
  const note = buildImportNote(fullCommit());
  assert.match(note, new RegExp(`ref:${SUBMISSION_KEY}`));
  assert.match(note, /photos et texte/);
  assert.match(note, /2 photo\(s\) non conservée\(s\)/);
  assert.match(note, /échange du 02\/10\/2026/);
  assert.match(note, /Fabien : Envoyer le devis — pour le 10\/10\/2026(?! \(suggestion\))/);
  assert.match(note, /Client : Vérifier le fusible \(suggestion\)/);
  assert.match(note, /Décisions :\n• Passer en lithium/);
  assert.match(note, /À clarifier :\n• Mot illisible/);
  assert.match(note, /Informations ajoutées :\n• Fourgon L2H2/);
});

test("buildImportNote: sans photo, pas de mention de photos non conservées", () => {
  const note = buildImportNote(fullCommit({ source: { kind: "text", photoCount: 0 } }));
  assert.match(note, /texte saisi/);
  assert.doesNotMatch(note, /non conservée/);
});

test("detectTargetMismatch: prénom commun -> null, autre personne -> avertissement, liste vide -> null", () => {
  assert.equal(detectTargetMismatch("Jérôme Dupont", ["jerome"]), null);
  assert.equal(detectTargetMismatch("Jérôme Dupont", ["Paul", "Jérôme D."]), null);
  assert.equal(detectTargetMismatch("Jérôme Dupont", []), null);
  const warning = detectTargetMismatch("Jérôme Dupont", ["Paul Martin"]);
  assert.ok(warning);
  assert.match(warning, /Paul Martin/);
  assert.match(warning, /Jérôme Dupont/);
});

// ---------------------------------------------------------------- extraction

type CreateParams = {
  system: string;
  messages: Array<{ role: string; content: Array<Record<string, unknown>> }>;
  tool_choice: { type: string };
};

const extractService = loadModule("lib/services/meeting-notes-extract.ts", {
  "@/lib/http-errors": httpErrors,
  "@/lib/crm/meeting-notes-contract": meetingContract,
  "@/lib/server/anthropic": {
    getAnthropicClient: () => {
      throw new Error("Le vrai client Anthropic ne doit jamais être utilisé en test");
    },
  },
}) as {
  extractMeetingNotes: (
    request: MeetingExtractRequest,
    context: { targetName: string },
    deps?: { client?: unknown }
  ) => Promise<MeetingExtraction>;
};

function fakeClient(content: unknown[]) {
  const calls: CreateParams[] = [];
  return {
    calls,
    client: {
      messages: {
        create: async (params: CreateParams) => {
          calls.push(params);
          return { content };
        },
      },
    },
  };
}

function toolUse(input: unknown) {
  return { type: "tool_use", id: "toolu_test", name: "enregistrer_compte_rendu", input };
}

function extractRequest(overrides: Partial<MeetingExtractRequest> = {}): MeetingExtractRequest {
  return { text: "Jérôme : passer en lithium", images: [], exchangeDate: "2026-10-02", targetKind: "prospect", targetId: "p1", ...overrides };
}

test("extractMeetingNotes: cas nominal renvoie le compte rendu normalisé", async () => {
  const { client, calls } = fakeClient([
    { type: "text", text: "Voici." },
    toolUse({
      summary: "Point lithium",
      decisions: ["Passer en lithium"],
      actions: [{ label: "Envoyer devis", responsible: "COACH", origin: "NOTES", dueDate: "2026-10-09" }, { label: "Sans origine", responsible: "X" }],
      mentionedPeople: ["Jérôme"],
    }),
  ]);
  const result = await extractService.extractMeetingNotes(extractRequest(), { targetName: "Jérôme Dupont" }, { client });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].tool_choice.type, "auto");
  assert.match(calls[0].system, /enregistrer_compte_rendu/);
  assert.equal(result.summary, "Point lithium");
  assert.deepEqual(result.decisions, ["Passer en lithium"]);
  assert.equal(result.actions.length, 2);
  assert.equal(result.actions[0].origin, "NOTES");
  assert.equal(result.actions[1].origin, "SUGGESTION");
  assert.equal(result.actions[1].responsible, "COACH");
  assert.deepEqual(result.newInfo, []);
});

test("extractMeetingNotes: pas de tool_use -> HttpError 400", async () => {
  const { client } = fakeClient([{ type: "text", text: "Je ne peux pas." }]);
  await assert.rejects(
    extractService.extractMeetingNotes(extractRequest(), { targetName: "X" }, { client }),
    isHttpStatus(400)
  );
});

test("extractMeetingNotes: tool_use d'un autre outil -> HttpError 400", async () => {
  const { client } = fakeClient([{ type: "tool_use", id: "x", name: "autre", input: { summary: "ok" } }]);
  await assert.rejects(
    extractService.extractMeetingNotes(extractRequest(), { targetName: "X" }, { client }),
    isHttpStatus(400)
  );
});

test("extractMeetingNotes: réponse sans summary -> HttpError 400 inexploitable", async () => {
  const { client } = fakeClient([toolUse({ decisions: ["x"] })]);
  await assert.rejects(
    extractService.extractMeetingNotes(extractRequest(), { targetName: "X" }, { client }),
    (error: unknown) => error instanceof HttpError && error.status === 400 && /inexploitable/.test(error.message)
  );
});

test("extractMeetingNotes: le prompt contient la date de l'échange et le nom du dossier", async () => {
  const { client, calls } = fakeClient([toolUse({ summary: "ok" })]);
  await extractService.extractMeetingNotes(extractRequest({ exchangeDate: "2026-09-18" }), { targetName: "Camille Leroy" }, { client });
  assert.match(calls[0].system, /Date de l'échange : 2026-09-18/);
  assert.match(calls[0].system, /« Camille Leroy »/);
  const textBlock = calls[0].messages[0].content.at(-1);
  assert.match(String(textBlock?.text), /passer en lithium/);
});

test("extractMeetingNotes: images en blocs base64 avant le texte", async () => {
  const { client, calls } = fakeClient([toolUse({ summary: "ok" })]);
  await extractService.extractMeetingNotes(
    extractRequest({
      text: "",
      images: [
        { mediaType: "image/jpeg", data: "AAAA" },
        { mediaType: "image/webp", data: "BBBB" },
      ],
    }),
    { targetName: "X" },
    { client }
  );

  const content = calls[0].messages[0].content;
  assert.equal(calls[0].messages[0].role, "user");
  assert.equal(content.length, 3);
  assert.equal(content[0].type, "image");
  assert.deepEqual(JSON.parse(JSON.stringify(content[0].source)), { type: "base64", media_type: "image/jpeg", data: "AAAA" });
  assert.equal(content[1].type, "image");
  assert.deepEqual(JSON.parse(JSON.stringify(content[1].source)), { type: "base64", media_type: "image/webp", data: "BBBB" });
  assert.equal(content[2].type, "text");
  assert.match(String(content[2].text), /photos/);
});

// ---------------------------------------------------------------- application (faux prisma)

type Row = Record<string, unknown>;
type State = {
  projects: Row[];
  prospects: Row[];
  sessions: Row[];
  actionItems: Row[];
  projectEvents: Row[];
  prospectEvents: Row[];
};
type Write = { txId: number; table: keyof State | "projects:update" | "prospects:update" };

function emptyState(): State {
  return { projects: [], prospects: [], sessions: [], actionItems: [], projectEvents: [], prospectEvents: [] };
}

function matchesNote(row: Row, where: Row) {
  const note = where.note as { contains?: string } | undefined;
  return !note?.contains || String(row.note ?? "").includes(note.contains);
}

// Faux client prisma transactionnel : chaque $transaction travaille sur une
// copie de l'état "commité" et ne la publie qu'en cas de succès. Une
// exception annule donc toutes les écritures, comme PostgreSQL.
function createFakePrisma(initial: State) {
  const harness = {
    committed: structuredClone(initial),
    transactions: 0,
    locks: [] as unknown[],
    writes: [] as Write[],
    failOn: null as string | null,
  };

  function makeTx(state: State, txId: number) {
    const guard = (name: string) => {
      if (harness.failOn === name) throw new Error(`échec simulé: ${name}`);
    };
    const insert = (table: keyof State, row: Row) => {
      const created = { id: `${table}-${state[table].length + 1}`, ...row };
      state[table] = [...state[table], created];
      harness.writes = [...harness.writes, { txId, table }];
      return created;
    };
    const patch = (table: "projects" | "prospects", id: unknown, data: Row) => {
      state[table] = state[table].map((row) => (row.id === id ? { ...row, ...data } : row));
      harness.writes = [...harness.writes, { txId, table: `${table}:update` }];
      return state[table].find((row) => row.id === id);
    };

    return {
      $executeRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
        assert.match(strings.join("?"), /pg_advisory_xact_lock/);
        harness.locks = [...harness.locks, ...values];
        return [];
      },
      coachingProject: {
        findUnique: async ({ where }: { where: Row }) => state.projects.find((row) => row.id === where.id) ?? null,
        update: async ({ where, data }: { where: Row; data: Row }) => patch("projects", where.id, data),
      },
      coachingProjectEvent: {
        findFirst: async ({ where }: { where: Row }) =>
          state.projectEvents.find((row) => row.projectId === where.projectId && row.type === where.type && matchesNote(row, where)) ??
          null,
        create: async ({ data }: { data: Row }) => {
          guard("coachingProjectEvent.create");
          return insert("projectEvents", data);
        },
      },
      coachingSession: {
        create: async ({ data }: { data: Row }) => {
          guard("coachingSession.create");
          return insert("sessions", data);
        },
      },
      coachingActionItem: {
        createMany: async ({ data }: { data: Row[] }) => {
          guard("coachingActionItem.createMany");
          data.forEach((row) => insert("actionItems", row));
          return { count: data.length };
        },
      },
      prospect: {
        findUnique: async ({ where }: { where: Row }) => state.prospects.find((row) => row.id === where.id) ?? null,
        update: async ({ where, data }: { where: Row; data: Row }) => {
          guard("prospect.update");
          return patch("prospects", where.id, data);
        },
      },
      prospectEvent: {
        findFirst: async ({ where }: { where: Row }) =>
          state.prospectEvents.find((row) => row.prospectId === where.prospectId && row.type === where.type && matchesNote(row, where)) ??
          null,
        create: async ({ data }: { data: Row }) => insert("prospectEvents", data),
      },
    };
  }

  const prisma = {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      harness.transactions += 1;
      const working = structuredClone(harness.committed);
      const result = await fn(makeTx(working, harness.transactions));
      harness.committed = working;
      return result;
    },
  };

  return { prisma, harness };
}

// Le module est chargé une fois ; chaque test installe son propre faux prisma.
const prismaSlot: { current: ReturnType<typeof createFakePrisma>["prisma"] | null } = { current: null };

const applyService = loadModule("lib/services/meeting-notes-apply.ts", {
  "@/lib/http-errors": httpErrors,
  "@/lib/crm/meeting-notes-format": meetingFormat,
  "@/lib/crm/meeting-notes-contract": meetingContract,
  "@/lib/server/advisory-lock": advisoryLock,
  "@/lib/prisma": {
    prisma: {
      $transaction: (fn: (tx: unknown) => Promise<unknown>) => {
        assert.ok(prismaSlot.current, "faux prisma non installé");
        return prismaSlot.current.$transaction(fn);
      },
    },
  },
  "@/lib/services/coaching-project-events": {
    // Même effet observable que la vraie fonction : une ligne d'événement
    // écrite via le client transactionnel reçu.
    logCoachingProjectEvent: async (
      tx: { coachingProjectEvent: { create: (args: { data: Row }) => Promise<unknown> } },
      projectId: string,
      type: string,
      _actor: unknown,
      note?: string
    ) => {
      await tx.coachingProjectEvent.create({ data: { projectId, type, authorName: "Fabien", note } });
    },
  },
}) as {
  applyMeetingNotes: (raw: unknown) => Promise<{ status: string; targetHref: string; actionCount: number }>;
};

function install(initial: State) {
  const fake = createFakePrisma(initial);
  prismaSlot.current = fake.prisma;
  return fake.harness;
}

function projectCommit(overrides: Record<string, unknown> = {}) {
  return {
    ...validCommit(),
    channel: "Téléphone",
    durationMinutes: 25,
    decisions: ["Passer en lithium"],
    nextMeetingTopics: ["Câblage"],
    actions: [
      { label: "Envoyer le devis", responsible: "COACH", dueDate: "2026-10-10", origin: "NOTES" },
      { label: "Mesurer le coffre", responsible: "CLIENT", dueDate: "2026-10-05", origin: "NOTES" },
      { label: "Lire la notice", responsible: "CLIENT", dueDate: null, origin: "SUGGESTION" },
    ],
    source: { kind: "photos", photoCount: 1 },
    ...overrides,
  };
}

function stateWithProject(): State {
  return { ...emptyState(), projects: [{ id: "proj-1", lastReviewedAt: null }] };
}

test("applyMeetingNotes coaching_project: séance REALISEE privée, actions, événement NOTES_IMPORT, une transaction", async () => {
  const harness = install(stateWithProject());
  const result = await applyService.applyMeetingNotes(projectCommit());

  assert.deepEqual({ ...result }, { status: "created", targetHref: "/dashboard/crm/projects/proj-1", actionCount: 3 });
  assert.equal(harness.transactions, 1);
  assert.deepEqual(harness.locks, [SUBMISSION_KEY]);

  const { sessions, actionItems, projectEvents, projects } = harness.committed;
  assert.equal(sessions.length, 1);
  const session = sessions[0];
  assert.equal(session.projectId, "proj-1");
  assert.equal(session.status, "REALISEE");
  assert.equal(session.sharedWithClient, false);
  assert.equal(session.durationMinutes, 25);
  assert.equal(session.channel, "Téléphone");
  assert.equal((session.scheduledAt as Date).toISOString(), "2026-10-02T12:00:00.000Z");
  assert.match(String(session.sujetsAbordes), /Décisions :\n• Passer en lithium/);
  assert.equal(session.prochaineEtape, "• Câblage");

  assert.equal(actionItems.length, 3);
  assert.deepEqual(
    actionItems.map((item) => [item.label, item.responsible, item.sessionId, item.projectId]),
    [
      ["Envoyer le devis", "COACH", session.id, "proj-1"],
      ["Mesurer le coffre", "CLIENT", session.id, "proj-1"],
      ["Lire la notice", "CLIENT", session.id, "proj-1"],
    ]
  );
  assert.equal((actionItems[0].dueDate as Date).toISOString(), "2026-10-10T12:00:00.000Z");
  assert.equal((actionItems[1].dueDate as Date).toISOString(), "2026-10-05T12:00:00.000Z");
  assert.equal(actionItems[2].dueDate, null);

  assert.equal(projectEvents.length, 1);
  assert.equal(projectEvents[0].type, `NOTES_IMPORT:${SUBMISSION_KEY}`);
  assert.match(String(projectEvents[0].note), new RegExp(`ref:${SUBMISSION_KEY}`));
  assert.match(String(projectEvents[0].note), /Lire la notice \(suggestion\)/);
  assert.ok(projects[0].derniereActivite);

  assert.ok(harness.writes.length >= 5);
  assert.ok(harness.writes.every((write) => write.txId === 1), "toutes les écritures dans la même transaction");
});

test("applyMeetingNotes coaching_project: sans action, pas de createMany", async () => {
  const harness = install(stateWithProject());
  const result = await applyService.applyMeetingNotes(projectCommit({ actions: [] }));
  assert.equal(result.actionCount, 0);
  assert.equal(harness.committed.sessions.length, 1);
  assert.equal(harness.committed.actionItems.length, 0);
});

test("applyMeetingNotes: rejouer la même submissionKey -> already_applied sans nouvelle création", async () => {
  const harness = install(stateWithProject());
  await applyService.applyMeetingNotes(projectCommit());
  const writesAfterFirst = harness.writes.length;

  const replay = await applyService.applyMeetingNotes(projectCommit());

  assert.equal(replay.status, "already_applied");
  assert.equal(replay.targetHref, "/dashboard/crm/projects/proj-1");
  assert.equal(harness.transactions, 2);
  assert.deepEqual(harness.locks, [SUBMISSION_KEY, SUBMISSION_KEY]);
  assert.equal(harness.writes.length, writesAfterFirst);
  assert.equal(harness.committed.sessions.length, 1);
  assert.equal(harness.committed.actionItems.length, 3);
  assert.equal(harness.committed.projectEvents.length, 1);
});

test("applyMeetingNotes: l'idempotence ne dépend pas du texte de la note (note reformulée ou vidée)", async () => {
  const harness = install(stateWithProject());
  await applyService.applyMeetingNotes(projectCommit());

  // Simule une modification ulterieure du texte de la trace.
  const [event] = harness.committed.projectEvents;
  event.note = "Texte entièrement reformulé, sans la marque de référence.";

  const replay = await applyService.applyMeetingNotes(projectCommit());

  assert.equal(replay.status, "already_applied");
  assert.equal(harness.committed.sessions.length, 1);
  assert.equal(harness.committed.projectEvents.length, 1);
});

test("applyMeetingNotes: une autre submissionKey crée une nouvelle séance", async () => {
  const harness = install(stateWithProject());
  await applyService.applyMeetingNotes(projectCommit());
  const other = await applyService.applyMeetingNotes(projectCommit({ submissionKey: "9b2e7c1d-4a5f-4e3b-8c6d-1f2a3b4c5d6e" }));
  assert.equal(other.status, "created");
  assert.equal(harness.committed.sessions.length, 2);
});

for (const failing of ["coachingActionItem.createMany", "coachingProjectEvent.create"]) {
  test(`applyMeetingNotes: échec de ${failing} -> erreur remontée, rien de commité`, async () => {
    const harness = install(stateWithProject());
    harness.failOn = failing;

    await assert.rejects(applyService.applyMeetingNotes(projectCommit()), new RegExp(`échec simulé: ${failing.replace(".", "\\.")}`));

    assert.deepEqual(harness.committed, structuredClone(stateWithProject()));

    // Une nouvelle tentative avec la même clé réussit ensuite (pas de trace fantôme).
    harness.failOn = null;
    const retry = await applyService.applyMeetingNotes(projectCommit());
    assert.equal(retry.status, "created");
    assert.equal(harness.committed.sessions.length, 1);
  });
}

function prospectCommit(actions: unknown[]) {
  return projectCommit({ target: { kind: "prospect", prospectId: "pr-1" }, actions });
}

function stateWithProspect(nextAction: string | null = "Rappeler lundi"): State {
  return {
    ...emptyState(),
    prospects: [{ id: "pr-1", nextAction, nextActionAt: nextAction ? new Date("2026-09-28T09:00:00Z") : null }],
  };
}

test("applyMeetingNotes prospect: note NOTE avec ref, prochaine action = 1re COACH d'origine NOTES, ancienne mentionnée", async () => {
  const harness = install(stateWithProspect());
  const result = await applyService.applyMeetingNotes(
    prospectCommit([
      { label: "Le client mesure", responsible: "CLIENT", dueDate: "2026-10-04", origin: "NOTES" },
      { label: "Idée IA", responsible: "COACH", dueDate: "2026-10-03", origin: "SUGGESTION" },
      { label: "Envoyer le devis", responsible: "COACH", dueDate: "2026-10-10", origin: "NOTES" },
      { label: "Relancer", responsible: "COACH", dueDate: "2026-10-20", origin: "NOTES" },
    ])
  );

  assert.deepEqual({ ...result }, { status: "created", targetHref: "/dashboard/crm/prospects/pr-1", actionCount: 4 });
  assert.equal(harness.transactions, 1);
  assert.deepEqual(harness.locks, [SUBMISSION_KEY]);

  const [event] = harness.committed.prospectEvents;
  assert.equal(harness.committed.prospectEvents.length, 1);
  assert.equal(event.type, `NOTE:${SUBMISSION_KEY}`);
  assert.equal(event.prospectId, "pr-1");
  assert.match(String(event.note), new RegExp(`ref:${SUBMISSION_KEY}`));
  assert.match(String(event.note), /Prochaine action précédente remplacée : Rappeler lundi/);

  const prospect = harness.committed.prospects[0];
  assert.equal(prospect.nextAction, "Envoyer le devis");
  assert.equal((prospect.nextActionAt as Date).toISOString(), "2026-10-10T12:00:00.000Z");
  assert.ok(prospect.derniereActivite);
  assert.equal(harness.committed.sessions.length, 0);
});

test("applyMeetingNotes prospect: à défaut d'action COACH issue des notes, première COACH (suggestion)", async () => {
  const harness = install(stateWithProspect(null));
  await applyService.applyMeetingNotes(
    prospectCommit([
      { label: "Le client mesure", responsible: "CLIENT", dueDate: null, origin: "NOTES" },
      { label: "Proposer un appel", responsible: "COACH", dueDate: null, origin: "SUGGESTION" },
    ])
  );
  const prospect = harness.committed.prospects[0];
  assert.equal(prospect.nextAction, "Proposer un appel");
  assert.equal(prospect.nextActionAt, null);
  assert.doesNotMatch(String(harness.committed.prospectEvents[0].note), /précédente remplacée/);
});

test("applyMeetingNotes prospect: sans action COACH, nextAction inchangée", async () => {
  const harness = install(stateWithProspect());
  await applyService.applyMeetingNotes(
    prospectCommit([{ label: "Le client mesure", responsible: "CLIENT", dueDate: "2026-10-04", origin: "NOTES" }])
  );
  const prospect = harness.committed.prospects[0];
  assert.equal(prospect.nextAction, "Rappeler lundi");
  assert.equal((prospect.nextActionAt as Date).toISOString(), "2026-09-28T09:00:00.000Z");
  assert.ok(prospect.derniereActivite);
  assert.doesNotMatch(String(harness.committed.prospectEvents[0].note), /précédente remplacée/);
});

test("applyMeetingNotes prospect: rejouer la même clé -> already_applied, rien de plus", async () => {
  const harness = install(stateWithProspect());
  const actions = [{ label: "Envoyer le devis", responsible: "COACH", dueDate: "2026-10-10", origin: "NOTES" }];
  await applyService.applyMeetingNotes(prospectCommit(actions));
  const writes = harness.writes.length;

  const replay = await applyService.applyMeetingNotes(prospectCommit(actions));
  assert.equal(replay.status, "already_applied");
  assert.equal(harness.writes.length, writes);
  assert.equal(harness.committed.prospectEvents.length, 1);
});

test("applyMeetingNotes prospect: échec de la mise à jour -> la note n'est pas commitée", async () => {
  const harness = install(stateWithProspect());
  harness.failOn = "prospect.update";
  await assert.rejects(
    applyService.applyMeetingNotes(prospectCommit([{ label: "x", responsible: "COACH", dueDate: null, origin: "NOTES" }])),
    /échec simulé/
  );
  assert.equal(harness.committed.prospectEvents.length, 0);
  assert.equal(harness.committed.prospects[0].nextAction, "Rappeler lundi");
});

test("applyMeetingNotes: projet introuvable -> HttpError 404, rien créé", async () => {
  const harness = install(emptyState());
  await assert.rejects(applyService.applyMeetingNotes(projectCommit()), isHttpStatus(404));
  assert.equal(harness.writes.length, 0);
});

test("applyMeetingNotes: prospect introuvable -> HttpError 404", async () => {
  const harness = install(emptyState());
  await assert.rejects(applyService.applyMeetingNotes(prospectCommit([])), isHttpStatus(404));
  assert.equal(harness.writes.length, 0);
});

test("applyMeetingNotes: commit invalide -> HttpError 400 sans ouvrir de transaction", async () => {
  const harness = install(stateWithProject());
  await assert.rejects(applyService.applyMeetingNotes(projectCommit({ submissionKey: "nope" })), isHttpStatus(400));
  await assert.rejects(applyService.applyMeetingNotes({}), isHttpStatus(400));
  assert.equal(harness.transactions, 0);
});
