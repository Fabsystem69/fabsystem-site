import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// UI-13 — tests de régression sur le code source (même technique que
// tests/downloads-route.test.ts) pour verrouiller des garanties
// architecturales qui ne s'exercent pas facilement avec node:test seul
// (composants React, pas de DOM dans ce runner) : le mode guidé ne doit
// jamais dupliquer un moteur, ni retenir une valeur sans confirmation
// explicite de l'utilisateur.
const guidedFlowSource = readFileSync(
  join(__dirname, "..", "components/customer/dashboard/guided/GuidedProjectFlow.tsx"),
  "utf8"
);

test("le mode guidé ne fait jamais d'appel réseau direct (mission §27 : aucun mini-moteur frontend)", () => {
  // Tout calcul doit passer par les composants moteur déjà réels
  // (EnergyModule, BatteryModule...), jamais par un fetch() propre au
  // parcours guidé qui recalculerait ou réécrirait une formule.
  assert.doesNotMatch(guidedFlowSource, /\bfetch\(/);
});

test("le mode guidé réutilise les modules moteur existants, ne les redéfinit pas", () => {
  for (const moduleName of [
    "EnergyModule",
    "BatteryModule",
    "AlternatorModule",
    "SolarModule",
    "ChargerModule",
    "CircuitModule",
    "CableModule",
    "ProtectionModule",
    "DiagramModule",
  ]) {
    assert.match(
      guidedFlowSource,
      new RegExp(`from "@/components/customer/dashboard/engines/${moduleName}"`),
      `${moduleName} devrait être importé depuis le module moteur existant`
    );
  }
});

test("le mode guidé ne retient jamais de valeur automatiquement (aucun appel retain hors des boutons existants)", () => {
  // "Utiliser pour mon projet" (retain: true) vit exclusivement dans
  // EngineActionBar/useEngineRun, réutilisés tels quels par chaque
  // Module — le fichier du parcours guidé lui-même ne doit contenir
  // aucune littérale "retain: true".
  assert.doesNotMatch(guidedFlowSource, /retain:\s*true/);
});

test("le passage Guidé ↔ Avancé passe par ModeSwitch, pas par une nouvelle logique de bascule", () => {
  assert.match(guidedFlowSource, /ModeSwitch/);
  assert.match(guidedFlowSource, /onSwitchMode/);
});

const modeGateSource = readFileSync(
  join(__dirname, "..", "components/customer/dashboard/project-mode/ProjectModeGate.tsx"),
  "utf8"
);

test("ProjectModeGate ne crée jamais un second Project lors du changement de mode", () => {
  assert.doesNotMatch(modeGateSource, /createProject|POST.*\/api\/projects(?!\/)/);
});

const energyImportSource = readFileSync(
  join(__dirname, "..", "components/outils/project-bridge/EnergyImportModal.tsx"),
  "utf8"
);
const cableImportSource = readFileSync(
  join(__dirname, "..", "components/outils/project-bridge/CableImportModal.tsx"),
  "utf8"
);

test("l'import Energy affiche toujours un aperçu (retain:false) avant tout import définitif (retain:true)", () => {
  assert.match(energyImportSource, /retain:\s*false/);
  assert.match(energyImportSource, /retain:\s*true/);
});

test("l'import Cable affiche toujours un aperçu (retain:false) avant tout import définitif (retain:true)", () => {
  assert.match(cableImportSource, /retain:\s*false/);
  assert.match(cableImportSource, /retain:\s*true/);
});

test("l'import Energy gère explicitement le conflit (valeur déjà retenue) plutôt que d'écraser silencieusement", () => {
  assert.match(energyImportSource, /existingValue/);
  assert.match(energyImportSource, /Une valeur existe déjà dans ce projet/);
});

test("l'import Cable ne construit jamais un circuit sans énergie déjà retenue (dépendance réelle du moteur circuit.structure)", () => {
  assert.match(cableImportSource, /no-consumers/);
  assert.match(cableImportSource, /Retenez d'abord votre consommation/);
});
