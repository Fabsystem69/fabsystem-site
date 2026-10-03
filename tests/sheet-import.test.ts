import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as httpErrors from "@/lib/http-errors";
import * as contract from "@/lib/crm/sheet-import-contract";
import * as fields from "@/lib/crm/sheet-import-fields";
import * as formatMod from "@/lib/crm/sheet-import-format";
import * as translate from "@/lib/crm/sheet-import-translate";
import * as meetingFormat from "@/lib/crm/meeting-notes-format";
import * as existing from "@/lib/crm/existing-installation";
import * as values from "@/lib/crm/discovery-sheet-values";
import * as advisory from "@/lib/server/advisory-lock";
import { buildSheetProposal } from "@/lib/crm/sheet-import-proposal";
import type { SheetExtraction, SheetExtractRequest } from "@/lib/crm/sheet-import-contract";
import type { SheetProjectSource } from "@/lib/crm/discovery-sheet-values";

const { HttpError } = httpErrors;
const KEY = "3f1c2a4e-8b7d-4c1e-9a2b-5d6e7f8a9b0c";

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

const isStatus = (status: number) => (error: unknown) => error instanceof HttpError && error.status === status;

// ---------------------------------------------------------------- fixtures

const SCALAR_KEYS = [
  "assetType", "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleEngine", "vehicleFormat", "vehicleDimensions",
  "registrationCountry", "usageCountry", "homologationNotes", "projectStage", "niveauClient", "usagePattern",
  "seasonsRegionsNotes", "travelerCount", "remoteWorkNotes", "parkingExposure", "coachingTopics", "objectifs",
  "threePriorities", "daysWithoutRecharge", "minAutonomyNoRecharge", "criticalDevicesWhenLow", "drivingHabits",
  "shorePowerAvailability", "solarPreference", "solarMounting", "solarRoofSpaceNotes", "otherEnergySources",
  "plannedEquipmentNotes", "materialBudgetCents", "laborBudgetCents", "whoDoesTheWork", "startDeadline",
  "implantationNotes", "ventilationConstraints", "outletsLightingNotes", "vehicleElectricalNotes", "vehicleElectricalSource",
];

function projectSource(overrides: Record<string, unknown> = {}): SheetProjectSource {
  return {
    ...Object.fromEntries(SCALAR_KEYS.map((key) => [key, null])),
    existingInstallation: null,
    devices: [],
    documents: [],
    ...overrides,
  } as unknown as SheetProjectSource;
}

function extraction(overrides: Record<string, unknown> = {}): SheetExtraction {
  return contract.sheetExtractionSchema.parse({ fields: [], ...overrides });
}

const read = (key: string, value: string) => ({ key, state: "READ", value });

// ---------------------------------------------------------------- proposition

test("proposition: EMPTY / ILLEGIBLE / valeur vide ne produisent aucun changement et gardent l'existant", () => {
  const proposal = buildSheetProposal(
    extraction({
      fields: [
        { key: "vehicle_brand", state: "EMPTY", value: null },
        { key: "vehicle_model", state: "ILLEGIBLE", value: "Jumpr?" },
        { key: "vehicle_year", state: "READ", value: "  " },
      ],
    }),
    projectSource({ vehicleBrand: "Fiat", vehicleModel: "Ducato", vehicleYear: "2019" }),
  );
  assert.deepEqual(proposal.changes, []);
  assert.deepEqual(
    proposal.unread.map((u) => [u.fieldKey, u.reason, u.current]),
    [["vehicle_brand", "EMPTY", "Fiat"], ["vehicle_model", "ILLEGIBLE", "Ducato"], ["vehicle_year", "EMPTY", "2019"]],
  );
});

test("proposition: champ vide aujourd'hui -> NEW coché ; contradiction -> CHANGE décoché", () => {
  const proposal = buildSheetProposal(
    extraction({ fields: [read("vehicle_brand", "Renault"), read("vehicle_model", "Master")] }),
    projectSource({ vehicleModel: "Ducato" }),
  );
  const [brand, model] = proposal.changes;
  assert.equal(brand.kind, "NEW");
  assert.equal(brand.defaultChecked, true);
  assert.equal(brand.current, null);
  assert.equal(model.kind, "CHANGE");
  assert.equal(model.defaultChecked, false);
  assert.equal(model.current, "Ducato");
  assert.equal(model.proposed, "Master");
});

