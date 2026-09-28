import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Constat d'audit (défaut n°2, PROMPT_REPRISE_CLAUDE_CRM.md) : la version
// était vérifiée par un `findUnique` puis écrite par un `update` séparé —
// une écriture concurrente entre les deux pouvait être écrasée sans le
// détecter. La correction lit et écrit en une seule requête conditionnelle
// (`updateMany` avec id + version dans le WHERE). Ce test prouve les trois
// issues possibles de ce chemin unique : succès, conflit de version,
// projet introuvable — pour les trois sections concernées.

type FakeProject = Record<string, unknown> & { id: string };

function httpErrorStubs() {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    badRequest: (message: string) => new HttpError(400, message),
    forbidden: (message: string) => new HttpError(403, message),
    notFound: (message: string) => new HttpError(404, message),
    conflict: (message: string) => new HttpError(409, message),
  };
}

function makeFakePrisma(initial: FakeProject) {
  const project: FakeProject = { ...initial };
  const tx = {
    coachingProject: {
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (where.id !== project.id) return { count: 0 };
        for (const [key, value] of Object.entries(where)) {
          if (key === "id") continue;
          const current = project[key];
          const matches = value instanceof Date && current instanceof Date ? value.getTime() === current.getTime() : value === current;
          if (!matches) return { count: 0 };
        }
        Object.assign(project, data);
        return { count: 1 };
      },
      findUnique: async ({ where }: { where: { id: string } }) => (where.id === project.id ? { id: project.id } : null),
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        if (where.id !== project.id) throw new Error("not found");
        return { ...project };
      },
    },
  };
  return { prisma: { $transaction: async (cb: (tx: unknown) => unknown) => cb(tx) }, project };
}

function loadDossierService(fakePrisma: unknown) {
  const source = ts.transpileModule(readFileSync("lib/services/coaching-van-dossier.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} as Record<string, (...args: unknown[]) => Promise<unknown>> };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id: string) => {
      if (id === "@/lib/http-errors") return httpErrorStubs();
      if (id === "@/lib/prisma") return fakePrisma;
      if (id === "@/lib/services/coaching-project-events") return { logCoachingProjectEvent: async () => {} };
      if (id.startsWith("@/")) return {};
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return loadedModule.exports;
}

const sections = [
  { fn: "updateVehicleInfo", versionField: "vehicleInfoUpdatedAt", expectedKey: "expectedVehicleInfoUpdatedAt", field: "vehicleBrand", value: "Fiat" },
  { fn: "updateUsagesInfo", versionField: "usagesUpdatedAt", expectedKey: "expectedUsagesUpdatedAt", field: "travelerCount", value: "2" },
  { fn: "updateImplantationInfo", versionField: "implantationUpdatedAt", expectedKey: "expectedImplantationUpdatedAt", field: "implantationNotes", value: "Sous le lit" },
] as const;

for (const section of sections) {
  test(`${section.fn}: version+ID sont vérifiés et écrits en une seule requête`, async () => {
    const originalVersion = new Date("2026-01-01T00:00:00Z");
    const { prisma, project } = makeFakePrisma({ id: "project-1", [section.versionField]: originalVersion });
    const service = loadDossierService({ prisma });

    // Succès : version fournie == version courante.
    const updated = (await service[section.fn]({
      projectId: "project-1",
      [section.expectedKey]: originalVersion,
      fields: { [section.field]: section.value },
      actor: { kind: "coach" },
    })) as FakeProject;
    assert.equal(updated[section.field], section.value);
    assert.notEqual((project[section.versionField] as Date).getTime(), originalVersion.getTime());
    const newVersion = project[section.versionField] as Date;

    // Conflit : rejeu avec l'ancienne version, désormais périmée — la
    // donnée déjà enregistrée ne doit pas être écrasée par ce rejeu.
    await assert.rejects(
      () =>
        service[section.fn]({
          projectId: "project-1",
          [section.expectedKey]: originalVersion,
          fields: { [section.field]: "valeur rejouée à tort" },
          actor: { kind: "client" },
        }),
      /modifiée entre-temps/
    );
    assert.equal(project[section.field], section.value, "no silent overwrite on stale version");

    // La bonne version courante permet toujours d'écrire ensuite.
    await service[section.fn]({
      projectId: "project-1",
      [section.expectedKey]: newVersion,
      fields: { [section.field]: "valeur suivante" },
      actor: { kind: "coach" },
    });
    assert.equal(project[section.field], "valeur suivante");

    // Projet inexistant : erreur dédiée, pas un conflit trompeur.
    await assert.rejects(
      () =>
        service[section.fn]({
          projectId: "does-not-exist",
          [section.expectedKey]: originalVersion,
          fields: { [section.field]: section.value },
          actor: { kind: "coach" },
        }),
      /introuvable/
    );
  });
}
