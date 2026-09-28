import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { buildContactMessage, buildProspectIntakeFromContactRequest } from "@/lib/contact-message";

// Scenario explicite de PLAN_AMELIORATION_CRM_FABSYSTEM.md §10 : "Contact
// web, panne de notification -> Demande retrouvable et alerte retentable".
// app/api/contact/route.ts doit desormais aussi enregistrer un Prospect
// (source SITE_WEB) AVANT de tenter l'envoi d'e-mail, pour que la demande
// reste retrouvable meme si l'e-mail echoue — sans jamais, dans l'autre
// sens, laisser un incident base de donnees empecher l'envoi de l'e-mail.
// Ce test execute la vraie route transpilee (aucune base ni SMTP reels) ;
// buildContactMessage/buildProspectIntakeFromContactRequest sont les vrais
// modules (purs, sans dependance serveur) plutot que des doublons.

function httpErrorStubs() {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return { payloadTooLarge: (message: string) => new HttpError(413, message) };
}

function loadRoute(deps: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync("app/api/contact/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadedModule = { exports: {} as any };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    process,
    Response,
    require: (id: string) => {
      if (id in deps) return deps[id];
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

const baseContactData = {
  source: "contact",
  name: "Client test",
  email: "test@example.invalid",
  phone: "0600000000",
  message: "Mon projet de van",
  company: "",
  startedAt: Date.now() - 5000,
  requestType: "Coaching",
};

function makeDeps(overrides: {
  parsedData?: Record<string, unknown>;
  createProspectImpl?: (input: unknown) => Promise<unknown>;
  sendMailImpl?: (input: unknown) => Promise<unknown>;
} = {}) {
  const callOrder: string[] = [];
  const createProspectCalls: unknown[] = [];
  const sendMailCalls: unknown[] = [];
  const loggedErrors: unknown[] = [];

  const deps = {
    "@/lib/contact-message": { buildContactMessage, buildProspectIntakeFromContactRequest },
    "@/lib/contact-request": {
      parseContactPayload: async () => ({ data: overrides.parsedData ?? baseContactData, attachments: [] }),
      assertHumanDelay: () => {},
    },
    "@/lib/http-errors": httpErrorStubs(),
    "@/lib/server/error-response": {
      toErrorResponse: (error: unknown) => ({ status: "error-response", error }),
    },
    "@/lib/rate-limit": {
      enforceRateLimit: async () => {},
      getClientIp: () => "127.0.0.1",
    },
    "@/lib/server/nodemailer": {
      sendMail: async (input: unknown) => {
        callOrder.push("sendMail");
        sendMailCalls.push(input);
        if (overrides.sendMailImpl) return overrides.sendMailImpl(input);
      },
    },
    "@/lib/server-log": {
      logServerEvent: (level: string, message: string, meta?: unknown) => {
        if (level === "error") loggedErrors.push({ message, meta });
      },
    },
    "@/lib/services/prospect": {
      createProspect: async (input: unknown) => {
        callOrder.push("createProspect");
        createProspectCalls.push(input);
        if (overrides.createProspectImpl) return overrides.createProspectImpl(input);
        return { id: "prospect-1", ...(input as Record<string, unknown>) };
      },
    },
  };

  return { deps, callOrder, createProspectCalls, sendMailCalls, loggedErrors };
}

test("une soumission valide enregistre un Prospect (source SITE_WEB) avant l'envoi de l'e-mail", async () => {
  const { deps, callOrder, createProspectCalls } = makeDeps();
  const route = loadRoute(deps);

  const response = await route.POST(new Request("http://localhost/api/contact", { method: "POST" }));

  assert.equal(response.status, 200);
  assert.deepEqual(callOrder, ["createProspect", "sendMail"], "the prospect must be persisted before the email is attempted");
  assert.equal(createProspectCalls.length, 1);
  const call = createProspectCalls[0] as Record<string, unknown>;
  assert.equal(call.source, "SITE_WEB");
  assert.equal(call.name, "Client test");
  assert.equal(call.email, "test@example.invalid");
  assert.equal(call.phone, "0600000000");
  assert.match(String(call.besoinElectricite), /Coaching/);
  assert.match(String(call.nextAction), /Répondre/);
  assert.equal(typeof (call.nextActionAt as { getTime?: unknown })?.getTime, "function");
});

test("un échec de l'enregistrement Prospect n'empêche jamais l'envoi de l'e-mail (best-effort)", async () => {
  const { deps, sendMailCalls, loggedErrors } = makeDeps({
    createProspectImpl: async () => {
      throw new Error("database unreachable");
    },
  });
  const route = loadRoute(deps);

  const response = await route.POST(new Request("http://localhost/api/contact", { method: "POST" }));

  assert.equal(response.status, 200, "the visitor's email must still go through");
  assert.equal(sendMailCalls.length, 1);
  assert.ok(
    loggedErrors.some((e) => typeof (e as { message?: string }).message === "string" && (e as { message: string }).message.includes("prospect")),
    "the prospect failure is logged, not thrown"
  );
});

test("un échec de l'envoi de l'e-mail n'empêche pas la demande d'être déjà enregistrée comme prospect", async () => {
  const { deps, createProspectCalls } = makeDeps({
    sendMailImpl: async () => {
      throw new Error("smtp down");
    },
  });
  const route = loadRoute(deps);

  const response = await route.POST(new Request("http://localhost/api/contact", { method: "POST" }));

  assert.equal((response as { status: string }).status, "error-response", "the request still surfaces the email failure to the caller");
  assert.equal(createProspectCalls.length, 1, "the demand was already saved before the email attempt failed — it stays findable in the CRM");
});

test("un déclenchement du piège à bots (honeypot) n'enregistre aucun Prospect", async () => {
  const { deps, createProspectCalls, sendMailCalls } = makeDeps({
    parsedData: { ...baseContactData, company: "I am a bot" },
  });
  const route = loadRoute(deps);

  const response = await route.POST(new Request("http://localhost/api/contact", { method: "POST" }));

  assert.equal(response.status, 200);
  assert.equal(createProspectCalls.length, 0);
  assert.equal(sendMailCalls.length, 0);
});