test("proposition: même valeur (casse, espaces) -> sameCount, aucun changement", () => {
  const proposal = buildSheetProposal(extraction({ fields: [read("vehicle_brand", "  fiat  ")] }), projectSource({ vehicleBrand: "FIAT" }));
  assert.equal(proposal.sameCount, 1);
  assert.deepEqual(proposal.changes, []);
});

test("proposition: choix invalide -> unread INVALID_CHOICE ; option valide normalisée", () => {
  const proposal = buildSheetProposal(
    extraction({ fields: [read("usage_pattern", "Tous les jours"), read("energy_solar_preference", "souhaité"), read("project_nature", "Je ne sais pas encore")] }),
    projectSource(),
  );
  assert.deepEqual(proposal.unread.map((u) => [u.fieldKey, u.reason]), [["usage_pattern", "INVALID_CHOICE"], ["project_nature", "EMPTY"]]);
  assert.equal(proposal.changes[0].proposed, "Souhaité");
});

test("proposition: budget « 1 500 » / « 1500€ » normalisé et comparé en centimes", () => {
  const proposal = buildSheetProposal(
    extraction({ fields: [read("budget_material", "1500€"), read("budget_labor", "2 000 euros"), read("budget_who_does_work", "moi")] }),
    projectSource({ materialBudgetCents: 150000, laborBudgetCents: 100000 }),
  );
  assert.equal(proposal.sameCount, 1);
  assert.equal(proposal.changes[0].fieldKey, "budget_labor");
  assert.equal(proposal.changes[0].proposed, "2 000 €");
  assert.equal(proposal.changes[0].kind, "CHANGE");
  assert.equal(fields.parseBudgetCents("1 500"), 150000);
  assert.equal(fields.parseBudgetCents("abc"), null);
  const bad = buildSheetProposal(extraction({ fields: [read("budget_material", "beaucoup")] }), projectSource());
  assert.equal(bad.unread[0].reason, "INVALID_CHOICE");
});

test("proposition: clé inconnue, clé coach et clé sans cible -> UNKNOWN_KEY", () => {
  const proposal = buildSheetProposal(
    extraction({ fields: [read("nope", "x"), read("coach_observations", "secret"), read("contact_phone", "0600")] }),
    projectSource(),
  );
  assert.deepEqual(proposal.unread.map((u) => u.reason), ["UNKNOWN_KEY", "UNKNOWN_KEY", "UNKNOWN_KEY"]);
  assert.equal(proposal.changes.length, 0);
  assert.ok(proposal.warnings.some((w) => /Aucun champ/.test(w)));
});

test("proposition: tri-état, détail orphelin écarté, détail avec statut conservé", () => {
  const withStatus = buildSheetProposal(
    extraction({ fields: [read("existing_battery", "Présent"), read("existing_battery_detail", "100 Ah"), read("existing_solar_detail", "200 W")] }),
    projectSource(),
  );
  assert.deepEqual(withStatus.changes.map((c) => c.fieldKey), ["existing_battery", "existing_battery_detail"]);
  assert.deepEqual(withStatus.unread.map((u) => u.fieldKey), ["existing_solar_detail"]);
  assert.equal(withStatus.warnings.length > 0, true);
});

test("proposition: appareils, doublon avec le projet ou la fiche -> alreadyExists", () => {
  const proposal = buildSheetProposal(
    extraction({
      devices: [
        { name: "Frigo", quantity: 1, powerSupply: "DC12", duration: "24h", remark: null },
        { name: " ordinateur ", quantity: 2, powerSupply: "USB" },
        { name: "ORDINATEUR", quantity: 1 },
      ],
    }),
    projectSource({ devices: [{ name: "frigo", quantity: 1, powerSupply: "DC12" }] }),
  );
  assert.deepEqual(proposal.devices.map((d) => d.alreadyExists), [true, false, true]);
});

test("proposition: coach copié tel quel, beaucoup d'illisibles -> avertissement", () => {
  const illegible = Array.from({ length: 6 }, (_, i) => ({ key: `vehicle_brand${i}`, state: "ILLEGIBLE", value: null }));
  const proposal = buildSheetProposal(
    extraction({
      fields: [read("vehicle_brand", "Fiat"), { key: "vehicle_model", state: "ILLEGIBLE", value: null }, { key: "vehicle_year", state: "ILLEGIBLE", value: null }, { key: "vehicle_engine", state: "ILLEGIBLE", value: null }, { key: "vehicle_format", state: "ILLEGIBLE", value: null }, { key: "vehicle_dimensions", state: "ILLEGIBLE", value: null }, ...illegible.slice(0, 0)],
      coach: { observations: "RAS", pointsToCheck: ["a"], decisions: [], actions: [] },
    }),
    projectSource(),
  );
  assert.equal(proposal.coach.observations, "RAS");
  assert.ok(proposal.warnings.some((w) => /illisibles/.test(w)));
});

