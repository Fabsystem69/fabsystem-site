import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the real action with isolated dependencies: no database, token or email.
function loadAction(authorized: boolean, failService = false) {
  let lookups = 0;
  let requests = 0;
  const deps: Record<string, unknown> = {
    "@/lib/require-session": { requireSession: async () => { if (!authorized) throw new Error("unauthorized"); } },
    "@/lib/prisma": { prisma: { coachingProject: { findUniqueOrThrow: async () => {
      lookups++; return { customer: { email: "test@example.invalid", name: "Test" } };
    } } } },
    "@/lib/server/env": { getRequiredBaseUrl: () => "https://example.invalid" },
    "@/lib/services/customer-auth": { requestMagicLoginLink: async () => {
      requests++;
      if (failService) throw new Error("private service details");
      return { status: "created", magicLink: "https://example.invalid/test-only", expiresAt: new Date("2026-09-27T12:15:00Z") };
    } },
    "next/navigation": { redirect: () => { throw new Error("unexpected redirect"); } },
  };
  const source = ts.transpileModule(readFileSync("app/dashboard/crm/actions.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as { generateInviteLinkAction: (state: unknown, form: FormData) => Promise<{status: string; magicLink?: string; expiresAt?: string; message?: string}> } };
  vm.runInNewContext(source, { module: loadedModule, exports: loadedModule.exports, require: (id: string) => {
    if (id in deps) return deps[id];
    if (id.startsWith("@/") || id === "next/cache") return {};
    throw new Error(`Unexpected import ${id}`);
  } });
  return { invoke: () => {
    const form = new FormData(); form.set("projectId", "test-project");
    return loadedModule.exports.generateInviteLinkAction({ status: "idle" }, form);
  }, calls: () => ({ lookups, requests }) };
}

test("invitation returns actual expiry in action state without redirect", async () => {
  const action = loadAction(true);
  const result = await action.invoke();
  assert.equal(result.status, "created");
  assert.equal(result.expiresAt, "2026-09-27T12:15:00.000Z");
  assert.equal(result.magicLink, "https://example.invalid/test-only");
  assert.deepEqual(action.calls(), { lookups: 1, requests: 1 });
});

test("invitation requires admin session before accessing customer or requesting token", async () => {
  const action = loadAction(false);
  await assert.rejects(action.invoke(), /unauthorized/);
  assert.deepEqual(action.calls(), { lookups: 0, requests: 0 });
});

test("invitation reports service failure without exposing internal details", async () => {
  const result = await loadAction(true, true).invoke();
  assert.equal(result.status, "error");
  assert.equal(result.magicLink, undefined);
  assert.ok(!result.message?.includes("private service details"));
});
