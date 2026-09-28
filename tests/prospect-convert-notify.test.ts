import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// convertProspectToClient (lib/services/prospect.ts) est le déclencheur le
// plus direct du besoin utilisateur "rajoute automatique des contacts à mon
// téléphone si passe en client coaching" : c'est exactement le moment où un
// prospect devient un client. Ce test exécute le vrai service transpilé,
// aucune base réelle — pas de test existant pour convertProspectToClient
// avant ce fichier (gap comblé au passage).

function loadService(deps: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync("lib/services/prospect.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as Record<string, (...args: unknown[]) => Promise<unknown>> };
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

function makeFakePrisma(prospect: { id: string; name: string; phone: string | null; besoinElectricite: string | null; status: string; convertedCustomerId: string | null }) {
  const tx = {
    customer: {
      upsert: async ({ create }: { create: Record<string, unknown> }) => ({ id: "customer-1", ...create }),
    },
    coachingProject: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({ id: "project-1", ...data }),
    },
    prospect: {
      update: async () => ({}),
    },
    prospectEvent: {
      create: async () => ({}),
    },
  };
  const prisma = {
    prospect: { findUnique: async () => ({ ...prospect }) },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(tx),
  };
  return prisma;
}

test("convertProspectToClient notifie le coach (fiche contact) après une conversion réussie", async () => {
  const notifyCalls: unknown[] = [];
  const prisma = makeFakePrisma({
    id: "prospect-1",
    name: "Camille Dupont",
    phone: "0600000000",
    besoinElectricite: "Van Sprinter à équiper",
    status: "COACHING_PROPOSE",
    convertedCustomerId: null,
  });
  const service = loadService({
    "@/lib/prisma": { prisma },
    "@/lib/http-errors": { badRequest: (m: string) => new Error(m), notFound: (m: string) => new Error(m) },
    "@/lib/services/coaching-project": {
      notifyCoachOfNewCoachingClient: async (customerId: string) => {
        notifyCalls.push(customerId);
      },
    },
  });

  const result = (await service.convertProspectToClient({
    prospectId: "prospect-1",
    email: "camille@example.invalid",
    projectTitle: "Van Sprinter",
  })) as { customerId: string; projectId: string };

  assert.equal(result.customerId, "customer-1");
  assert.deepEqual(notifyCalls, ["customer-1"], "the coach is notified for the newly created customer");
});
