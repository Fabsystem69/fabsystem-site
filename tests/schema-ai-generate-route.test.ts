import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { z } from "zod";

// app/api/schema-editor/ai-generate/route.ts : réservé à l'admin, jamais
// accessible à un client (même en connaissant l'URL) — même garde que
// /ai-chat. Ce test exécute la vraie route transpilée, aucune base ni appel
// réel à l'API Anthropic.

function httpErrorStubs() {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return { badRequest: (m: string) => new HttpError(400, m), forbidden: (m: string) => new HttpError(403, m) };
}

function loadRoute(deps: {
  adminSession?: { sub: string } | null;
  generateSchemaPlanImpl?: (...args: unknown[]) => Promise<unknown>;
}) {
  const source = ts.transpileModule(readFileSync("app/api/schema-editor/ai-generate/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as { POST: (req: Request) => Promise<{ status?: number; body?: unknown }> } };
  const generateCalls: unknown[] = [];
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id: string) => {
      if (id === "next/server") {
        return {
          NextResponse: {
            json: (body: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200, body }),
          },
        };
      }
      if (id === "@/lib/require-session") return { getSessionFromCookies: async () => (deps.adminSession === undefined ? { sub: "fabien@fabsystem.fr" } : deps.adminSession) };
      if (id === "@/lib/http-errors") return httpErrorStubs();
      if (id === "@/lib/server-log") return { logServerEvent: () => {} };
      if (id === "@/lib/server/error-response") {
        return {
          toErrorResponse: (error: { status?: number; message: string }) => ({ status: error.status ?? 500, body: { error: error.message } }),
        };
      }
      if (id === "@/lib/services/schema-ai-generate") {
        return {
          generateSchemaPlan: async (...args: unknown[]) => {
            generateCalls.push(args);
            return (deps.generateSchemaPlanImpl ?? (async () => ({ kind: "message", text: "Réponse." })))(...args);
          },
          schemaAiGenerateMessagesSchema: { safeParse: (value: unknown) => (Array.isArray(value) && value.length > 0 ? { success: true, data: value } : { success: false }) },
          schemaAiModelSchema: z.enum(["claude-opus-5", "claude-sonnet-5"]),
        };
      }
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return { route: loadedModule.exports, generateCalls };
}

test("POST /ai-generate: refuse un visiteur sans session admin (403)", async () => {
  const { route, generateCalls } = loadRoute({ adminSession: null });

  const response = await route.POST(
    new Request("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "salut" }], nodes: [], edges: [] }),
    })
  );

  assert.equal(response.status, 403);
  assert.equal(generateCalls.length, 0, "the AI must never be called for a non-admin request");
});

test("POST /ai-generate: refuse un corps sans nodes/edges (400)", async () => {
  const { route } = loadRoute({});

  const response = await route.POST(
    new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "salut" }] }) })
  );

  assert.equal(response.status, 400);
});

test("POST /ai-generate: refuse des messages invalides (400)", async () => {
  const { route } = loadRoute({});

  const response = await route.POST(
    new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ messages: [], nodes: [], edges: [] }) })
  );

  assert.equal(response.status, 400);
});

test("POST /ai-generate: refuse un modèle hors liste fermée (400)", async () => {
  const { route, generateCalls } = loadRoute({});

  const response = await route.POST(
    new Request("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "salut" }], nodes: [], edges: [], model: "gpt-4" }),
    })
  );

  assert.equal(response.status, 400);
  assert.equal(generateCalls.length, 0, "the AI must never be called with an unvalidated model");
});

test("POST /ai-generate: session admin valide, réponse de type message -> renvoyée telle quelle", async () => {
  const { route, generateCalls } = loadRoute({ generateSchemaPlanImpl: async () => ({ kind: "message", text: "Quelle capacité de batterie ?" }) });

  const response = await route.POST(
    new Request("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Ajoute un panneau solaire" }], nodes: [], edges: [], projectName: "Van" }),
    })
  );

  assert.equal(response.status, 200);
  assert.equal(JSON.stringify(response.body), JSON.stringify({ kind: "message", text: "Quelle capacité de batterie ?" }));
  assert.equal(generateCalls.length, 1);
});

test("POST /ai-generate: session admin valide, réponse de type plan -> renvoyée telle quelle", async () => {
  const plan = { zoneLabel: "Solaire", zoneWidth: 400, zoneHeight: 200, components: [], edges: [] };
  const { route } = loadRoute({ generateSchemaPlanImpl: async () => ({ kind: "plan", intro: "Voici une proposition.", plan }) });

  const response = await route.POST(
    new Request("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Ajoute un panneau solaire 200W + MPPT" }], nodes: [], edges: [], projectName: "Van" }),
    })
  );

  assert.equal(response.status, 200);
  assert.equal(JSON.stringify(response.body), JSON.stringify({ kind: "plan", intro: "Voici une proposition.", plan }));
});

test("POST /ai-generate: transmet le modèle choisi à generateSchemaPlan", async () => {
  const { route, generateCalls } = loadRoute({});

  await route.POST(
    new Request("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "salut" }],
        nodes: [],
        edges: [],
        projectName: "Van",
        model: "claude-sonnet-5",
      }),
    })
  );

  assert.equal(generateCalls.length, 1);
  const args = generateCalls[0] as unknown[];
  assert.equal(args[4], "claude-sonnet-5");
});
