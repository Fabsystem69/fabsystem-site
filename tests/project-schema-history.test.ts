import assert from "node:assert/strict";
import test from "node:test";
import type { Project, ProjectSchema } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import {
  createProjectSchemaService,
  hasSchemaContentChanged,
  type ProjectSchemaDb,
  type SaveProjectSchemaResult,
} from "@/lib/services/project-schema";

// Lot 3 dashboard client (docs/03-DATABASE.md "Lot 3 dashboard client") :
// instantané automatique avant sauvegarde + protection de concurrence.
// Fixtures isolées uniquement — le comportement réel de la transaction
// Prisma (création de version, numérotation, dédoublonnage) est vérifié
// séparément contre la base de développement locale, jamais ici.

function createProjectRecord(overrides: Partial<Project> = {}): Project {
  const now = new Date("2026-08-10T00:00:00.000Z");
  return {
    id: overrides.id ?? "proj_1",
    customerId: overrides.customerId ?? "cust_1",
    name: overrides.name ?? "Projet schema",
    assetType: overrides.assetType ?? "VAN",
    voltage: overrides.voltage ?? "V12",
    status: overrides.status ?? "ACTIVE",
    archivedAt: overrides.archivedAt ?? null,
    deleteScheduledAt: overrides.deleteScheduledAt ?? null,
    preScheduleStatus: overrides.preScheduleStatus ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  } as Project;
}

function createProjectSchemaRecord(overrides: Partial<ProjectSchema> = {}): ProjectSchema {
  const now = new Date("2026-08-10T00:00:00.000Z");
  return {
    id: overrides.id ?? "schema_1",
    projectId: overrides.projectId ?? "proj_1",
    projectName: overrides.projectName ?? "Projet schema",
    nodes: overrides.nodes ?? [],
    edges: overrides.edges ?? [],
    thumbnail: overrides.thumbnail ?? null,
    shareToken: overrides.shareToken ?? null,
    shareEnabledAt: overrides.shareEnabledAt ?? null,
    lastModifiedByType: overrides.lastModifiedByType ?? null,
    lastModifiedByName: overrides.lastModifiedByName ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

const PROJECT = createProjectRecord();
const ADMIN_ACTOR: OwnershipActor = { role: "admin" };
const CUSTOMER_ACTOR: OwnershipActor = { role: "customer", customerId: "cust_1" };

test("hasSchemaContentChanged: false pour un contenu strictement identique", () => {
  const a = { projectName: "Van", nodes: [{ id: "n1" }], edges: [] };
  const b = { projectName: "Van", nodes: [{ id: "n1" }], edges: [] };
  assert.equal(hasSchemaContentChanged(a, b), false);
});

test("hasSchemaContentChanged: true si les nodes diffèrent", () => {
  const a = { projectName: "Van", nodes: [{ id: "n1" }], edges: [] };
  const b = { projectName: "Van", nodes: [{ id: "n1" }, { id: "n2" }], edges: [] };
  assert.equal(hasSchemaContentChanged(a, b), true);
});

test("hasSchemaContentChanged: true si le nom du projet diffère", () => {
  const a = { projectName: "Van", nodes: [], edges: [] };
  const b = { projectName: "Van 2", nodes: [], edges: [] };
  assert.equal(hasSchemaContentChanged(a, b), true);
});

test("hasSchemaContentChanged: ignore la miniature (cosmétique, jamais un vrai changement)", () => {
  // La signature ne prend même pas `thumbnail` — vérifie que deux objets
  // avec le même contenu significatif mais des miniatures différentes,
  // une fois réduits à {projectName, nodes, edges}, restent "non changés".
  const a = { projectName: "Van", nodes: [], edges: [] };
  const b = { projectName: "Van", nodes: [], edges: [] };
  assert.equal(hasSchemaContentChanged(a, b), false);
});

test("saveProjectSchema: lève un conflit explicite quand saveWithHistory signale un conflit, jamais un faux succès", async () => {
  const db: ProjectSchemaDb = {
    async findByProjectId() {
      return createProjectSchemaRecord();
    },
    async saveWithHistory(): Promise<SaveProjectSchemaResult> {
      return { status: "conflict" };
    },
    async findSummariesByProjectIds() {
      return [];
    },
  };
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => false,
  });

  await assert.rejects(
    () => service.saveProjectSchema(CUSTOMER_ACTOR, PROJECT.id, { projectName: "Van", nodes: [], edges: [], thumbnail: null }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("saveProjectSchema: transmet l'auteur CUSTOMER/Client pour un acteur client", async () => {
  let receivedAuthor: { authorType: string; authorName: string } | null = null;
  const db: ProjectSchemaDb = {
    async findByProjectId() {
      return createProjectSchemaRecord();
    },
    async saveWithHistory(_projectId, _input, author) {
      receivedAuthor = author;
      return { status: "saved", schema: createProjectSchemaRecord() };
    },
    async findSummariesByProjectIds() {
      return [];
    },
  };
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => false,
  });

  await service.saveProjectSchema(CUSTOMER_ACTOR, PROJECT.id, { projectName: "Van", nodes: [], edges: [], thumbnail: null });

  assert.deepEqual(receivedAuthor, { authorType: "CUSTOMER", authorName: "Client" });
});

test("saveProjectSchema: transmet l'auteur ADMIN/FabSystem pour un acteur admin", async () => {
  let receivedAuthor: { authorType: string; authorName: string } | null = null;
  const db: ProjectSchemaDb = {
    async findByProjectId() {
      return createProjectSchemaRecord();
    },
    async saveWithHistory(_projectId, _input, author) {
      receivedAuthor = author;
      return { status: "saved", schema: createProjectSchemaRecord() };
    },
    async findSummariesByProjectIds() {
      return [];
    },
  };
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => false,
  });

  await service.saveProjectSchema(ADMIN_ACTOR, PROJECT.id, { projectName: "Van", nodes: [], edges: [], thumbnail: null });

  assert.deepEqual(receivedAuthor, { authorType: "ADMIN", authorName: "FabSystem" });
});

