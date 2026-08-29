import assert from "node:assert/strict";
import test from "node:test";
import { getBrandModel } from "@/lib/electrical-components/brand-models";
import { getBusbarConnectionPointLimit, getBusbarFacePointCounts, getComponentDefinition, getEffectiveHandles } from "@/lib/electrical-components/definitions";

test("un busbar repartit ses plots sur les quatre faces sans changer leurs identifiants", () => {
  const busbar = getComponentDefinition("busbar");
  assert.ok(busbar);

  const data = { polarity: "positive", leftPoints: 1, topPoints: 2, rightPoints: 2, bottomPoints: 1 };
  const handles = getEffectiveHandles(busbar, data);

  assert.deepEqual(handles.map((handle) => handle.id), ["input", "out-1", "out-2", "out-3", "out-4", "out-5"]);
  assert.deepEqual(handles.map((handle) => handle.side), ["left", "top", "top", "right", "right", "bottom"]);
});

test("un ancien busbar sans repartition reste lisible sur la droite", () => {
  assert.deepEqual(getBusbarFacePointCounts({ outputCount: 4 }), { left: 0, top: 0, right: 5, bottom: 0 });
});

test("le Lynx Power In limite chaque rail a quatre connexions", () => {
  const lynx = getBrandModel("victron-lynx-power-in-m8");
  assert.ok(lynx);
  const data = { polarity: "negative", ...lynx.defaults, rightPoints: 8 };

  assert.equal(getBusbarConnectionPointLimit(data), 4);
  assert.deepEqual(getBusbarFacePointCounts(data), { left: 0, top: 0, right: 4, bottom: 0 });
});
