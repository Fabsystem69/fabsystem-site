import assert from "node:assert/strict";
import test from "node:test";

// UI-13 — ces utilitaires (lib/client/*.ts) ne s'exécutent normalement que
// dans un navigateur (window.localStorage). node:test tourne en Node pur,
// sans DOM : ce petit polyfill en mémoire suffit à exercer le code réel
// sans dépendance supplémentaire (aucune librairie de test DOM ajoutée
// pour ça, conformément à l'esprit "ne pas créer un système complexe si
// un state/session/localStorage suffit").
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = {
  localStorage: new MemoryStorage(),
};

import { readProjectMode, writeProjectMode } from "@/lib/client/project-mode-storage";
import {
  readGuidedFlowState,
  writeGuidedFlowState,
} from "@/lib/client/guided-flow-storage";
import {
  readPendingImport,
  writePendingImport,
  clearPendingImport,
} from "@/lib/client/pending-import-storage";

function resetStorage() {
  (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.clear();
}

// ── project-mode-storage ───────────────────────────────────────────────

test("readProjectMode renvoie null tant qu'aucun choix n'a été fait", () => {
  resetStorage();
  assert.equal(readProjectMode("proj_1"), null);
});

test("writeProjectMode puis readProjectMode : le choix est mémorisé, réversible, par projet", () => {
  resetStorage();
  writeProjectMode("proj_1", "guided");
  assert.equal(readProjectMode("proj_1"), "guided");

  writeProjectMode("proj_1", "advanced");
  assert.equal(readProjectMode("proj_1"), "advanced");

  // Un autre projet n'est jamais affecté (mission §2 : même Project, mêmes
  // données — mais le mode reste bien une préférence PAR projet).
  assert.equal(readProjectMode("proj_2"), null);
});

// ── guided-flow-storage ─────────────────────────────────────────────────

test("readGuidedFlowState renvoie un état par défaut propre (aucune branche recharge sélectionnée)", () => {
  resetStorage();
  const state = readGuidedFlowState("proj_1");
  assert.equal(state.stepId, "installation");
  assert.equal(state.hasExistingBattery, null);
  assert.deepEqual(state.rechargeMethods, []);
  assert.equal(state.rechargeUnknown, false);
});

test("writeGuidedFlowState permet de reprendre le parcours à la bonne étape (quitter/revenir)", () => {
  resetStorage();
  writeGuidedFlowState("proj_1", {
    stepId: "recharge",
    hasExistingBattery: "yes",
    rechargeMethods: ["solar"],
    rechargeUnknown: false,
  });

  const resumed = readGuidedFlowState("proj_1");
  assert.equal(resumed.stepId, "recharge");
  assert.equal(resumed.hasExistingBattery, "yes");
  assert.deepEqual(resumed.rechargeMethods, ["solar"]);
});

test("branche recharge : sélectionner solaire n'active pas alternateur/chargeur", () => {
  resetStorage();
  writeGuidedFlowState("proj_1", {
    stepId: "recharge",
    hasExistingBattery: null,
    rechargeMethods: ["solar"],
    rechargeUnknown: false,
  });

  const state = readGuidedFlowState("proj_1");
  assert.equal(state.rechargeMethods.includes("solar"), true);
  assert.equal(state.rechargeMethods.includes("alternator"), false);
  assert.equal(state.rechargeMethods.includes("charger"), false);
});

test("batterie inconnue : hasExistingBattery accepte 'unknown' sans bloquer le parcours", () => {
  resetStorage();
  writeGuidedFlowState("proj_1", {
    stepId: "batterie",
    hasExistingBattery: "unknown",
    rechargeMethods: [],
    rechargeUnknown: false,
  });

  assert.equal(readGuidedFlowState("proj_1").hasExistingBattery, "unknown");
});

test("readGuidedFlowState retombe sur l'état par défaut si le JSON stocké est invalide", () => {
  resetStorage();
  (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.setItem(
    "fabsystem:guided-flow:proj_1",
    "{not-json"
  );

  const state = readGuidedFlowState("proj_1");
  assert.equal(state.stepId, "installation");
  assert.deepEqual(state.rechargeMethods, []);
});

// ── pending-import-storage ────────────────────────────────────────────

test("writePendingImport puis readPendingImport : le calcul en attente est conservé après une redirection connexion", () => {
  resetStorage();
  writePendingImport({ kind: "energy", sourceTool: "Bilan de consommation", data: { foo: "bar" } });

  const pending = readPendingImport();
  assert.equal(pending?.kind, "energy");
  assert.equal(pending?.sourceTool, "Bilan de consommation");
  assert.deepEqual(pending?.data, { foo: "bar" });
});

test("clearPendingImport supprime le calcul en attente", () => {
  resetStorage();
  writePendingImport({ kind: "cable", sourceTool: "Section de câble", data: {} });
  clearPendingImport();
  assert.equal(readPendingImport(), null);
});