// ---------------------------------------------------------------- extraction

const extractService = loadModule("lib/services/sheet-import-extract.ts", {
  "@/lib/http-errors": httpErrors,
  "@/lib/crm/sheet-import-contract": contract,
  "@/lib/crm/sheet-import-fields": fields,
  "@/lib/server/anthropic": { getAnthropicClient: () => { throw new Error("vrai client interdit"); } },
}) as {
  extractSheetFromPhotos: (r: SheetExtractRequest, deps?: { client?: unknown }) => Promise<SheetExtraction>;
};

type CreateParams = { system: string; tool_choice: { type: string }; messages: { content: { type: string }[] }[] };

function fakeClient(content: unknown[]) {
  const calls: CreateParams[] = [];
  return { calls, client: { messages: { create: async (p: CreateParams) => (calls.push(p), { content }) } } };
}

const request = (): SheetExtractRequest => ({ images: [{ mediaType: "image/jpeg", data: "AAAA" }], exchangeDate: "2026-10-02", projectId: "p1" });
const toolUse = (input: unknown) => ({ type: "tool_use", id: "t", name: "enregistrer_lecture_fiche", input });

test("extractSheetFromPhotos: nominal, outil forcé, éléments mal formés écartés un par un", async () => {
  const { client, calls } = fakeClient([
    toolUse({
      fields: [read("vehicle_brand", "Fiat"), { key: "vehicle_model", state: "???", value: "x" }, "pas un champ", { state: "READ" }],
      devices: [{ name: "Frigo", quantity: "beaucoup", powerSupply: "XX" }, { quantity: 1 }],
      coach: { observations: "Voir batterie", actions: [{ label: "Devis", responsible: "COACH", origin: "NOTES" }, "n'importe quoi"] },
    }),
  ]);
  const result = await extractService.extractSheetFromPhotos(request(), { client });
  assert.equal(calls[0].tool_choice.type, "auto");
  assert.match(calls[0].system, /enregistrer_lecture_fiche/);
  assert.equal(calls[0].messages[0].content[0].type, "image");
  assert.equal(result.fields.length, 2);
  assert.equal(result.fields[1].state, "ILLEGIBLE");
  assert.deepEqual(result.devices.map((d) => [d.name, d.quantity, d.powerSupply]), [["Frigo", 1, "INCONNU"]]);
  assert.equal(result.coach.actions.length, 1);
});

test("extractSheetFromPhotos: le prompt contient les clés, les options et le mot ILLISIBLE, pas la section coach", async () => {
  const { client, calls } = fakeClient([toolUse({ fields: [] })]);
  await extractService.extractSheetFromPhotos(request(), { client });
  const system = calls[0].system;
  assert.match(system, /ILLISIBLE/);
  assert.match(system, /vehicle_brand/);
  assert.match(system, /existing_battery_detail/);
  assert.match(system, /« Présent » \| « Absent » \| « Je ne sais pas »/);
  assert.match(system, /2026-10-02/);
  assert.doesNotMatch(system, /coach_observations/);
});

test("extractSheetFromPhotos: pas de tool_use ou entrée non objet -> 400", async () => {
  await assert.rejects(extractService.extractSheetFromPhotos(request(), { client: fakeClient([{ type: "text", text: "x" }]).client }), isStatus(400));
  await assert.rejects(extractService.extractSheetFromPhotos(request(), { client: fakeClient([toolUse("texte")]).client }), isStatus(400));
});

// ---------------------------------------------------------------- application (faux prisma)

type Row = Record<string, unknown>;
type State = { project: Row | null; devices: Row[]; actions: Row[]; events: Row[] };

