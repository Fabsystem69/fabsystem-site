import assert from "node:assert/strict";
import test from "node:test";
import { ConfigurationError } from "@/lib/engines/errors";
import { createEngineRegistry } from "@/lib/engines/registry";
import type { BaseEngine } from "@/lib/engines/types";

function createFakeEngine(id: string): BaseEngine<never, never> {
  return {
    id,
    run: () => ({ output: undefined as never }),
  };
}

test("register then get returns the same engine instance", () => {
  const registry = createEngineRegistry();
  const engine = createFakeEngine("fixture.dummy");

  registry.register(engine);

  assert.equal(registry.get("fixture.dummy"), engine);
});

test("has reflects registration state", () => {
  const registry = createEngineRegistry();

  assert.equal(registry.has("fixture.dummy"), false);
  registry.register(createFakeEngine("fixture.dummy"));
  assert.equal(registry.has("fixture.dummy"), true);
});

test("list returns every registered engine", () => {
  const registry = createEngineRegistry();
  registry.register(createFakeEngine("fixture.one"));
  registry.register(createFakeEngine("fixture.two"));

  assert.deepEqual(
    registry.list().map((engine) => engine.id).sort(),
    ["fixture.one", "fixture.two"]
  );
});

test("get returns undefined for an unknown engine id", () => {
  const registry = createEngineRegistry();

  assert.equal(registry.get("missing"), undefined);
});

test("registering the same id twice throws a ConfigurationError", () => {
  const registry = createEngineRegistry();
  registry.register(createFakeEngine("fixture.dummy"));

  assert.throws(
    () => registry.register(createFakeEngine("fixture.dummy")),
    (error: unknown) =>
      error instanceof ConfigurationError && error.code === "ENGINE_ALREADY_REGISTERED"
  );
});

test("registering an engine with an empty id throws a ConfigurationError", () => {
  const registry = createEngineRegistry();

  assert.throws(
    () => registry.register(createFakeEngine("   ")),
    (error: unknown) => error instanceof ConfigurationError
  );
});

test("unregister removes a registered engine and reports success", () => {
  const registry = createEngineRegistry();
  registry.register(createFakeEngine("fixture.dummy"));

  const removed = registry.unregister("fixture.dummy");

  assert.equal(removed, true);
  assert.equal(registry.has("fixture.dummy"), false);
});

test("unregister returns false for an unknown engine id", () => {
  const registry = createEngineRegistry();

  assert.equal(registry.unregister("missing"), false);
});

test("the registry declares no real engine by default", () => {
  const registry = createEngineRegistry();

  assert.deepEqual(registry.list(), []);
});
