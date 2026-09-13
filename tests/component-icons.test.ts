import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { COMPONENT_DEFINITIONS, CONSUMER_PRESETS, getComponentDefinition, getEffectiveHandles, getNodeIcon } from "@/lib/electrical-components/definitions";
import { getBrandModel, getBrandModelsForType } from "@/lib/electrical-components/brand-models";

function publicAssetPath(icon: string) {
  return join(process.cwd(), "public", icon.replace(/^\/+/, ""));
}

test("un modèle Victron conserve l'illustration de famille validée", () => {
  const battery = getComponentDefinition("battery");
  assert.ok(battery);

  const icon = getNodeIcon(
    battery,
    {
      brandModelId: "victron-lithium-smart-100ah",
      technology: "lifepo4",
      customItemIconDataUrl: "data:image/png;base64,custom",
    },
    "pro",
  );

  assert.equal(icon, "/schema-icons/pro/family/battery.png");
});

test("les écrans et centrales utilisent l'illustration exacte du modèle", () => {
  const display = getComponentDefinition("system-monitor");
  const controller = getComponentDefinition("system-controller");
  assert.ok(display);
  assert.ok(controller);

  assert.equal(getNodeIcon(display, { brandModelId: "victron-gx-touch-70" }, "pro"), "/schema-icons/pro/brand/victron-gx-touch-70.webp");
  assert.equal(getNodeIcon(display, { brandModelId: "victron-bmv-712-display" }, "pro"), "/schema-icons/pro/brand/victron-bmv-712.webp");
  assert.equal(getNodeIcon(controller, { brandModelId: "victron-cerbo-gx" }, "pro"), "/schema-icons/pro/brand/victron-cerbo-gx.webp");
  assert.equal(getNodeIcon(controller, { brandModelId: "victron-ekrano-gx" }, "pro"), "/schema-icons/pro/brand/victron-ekrano-gx.webp");
});

test("les panneaux solaires n'utilisent que les visuels rigide et flexible", () => {
  const solarPanel = getComponentDefinition("solar-panel");
  assert.ok(solarPanel);

  assert.equal(
    getNodeIcon(solarPanel, { brandModelId: "renogy-175w-flexible" }, "pro"),
    "/schema-icons/pro/solar-panel-flexible.cutout.png",
  );
  assert.equal(
    getNodeIcon(solarPanel, { brandModelId: "victron-bluesolar-365w-mono" }, "pro"),
    "/schema-icons/pro/solar-panel-rigid.png",
  );
  assert.equal(
    getNodeIcon(solarPanel, { panelStyle: "flexible", brandModelId: "victron-bluesolar-365w-mono" }, "pro"),
    "/schema-icons/pro/solar-panel-flexible.cutout.png",
  );
});

test("les MPPT utilisent une illustration par marque et le visuel Victron validé comme repli", () => {
  const mppt = getComponentDefinition("mppt");
  assert.ok(mppt);

  assert.equal(getNodeIcon(mppt, { brandModelId: "renogy-rover-60a" }, "pro"), "/schema-icons/pro/brand/renogy-rover-20a.webp");
  assert.equal(getNodeIcon(mppt, { brandModelId: "epever-tracer-40a" }, "pro"), "/schema-icons/pro/brand/epever-mppt.webp");
  assert.equal(getNodeIcon(mppt, {}, "pro"), "/schema-icons/pro/family/mppt.cutout.png");
});

test("BatteryProtect est un composant distinct du coupe-batterie manuel", () => {
  assert.equal(getBrandModelsForType("battery-switch").length, 4);
  assert.equal(getBrandModelsForType("battery-protect").length, 3);

  const protect = getComponentDefinition("battery-protect");
  assert.ok(protect);
  assert.equal(protect.label, "BatteryProtect");
  assert.deepEqual(protect.handles.map((handle) => handle.id), ["input", "output", "negative"]);
  assert.equal(getNodeIcon(protect, {}, "pro"), "/schema-icons/pro/family/battery-protect.png");
});

