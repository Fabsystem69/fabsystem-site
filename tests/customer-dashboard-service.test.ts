import assert from "node:assert/strict";
import test from "node:test";
import {
  createCustomerDashboardService,
  type CustomerDashboardCoachingSummary,
  type CustomerDashboardDb,
  type CustomerDashboardProjectSummary,
} from "@/lib/services/customer-dashboard";

// Lot 1 (PROMPT_CLAUDE_DASHBOARD_CLIENT_V1.md) : fixtures isolées, aucun
// service externe ni vraie base — couvre les scénarios 1/2/3/4 de la
// "Recette minimale" qui concernent la résolution de contexte commun.

function project(overrides: Partial<CustomerDashboardProjectSummary> = {}): CustomerDashboardProjectSummary {
  return {
    id: "proj_1",
    name: "Mon van",
    assetType: "VAN",
    voltage: "V12",
    status: "ACTIVE",
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    hasSchema: true,
    schemaUpdatedAt: new Date("2026-09-01T00:00:00.000Z"),
    schemaThumbnail: null,
    linkedCoachingProjectId: null,
    ...overrides,
  };
}

function coaching(overrides: Partial<CustomerDashboardCoachingSummary> = {}): CustomerDashboardCoachingSummary {
  return {
    id: "coach_1",
    title: "Accompagnement van",
    status: "EN_COURS",
    assetType: "VAN",
    derniereActivite: new Date("2026-09-02T00:00:00.000Z"),
    readyForReviewAt: null,
    openClientActionCount: 0,
    orderId: null,
    whatsapp: null,
    linkedProjectId: null,
    ...overrides,
  };
}

function createFakeDb(seed: {
  projects?: CustomerDashboardProjectSummary[];
  coachingProjects?: CustomerDashboardCoachingSummary[];
  legacyDossier?: { id: string; offre: "DECOUVERTE" | "CONSEIL" | "GUIDE" | "CONCEPTION"; orderId: string | null } | null;
}): CustomerDashboardDb {
  return {
    async listProjects() {
      return seed.projects ?? [];
    },
    async listCoachingProjects() {
      return seed.coachingProjects ?? [];
    },
    async findLatestLegacyDossier() {
      return seed.legacyDossier ?? null;
    },
  };
}

test("scénario 1 — coaching + projet lié : le projet lié est le contexte sélectionné", async () => {
  const linkedProject = project({ id: "proj_linked" });
  const coachingProject = coaching({ id: "coach_linked", linkedProjectId: "proj_linked" });
  const service = createCustomerDashboardService(
    createFakeDb({ projects: [linkedProject], coachingProjects: [coachingProject] })
  );

  const context = await service.getContext("cust_1");
  const selected = service.resolveSelectedProject(context);

  assert.equal(selected?.id, "proj_linked");
  assert.equal(service.resolveLinkedCoaching(context, "proj_linked")?.id, "coach_linked");
});

test("scénario 2 — deux projets, aucun lien coaching : le plus récemment modifié est sélectionné", async () => {
  const older = project({ id: "proj_old", updatedAt: new Date("2026-01-01T00:00:00.000Z") });
  const newer = project({ id: "proj_new", updatedAt: new Date("2026-08-01T00:00:00.000Z") });
  const service = createCustomerDashboardService(createFakeDb({ projects: [older, newer] }));

  const context = await service.getContext("cust_2");
  const selected = service.resolveSelectedProject(context);

  assert.equal(selected?.id, "proj_new");
});

test("scénario 2bis — changement de contexte explicite : un projectId demandé prime toujours", async () => {
  const a = project({ id: "proj_a", updatedAt: new Date("2026-08-01T00:00:00.000Z") });
  const b = project({ id: "proj_b", updatedAt: new Date("2026-01-01T00:00:00.000Z") });
  const service = createCustomerDashboardService(createFakeDb({ projects: [a, b] }));

  const context = await service.getContext("cust_2b");
  const selected = service.resolveSelectedProject(context, "proj_b");

  assert.equal(selected?.id, "proj_b");
});

test("scénario 3 — client ebook seul, aucun projet ni coaching : contexte vide, pas d'erreur", async () => {
  const service = createCustomerDashboardService(createFakeDb({}));

  const context = await service.getContext("cust_3");

  assert.equal(context.projects.length, 0);
  assert.equal(context.coachingProjects.length, 0);
  assert.deepEqual(context.legacyDossier, { kind: "none" });
  assert.equal(service.resolveSelectedProject(context), null);
});

test("scénario 4 — ancien dossier non repris : signalé explicitement, jamais masqué ni fusionné par supposition", async () => {
  const service = createCustomerDashboardService(
    createFakeDb({ legacyDossier: { id: "dossier_1", offre: "GUIDE", orderId: "order_1" } })
  );

  const context = await service.getContext("cust_4");

  assert.deepEqual(context.legacyDossier, {
    kind: "present",
    dossierId: "dossier_1",
    offre: "GUIDE",
    absorbedByMatchingOrderId: false,
    hasAnyCoachingProject: false,
  });
});

test("le dossier legacy n'est marqué repris que si un CoachingProject partage le même orderId (jamais par nom/date)", async () => {
  const sameOrder = coaching({ id: "coach_same_order", orderId: "order_42" });
  const service = createCustomerDashboardService(
    createFakeDb({
      coachingProjects: [sameOrder],
      legacyDossier: { id: "dossier_2", offre: "CONCEPTION", orderId: "order_42" },
    })
  );

  const context = await service.getContext("cust_5");

  assert.equal(context.legacyDossier.kind, "present");
  if (context.legacyDossier.kind === "present") {
    assert.equal(context.legacyDossier.absorbedByMatchingOrderId, true);
  }
});

