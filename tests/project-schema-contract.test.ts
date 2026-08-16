import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPortableSchemaFile,
  getFirstSchemaValidationMessage,
  type SaveProjectSchemaPayload,
  validatePortableSchemaFile,
  validateSaveProjectSchemaPayload,
} from "@/lib/project-schema-contract";

function buildMinimalPayload(): SaveProjectSchemaPayload {
  return {
    projectName: "Schéma test",
    nodes: [
      {
        id: "battery-1",
        type: "electrical",
        position: { x: 10, y: 20 },
        data: { componentType: "battery", label: "Batterie service", voltage: 12 },
      },
    ],
    edges: [
      {
        id: "edge-1",
        source: "battery-1",
        target: "consumer-1",
        type: "cable",
        data: { cableType: "power-positive", section: "6 mm²", length: 1.5 },
      },
    ],
    thumbnail: null,
  };
}

test("validateSaveProjectSchemaPayload accepte un schéma simple valide", () => {
  const result = validateSaveProjectSchemaPayload(buildMinimalPayload());
  assert.equal(result.success, true);
});

test("validateSaveProjectSchemaPayload refuse un texte imbriqué trop long", () => {
  const payload = buildMinimalPayload();
  payload.nodes[0]!.data = {
    ...(payload.nodes[0]!.data as Record<string, unknown>),
    note: "x".repeat(5_000),
  };

  const result = validateSaveProjectSchemaPayload(payload);
  if (result.success) {
    assert.fail("Le validateur aurait dû refuser un texte trop long.");
  }
  assert.match(getFirstSchemaValidationMessage(result.details), /Texte trop long/i);
});

test("validateSaveProjectSchemaPayload refuse une structure trop imbriquée", () => {
  const payload = buildMinimalPayload();
  payload.nodes[0]!.data = {
    ...(payload.nodes[0]!.data as Record<string, unknown>),
    nested: {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: {
                    h: {
                      i: "trop profond",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const result = validateSaveProjectSchemaPayload(payload);
  if (result.success) {
    assert.fail("Le validateur aurait dû refuser une structure trop imbriquée.");
  }
  assert.match(getFirstSchemaValidationMessage(result.details), /Structure trop imbriquée/i);
});

test("validatePortableSchemaFile accepte un export .fabschema généré par l'application", () => {
  const payload = buildMinimalPayload();
  const file = buildPortableSchemaFile({
    projectName: payload.projectName,
    nodes: payload.nodes,
    edges: payload.edges,
  });

  const result = validatePortableSchemaFile(file);
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.format, "fabsystem-schema-file");
  assert.equal(result.data.version, 1);
  assert.equal(result.data.projectName, payload.projectName);
});