// Bug corrigé (retour utilisateur : "quand je rajoute n'importe quel
// appareil j'ai la liste de pundmann de chauffe eau") — "consumer" est
// partagé par tous les appareils, donc un modèle de marque ajouté pour UN
// appareil (Pundmann Therm, presetType "chauffe-eau*") ressortait pour
// n'importe quel autre appareil (éclairage, pompe...) partageant le même
// componentType.
test("getBrandModelsForType filtre les modèles 'consumer' par presetType, jamais par simple componentType", () => {
  // Le bon appareil retrouve bien ses modèles de marque...
  assert.equal(getBrandModelsForType("consumer", "chauffe-eau-12v").length, 3);
  assert.ok(getBrandModelsForType("consumer", "chauffe-eau-12v").every((m) => m.brand === "Pundmann"));

  // ...mais un appareil sans rapport n'en hérite plus.
  assert.deepEqual(getBrandModelsForType("consumer", "eclairage-led"), []);
  assert.deepEqual(getBrandModelsForType("consumer", "klaxon"), []);

  // "pompe-eau" a ses propres modèles (Pentair Shurflo, migrés depuis
  // d'anciens préréglages à part — retour utilisateur : "pompe à eau...
  // plus appareil pour la même chose et pas juste le choix du modèle") —
  // jamais les Pundmann du chauffe-eau ci-dessus.
  assert.equal(getBrandModelsForType("consumer", "pompe-eau").length, 3);
  assert.ok(getBrandModelsForType("consumer", "pompe-eau").every((m) => m.brand === "Pentair"));

  // Sans presetType du tout (l'ancien appel, avant le correctif), plus
  // aucun modèle ne doit ressortir — jamais un "générique" qui reviendrait
  // au bug initial.
  assert.deepEqual(getBrandModelsForType("consumer"), []);
});

test("getBrandModelsForType reste inchangé pour les types à une seule famille (non 'consumer')", () => {
  // Le paramètre presetType est ignoré pour tout type qui n'est pas
  // générique — pas de régression sur les types déjà corrects.
  const withoutPreset = getBrandModelsForType("mppt");
  const withIrrelevantPreset = getBrandModelsForType("mppt", "chauffe-eau-12v");
  assert.equal(withoutPreset.length, withIrrelevantPreset.length);
  assert.ok(withoutPreset.length > 0);
});

test("les variantes visuelles gardent seulement les différences fonctionnelles", () => {
  const busbar = getComponentDefinition("busbar");
  const isolator = getComponentDefinition("battery-isolator");
  assert.ok(busbar);
  assert.ok(isolator);

  assert.equal(getNodeIcon(busbar, { polarity: "negative" }, "pro"), "/schema-icons/pro/family/busbar-negative.png");
  assert.equal(getNodeIcon(busbar, { polarity: "positive" }, "pro"), "/schema-icons/pro/family/busbar-positive.png");
  assert.equal(getNodeIcon(isolator, { outputCount: 3 }, "pro"), "/schema-icons/pro/family/battery-isolator-3.png");
});

test("les consommateurs partagent un visuel seulement lorsqu'ils sont de même nature", () => {
  const consumer = getComponentDefinition("consumer");
  assert.ok(consumer);

  assert.equal(getNodeIcon(consumer, { presetType: "refrigerateur" }, "pro"), "/schema-icons/pro/refrigerateur.webp");
  assert.equal(getNodeIcon(consumer, { presetType: "refrigerateur-trimix" }, "pro"), "/schema-icons/pro/refrigerateur.webp");
  assert.equal(getNodeIcon(consumer, { presetType: "pompe-eau" }, "pro"), "/schema-icons/pro/pompe-eau.webp");
  assert.equal(getNodeIcon(consumer, { presetType: "pompe-eau-immergee-25l" }, "pro"), "/schema-icons/pro/pompe-eau.webp");
  assert.equal(getNodeIcon(consumer, { presetType: "wc-electrique" }, "pro"), "/schema-icons/pro/wc-electrique.webp");
  assert.equal(getNodeIcon(consumer, { presetType: "electrovanne" }, "pro"), "/schema-icons/pro/electrovanne.webp");
  assert.equal(getNodeIcon(consumer, { presetType: "chauffe-eau-mixte-12-220" }, "pro"), "/schema-icons/pro/chauffe-eau.webp");
  assert.equal(getNodeIcon(consumer, { presetType: "tele-220v" }, "pro"), "/schema-icons/pro/tele-12v.jpg");
  assert.equal(getNodeIcon(consumer, { presetType: "climatiseur-portable" }, "pro"), "/schema-icons/pro/climatisation.webp");
  assert.equal(getNodeIcon(consumer, { presetType: "pilote-automatique" }, "pro"), "/schema-icons/pro/pilote-automatique.webp");
  assert.equal(getNodeIcon(consumer, { presetType: "spot-led" }, "pro"), "/schema-icons/pro/spot-led.jpg");
  assert.equal(getNodeIcon(consumer, { presetType: "ruban-led" }, "pro"), "/schema-icons/pro/ruban-led.jpg");
});

