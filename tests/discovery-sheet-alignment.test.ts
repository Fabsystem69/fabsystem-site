import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ASSET_TYPE_OPTIONS,
  CLIENT_LEVEL_OPTIONS,
  DAYS_WITHOUT_RECHARGE_OPTIONS,
  PROJECT_STAGE_OPTIONS,
  SOLAR_PREFERENCE_OPTIONS,
  USAGE_PATTERN_OPTIONS,
} from "@/lib/coaching-form-options";
import { DISCOVERY_SHEET_SECTIONS, DISCOVERY_SHEET_VERSION, getSheetFieldKeys } from "@/lib/crm/discovery-sheet-spec";
import {
  countUnanswered,
  readSheetAnswers,
  readSheetValueByKey,
  type SheetProjectSource,
} from "@/lib/crm/discovery-sheet-values";
import {
  mergeExistingInstallation,
  parseExistingInstallation,
  parseExistingInstallationPatch,
  readExistingInstallationPatchFromForm,
  EXISTING_INSTALLATION_LABELS,
} from "@/lib/crm/existing-installation";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const EMPTY_PROJECT: SheetProjectSource = {
  assetType: null, vehicleBrand: null, vehicleModel: null, vehicleYear: null, vehicleEngine: null,
  vehicleFormat: null, vehicleDimensions: null, registrationCountry: null, usageCountry: null,
  homologationNotes: null, projectStage: null, niveauClient: null, usagePattern: null,
  seasonsRegionsNotes: null, travelerCount: null, remoteWorkNotes: null, parkingExposure: null,
  coachingTopics: null, objectifs: null, threePriorities: null, daysWithoutRecharge: null,
  minAutonomyNoRecharge: null, criticalDevicesWhenLow: null, drivingHabits: null,
  shorePowerAvailability: null, solarPreference: null, solarMounting: null, solarRoofSpaceNotes: null,
  otherEnergySources: null, plannedEquipmentNotes: null, materialBudgetCents: null, laborBudgetCents: null,
  whoDoesTheWork: null, startDeadline: null, implantationNotes: null, ventilationConstraints: null,
  outletsLightingNotes: null, vehicleElectricalNotes: null, vehicleElectricalSource: null,
  existingInstallation: null, devices: [], documents: [],
};

test("project stage options: les 6 choix exacts, Dépannage inclus", () => {
  assert.deepEqual([...PROJECT_STAGE_OPTIONS], [
    "Idée", "Véhicule acheté", "Aménagement en cours", "Installation partielle",
    "Installation existante à modifier", "Dépannage",
  ]);
});

