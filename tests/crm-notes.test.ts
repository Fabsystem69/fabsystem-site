import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as httpErrors from "@/lib/http-errors";
import * as notesContract from "@/lib/crm/notes-contract";
import { digitsOnly, findMatchesForEntry, type ProspectMatch } from "@/lib/services/crm-notes-match";

// "Notes en vrac -> fiches prospects CRM".
// crm-notes-extract.ts et crm-notes-apply.ts importent des modules
// "server-only" (client Anthropic, prisma) : on les exécute transpilés dans
// une VM avec ces dépendances remplacées par des stubs, comme
// tests/schema-ai-generate.test.ts. Aucun appel réseau ni base.

const { extractRequestSchema, extractedEntrySchema, MAX_NOTE_IMAGES } = notesContract;
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
    Intl,
    require: (id: string) => {
      if (id in modules) return modules[id];
      throw new Error(`Unexpected import ${id} in ${path}`);
    },
  });
  return loaded.exports;
}

type CreateParams = {
  system: string;
  messages: Array<{ role: string; content: Array<Record<string, unknown>> }>;
  tool_choice: { type: string };
};

const extractService = loadModule("lib/services/crm-notes-extract.ts", {
  "@/lib/http-errors": httpErrors,
  "@/lib/crm/notes-contract": notesContract,
  "@/lib/server/anthropic": {
    getAnthropicClient: () => {
      throw new Error("Le vrai client Anthropic ne doit jamais être utilisé en test");
    },
  },
}) as {
  extractCrmNotes: (
    request: notesContract.ExtractRequest,
    deps?: { client?: unknown; now?: Date }
  ) => Promise<notesContract.ExtractionResult>;
  buildExtractionSystemPrompt: (today: string) => string;
  formatParisDate: (now: Date) => string;
};

const applyService = loadModule("lib/services/crm-notes-apply.ts", {
  "@/lib/http-errors": httpErrors,
  "@/lib/crm/notes-contract": notesContract,
  "@/lib/server-log": { logServerEvent: () => undefined },
  "@/lib/services/prospect": {
    createProspect: () => {
      throw new Error("prisma interdit en test");
    },
    logProspectNote: () => {
      throw new Error("prisma interdit en test");
    },
    updateProspect: () => {
      throw new Error("prisma interdit en test");
    },
  },
}) as {
  toActionDate: (value: string | null) => Date | null;
  buildAppendedNote: (entry: { besoinElectricite: string | null; notes: string | null }) => string | null;
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
  return { type: "tool_use", id: "toolu_test", name: "enregistrer_notes_crm", input };
}

const NOMINAL_ENTRY = {
  name: "Jérôme Dupont",
  phone: "06 12 34 56 78",
  email: "Jerome.Dupont@Example.com",
  source: "MESSENGER",
  besoinElectricite: "Fourgon L2H2, 200 Ah lithium, 400 W solaire",
  notes: "Appel de 20 minutes",
  status: "EN_DISCUSSION",
  nextAction: "Rappeler pour devis",
  nextActionDate: "2026-10-08",
};

// ---------------------------------------------------------------- contrat

test("contrat: un email illisible devient null au lieu de faire échouer l'entrée", () => {
  const parsed = extractedEntrySchema.parse({ name: "Paul", email: "paul@@gmail", source: "AUTRE", status: "NOUVEAU" });
  assert.equal(parsed.email, null);
});

test("contrat: un email valide est conservé en minuscules", () => {
  const parsed = extractedEntrySchema.parse({ name: "Paul", email: " Paul@Gmail.COM ", source: "AUTRE", status: "NOUVEAU" });
  assert.equal(parsed.email, "paul@gmail.com");
});

