import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// app/api/schema-editor/ai-chat/route.ts : réservé à l'admin, jamais
// accessible à un client (même en connaissant l'URL). Ce test exécute la
// vraie route transpilée, aucune base ni appel réel à l'API Anthropic.

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
  chatAboutSchemaImpl?: (...args: unknown[]) => Promise<string>;
}) {
  const source = ts.transpileModule(readFileSync("app/api/schema-editor/ai-chat/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as { POST: (req: Request) => Promise<{ status?: number; body?: unknown }> } };
  const chatCalls: unknown[] = [];
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
      if (id === "@/lib/services/schema-ai-chat") {
        return {
          chatAboutSchema: async (...args: unknown[]) => {
            chatCalls.push(args);
            return (deps.chatAboutSchemaImpl ?? (async () => "Réponse."))(...args);
          },
          schemaAiChatMessagesSchema: { safeParse: (value: unknown) => (Array.isArray(value) && value.length > 0 ? { success: true, data: value } : { success: false }) },
        };
      }
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return { route: loadedModule.exports, chatCalls };
}

test("POST /ai-chat: refuse un visiteur sans session admin (403)", async () => {
  const { route, chatCalls } = loadRoute({ adminSession: null });

  const response = await route.POST(
    new Request("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "salut" }], nodes: [], edges: [] }),
    })
  );

  assert.equal(response.status, 403);
  assert.equal(chatCalls.length, 0, "the AI must never be called for a non-admin request");
});

test("POST /ai-chat: refuse un corps sans nodes/edges (400)", async () => {
  const { route } = loadRoute({});

  const response = await route.POST(
    new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "salut" }] }) })
  );

  assert.equal(response.status, 400);
});

test("POST /ai-chat: refuse des messages invalides (400)", async () => {
  const { route } = loadRoute({});

  const response = await route.POST(
    new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ messages: [], nodes: [], edges: [] }) })
  );

  assert.equal(response.status, 400);
});

test("POST /ai-chat: session admin valide -> appelle chatAboutSchema et renvoie la réponse", async () => {
  const { route, chatCalls } = loadRoute({ chatAboutSchemaImpl: async () => "Voici mon avis sur ce schéma." });

  const response = await route.POST(
    new Request("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Évalue ce schéma" }], nodes: [], edges: [], projectName: "Van" }),
    })
  );

  assert.equal(response.status, 200);
  // JSON.stringify plutôt que deepEqual : l'objet vient du code transpilé
  // exécuté dans un contexte vm distinct (realm différent), "same structure
  // but not reference-equal" même à structure identique.
  assert.equal(JSON.stringify(response.body), JSON.stringify({ reply: "Voici mon avis sur ce schéma." }));
  assert.equal(chatCalls.length, 1);
});