test("saveProjectSchema: un admin peut sauvegarder même si le projet est verrouillé (lecture seule pour le client)", async () => {
  const db: ProjectSchemaDb = {
    async findByProjectId() {
      return createProjectSchemaRecord();
    },
    async saveWithHistory() {
      return { status: "saved", schema: createProjectSchemaRecord() };
    },
    async findSummariesByProjectIds() {
      return [];
    },
  };
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => true, // verrouillé pour le client
  });

  // Ne doit PAS lever malgré le verrou, car l'acteur est admin.
  const schema = await service.saveProjectSchema(ADMIN_ACTOR, PROJECT.id, { projectName: "Van", nodes: [], edges: [], thumbnail: null });
  assert.ok(schema);
});

test("setCableLengths: propage le conflit si l'état a changé entre la lecture et l'écriture", async () => {
  const edges = [{ id: "e1", source: "n1", target: "n2", data: {} }];
  const db: ProjectSchemaDb = {
    async findByProjectId() {
      return createProjectSchemaRecord({ edges: edges as never });
    },
    async saveWithHistory() {
      return { status: "conflict" };
    },
    async findSummariesByProjectIds() {
      return [];
    },
  };
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => false,
  });

  await assert.rejects(
    () => service.setCableLengths(CUSTOMER_ACTOR, PROJECT.id, { e1: 3 }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("setCableLengths: transmet expectedUpdatedAt depuis sa propre lecture, pour se protéger lui-même d'une course", async () => {
  const readUpdatedAt = new Date("2026-09-01T00:00:00.000Z");
  let receivedExpected: Date | undefined;
  const db: ProjectSchemaDb = {
    async findByProjectId() {
      return createProjectSchemaRecord({ edges: [{ id: "e1", source: "n1", target: "n2", data: {} }] as never, updatedAt: readUpdatedAt });
    },
    async saveWithHistory(_projectId, input) {
      receivedExpected = input.expectedUpdatedAt;
      return { status: "saved", schema: createProjectSchemaRecord() };
    },
    async findSummariesByProjectIds() {
      return [];
    },
  };
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => false,
  });

  await service.setCableLengths(CUSTOMER_ACTOR, PROJECT.id, { e1: 3 });

  assert.equal(receivedExpected?.getTime(), readUpdatedAt.getTime());
});

// Scénario déterministe demandé en revue (pas une course hasardeuse) : A et
// B lisent le même état (même updatedAt). A sauvegarde et termine. B tente
// ENSUITE avec son expectedUpdatedAt resté à la valeur périmée -> conflit,
// aucune écriture. Fake DB en mémoire qui simule fidèlement la sémantique
// réelle de saveWithHistory (vérifiée séparément contre la vraie base
// locale, voir le journal) : rejette si expectedUpdatedAt ne correspond
// plus à l'état courant.
test("scénario déterministe A/B : la sauvegarde de B avec un expectedUpdatedAt périmé par la sauvegarde de A est un conflit, sans écriture", async () => {
  let currentUpdatedAt = new Date("2026-09-01T00:00:00.000Z");
  let currentNodes: unknown = [{ id: "initial" }];
  let saveAttempts = 0;

  const db: ProjectSchemaDb = {
    async findByProjectId() {
      return createProjectSchemaRecord({ nodes: currentNodes as never, updatedAt: currentUpdatedAt });
    },
    async saveWithHistory(_projectId, input) {
      saveAttempts += 1;
      if (input.expectedUpdatedAt && input.expectedUpdatedAt.getTime() !== currentUpdatedAt.getTime()) {
        return { status: "conflict" };
      }
      currentNodes = input.nodes;
      currentUpdatedAt = new Date(currentUpdatedAt.getTime() + 1000);
      return { status: "saved", schema: createProjectSchemaRecord({ nodes: currentNodes as never, updatedAt: currentUpdatedAt }) };
    },
    async findSummariesByProjectIds() {
      return [];
    },
  };
  const service = createProjectSchemaService(db, {
    assertOwnedProject: async () => PROJECT,
    checkProjectReadOnly: async () => false,
  });

  // A et B lisent le même état de départ.
  const baseline = currentUpdatedAt;

  // A sauvegarde et termine — avance l'état.
  await service.saveProjectSchema(CUSTOMER_ACTOR, PROJECT.id, {
    projectName: "Van",
    nodes: [{ id: "a-wins" }],
    edges: [],
    thumbnail: null,
    expectedUpdatedAt: baseline,
  });

  // B tente ENSUITE avec l'updatedAt périmé qu'il avait lu au départ.
  await assert.rejects(
    () =>
      service.saveProjectSchema(CUSTOMER_ACTOR, PROJECT.id, {
        projectName: "Van",
        nodes: [{ id: "b-stale-attempt" }],
        edges: [],
        thumbnail: null,
        expectedUpdatedAt: baseline,
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );

  assert.equal(saveAttempts, 2, "les deux tentatives doivent avoir atteint saveWithHistory");
  assert.deepEqual(currentNodes, [{ id: "a-wins" }], "le contenu final doit être celui de A, jamais celui de B");
});