test("contrat: une date non ISO devient null, une date ISO est conservée", () => {
  const bad = extractedEntrySchema.parse({ name: "Paul", nextActionDate: "jeudi prochain", source: "AUTRE", status: "NOUVEAU" });
  const frDate = extractedEntrySchema.parse({ name: "Paul", nextActionDate: "08/10/2026", source: "AUTRE", status: "NOUVEAU" });
  const good = extractedEntrySchema.parse({ name: "Paul", nextActionDate: "2026-10-08", source: "AUTRE", status: "NOUVEAU" });
  assert.equal(bad.nextActionDate, null);
  assert.equal(frDate.nextActionDate, null);
  assert.equal(good.nextActionDate, "2026-10-08");
});

test("contrat: source et status invalides retombent sur AUTRE et NOUVEAU", () => {
  const parsed = extractedEntrySchema.parse({ name: "Paul", source: "TELEPATHIE", status: "PEUT_ETRE" });
  assert.equal(parsed.source, "AUTRE");
  assert.equal(parsed.status, "NOUVEAU");
  const missing = extractedEntrySchema.parse({ name: "Paul" });
  assert.equal(missing.source, "AUTRE");
  assert.equal(missing.status, "NOUVEAU");
});

test("contrat: champs texte vides ou absents normalisés à null, nom vide refusé", () => {
  const parsed = extractedEntrySchema.parse({ name: "  Paul  ", phone: "   ", notes: undefined });
  assert.equal(parsed.name, "Paul");
  assert.equal(parsed.phone, null);
  assert.equal(parsed.notes, null);
  assert.equal(extractedEntrySchema.safeParse({ name: "   " }).success, false);
});

test("contrat: une requête sans texte ni image est refusée", () => {
  assert.equal(extractRequestSchema.safeParse({}).success, false);
  assert.equal(extractRequestSchema.safeParse({ text: "   ", images: [] }).success, false);
});

test("contrat: texte seul ou image seule acceptés", () => {
  assert.equal(extractRequestSchema.safeParse({ text: "Appel de Paul" }).success, true);
  assert.equal(extractRequestSchema.safeParse({ images: [{ mediaType: "image/png", data: "aGVsbG8=" }] }).success, true);
});

test("contrat: plus de 5 images refusées, type d'image inconnu refusé", () => {
  const image = { mediaType: "image/jpeg", data: "aGVsbG8=" };
  const max = Array.from({ length: MAX_NOTE_IMAGES }, () => image);
  assert.equal(extractRequestSchema.safeParse({ images: max }).success, true);
  assert.equal(extractRequestSchema.safeParse({ images: [...max, image] }).success, false);
  assert.equal(
    extractRequestSchema.safeParse({ images: [{ mediaType: "image/gif", data: "aGVsbG8=" }] }).success,
    false
  );
});

// ---------------------------------------------------------------- extraction

test("extractCrmNotes: cas nominal renvoie les entrées normalisées", async () => {
  const { client, calls } = fakeClient([
    { type: "text", text: "Voici les fiches." },
    toolUse({ entries: [NOMINAL_ENTRY], warnings: ["Nom incertain"] }),
  ]);

  const result = await extractService.extractCrmNotes(
    { text: "Jérôme Dupont 06 12 34 56 78", images: [] },
    { client, now: new Date("2026-10-03T10:00:00Z") }
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].tool_choice.type, "auto");
  assert.match(calls[0].system, /enregistrer_notes_crm/);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].name, "Jérôme Dupont");
  assert.equal(result.entries[0].email, "jerome.dupont@example.com");
  assert.equal(result.entries[0].status, "EN_DISCUSSION");
  assert.equal(result.entries[0].nextActionDate, "2026-10-08");
  assert.deepEqual(result.warnings, ["Nom incertain"]);
});

test("extractCrmNotes: warnings absents -> tableau vide", async () => {
  const { client } = fakeClient([toolUse({ entries: [{ name: "Paul" }] })]);
  const result = await extractService.extractCrmNotes({ text: "Paul", images: [] }, { client });
  assert.deepEqual(result.warnings, []);
  assert.equal(result.entries[0].source, "AUTRE");
});