test("aucun <option> en dur pour les choix fermés du formulaire client et de l'admin", () => {
  const files = [
    "components/customer/mon-van/VehicleStep.tsx",
    "components/customer/mon-van/UsagesStep.tsx",
    "components/customer/mon-van/ImplantationStep.tsx",
    "app/dashboard/crm/projects/[projectId]/page.tsx",
  ];
  const allLiterals = [
    ...PROJECT_STAGE_OPTIONS, ...USAGE_PATTERN_OPTIONS, ...SOLAR_PREFERENCE_OPTIONS,
    ...DAYS_WITHOUT_RECHARGE_OPTIONS, ...CLIENT_LEVEL_OPTIONS.map((o) => o.label),
  ];
  for (const file of files) {
    const source = read(file);
    const hardcoded = [...source.matchAll(/<option[^>]*>([^<{]+)<\/option>/g)].map((m) => m[1].trim());
    for (const text of hardcoded) {
      assert.ok(!allLiterals.includes(text.replace(/&apos;/g, "'")), `${file} : <option> en dur « ${text} »`);
    }
  }
  const vehicle = read("components/customer/mon-van/VehicleStep.tsx");
  assert.match(vehicle, /PROJECT_STAGE_CHOICES/);
  assert.match(vehicle, /ASSET_TYPE_OPTIONS/);
  assert.match(vehicle, /CLIENT_LEVEL_OPTIONS/);
  const usages = read("components/customer/mon-van/UsagesStep.tsx");
  assert.match(usages, /USAGE_PATTERN_CHOICES/);
  assert.match(usages, /SOLAR_PREFERENCE_CHOICES/);
  assert.match(usages, /DAYS_WITHOUT_RECHARGE_CHOICES/);
});

test("la fiche papier reprend exactement les constantes partagées", () => {
  const fields = DISCOVERY_SHEET_SECTIONS.flatMap((section) => section.fields);
  const byKey = (key: string) => fields.find((field) => field.key === key)?.options ?? [];
  assert.deepEqual(byKey("project_nature").slice(0, 6), [...PROJECT_STAGE_OPTIONS]);
  assert.deepEqual(byKey("usage_pattern").slice(0, -1), [...USAGE_PATTERN_OPTIONS]);
  assert.deepEqual(byKey("energy_solar_preference").slice(0, -1), [...SOLAR_PREFERENCE_OPTIONS]);
  assert.deepEqual(byKey("autonomy_days").slice(0, -1), [...DAYS_WITHOUT_RECHARGE_OPTIONS]);
  assert.deepEqual(byKey("vehicle_type").slice(0, -1), ASSET_TYPE_OPTIONS.map((o) => o.label));
  for (const key of ["project_nature", "usage_pattern", "vehicle_type", "client_level", "autonomy_days", "energy_solar_preference"]) {
    assert.equal(byKey(key).at(-1), "Je ne sais pas encore", key);
  }
});

test("section 7 : 5 éléments Présent / Absent / Je ne sais pas mappés sur existingInstallation", () => {
  const section = DISCOVERY_SHEET_SECTIONS.find((s) => s.id === "existing_install");
  assert.ok(section);
  const statusFields = section.fields.filter((f) => f.kind === "checkbox-group");
  assert.deepEqual(
    statusFields.map((f) => f.prismaField),
    ["battery", "solar", "driving_charge", "shore_power", "inverter"].map((k) => `existingInstallation.${k}`),
  );
  for (const field of statusFields) assert.deepEqual(field.options, ["Présent", "Absent", "Je ne sais pas"]);
  assert.equal(section.fields.filter((f) => f.prismaField?.endsWith(".detail")).length, 5);
  assert.equal(DISCOVERY_SHEET_VERSION, "2026-10-v3");
});

test("chaque prismaField du spec existe sur le modèle CoachingProject", () => {
  const scalars = new Set<string>(Object.values(Prisma.CoachingProjectScalarFieldEnum));
  const relations = new Set(["devices", "actions"]); // relations, pas des colonnes
  for (const field of DISCOVERY_SHEET_SECTIONS.flatMap((section) => section.fields)) {
    if (!field.prismaField) continue;
    const root = field.prismaField.split(".")[0];
    assert.ok(scalars.has(root) || relations.has(root), `${field.key} -> ${field.prismaField} inconnu`);
  }
});

test("clés du spec uniques et en snake_case", () => {
  const keys = getSheetFieldKeys();
  assert.equal(new Set(keys).size, keys.length);
  for (const key of keys) assert.match(key, /^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/, key);
  for (const key of DISCOVERY_SHEET_SECTIONS.flatMap((s) => s.fields.map((f) => f.key))) {
    assert.match(key, /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/, key);
  }
});

test("readSheetAnswers : projet vide => tout display=null, jamais de section coach", () => {
  const answers = readSheetAnswers(EMPTY_PROJECT);
  assert.ok(answers.length > 20);
  assert.ok(answers.every((a) => a.display === null && !a.isUnknown));
  assert.equal(countUnanswered(answers), answers.length);
  const coachKeys = DISCOVERY_SHEET_SECTIONS.filter((s) => s.coachOnly).flatMap((s) => s.fields.map((f) => f.key));
  const privateKeys = DISCOVERY_SHEET_SECTIONS.flatMap((s) => s.fields)
    .filter((f) => ["preoccupations", "questionsEnAttente", "notesInternes"].includes(f.prismaField ?? ""))
    .map((f) => f.key);
  for (const answer of answers) {
    assert.ok(!coachKeys.includes(answer.fieldKey), answer.fieldKey);
    assert.ok(!privateKeys.includes(answer.fieldKey), answer.fieldKey);
    assert.ok(!["coach"].includes(answer.sectionId));
  }
});

test("readSheetAnswers : valeurs, budget en euros, inconnu", () => {
  const project: SheetProjectSource = {
    ...EMPTY_PROJECT,
    assetType: "VAN",
    projectStage: "Dépannage",
    niveauClient: "DEBUTANT",
    materialBudgetCents: 123450,
    laborBudgetCents: 50000,
    existingInstallation: {
      version: 1,
      items: { battery: { status: "PRESENT", detail: "100 Ah" }, solar: { status: "UNKNOWN", detail: null } },
    },
    devices: [{ name: "Frigo", quantity: 1, powerSupply: "DC12" }],
    documents: [{ filename: "plan.pdf" }],
  };
  const answers = readSheetAnswers(project);
  const get = (key: string) => answers.find((a) => a.fieldKey === key);
  assert.equal(get("vehicle_type")?.display, "Van & Fourgon");
  assert.equal(get("client_level")?.display, "Je débute");
  assert.equal(get("budget_material")?.display, "1 234,50 €");
  assert.equal(get("budget_labor")?.display, "500 €");
  assert.equal(get("existing_battery")?.display, "Présent — 100 Ah");
  assert.equal(get("existing_solar")?.isUnknown, true);
  assert.equal(get("existing_inverter")?.display, null);
  assert.equal(get("devices_table")?.display, "Frigo × 1");
  assert.equal(get("documents_list")?.display, "plan.pdf");
  assert.equal(readSheetValueByKey(project, "existing_battery"), "Présent");
  assert.equal(readSheetValueByKey(project, "existing_battery_detail"), "100 Ah");
  assert.equal(readSheetValueByKey(project, "project_nature"), "Dépannage");
  assert.equal(readSheetValueByKey(project, "coach_observations"), null);
  assert.equal(readSheetValueByKey(project, "inconnue"), null);
});

test("existing-installation : JSON invalide ou inconnu => null, sans exception", () => {
  for (const bad of [null, undefined, "{", 42, [], { version: 2, items: {} }, { version: 1, items: { toaster: { status: "PRESENT", detail: null } } }, { version: 1, items: { battery: { status: "MAYBE", detail: null } } }]) {
    assert.equal(parseExistingInstallation(bad), null);
  }
  assert.deepEqual(parseExistingInstallation({ version: 1, items: { battery: { status: "ABSENT", detail: "  " } } }), {
    version: 1, items: { battery: { status: "ABSENT", detail: null } },
  });
});

test("existing-installation : patch refuse clé inconnue, statut invalide, détail > 300", () => {
  assert.equal(parseExistingInstallationPatch({ toaster: { status: "PRESENT", detail: null } }).success, false);
  assert.equal(parseExistingInstallationPatch({ battery: { status: "OUI", detail: null } }).success, false);
  assert.equal(parseExistingInstallationPatch({ battery: { status: "PRESENT", detail: "x".repeat(301) } }).success, false);
  assert.equal(parseExistingInstallationPatch({ battery: { status: "PRESENT", detail: "x".repeat(300) } }).success, true);
});

test("existing-installation : merge immuable, n'efface jamais une clé non fournie", () => {
  const current = parseExistingInstallation({
    version: 1,
    items: { battery: { status: "PRESENT", detail: "100 Ah" }, solar: { status: "ABSENT", detail: null } },
  });
  assert.ok(current);
  const snapshot = JSON.stringify(current);
  const merged = mergeExistingInstallation(current, { solar: { status: "PRESENT", detail: "200 W" } });
  assert.equal(JSON.stringify(current), snapshot);
  assert.notEqual(merged, current);
  assert.deepEqual(merged.items.battery, { status: "PRESENT", detail: "100 Ah" });
  assert.deepEqual(merged.items.solar, { status: "PRESENT", detail: "200 W" });
  assert.deepEqual(mergeExistingInstallation(current, {}).items, current.items);
  assert.deepEqual(mergeExistingInstallation(null, { inverter: { status: "UNKNOWN", detail: null } }).items, {
    inverter: { status: "UNKNOWN", detail: null },
  });
});

test("existing-installation : formulaire, ligne non soumise = absente du patch", () => {
  const form = new FormData();
  form.set("existing_battery_status", "PRESENT");
  form.set("existing_battery_detail", " 100 Ah ");
  form.set("existing_solar_detail", "");
  const result = readExistingInstallationPatchFromForm(form);
  assert.ok(result.success);
  assert.deepEqual(result.data, { battery: { status: "PRESENT", detail: "100 Ah" } });
  const detailOnly = new FormData();
  detailOnly.set("existing_solar_detail", "2 panneaux");
  assert.equal(readExistingInstallationPatchFromForm(detailOnly).success, false);
  assert.equal(EXISTING_INSTALLATION_LABELS.driving_charge, "Recharge en roulant (alternateur / convertisseur DC-DC)");
});