function baseProject(overrides: Row = {}): Row {
  return {
    ...Object.fromEntries(SCALAR_KEYS.map((key) => [key, null])),
    id: "proj-1",
    existingInstallation: null,
    notesInternes: null,
    questionsEnAttente: null,
    preoccupations: null,
    vehicleInfoUpdatedAt: new Date("2026-01-01"),
    usagesUpdatedAt: new Date("2026-01-01"),
    implantationUpdatedAt: new Date("2026-01-01"),
    entretienUpdatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function createFakePrisma(initial: State) {
  const harness = { committed: structuredClone(initial), transactions: 0, locks: [] as unknown[], failOn: null as string | null };
  const makeTx = (s: State) => {
    const guard = (name: string) => { if (harness.failOn === name) throw new Error(`échec simulé: ${name}`); };
    return {
      $executeRaw: async (strings: TemplateStringsArray, ...vals: unknown[]) => {
        assert.match(strings.join("?"), /pg_advisory_xact_lock/);
        harness.locks.push(...vals);
        return 0;
      },
      coachingProject: {
        findUnique: async () => s.project,
        update: async ({ data }: { data: Row }) => { guard("project.update"); s.project = { ...s.project, ...data }; return s.project; },
      },
      coachingProjectEvent: {
        findFirst: async ({ where }: { where: Row }) => s.events.find((e) => e.type === where.type && e.projectId === where.projectId) ?? null,
        create: async ({ data }: { data: Row }) => { guard("event.create"); s.events = [...s.events, data]; return data; },
      },
      coachingDevice: {
        findMany: async () => s.devices,
        create: async ({ data }: { data: Row }) => { guard("device.create"); s.devices = [...s.devices, data]; return data; },
      },
      coachingActionItem: {
        createMany: async ({ data }: { data: Row[] }) => { guard("action.createMany"); s.actions = [...s.actions, ...data]; return { count: data.length }; },
      },
    };
  };
  const prisma = {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      harness.transactions += 1;
      const working = structuredClone(harness.committed);
      const result = await fn(makeTx(working));
      harness.committed = working;
      return result;
    },
  };
  return { prisma, harness };
}

const slot: { current: ReturnType<typeof createFakePrisma>["prisma"] | null } = { current: null };

const applyService = loadModule("lib/services/sheet-import-apply.ts", {
  "@/lib/http-errors": httpErrors,
  "@/lib/crm/existing-installation": existing,
  "@/lib/crm/discovery-sheet-values": values,
  "@/lib/crm/meeting-notes-format": meetingFormat,
  "@/lib/crm/sheet-import-fields": fields,
  "@/lib/crm/sheet-import-contract": contract,
  "@/lib/crm/sheet-import-format": formatMod,
  "@/lib/crm/sheet-import-translate": translate,
  "@/lib/server/advisory-lock": advisory,
  "@/lib/prisma": { prisma: { $transaction: (fn: (tx: unknown) => Promise<unknown>) => slot.current!.$transaction(fn) } },
  "@/lib/services/coaching-project-events": {
    logCoachingProjectEvent: async (tx: { coachingProjectEvent: { create: (a: { data: Row }) => Promise<unknown> } }, projectId: string, type: string, _a: unknown, note?: string) => {
      await tx.coachingProjectEvent.create({ data: { projectId, type, authorName: "FabSystem", note } });
    },
  },
}) as { applySheetImport: (raw: unknown) => Promise<{ status: string; writtenFields: string[]; devicesCreated: number; actionCount: number; targetHref: string }> };

function install(project: Row | null = baseProject(), extra: Partial<State> = {}) {
  const fake = createFakePrisma({ project, devices: [], actions: [], events: [], ...extra });
  slot.current = fake.prisma;
  return fake.harness;
}

function commit(overrides: Record<string, unknown> = {}) {
  return { submissionKey: KEY, projectId: "proj-1", exchangeDate: "2026-10-02", fields: [], devices: [], photoCount: 2, ...overrides };
}

test("apply: seuls les champs fournis sont écrits, jetons de section mis à jour, budget en centimes", async () => {
  const harness = install(baseProject({ vehicleModel: "Ducato", usageCountry: "France" }));
  const result = await applyService.applySheetImport(
    commit({
      fields: [
        { fieldKey: "vehicle_brand", value: "Fiat" },
        { fieldKey: "vehicle_type", value: "Camping-car" },
        { fieldKey: "budget_material", value: "1 500 €" },
        { fieldKey: "usage_traveler_count", value: "2" },
      ],
    }),
  );
  const project = harness.committed.project as Row;
  assert.equal(result.status, "applied");
  assert.deepEqual([...result.writtenFields], ["vehicle_brand", "vehicle_type", "budget_material", "usage_traveler_count"]);
  assert.equal(project.vehicleBrand, "Fiat");
  assert.equal(project.vehicleModel, "Ducato");
  assert.equal(project.usageCountry, "France");
  assert.equal(project.assetType, "MOTORHOME");
  assert.equal(project.materialBudgetCents, 150000);
  assert.equal(project.laborBudgetCents, null);
  assert.ok((project.vehicleInfoUpdatedAt as Date).getTime() > new Date("2026-01-02").getTime());
  assert.ok((project.usagesUpdatedAt as Date).getTime() > new Date("2026-01-02").getTime());
  assert.equal((project.implantationUpdatedAt as Date).getTime(), new Date("2026-01-01").getTime());
  assert.equal((project.entretienUpdatedAt as Date).getTime(), new Date("2026-01-01").getTime());
  assert.equal(harness.transactions, 1);
  assert.deepEqual(harness.locks, [KEY]);
});

test("apply: existingInstallation fusionné sans effacer les autres clés, détail conservé", async () => {
  const harness = install(
    baseProject({ existingInstallation: { version: 1, items: { battery: { status: "PRESENT", detail: "100 Ah" }, solar: { status: "ABSENT", detail: null } } } }),
  );
  await applyService.applySheetImport(
    commit({ fields: [{ fieldKey: "existing_inverter", value: "Présent" }, { fieldKey: "existing_inverter_detail", value: "1000 W" }, { fieldKey: "existing_battery", value: "Je ne sais pas" }] }),
  );
  const items = ((harness.committed.project as Row).existingInstallation as { items: Record<string, unknown> }).items;
  assert.deepEqual(items.solar, { status: "ABSENT", detail: null });
  assert.deepEqual(items.inverter, { status: "PRESENT", detail: "1000 W" });
  assert.deepEqual(items.battery, { status: "UNKNOWN", detail: "100 Ah" });
  assert.ok(((harness.committed.project as Row).implantationUpdatedAt as Date).getTime() > new Date("2026-01-02").getTime());
});

test("apply: détail sans statut connu -> 400, rien écrit", async () => {
  const harness = install();
  await assert.rejects(applyService.applySheetImport(commit({ fields: [{ fieldKey: "existing_solar_detail", value: "200 W" }] })), isStatus(400));
  assert.equal((harness.committed.project as Row).existingInstallation, null);
  assert.equal(harness.committed.events.length, 0);
});

test("apply: section coach AJOUTÉE (notesInternes, questions), actions, décisions et trace", async () => {
  const harness = install(baseProject({ notesInternes: "Ancienne note", questionsEnAttente: "Ancienne question" }));
  const result = await applyService.applySheetImport(
    commit({
      fields: [{ fieldKey: "vehicle_brand", value: "Fiat" }],
      devices: [
        { name: "Frigo", quantity: 1, powerSupply: "DC12", duration: "24h", remark: "compresseur" },
        { name: "Ordinateur", quantity: 2, powerSupply: "USB", duration: null, remark: null },
      ],
      coach: {
        observations: "Client motivé",
        pointsToCheck: ["Section du câble"],
        decisions: ["Passer en lithium"],
        actions: [
          { label: "Envoyer devis", responsible: "COACH", dueDate: "2026-10-09", origin: "NOTES" },
          { label: "Mesurer coffre", responsible: "CLIENT", dueDate: null, origin: "NOTES" },
        ],
      },
    }),
  );
  const project = harness.committed.project as Row;
  assert.match(String(project.notesInternes), /^Ancienne note\n\n— Fiche manuscrite du 02\/10\/2026/);
  assert.match(String(project.notesInternes), /Client motivé$/);
  assert.match(String(project.questionsEnAttente), /^Ancienne question\n\n/);
  assert.match(String(project.questionsEnAttente), /• Section du câble/);
  assert.equal(result.devicesCreated, 2);
  assert.equal(result.actionCount, 2);
  assert.deepEqual(
    harness.committed.devices.map((d) => [d.name, d.category, d.state, d.phase, d.powerSupply, d.dataOrigin]),
    [["Frigo", "AUTRE", "ENVISAGE", "ACTUEL", "DC12", "ESTIMATION_CLIENT"], ["Ordinateur", "AUTRE", "ENVISAGE", "ACTUEL", "USB", "ESTIMATION_CLIENT"]],
  );
  assert.equal((harness.committed.actions[0].dueDate as Date).toISOString(), "2026-10-09T12:00:00.000Z");
  assert.equal(harness.committed.actions[1].responsible, "CLIENT");
  const event = harness.committed.events[0];
  assert.equal(event.type, `FICHE_IMPORT:${KEY}`);
  assert.equal(event.authorName, "FabSystem");
  const note = String(event.note);
  assert.match(note, /avant : \(vide\)/);
  assert.match(note, /2 photo\(s\) non conservée\(s\)/);
  assert.match(note, /durée : 24h/);
  assert.match(note, /Passer en lithium/);
});

test("apply: valeur précédente conservée dans la trace", async () => {
  const harness = install(baseProject({ vehicleModel: "Ducato" }));
  await applyService.applySheetImport(commit({ fields: [{ fieldKey: "vehicle_model", value: "Master" }] }));
  assert.match(String(harness.committed.events[0].note), /Modèle \[vehicle_model\] — avant : Ducato/);
});

test("apply: appareil au même nom ignoré (projet ou doublon dans le commit)", async () => {
  const harness = install(baseProject(), { devices: [{ name: "Frigo" }] });
  const result = await applyService.applySheetImport(
    commit({
      devices: [
        { name: " frigo ", quantity: 1, powerSupply: "DC12", duration: null, remark: null },
        { name: "Lampe", quantity: 3, powerSupply: "DC12", duration: null, remark: null },
        { name: "LAMPE", quantity: 1, powerSupply: "DC12", duration: null, remark: null },
      ],
    }),
  );
  assert.equal(result.devicesCreated, 1);
  assert.equal(harness.committed.devices.length, 2);
});

test("apply: rejouer la même clé -> already_applied, rien de plus", async () => {
  const harness = install();
  const body = commit({ fields: [{ fieldKey: "vehicle_brand", value: "Fiat" }], devices: [{ name: "Frigo", quantity: 1, powerSupply: "DC12", duration: null, remark: null }], coach: { observations: "x" } });
  await applyService.applySheetImport(body);
  const second = await applyService.applySheetImport(body);
  assert.equal(second.status, "already_applied");
  assert.equal(second.devicesCreated, 0);
  assert.equal(harness.committed.events.length, 1);
  assert.equal(harness.committed.devices.length, 1);
  assert.equal(String((harness.committed.project as Row).notesInternes).match(/Fiche manuscrite/g)?.length, 1);
});

test("apply: échec au milieu -> aucune écriture (transaction annulée)", async () => {
  const harness = install();
  harness.failOn = "device.create";
  await assert.rejects(
    applyService.applySheetImport(commit({ fields: [{ fieldKey: "vehicle_brand", value: "Fiat" }], devices: [{ name: "Frigo", quantity: 1, powerSupply: "DC12", duration: null, remark: null }] })),
    /échec simulé/,
  );
  assert.equal((harness.committed.project as Row).vehicleBrand, null);
  assert.equal(harness.committed.events.length, 0);
});

test("apply: projet introuvable -> 404", async () => {
  install(null);
  await assert.rejects(applyService.applySheetImport(commit()), isStatus(404));
});

test("apply: valeurs invalides, clés inconnues ou coach -> 400 sans écriture ni transaction", async () => {
  const harness = install();
  const bad = [
    [{ fieldKey: "vehicle_type", value: "Fusée" }],
    [{ fieldKey: "vehicle_type", value: "Je ne sais pas encore" }],
    [{ fieldKey: "usage_pattern", value: "Tous les jours" }],
    [{ fieldKey: "budget_material", value: "beaucoup" }],
    [{ fieldKey: "coach_observations", value: "x" }],
    [{ fieldKey: "inconnu", value: "x" }],
    [{ fieldKey: "devices_table", value: "x" }],
    [{ fieldKey: "vehicle_brand", value: "A" }, { fieldKey: "vehicle_brand", value: "B" }],
  ];
  for (const fieldsList of bad) {
    await assert.rejects(applyService.applySheetImport(commit({ fields: fieldsList })), isStatus(400));
  }
  await assert.rejects(applyService.applySheetImport({ projectId: "x" }), isStatus(400));
  assert.equal(harness.transactions, 0);
});

test("confidentialité: ce qui est coach n'est jamais lisible par readSheetAnswers", () => {
  const project = projectSource({ notesInternes: "SECRET-COACH", questionsEnAttente: "SECRET-Q", preoccupations: "SECRET-P" });
  const dump = JSON.stringify(values.readSheetAnswers(project));
  assert.doesNotMatch(dump, /SECRET/);
  assert.equal(values.readSheetValueByKey(project, "coach_observations"), null);
  assert.equal(values.readSheetValueByKey(project, "questions_open"), null);
});