test("extractCrmNotes: réponse sans tool_use -> HttpError 400", async () => {
  const { client } = fakeClient([{ type: "text", text: "Je ne peux pas." }]);
  await assert.rejects(
    extractService.extractCrmNotes({ text: "Paul", images: [] }, { client }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("extractCrmNotes: tool_use d'un autre outil -> HttpError 400", async () => {
  const { client } = fakeClient([{ type: "tool_use", id: "x", name: "autre_outil", input: { entries: [NOMINAL_ENTRY] } }]);
  await assert.rejects(
    extractService.extractCrmNotes({ text: "Paul", images: [] }, { client }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("extractCrmNotes: entries vides -> HttpError 400 'Aucun contact'", async () => {
  const { client } = fakeClient([toolUse({ entries: [], warnings: [] })]);
  await assert.rejects(
    extractService.extractCrmNotes({ text: "rien", images: [] }, { client }),
    (error: unknown) => error instanceof HttpError && error.status === 400 && /Aucun contact/.test(error.message)
  );
});

test("extractCrmNotes: input inexploitable -> HttpError 400", async () => {
  const { client } = fakeClient([toolUse({ entries: "pas un tableau" })]);
  await assert.rejects(
    extractService.extractCrmNotes({ text: "Paul", images: [] }, { client }),
    (error: unknown) => error instanceof HttpError && error.status === 400 && /inexploitable/.test(error.message)
  );
});

test("extractCrmNotes: le prompt système contient la date du jour fournie via deps.now", async () => {
  const { client, calls } = fakeClient([toolUse({ entries: [{ name: "Paul" }] })]);
  await extractService.extractCrmNotes({ text: "Paul", images: [] }, { client, now: new Date("2026-03-15T12:00:00Z") });
  assert.match(calls[0].system, /Date du jour : 2026-03-15 /);
});

test("formatParisDate: utilise le fuseau Europe/Paris (minuit passé à Paris, pas en UTC)", () => {
  assert.equal(extractService.formatParisDate(new Date("2026-10-03T22:30:00Z")), "2026-10-04");
  assert.equal(extractService.formatParisDate(new Date("2026-01-01T12:00:00Z")), "2026-01-01");
  assert.match(extractService.buildExtractionSystemPrompt("2026-10-04"), /Date du jour : 2026-10-04/);
});

test("extractCrmNotes: images envoyées en blocs image base64 avant le texte", async () => {
  const { client, calls } = fakeClient([toolUse({ entries: [{ name: "Paul" }] })]);
  await extractService.extractCrmNotes(
    {
      text: "",
      images: [
        { mediaType: "image/jpeg", data: "AAAA" },
        { mediaType: "image/png", data: "BBBB" },
      ],
    },
    { client }
  );

  const content = calls[0].messages[0].content;
  assert.equal(calls[0].messages[0].role, "user");
  assert.equal(content.length, 3);
  assert.equal(content[0].type, "image");
  assert.deepEqual(JSON.parse(JSON.stringify(content[0].source)), {
    type: "base64",
    media_type: "image/jpeg",
    data: "AAAA",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(content[1].source)), {
    type: "base64",
    media_type: "image/png",
    data: "BBBB",
  });
  assert.equal(content[2].type, "text");
  assert.match(String(content[2].text), /photos/);
});

test("extractCrmNotes: texte seul envoyé en un bloc texte contenant les notes", async () => {
  const { client, calls } = fakeClient([toolUse({ entries: [{ name: "Paul" }] })]);
  await extractService.extractCrmNotes({ text: "Paul veut 2 batteries", images: [] }, { client });
  const content = calls[0].messages[0].content;
  assert.equal(content.length, 1);
  assert.equal(content[0].type, "text");
  assert.match(String(content[0].text), /Paul veut 2 batteries/);
});

// ---------------------------------------------------------------- correspondances

function candidate(overrides: Partial<ProspectMatch>): ProspectMatch {
  return { id: "p1", name: "Quelqu'un", phone: null, email: null, status: "NOUVEAU", ...overrides };
}

test("digitsOnly: ne garde que les chiffres, tolère null/undefined", () => {
  assert.equal(digitsOnly("+33 (0)6.12-34"), "33061234");
  assert.equal(digitsOnly(null), "");
  assert.equal(digitsOnly(undefined), "");
});

test("findMatchesForEntry: même téléphone sous formats +33 / 06 / 0033", () => {
  const candidates = [
    candidate({ id: "a", name: "Alpha", phone: "+33 6 12 34 56 78" }),
    candidate({ id: "b", name: "Beta", phone: "0033612345678" }),
    candidate({ id: "c", name: "Gamma", phone: "06 99 99 99 99" }),
  ];
  const matches = findMatchesForEntry({ name: "Inconnu", phone: "06.12.34.56.78", email: null }, candidates);
  assert.deepEqual(
    matches.map((m) => m.id),
    ["a", "b"]
  );
});

test("findMatchesForEntry: un numéro trop court ne matche pas", () => {
  const matches = findMatchesForEntry({ name: "X", phone: "5678", email: null }, [
    candidate({ id: "a", name: "Y", phone: "06 12 34 56 78" }),
  ]);
  assert.deepEqual(matches, []);
});

test("findMatchesForEntry: même email (casse différente côté candidat)", () => {
  const matches = findMatchesForEntry({ name: "Inconnu", phone: null, email: "paul@example.com" }, [
    candidate({ id: "a", name: "Autre", email: "Paul@Example.com" }),
    candidate({ id: "b", name: "Autre2", email: "pierre@example.com" }),
  ]);
  assert.deepEqual(
    matches.map((m) => m.id),
    ["a"]
  );
});

test("findMatchesForEntry: même nom dans un autre ordre et sans accents", () => {
  const matches = findMatchesForEntry({ name: "Jérôme Dupont", phone: null, email: null }, [
    candidate({ id: "a", name: "DUPONT jerome" }),
    candidate({ id: "b", name: "Jérôme Durand" }),
  ]);
  assert.deepEqual(
    matches.map((m) => m.id),
    ["a"]
  );
});

test("findMatchesForEntry: correspondance forte (téléphone) classée avant le simple nom", () => {
  const matches = findMatchesForEntry({ name: "Jérôme Dupont", phone: "0612345678", email: null }, [
    candidate({ id: "nom", name: "Dupont Jérôme" }),
    candidate({ id: "tel", name: "J. D.", phone: "+33612345678" }),
  ]);
  assert.deepEqual(
    matches.map((m) => m.id),
    ["tel", "nom"]
  );
});

test("findMatchesForEntry: aucun match", () => {
  const matches = findMatchesForEntry({ name: "Paul Martin", phone: "0611111111", email: "paul@x.fr" }, [
    candidate({ id: "a", name: "Pierre Martin", phone: "0622222222", email: "pierre@x.fr" }),
    candidate({ id: "b", name: "Sans infos" }),
  ]);
  assert.deepEqual(matches, []);
  assert.deepEqual(findMatchesForEntry({ name: "Paul", phone: null, email: null }, []), []);
});

// ---------------------------------------------------------------- application (fonctions pures)

test("toActionDate: null -> null, date ISO -> midi UTC du même jour (indépendant du fuseau serveur)", () => {
  assert.equal(applyService.toActionDate(null), null);
  const date = applyService.toActionDate("2026-10-08");
  assert.ok(date);
  assert.equal(date.toISOString(), "2026-10-08T12:00:00.000Z");
});

test("buildAppendedNote: concatène besoin et notes, ignore les vides, null si rien", () => {
  assert.equal(
    applyService.buildAppendedNote({ besoinElectricite: "200 Ah lithium", notes: "Rappeler jeudi" }),
    "200 Ah lithium\nRappeler jeudi"
  );
  assert.equal(applyService.buildAppendedNote({ besoinElectricite: null, notes: "Rappeler jeudi" }), "Rappeler jeudi");
  assert.equal(applyService.buildAppendedNote({ besoinElectricite: "200 Ah", notes: null }), "200 Ah");
  assert.equal(applyService.buildAppendedNote({ besoinElectricite: null, notes: null }), null);
});
