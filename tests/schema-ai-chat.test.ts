import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as zod from "zod";

// Retour utilisateur : "je le veux vraiment mode chat box quand je suis sur
// mon éditeur en mode admin" — assistant conversationnel sur le schéma en
// cours d'édition. Ce test exécute le vrai service transpilé
// (lib/services/schema-ai-chat.ts), aucun appel réel à l'API Anthropic.

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

function loadService(deps: {
  createImpl?: (params: unknown) => Promise<unknown>;
  computeSchemaIssuesImpl?: () => unknown[];
}) {
  const source = ts.transpileModule(readFileSync("lib/services/schema-ai-chat.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
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
      if (id === "@/lib/ai/schema-summary") {
        return { buildSchemaSummaryText: () => "Composants (0) :\n(aucun)\n\nCâbles (0) :\n(aucun)" };
      }
      if (id === "@/lib/electrical-components/checks") {
        return { computeSchemaIssues: deps.computeSchemaIssuesImpl ?? (() => []) };
      }
      if (id === "zod") return zod;
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return { service: loadedModule.exports, createCalls };
}

test("chatAboutSchema: construit les messages avec le contexte du schéma injecté dans le dernier tour", async () => {
  const { service, createCalls } = loadService({
    createImpl: async () => ({ content: [{ type: "text", text: "Voici mon avis." }] }),
  });
  const chatAboutSchema = service.chatAboutSchema as (
    history: { role: "user" | "assistant"; content: string }[],
    nodes: unknown[],
    edges: unknown[],
    projectName: string
  ) => Promise<string>;

  const reply = await chatAboutSchema(
    [
      { role: "user", content: "Bonjour" },
      { role: "assistant", content: "Bonjour, comment puis-je aider ?" },
      { role: "user", content: "Évalue ce schéma" },
    ],
    [],
    [],
    "Van Sprinter"
  );

  assert.equal(reply, "Voici mon avis.");
  assert.equal(createCalls.length, 1);
  const params = createCalls[0] as { messages: { role: string; content: string }[]; model: string };
  assert.equal(params.model, "claude-opus-5");
  assert.equal(params.messages.length, 3);
  assert.equal(params.messages[0].content, "Bonjour");
  assert.equal(params.messages[1].content, "Bonjour, comment puis-je aider ?");
  assert.match(params.messages[2].content, /Van Sprinter/);
  assert.match(params.messages[2].content, /Évalue ce schéma/);
});

test("chatAboutSchema: envoie un budget de tokens assez large pour couvrir la réflexion adaptative", async () => {
  const { service, createCalls } = loadService({
    createImpl: async () => ({ content: [{ type: "text", text: "Réponse." }] }),
  });
  const chatAboutSchema = service.chatAboutSchema as (
    history: { role: "user" | "assistant"; content: string }[],
    nodes: unknown[],
    edges: unknown[],
    projectName: string
  ) => Promise<string>;

  await chatAboutSchema([{ role: "user", content: "Évalue ce schéma" }], [], [], "Van");

  const params = createCalls[0] as { max_tokens: number; thinking: { type: string } };
  // Bug réel (retour utilisateur : "L'IA n'a renvoyé aucun texte
  // exploitable.") : à 2048, la réflexion adaptative pouvait épuiser le
  // budget avant tout texte — max_tokens couvre la réflexion ET la
  // réponse. Ce test verrouille une valeur largement suffisante.
  assert.ok(params.max_tokens >= 8000, `max_tokens (${params.max_tokens}) semble trop bas pour la réflexion adaptative`);
  assert.equal(params.thinking.type, "adaptive");
});

test("chatAboutSchema: message d'erreur exploitable quand aucun texte n'est renvoyé (ex. coupé par max_tokens)", async () => {
  const { service } = loadService({
    // Reproduit exactement le bug signalé : la réponse ne contient qu'un
    // bloc "thinking" (réflexion tronquée), aucun bloc "text".
    createImpl: async () => ({ content: [{ type: "thinking", thinking: "..." }], stop_reason: "max_tokens" }),
  });
  const chatAboutSchema = service.chatAboutSchema as (
    history: { role: "user" | "assistant"; content: string }[],
    nodes: unknown[],
    edges: unknown[],
    projectName: string
  ) => Promise<string>;

  await assert.rejects(
    () => chatAboutSchema([{ role: "user", content: "Évalue ce schéma" }], [], [], "Van"),
    /aucun texte exploitable.*max_tokens/
  );
});

test("chatAboutSchema: transmet le modèle choisi à l'appel API (défaut : Opus 5)", async () => {
  const { service, createCalls } = loadService({
    createImpl: async () => ({ content: [{ type: "text", text: "Réponse." }] }),
  });
  const chatAboutSchema = service.chatAboutSchema as (
    history: { role: "user" | "assistant"; content: string }[],
    nodes: unknown[],
    edges: unknown[],
    projectName: string,
    model?: string
  ) => Promise<string>;

  await chatAboutSchema([{ role: "user", content: "Salut" }], [], [], "Van");
  await chatAboutSchema([{ role: "user", content: "Salut" }], [], [], "Van", "claude-sonnet-5");

  assert.equal((createCalls[0] as { model: string }).model, "claude-opus-5");
  assert.equal((createCalls[1] as { model: string }).model, "claude-sonnet-5");
});

test("chatAboutSchema: refuse un historique vide", async () => {
  const { service } = loadService({});
  const chatAboutSchema = service.chatAboutSchema as (
    history: unknown[],
    nodes: unknown[],
    edges: unknown[],
    projectName: string
  ) => Promise<string>;

  await assert.rejects(() => chatAboutSchema([], [], [], "Van"), /Aucun message/);
});

test("chatAboutSchema: refuse si le dernier message ne vient pas de l'utilisateur", async () => {
  const { service } = loadService({});
  const chatAboutSchema = service.chatAboutSchema as (
    history: { role: "user" | "assistant"; content: string }[],
    nodes: unknown[],
    edges: unknown[],
    projectName: string
  ) => Promise<string>;

  await assert.rejects(
    () => chatAboutSchema([{ role: "assistant", content: "..." }], [], [], "Van"),
    /dernier message doit venir de l'utilisateur/
  );
});

test("chatAboutSchema: signale les contrôles automatiques déjà détectés dans le contexte injecté", async () => {
  const { service, createCalls } = loadService({
    computeSchemaIssuesImpl: () => [{ severity: "error", message: "Fusible manquant sur la ligne positive." }],
  });
  const chatAboutSchema = service.chatAboutSchema as (
    history: { role: "user" | "assistant"; content: string }[],
    nodes: unknown[],
    edges: unknown[],
    projectName: string
  ) => Promise<string>;

  await chatAboutSchema([{ role: "user", content: "Qu'en penses-tu ?" }], [], [], "Van");

  const params = createCalls[0] as { messages: { role: string; content: string }[] };
  assert.match(params.messages[0].content, /Fusible manquant sur la ligne positive/);
});
