import assert from "node:assert/strict";
import test from "node:test";
import {
  CalculationError,
  ConfigurationError,
  DependencyError,
  EngineError,
  ValidationError,
  isEngineError,
} from "@/lib/engines/errors";

test("EngineError carries a default code and message", () => {
  const error = new EngineError("something went wrong");

  assert.equal(error.message, "something went wrong");
  assert.equal(error.code, "ENGINE_ERROR");
  assert.equal(error.name, "EngineError");
  assert.ok(error instanceof Error);
});

test("ValidationError defaults to code VALIDATION_ERROR", () => {
  const error = new ValidationError("missing input");

  assert.equal(error.code, "VALIDATION_ERROR");
  assert.equal(error.name, "ValidationError");
  assert.ok(error instanceof EngineError);
});

test("ConfigurationError defaults to code CONFIGURATION_ERROR", () => {
  const error = new ConfigurationError("engine not registered");

  assert.equal(error.code, "CONFIGURATION_ERROR");
  assert.ok(error instanceof EngineError);
});

test("DependencyError defaults to code DEPENDENCY_ERROR", () => {
  const error = new DependencyError("missing source value");

  assert.equal(error.code, "DEPENDENCY_ERROR");
  assert.ok(error instanceof EngineError);
});

test("CalculationError defaults to code CALCULATION_ERROR", () => {
  const error = new CalculationError("division by zero");

  assert.equal(error.code, "CALCULATION_ERROR");
  assert.ok(error instanceof EngineError);
});

test("a subclass can override its default code and attach details/cause", () => {
  const cause = new Error("root cause");
  const error = new ValidationError("bad value", {
    code: "CUSTOM_CODE",
    details: { field: "voltage" },
    cause,
  });

  assert.equal(error.code, "CUSTOM_CODE");
  assert.deepEqual(error.details, { field: "voltage" });
  assert.equal(error.cause, cause);
});

test("isEngineError narrows only EngineError instances", () => {
  assert.equal(isEngineError(new ValidationError("x")), true);
  assert.equal(isEngineError(new Error("plain error")), false);
  assert.equal(isEngineError("not an error"), false);
});