test("un CoachingProject sans orderId partagé ne marque jamais le dossier comme repris", async () => {
  const unrelatedCoaching = coaching({ id: "coach_unrelated", orderId: null });
  const service = createCustomerDashboardService(
    createFakeDb({
      coachingProjects: [unrelatedCoaching],
      legacyDossier: { id: "dossier_3", offre: "DECOUVERTE", orderId: null },
    })
  );

  const context = await service.getContext("cust_6");

  assert.equal(context.legacyDossier.kind, "present");
  if (context.legacyDossier.kind === "present") {
    assert.equal(context.legacyDossier.absorbedByMatchingOrderId, false);
    // hasAnyCoachingProject reste vrai : un coaching existe bel et bien pour
    // ce client, mais rien ne prouve qu'il correspond à CE dossier précis —
    // l'ambiguïté doit rester visible, pas résolue à la place du coach.
    assert.equal(context.legacyDossier.hasAnyCoachingProject, true);
  }
});

test("un accompagnement terminé ne doit pas s'imposer comme contexte sélectionné face à un projet plus pertinent", async () => {
  const activeProject = project({ id: "proj_active", updatedAt: new Date("2026-08-01T00:00:00.000Z") });
  const finishedCoaching = coaching({ id: "coach_finished", status: "TERMINE", linkedProjectId: "proj_old_finished" });
  const oldFinishedProject = project({ id: "proj_old_finished", updatedAt: new Date("2025-01-01T00:00:00.000Z") });
  const service = createCustomerDashboardService(
    createFakeDb({ projects: [activeProject, oldFinishedProject], coachingProjects: [finishedCoaching] })
  );

  const context = await service.getContext("cust_7");
  const selected = service.resolveSelectedProject(context);

  assert.equal(selected?.id, "proj_active");
});

test("resolveLinkedCoaching renvoie null quand le projet n'a aucun accompagnement rattaché", async () => {
  const standaloneProject = project({ id: "proj_standalone" });
  const service = createCustomerDashboardService(createFakeDb({ projects: [standaloneProject] }));

  const context = await service.getContext("cust_8");

  assert.equal(service.resolveLinkedCoaching(context, "proj_standalone"), null);
  assert.equal(service.resolveLinkedCoaching(context, null), null);
});

// --- Revue (02/10/2026) : resolveSelectedCoaching, résolution indépendante ---
// du projet — un accompagnement sans schéma rattaché ne doit jamais devenir
// invisible, et ne doit jamais se voir attribuer un projet au hasard.

test("resolveSelectedCoaching : un accompagnement SANS linkedProjectId reste résolu (jamais invisible)", async () => {
  const unlinkedCoaching = coaching({ id: "coach_unlinked", linkedProjectId: null });
  const service = createCustomerDashboardService(createFakeDb({ coachingProjects: [unlinkedCoaching] }));

  const context = await service.getContext("cust_9");

  assert.equal(service.resolveSelectedCoaching(context)?.id, "coach_unlinked");
});

test("resolveSelectedCoaching : un accompagnement non rattaché ne doit jamais être présenté comme lié à un autre projet existant", async () => {
  const unrelatedProject = project({ id: "proj_unrelated" });
  const unlinkedCoaching = coaching({ id: "coach_unlinked", linkedProjectId: null });
  const service = createCustomerDashboardService(
    createFakeDb({ projects: [unrelatedProject], coachingProjects: [unlinkedCoaching] })
  );

  const context = await service.getContext("cust_10");

  assert.equal(service.resolveSelectedCoaching(context)?.id, "coach_unlinked");
  // Le projet reste sélectionnable normalement, mais rien ne doit jamais
  // prétendre qu'il est rattaché à cet accompagnement : seul le lien
  // explicite (absent ici) ferait le lien, jamais une déduction.
  assert.equal(service.resolveLinkedCoaching(context, "proj_unrelated"), null);
});

test("resolveSelectedCoaching : client ebook seul (ni projet ni accompagnement) -> null, sans erreur", async () => {
  const service = createCustomerDashboardService(createFakeDb({}));

  const context = await service.getContext("cust_11_ebook_only");

  assert.equal(service.resolveSelectedCoaching(context), null);
  assert.equal(service.resolveSelectedProject(context), null);
});

test("resolveSelectedCoaching : plusieurs projets sans aucun accompagnement -> toujours null, le projet se sélectionne quand même", async () => {
  const older = project({ id: "proj_multi_old", updatedAt: new Date("2026-01-01T00:00:00.000Z") });
  const newer = project({ id: "proj_multi_new", updatedAt: new Date("2026-08-01T00:00:00.000Z") });
  const service = createCustomerDashboardService(createFakeDb({ projects: [older, newer] }));

  const context = await service.getContext("cust_12_multi_project");

  assert.equal(service.resolveSelectedCoaching(context), null);
  assert.equal(service.resolveSelectedProject(context)?.id, "proj_multi_new");
});

test("resolveSelectedCoaching : priorité à l'accompagnement actif le plus récent, jamais un accompagnement terminé", async () => {
  const finished = coaching({ id: "coach_finished_2", status: "TERMINE", derniereActivite: new Date("2026-09-01T00:00:00.000Z") });
  const active = coaching({ id: "coach_active_2", status: "EN_COURS", derniereActivite: new Date("2026-01-01T00:00:00.000Z") });
  const service = createCustomerDashboardService(createFakeDb({ coachingProjects: [finished, active] }));

  const context = await service.getContext("cust_13");

  assert.equal(service.resolveSelectedCoaching(context)?.id, "coach_active_2");
});
