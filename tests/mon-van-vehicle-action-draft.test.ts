import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as existingInstallation from "@/lib/crm/existing-installation";

// D13 (AUDIT_INDEPENDANT_FABSYSTEM.md) : "la saisie en cours n'est pas
// reprise" — les formulaires "Votre projet et votre véhicule" (16 champs)
// et "Votre quotidien et votre recharge" (15 champs) sont les plus gros
// formulaires CLIENT de tout le dossier, remplis par le vrai client, pas
// seulement le coach. En cas d'erreur, updateVehicleInfoAction/
// updateUsagesInfoAction doivent renvoyer la saisie brute dans l'URL de
// redirection plutôt que la perdre. Vrai service transpilé, aucune base
// réelle.

class RedirectSignal extends Error {
  target: string;
  constructor(target: string) {
    super("redirect");
    this.target = target;
  }
}

function httpErrorStubs() {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    HttpError,
    badRequest: (message: string) => new HttpError(400, message),
    forbidden: (message: string) => new HttpError(403, message),
    notFound: (message: string) => new HttpError(404, message),
    isHttpError: (error: unknown) => error instanceof HttpError,
  };
}

function loadActions(deps: {
  updateVehicleInfoImpl?: (input: unknown) => Promise<unknown>;
  updateUsagesInfoImpl?: (input: unknown) => Promise<unknown>;
  updateImplantationInfoImpl?: (input: unknown) => Promise<unknown>;
  assetTypeParseSuccess?: boolean;
  httpErrors?: ReturnType<typeof httpErrorStubs>;
}) {
  const httpErrors = deps.httpErrors ?? httpErrorStubs();
  const moduleDeps: Record<string, unknown> = {
    "@/lib/http-errors": httpErrors,
    // Module pur (zod seulement) : on utilise le vrai, pas une simulation.
    "@/lib/crm/existing-installation": existingInstallation,
    "@/lib/project-payload": {
      projectAssetTypeSchema: {
        safeParse: (value: string) =>
          deps.assetTypeParseSuccess === false ? { success: false } : { success: true, data: value },
      },
    },
    "@/lib/server/project-actor": { requireCustomerActor: async () => ({ role: "customer", customerId: "customer-1" }) },
    "@/lib/prisma": { prisma: { coachingProject: { findUnique: async () => ({ customerId: "customer-1" }) } } },
    "@/lib/services/coaching-van-dossier": {
      updateVehicleInfo: deps.updateVehicleInfoImpl ?? (async () => ({})),
      updateUsagesInfo: deps.updateUsagesInfoImpl ?? (async () => ({})),
      updateImplantationInfo: deps.updateImplantationInfoImpl ?? (async () => ({})),
    },
    "next/navigation": {
      redirect: (target: string) => {
        throw new RedirectSignal(target);
      },
    },
    "next/cache": { revalidatePath: () => {} },
  };
  const source = ts.transpileModule(readFileSync("app/mon-compte/mon-van/actions.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as Record<string, (formData: FormData) => Promise<void>> };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id: string) => {
      if (id in moduleDeps) return moduleDeps[id];
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

async function invokeAndCaptureRedirect(action: (formData: FormData) => Promise<void>, formData: FormData) {
  try {
    await action(formData);
    throw new Error("expected a redirect");
  } catch (error) {
    if (error instanceof RedirectSignal) return error.target;
    throw error;
  }
}

test("updateVehicleInfoAction renvoie toute la saisie tapée dans l'URL d'erreur, sans rien perdre", async () => {
  // HttpError plutôt qu'un Error générique : le catch d'updateVehicleInfoAction
  // vit dans un contexte vm distinct (realm différent), donc un `instanceof
  // Error` créé hors du sandbox échouerait silencieusement (déjà rencontré
  // plusieurs fois cette session) — HttpError est injecté via les deps et
  // partage la même classe que celle vue par isHttpError().
  const httpErrors = httpErrorStubs();
  const actions = loadActions({
    httpErrors,
    updateVehicleInfoImpl: async () => {
      throw new httpErrors.HttpError(409, "Conflit de version détecté.");
    },
  });

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("expectedVehicleInfoUpdatedAt", "2026-01-01T00:00:00.000Z");
  form.set("assetType", "VAN");
  form.set("vehicleBrand", "Mercedes");
  form.set("vehicleModel", "Sprinter");
  form.set("vehicleYear", "2022");
  form.set("vehicleEngine", "Diesel");
  form.set("vehicleFormat", "L2H2");
  form.set("vehicleDimensions", "6m x 2m x 2.5m");
  form.set("registrationCountry", "France");
  form.set("usageCountry", "France");
  form.set("homologationNotes", "Contrôle technique prévu en mars");
  form.set("projectStage", "Aménagement en cours");
  form.set("niveauClient", "DEBUTANT");
  form.set("whoDoesTheWork", "Moi-même avec un ami");
  form.set("startDeadline", "Cet été");
  form.set("coachingTopics", "Dimensionnement batterie et solaire");
  form.set("objectifs", "Autonomie 4 jours sans recharge");
  form.set("threePriorities", "Sécurité, budget, simplicité");

  const target = await invokeAndCaptureRedirect(actions.updateVehicleInfoAction, form);

  const url = new URL(target, "http://localhost");
  assert.match(url.searchParams.get("error") ?? "", /Conflit de version/);
  const draft = JSON.parse(decodeURIComponent(url.searchParams.get("vehicleDraft") ?? "")) as Record<string, string>;
  assert.equal(draft.assetType, "VAN");
  assert.equal(draft.vehicleBrand, "Mercedes");
  assert.equal(draft.vehicleModel, "Sprinter");
  assert.equal(draft.vehicleDimensions, "6m x 2m x 2.5m");
  assert.equal(draft.homologationNotes, "Contrôle technique prévu en mars");
  assert.equal(draft.coachingTopics, "Dimensionnement batterie et solaire");
  assert.equal(draft.objectifs, "Autonomie 4 jours sans recharge");
  assert.equal(draft.threePriorities, "Sécurité, budget, simplicité");
});

test("updateVehicleInfoAction réussit normalement et ne joint aucun brouillon", async () => {
  const calls: Record<string, unknown>[] = [];
  const actions = loadActions({
    updateVehicleInfoImpl: async (input: unknown) => {
      calls.push(input as Record<string, unknown>);
      return {};
    },
  });

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("expectedVehicleInfoUpdatedAt", "2026-01-01T00:00:00.000Z");
  form.set("assetType", "BOAT");

  const target = await invokeAndCaptureRedirect(actions.updateVehicleInfoAction, form);

  assert.equal(calls.length, 1);
  const url = new URL(target, "http://localhost");
  assert.match(url.searchParams.get("success") ?? "", /Enregistré/);
  assert.equal(url.searchParams.get("vehicleDraft"), null);
});

test("updateUsagesInfoAction renvoie la saisie tapée dans l'URL d'erreur, sans rien perdre", async () => {
  const httpErrors = httpErrorStubs();
  const actions = loadActions({
    httpErrors,
    updateUsagesInfoImpl: async () => {
      throw new httpErrors.HttpError(409, "Conflit de version détecté.");
    },
  });

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("expectedUsagesUpdatedAt", "2026-01-01T00:00:00.000Z");
  form.set("travelerCount", "2 adultes, 1 enfant");
  form.set("usagePattern", "Vie à l'année");
  form.set("remoteWorkNotes", "4h/jour, ordinateur + écran externe");
  form.set("criticalDevicesWhenLow", "Frigo et éclairage en priorité");
  form.set("solarRoofSpaceNotes", "3m² disponibles, un vélux au milieu");

  const target = await invokeAndCaptureRedirect(actions.updateUsagesInfoAction, form);

  const url = new URL(target, "http://localhost");
  assert.match(url.searchParams.get("error") ?? "", /Conflit de version/);
  const draft = JSON.parse(decodeURIComponent(url.searchParams.get("usagesDraft") ?? "")) as Record<string, string>;
  assert.equal(draft.travelerCount, "2 adultes, 1 enfant");
  assert.equal(draft.usagePattern, "Vie à l'année");
  assert.equal(draft.remoteWorkNotes, "4h/jour, ordinateur + écran externe");
  assert.equal(draft.criticalDevicesWhenLow, "Frigo et éclairage en priorité");
  assert.equal(draft.solarRoofSpaceNotes, "3m² disponibles, un vélux au milieu");
});

test("updateImplantationInfoAction renvoie la saisie tapée dans l'URL d'erreur, sans rien perdre", async () => {
  const httpErrors = httpErrorStubs();
  const actions = loadActions({
    httpErrors,
    updateImplantationInfoImpl: async () => {
      throw new httpErrors.HttpError(409, "Conflit de version détecté.");
    },
  });

  const form = new FormData();
  form.set("projectId", "project-1");
  form.set("expectedImplantationUpdatedAt", "2026-01-01T00:00:00.000Z");
  form.set("implantationNotes", "Sous le lit, volume 40x60x20cm");
  form.set("ventilationConstraints", "Aucune aération prévue à cet endroit");
  form.set("vehicleElectricalSource", "Manuel constructeur");

  const target = await invokeAndCaptureRedirect(actions.updateImplantationInfoAction, form);

  const url = new URL(target, "http://localhost");
  assert.match(url.searchParams.get("error") ?? "", /Conflit de version/);
  const draft = JSON.parse(decodeURIComponent(url.searchParams.get("implantationDraft") ?? "")) as Record<string, string>;
  assert.equal(draft.implantationNotes, "Sous le lit, volume 40x60x20cm");
  assert.equal(draft.ventilationConstraints, "Aucune aération prévue à cet endroit");
  assert.equal(draft.vehicleElectricalSource, "Manuel constructeur");
});