test("les chauffe-eau Pundmann utilisent leur photo et les bornes de leur alimentation", () => {
  const consumer = getComponentDefinition("consumer");
  const boiler12v = getBrandModel("pundmann-therm-6l-12v");
  const boiler230v = getBrandModel("pundmann-therm-6l-230v");
  const boilerMixed = getBrandModel("pundmann-therm-6l-12v-230v");
  assert.ok(consumer);
  assert.ok(boiler12v);
  assert.ok(boiler230v);
  assert.ok(boilerMixed);

  assert.equal(
    getNodeIcon(consumer, { brandModelId: boiler12v.id, ...boiler12v.defaults }, "pro"),
    "/schema-icons/pro/brand/pundmann-therm-12v.jpg",
  );
  assert.equal(
    getNodeIcon(consumer, { brandModelId: boiler230v.id, ...boiler230v.defaults }, "pro"),
    "/schema-icons/pro/brand/pundmann-therm-230v.jpg",
  );
  assert.equal(
    getNodeIcon(consumer, { brandModelId: boilerMixed.id, ...boilerMixed.defaults }, "pro"),
    "/schema-icons/pro/brand/pundmann-therm-mixte.jpg",
  );
  assert.deepEqual(getEffectiveHandles(consumer, boiler12v.defaults).map((handle) => handle.id), ["positive", "negative"]);
  assert.deepEqual(getEffectiveHandles(consumer, boiler230v.defaults).map((handle) => handle.id), ["ac-in", "earth"]);
  assert.deepEqual(getEffectiveHandles(consumer, boilerMixed.defaults).map((handle) => handle.id), ["positive", "negative", "ac-in", "earth"]);
});

test("toutes les illustrations Pro référencées existent dans public", () => {
  const icons = new Set<string>();

  for (const definition of COMPONENT_DEFINITIONS) {
    const icon = getNodeIcon(definition, {}, "pro");
    if (icon) icons.add(icon);
  }

  const consumer = getComponentDefinition("consumer");
  assert.ok(consumer);
  for (const preset of CONSUMER_PRESETS) {
    const icon = getNodeIcon(consumer, { presetType: preset.value }, "pro");
    if (icon) icons.add(icon);
  }

  for (const preset of CONSUMER_PRESETS) {
    for (const model of getBrandModelsForType("consumer", preset.value)) {
      const icon = getNodeIcon(consumer, { brandModelId: model.id, ...model.defaults }, "pro");
      if (icon) icons.add(icon);
    }
  }

  for (const icon of icons) {
    assert.ok(existsSync(publicAssetPath(icon)), `Illustration introuvable : ${icon}`);
  }
});

test("les variantes détourées utilisent un vrai canal alpha", () => {
  const cutouts = [
    "/schema-icons/pro/family/ac-charger.cutout.png",
    "/schema-icons/pro/family/ac-panel.cutout.png",
    "/schema-icons/pro/family/dcdc.cutout.png",
    "/schema-icons/pro/family/easysolar.cutout.png",
    "/schema-icons/pro/family/mppt.cutout.png",
    "/schema-icons/pro/family/power-station.cutout.png",
    "/schema-icons/pro/family/pwm.cutout.png",
    "/schema-icons/pro/family/shunt.cutout.png",
    "/schema-icons/pro/solar-panel-flexible.cutout.png",
  ];

  for (const icon of cutouts) {
    const data = readFileSync(publicAssetPath(icon));
    assert.equal(data.subarray(1, 4).toString("ascii"), "PNG", `Format PNG attendu : ${icon}`);
    assert.ok([4, 6].includes(data[25]), `Canal alpha absent : ${icon}`);
  }
});
