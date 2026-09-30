import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as zod from "zod";

// lib/services/schema-ai-generate.ts : contrepartie "génération" de
// lib/services/schema-ai-chat.ts (évaluation, jamais ne modifie le schéma).
// Ce service PROPOSE un ajout structuré, validé contre le catalogue avant
// tout retour au client — jamais du texte libre parsé à la main. Ce test
// exécute le vrai service transpilé (et le vrai lib/schema-editor/generated-plan.ts,
// pur zod, transpilé lui aussi), aucun appel réel à l'API Anthropic.

function httpErrorStubs() {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return { badRequest: (m: string) => new HttpError(400, m) };
}

function transpile(path: string): string {
  return ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

// Petit catalogue factice (battery/mppt), suffisant pour vérifier la
// validation des types/bornes sans dépendre du vrai catalogue (2000+ lignes,
// hors de propos pour ce test unitaire).
const FAKE_DEFINITIONS = [
  { type: "battery", label: "Batterie", handles: [{ id: "positive" }, { id: "negative" }], defaultData: { voltage: 12 } },
  {
    type: "mppt",
    label: "Régulateur MPPT",
    handles: [{ id: "pv-positive" }, { id: "pv-negative" }, { id: "bat-positive" }, { id: "bat-negative" }],
    defaultData: {},
  },
];

function loadService(deps: { createImpl?: (params: unknown) => Promise<unknown> }) {
  const generatedPlanSource = transpile("lib/schema-editor/generated-plan.ts");
  const generatedPlanModule = { exports: {} as Record<string, unknown> };
  vm.runInNewContext(generatedPlanSource, {
    module: generatedPlanModule,
    exports: generatedPlanModule.exports,
    require: (id: string) => {
      if (id === "zod") return zod;
      throw new Error(`Unexpected import ${id} in generated-plan.ts`);
    },
  });

  const source = transpile("lib/services/schema-ai-generate.ts");
  const loadedModule = { exports: {} as Record<string, unknown> };
  const createCalls: unknown[] = [];
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id: string) => {
      if (id === "@/lib/http-errors") return httpErrorStubs();
      if (id === "@/lib/server/anthropic") {
        return {
          getAnthropicClient: () => ({
            messages: {
              create: async (params: unknown) => {
                createCalls.push(params);
                return (deps.createImpl ?? (async () => ({ content: [{ type: "text", text: "Réponse par défaut." }] })))(params);
              },
            },
          }),
        };
      }
      if (id === "@/lib/ai/schema-summary") return { buildSchemaSummaryText: () => "Composants (0) :\n(aucun)\n\nCâbles (0) :\n(aucun)" };
      if (id === "@/lib/electrical-components/definitions") {
        return {
          COMPONENT_DEFINITIONS: FAKE_DEFINITIONS,
          getComponentDefinition: (type: string) => FAKE_DEFINITIONS.find((d) => d.type === type),
          getEffectiveHandles: (def: { handles: { id: string }[] }) => def.handles,
        };
      }
      if (id === "@/lib/electrical-components/brand-models") {
        return {
          getBrandModelsForType: (type: string) =>
            type === "mppt"
              ? [{ id: "victron-smartsolar-100-20", brand: "Victron", model: "SmartSolar 100/20", componentType: "mppt", defaults: { amperage: 20 } }]
              : [],
        };
      }
      if (id === "@/lib/schema-editor/generated-plan") return generatedPlanModule.exports;
      if (id === "@/lib/ai/schema-ai-models") {
        return { SCHEMA_AI_MODELS: { "claude-opus-5": "Opus 5", "claude-sonnet-5": "Sonnet 5" }, schemaAiModelSchema: zod.z.enum(["claude-opus-5", "claude-sonnet-5"]) };
      }
      if (id === "zod") return zod;
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return { service: loadedModule.exports, createCalls };
}

interface TestPlan {
  zoneLabel: string;
  zoneWidth: number;
  zoneHeight: number;
  components: { key: string; type: string; label: string }[];
  edges: { sourceKey: string; sourceHandle: string; targetKey: string; targetHandle: string }[];
}

type GenerateFn = (
  history: { role: "user" | "assistant"; content: string }[],
  nodes: unknown[],
  edges: unknown[],
  projectName: string,
  model?: string
) => Promise<{ kind: "message"; text: string } | { kind: "plan"; intro: string; plan: TestPlan }>;

const VALID_PLAN_TOOL_INPUT = {
  intro: "Voici un chargeur solaire pour votre batterie.",
  zoneLabel: "Solaire",
  zoneWidth: 400,
  zoneHeight: 260,
  components: [
    { key: "battery-1", type: "battery", label: "Batterie", dataOverride: {}, offsetX: 0, offsetY: 0 },
    { key: "mppt-1", type: "mppt", label: "MPPT", dataOverride: {}, offsetX: 200, offsetY: 0 },
  ],
  edges: [{ sourceKey: "mppt-1", sourceHandle: "bat-positive", targetKey: "battery-1", targetHandle: "positive" }],
};

test("generateSchemaPlan: renvoie un message texte quand l'IA pose une question plutôt que de proposer un plan", async () => {
  const { service } = loadService({
    createImpl: async () => ({ content: [{ type: "text", text: "Quelle capacité de batterie (Ah) ?" }] }),
  });
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  const result = await generateSchemaPlan([{ role: "user", content: "Ajoute un panneau solaire" }], [], [], "Van");

  // JSON.stringify plutôt que deepEqual : l'objet vient du code transpilé
  // exécuté dans un contexte vm distinct (realm différent).
  assert.equal(JSON.stringify(result), JSON.stringify({ kind: "message", text: "Quelle capacité de batterie (Ah) ?" }));
});

test("generateSchemaPlan: renvoie un plan validé quand l'IA appelle l'outil avec une proposition cohérente", async () => {
  const { service, createCalls } = loadService({
    createImpl: async () => ({
      content: [{ type: "tool_use", name: "propose_schema_plan", input: VALID_PLAN_TOOL_INPUT }],
    }),
  });
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  const result = await generateSchemaPlan([{ role: "user", content: "Ajoute un panneau solaire + MPPT sur ma batterie 12V" }], [], [], "Van");

  assert.equal(result.kind, "plan");
  if (result.kind !== "plan") return;
  assert.equal(result.intro, "Voici un chargeur solaire pour votre batterie.");
  assert.equal(result.plan.components.length, 2);
  assert.equal(result.plan.edges.length, 1);
  assert.equal("intro" in result.plan, false, "intro ne doit pas polluer le plan appliqué au store");

  // Catalogue Victron transmis au modèle (préférence par défaut demandée).
  const params = createCalls[0] as { system: string; tools: { name: string }[] };
  assert.match(params.system, /Victron/);
  assert.equal(params.tools[0].name, "propose_schema_plan");
});

test("generateSchemaPlan: rejette un plan qui invente un type de composant hors catalogue", async () => {
  const { service } = loadService({
    createImpl: async () => ({
      content: [
        {
          type: "tool_use",
          name: "propose_schema_plan",
          input: { ...VALID_PLAN_TOOL_INPUT, components: [{ key: "x", type: "inverter-magique", label: "?", dataOverride: {}, offsetX: 0, offsetY: 0 }], edges: [] },
        },
      ],
    }),
  });
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  await assert.rejects(() => generateSchemaPlan([{ role: "user", content: "..." }], [], [], "Van"), /type de composant inconnu/);
});

test("generateSchemaPlan: rejette un plan qui invente une borne qui n'existe pas sur le composant", async () => {
  const { service } = loadService({
    createImpl: async () => ({
      content: [
        {
          type: "tool_use",
          name: "propose_schema_plan",
          input: {
            ...VALID_PLAN_TOOL_INPUT,
            edges: [{ sourceKey: "mppt-1", sourceHandle: "borne-imaginaire", targetKey: "battery-1", targetHandle: "positive" }],
          },
        },
      ],
    }),
  });
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  await assert.rejects(() => generateSchemaPlan([{ role: "user", content: "..." }], [], [], "Van"), /n'a pas de borne/);
});

test("generateSchemaPlan: rejette un plan qui référence un modèle de marque inexistant pour ce type", async () => {
  const { service } = loadService({
    createImpl: async () => ({
      content: [
        {
          type: "tool_use",
          name: "propose_schema_plan",
          input: {
            ...VALID_PLAN_TOOL_INPUT,
            components: [
              VALID_PLAN_TOOL_INPUT.components[0],
              { ...VALID_PLAN_TOOL_INPUT.components[1], dataOverride: { brandModelId: "victron-modele-invente" } },
            ],
          },
        },
      ],
    }),
  });
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  await assert.rejects(() => generateSchemaPlan([{ role: "user", content: "..." }], [], [], "Van"), /modèle de marque inconnu/);
});

test("generateSchemaPlan: accepte un modèle de marque réel présent dans le catalogue transmis", async () => {
  const { service } = loadService({
    createImpl: async () => ({
      content: [
        {
          type: "tool_use",
          name: "propose_schema_plan",
          input: {
            ...VALID_PLAN_TOOL_INPUT,
            components: [
              VALID_PLAN_TOOL_INPUT.components[0],
              { ...VALID_PLAN_TOOL_INPUT.components[1], dataOverride: { brandModelId: "victron-smartsolar-100-20" } },
            ],
          },
        },
      ],
    }),
  });
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  const result = await generateSchemaPlan([{ role: "user", content: "..." }], [], [], "Van");
  assert.equal(result.kind, "plan");
});

test("generateSchemaPlan: rejette un plan mal formé (aucun composant)", async () => {
  const { service } = loadService({
    createImpl: async () => ({
      content: [{ type: "tool_use", name: "propose_schema_plan", input: { ...VALID_PLAN_TOOL_INPUT, components: [] } }],
    }),
  });
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  await assert.rejects(() => generateSchemaPlan([{ role: "user", content: "..." }], [], [], "Van"), /plan mal formé/);
});

test("generateSchemaPlan: message d'erreur exploitable quand ni texte ni plan ne sont renvoyés", async () => {
  const { service } = loadService({
    createImpl: async () => ({ content: [{ type: "thinking", thinking: "..." }], stop_reason: "max_tokens" }),
  });
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  await assert.rejects(() => generateSchemaPlan([{ role: "user", content: "..." }], [], [], "Van"), /aucun texte exploitable.*max_tokens/);
});

test("generateSchemaPlan: transmet le modèle choisi à l'appel API (défaut : Opus 5)", async () => {
  const { service, createCalls } = loadService({
    createImpl: async () => ({ content: [{ type: "text", text: "Réponse." }] }),
  });
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  await generateSchemaPlan([{ role: "user", content: "Salut" }], [], [], "Van");
  await generateSchemaPlan([{ role: "user", content: "Salut" }], [], [], "Van", "claude-sonnet-5");

  assert.equal((createCalls[0] as { model: string }).model, "claude-opus-5");
  assert.equal((createCalls[1] as { model: string }).model, "claude-sonnet-5");
});

test("generateSchemaPlan: refuse un historique vide", async () => {
  const { service } = loadService({});
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  await assert.rejects(() => generateSchemaPlan([], [], [], "Van"), /Aucun message/);
});

test("generateSchemaPlan: refuse si le dernier message ne vient pas de l'utilisateur", async () => {
  const { service } = loadService({});
  const generateSchemaPlan = service.generateSchemaPlan as GenerateFn;

  await assert.rejects(() => generateSchemaPlan([{ role: "assistant", content: "..." }], [], [], "Van"), /dernier message doit venir de l'utilisateur/);
});
