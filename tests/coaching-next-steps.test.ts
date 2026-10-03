import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoachingNextStepsService,
  resolveNextAppointment,
  sortClientActionsByPriority,
  type AppointmentRow,
  type ClientActionRow,
  type CoachingNextStepsDb,
} from "@/lib/services/coaching-next-steps";

// Lot 2 — "prochaine action réelle" et "prochain rendez-vous non annulé"
// pour l'accueil client. Fixtures isolées uniquement.

function action(overrides: Partial<ClientActionRow> = {}): ClientActionRow {
  return { id: "action_1", label: "Compléter vos usages", dueDate: null, createdAt: new Date("2026-08-01T00:00:00.000Z"), ...overrides };
}

function appointment(overrides: Partial<AppointmentRow> = {}): AppointmentRow {
  return { id: "appt_1", scheduledAt: new Date("2026-09-10T10:00:00.000Z"), durationMinutes: 45, status: "PREVUE", channel: "WhatsApp", ...overrides };
}

test("sortClientActionsByPriority : une échéance passe toujours avant une action sans échéance", () => {
  const withDue = action({ id: "with-due", dueDate: new Date("2026-12-31T00:00:00.000Z"), createdAt: new Date("2026-01-01T00:00:00.000Z") });
  const withoutDue = action({ id: "without-due", dueDate: null, createdAt: new Date("2025-01-01T00:00:00.000Z") });

  const sorted = sortClientActionsByPriority([withoutDue, withDue]);

  assert.equal(sorted[0].id, "with-due");
});

test("sortClientActionsByPriority : parmi deux échéances, la plus proche d'abord", () => {
  const far = action({ id: "far", dueDate: new Date("2026-12-01T00:00:00.000Z") });
  const near = action({ id: "near", dueDate: new Date("2026-10-01T00:00:00.000Z") });

  const sorted = sortClientActionsByPriority([far, near]);

  assert.equal(sorted[0].id, "near");
});

test("sortClientActionsByPriority : sans échéance, la plus ancienne (createdAt) d'abord", () => {
  const recent = action({ id: "recent", createdAt: new Date("2026-09-01T00:00:00.000Z") });
  const old = action({ id: "old", createdAt: new Date("2026-01-01T00:00:00.000Z") });

  const sorted = sortClientActionsByPriority([recent, old]);

  assert.equal(sorted[0].id, "old");
});

test("resolveNextAppointment : exclut une séance annulée (recette scénario 7)", () => {
  const cancelled = appointment({ id: "cancelled", status: "ANNULEE", scheduledAt: new Date("2026-09-05T00:00:00.000Z") });
  const kept = appointment({ id: "kept", status: "PREVUE", scheduledAt: new Date("2026-09-10T00:00:00.000Z") });
  const now = new Date("2026-09-01T00:00:00.000Z");

  const result = resolveNextAppointment([cancelled, kept], now);

  assert.equal(result?.id, "kept");
});

test("resolveNextAppointment : exclut une séance REALISEE même si sa date est future (donnée incohérente, jamais retenue)", () => {
  const realisee = appointment({ id: "realisee", status: "REALISEE", scheduledAt: new Date("2026-09-10T00:00:00.000Z") });
  const now = new Date("2026-09-01T00:00:00.000Z");

  const result = resolveNextAppointment([realisee], now);

  assert.equal(result, null);
});

test("resolveNextAppointment : une séance tout juste commencée (scheduledAt passé, durée pas encore écoulée) reste affichée", () => {
  const justStarted = appointment({
    id: "just-started",
    status: "PREVUE",
    scheduledAt: new Date("2026-09-01T09:50:00.000Z"),
    durationMinutes: 60,
  });
  const now = new Date("2026-09-01T10:00:00.000Z"); // 10 min après le début, séance toujours en cours

  const result = resolveNextAppointment([justStarted], now);

  assert.equal(result?.id, "just-started");
});

test("resolveNextAppointment : une séance commencée et déjà terminée (durée écoulée) n'est plus le prochain rendez-vous", () => {
  const finished = appointment({
    id: "finished",
    status: "PREVUE",
    scheduledAt: new Date("2026-09-01T08:00:00.000Z"),
    durationMinutes: 60,
  });
  const now = new Date("2026-09-01T10:00:00.000Z"); // 60 min après la fin prévue

  const result = resolveNextAppointment([finished], now);

  assert.equal(result, null);
});

test("resolveNextAppointment : ignore les séances déjà passées", () => {
  const past = appointment({ id: "past", scheduledAt: new Date("2026-01-01T00:00:00.000Z") });
  const now = new Date("2026-09-01T00:00:00.000Z");

  const result = resolveNextAppointment([past], now);

  assert.equal(result, null);
});

test("resolveNextAppointment : retient la plus proche parmi plusieurs rendez-vous à venir", () => {
  const later = appointment({ id: "later", scheduledAt: new Date("2026-12-01T00:00:00.000Z") });
  const sooner = appointment({ id: "sooner", scheduledAt: new Date("2026-10-01T00:00:00.000Z") });
  const now = new Date("2026-09-01T00:00:00.000Z");

  const result = resolveNextAppointment([later, sooner], now);

  assert.equal(result?.id, "sooner");
});

test("getNextSteps : aucune action ni rendez-vous -> aucun faux état inventé", async () => {
  const db: CoachingNextStepsDb = {
    async listOpenClientActions() {
      return [];
    },
    async listUpcomingAppointments() {
      return [];
    },
  };
  const service = createCoachingNextStepsService(db);

  const result = await service.getNextSteps("coach_1", new Date("2026-09-01T00:00:00.000Z"));

  assert.equal(result.nextClientAction, null);
  assert.equal(result.nextAppointment, null);
});

test("getNextSteps : combine la priorité des actions et le prochain rendez-vous réel", async () => {
  const db: CoachingNextStepsDb = {
    async listOpenClientActions() {
      return [action({ id: "a1", dueDate: new Date("2026-10-01T00:00:00.000Z") }), action({ id: "a2", dueDate: null })];
    },
    async listUpcomingAppointments() {
      return [appointment({ id: "appt_future", scheduledAt: new Date("2026-09-20T00:00:00.000Z") })];
    },
  };
  const service = createCoachingNextStepsService(db);

  const result = await service.getNextSteps("coach_1", new Date("2026-09-01T00:00:00.000Z"));

  assert.equal(result.nextClientAction?.id, "a1");
  assert.equal(result.nextAppointment?.id, "appt_future");
});
