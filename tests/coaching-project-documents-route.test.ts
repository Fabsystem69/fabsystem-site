import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Nouvelle route client (app/api/coaching-projects/documents/[documentId]/route.ts) :
// aucun chemin de téléchargement client n'existait pour CoachingProjectDocument
// avant ce lot (seul l'admin pouvait télécharger). Même rigueur de propriété
// que le reste de la session : un document ne doit jamais être supposé
// appartenir au client sans vérifier explicitement le projet auquel il est
// rattaché — exactement le type de faille corrigée plus tôt pour les
// suppressions d'appareil/matériel. Ce test exécute la vraie route
// transpilée (aucune base réelle) et prouve le rejet croisé entre clients.

function httpErrorStubs() {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return { HttpError, forbidden: (message: string) => new HttpError(403, message), unauthorized: (message: string) => new HttpError(401, message) };
}

function loadRoute(deps: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync("app/api/coaching-projects/documents/[documentId]/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as { GET: (req: Request, ctx: { params: Promise<{ documentId: string }> }) => Promise<unknown> } };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id: string) => {
      if (id in deps) return deps[id];
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

test("un client ne peut pas télécharger le document d'un projet appartenant à un autre client", async () => {
  const errors: unknown[] = [];
  const streamCalls: string[] = [];
  const deps = {
    "next/server": { NextResponse: class {} },
    "@/lib/http-errors": httpErrorStubs(),
    "@/lib/prisma-errors": { databaseErrorResponse: (error: unknown) => { errors.push(error); return { status: "error-response" }; } },
    "@/lib/server/coaching-project-storage": {
      getCoachingProjectDocumentStream: async (path: string) => {
        streamCalls.push(path);
        return { stream: "fake-stream", contentType: "application/pdf" };
      },
    },
    "@/lib/server/project-actor": { requireCustomerActor: async () => ({ role: "customer", customerId: "customer-A" }) },
    "@/lib/prisma": {
      prisma: {
        coachingProject: {
          findUnique: async () => ({ customerId: "customer-B" }), // le document appartient à un AUTRE client
        },
      },
    },
    "@/lib/services/coaching-project": {
      getCoachingProjectDocumentById: async () => ({ id: "doc-1", projectId: "project-of-customer-B", path: "p", filename: "f.pdf", contentType: "application/pdf" }),
    },
  };
  const route = loadRoute(deps);

  await route.GET(new Request("http://localhost/x"), { params: Promise.resolve({ documentId: "doc-1" }) });

  assert.equal(streamCalls.length, 0, "the file stream must never be opened for a document owned by another customer");
  assert.equal(errors.length, 1);
  assert.match((errors[0] as Error).message, /appartient pas/);
});

test("un client peut télécharger le document de son propre projet", async () => {
  const errors: unknown[] = [];
  const streamCalls: string[] = [];
  let responseConstructed: { body: unknown; init: unknown } | null = null;
  const deps = {
    "next/server": {
      NextResponse: class {
        constructor(body: unknown, init: unknown) {
          responseConstructed = { body, init };
        }
      },
    },
    "@/lib/http-errors": httpErrorStubs(),
    "@/lib/prisma-errors": { databaseErrorResponse: (error: unknown) => { errors.push(error); return { status: "error-response" }; } },
    "@/lib/server/coaching-project-storage": {
      getCoachingProjectDocumentStream: async (path: string) => {
        streamCalls.push(path);
        return { stream: "fake-stream", contentType: "application/pdf" };
      },
    },
    "@/lib/server/project-actor": { requireCustomerActor: async () => ({ role: "customer", customerId: "customer-A" }) },
    "@/lib/prisma": {
      prisma: {
        coachingProject: {
          findUnique: async () => ({ customerId: "customer-A" }), // même client
        },
      },
    },
    "@/lib/services/coaching-project": {
      getCoachingProjectDocumentById: async () => ({ id: "doc-1", projectId: "project-of-customer-A", path: "p", filename: "f.pdf", contentType: "application/pdf" }),
    },
  };
  const route = loadRoute(deps);

  await route.GET(new Request("http://localhost/x"), { params: Promise.resolve({ documentId: "doc-1" }) });

  assert.equal(errors.length, 0, "no forbidden/error path taken for the legitimate owner");
  assert.deepEqual(streamCalls, ["p"]);
  assert.ok(responseConstructed, "a successful NextResponse must be built");
});
