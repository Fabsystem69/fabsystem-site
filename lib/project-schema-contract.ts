import { z } from "zod";

export const MAX_PROJECT_NAME_LENGTH = 120;
export const MAX_NODES = 500;
export const MAX_EDGES = 2000;
export const MAX_THUMBNAIL_LENGTH = 400_000;
export const MAX_PROJECT_SCHEMA_REQUEST_BYTES = 1_500_000;

const MAX_IDENTIFIER_LENGTH = 160;
const MAX_NESTED_STRING_LENGTH = 4_000;
const MAX_NESTED_ARRAY_LENGTH = 64;
const MAX_NESTED_OBJECT_KEYS = 64;
const MAX_NESTING_DEPTH = 8;
const MAX_TOTAL_NESTED_VALUES = 60_000;
const MAX_PROPERTY_NAME_LENGTH = 80;

export const PORTABLE_SCHEMA_FILE_FORMAT = "fabsystem-schema-file";
export const PORTABLE_SCHEMA_FILE_VERSION = 1;

export interface PersistedSchemaNode extends Record<string, unknown> {
  id: string;
  position: { x: number; y: number };
}

export interface PersistedSchemaEdge extends Record<string, unknown> {
  id: string;
  source: string;
  target: string;
}

export interface SaveProjectSchemaPayload {
  projectName: string;
  nodes: PersistedSchemaNode[];
  edges: PersistedSchemaEdge[];
  thumbnail?: string | null;
}

export interface PortableSchemaFile {
  format: typeof PORTABLE_SCHEMA_FILE_FORMAT;
  version: typeof PORTABLE_SCHEMA_FILE_VERSION;
  exportedAt: string;
  projectName: string;
  nodes: PersistedSchemaNode[];
  edges: PersistedSchemaEdge[];
}

export interface SchemaValidationDetails {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
}

type NestedBudgetState = {
  visitedValues: number;
};

const schemaNodeSchema = z
  .object({
    id: z.string().trim().min(1).max(MAX_IDENTIFIER_LENGTH),
    position: z.object({ x: z.number().finite(), y: z.number().finite() }),
  })
  .catchall(z.unknown());

const schemaEdgeSchema = z
  .object({
    id: z.string().trim().min(1).max(MAX_IDENTIFIER_LENGTH),
    source: z.string().trim().min(1).max(MAX_IDENTIFIER_LENGTH),
    target: z.string().trim().min(1).max(MAX_IDENTIFIER_LENGTH),
  })
  .catchall(z.unknown());

const saveProjectSchemaInputSchema = z.object({
  projectName: z.string().trim().min(1).max(MAX_PROJECT_NAME_LENGTH),
  nodes: z.array(schemaNodeSchema).max(MAX_NODES),
  edges: z.array(schemaEdgeSchema).max(MAX_EDGES),
  thumbnail: z.string().max(MAX_THUMBNAIL_LENGTH).startsWith("data:image/").nullable().optional(),
});

const portableSchemaFileSchema = z.object({
  format: z.literal(PORTABLE_SCHEMA_FILE_FORMAT),
  version: z.literal(PORTABLE_SCHEMA_FILE_VERSION),
  exportedAt: z.string().datetime(),
  projectName: z.string().trim().min(1).max(MAX_PROJECT_NAME_LENGTH),
  nodes: z.array(schemaNodeSchema).max(MAX_NODES),
  edges: z.array(schemaEdgeSchema).max(MAX_EDGES),
});

function createValidationDetails(): SchemaValidationDetails {
  return { formErrors: [], fieldErrors: {} };
}

function addIssue(details: SchemaValidationDetails, path: (string | number)[], message: string) {
  if (path.length === 0) {
    details.formErrors.push(message);
    return;
  }

  const key = path.join(".");
  details.fieldErrors[key] ??= [];
  details.fieldErrors[key].push(message);
}

function mergeDetails(target: SchemaValidationDetails, source: SchemaValidationDetails) {
  target.formErrors.push(...source.formErrors);
  for (const [key, messages] of Object.entries(source.fieldErrors)) {
    target.fieldErrors[key] ??= [];
    target.fieldErrors[key].push(...messages);
  }
}

function inspectNestedValue(
  value: unknown,
  path: (string | number)[],
  details: SchemaValidationDetails,
  state: NestedBudgetState,
  depth: number,
) {
  state.visitedValues += 1;

  if (state.visitedValues > MAX_TOTAL_NESTED_VALUES) {
    addIssue(details, [], "Le schéma contient trop de données détaillées pour être sauvegardé.");
    return;
  }

  if (depth > MAX_NESTING_DEPTH) {
    addIssue(details, path, `Structure trop imbriquée (maximum ${MAX_NESTING_DEPTH} niveaux).`);
    return;
  }

  if (value === null) return;

  switch (typeof value) {
    case "string":
      if (value.length > MAX_NESTED_STRING_LENGTH) {
        addIssue(details, path, `Texte trop long (maximum ${MAX_NESTED_STRING_LENGTH} caractères).`);
      }
      return;
    case "number":
      if (!Number.isFinite(value)) {
        addIssue(details, path, "Nombre invalide.");
      }
      return;
    case "boolean":
      return;
    case "object":
      if (Array.isArray(value)) {
        if (value.length > MAX_NESTED_ARRAY_LENGTH) {
          addIssue(details, path, `Tableau trop long (maximum ${MAX_NESTED_ARRAY_LENGTH} éléments).`);
          return;
        }

        value.forEach((entry, index) => {
          inspectNestedValue(entry, [...path, index], details, state, depth + 1);
        });
        return;
      }

      for (const key of Object.keys(value)) {
        if (key.length > MAX_PROPERTY_NAME_LENGTH) {
          addIssue(details, [...path, key], `Nom de propriété trop long (maximum ${MAX_PROPERTY_NAME_LENGTH} caractères).`);
          continue;
        }
      }

      const entries = Object.entries(value);
      if (entries.length > MAX_NESTED_OBJECT_KEYS) {
        addIssue(details, path, `Objet trop détaillé (maximum ${MAX_NESTED_OBJECT_KEYS} propriétés).`);
        return;
      }

      entries.forEach(([key, entry]) => {
        inspectNestedValue(entry, [...path, key], details, state, depth + 1);
      });
      return;
    default:
      addIssue(details, path, "Type de donnée non pris en charge.");
  }
}

function inspectSchemaGraph(nodes: PersistedSchemaNode[], edges: PersistedSchemaEdge[]) {
  const details = createValidationDetails();
  const state: NestedBudgetState = { visitedValues: 0 };

  nodes.forEach((node, index) => {
    inspectNestedValue(node, ["nodes", index], details, state, 0);
  });
  edges.forEach((edge, index) => {
    inspectNestedValue(edge, ["edges", index], details, state, 0);
  });

  return details;
}

function validateSerializedSize(value: unknown) {
  const details = createValidationDetails();

  try {
    const bytes = new TextEncoder().encode(JSON.stringify(value)).length;
    if (bytes > MAX_PROJECT_SCHEMA_REQUEST_BYTES) {
      addIssue(
        details,
        [],
        `Le schéma dépasse la limite de ${Math.floor(MAX_PROJECT_SCHEMA_REQUEST_BYTES / 1024)} ko pour la sauvegarde cloud.`,
      );
    }
  } catch {
    addIssue(details, [], "Le schéma ne peut pas être sérialisé correctement.");
  }

  return details;
}

function flattenZodIssues(error: z.ZodError) {
  const details = createValidationDetails();
  for (const issue of error.issues) {
    addIssue(
      details,
      issue.path.map((segment) => (typeof segment === "number" ? segment : String(segment))),
      issue.message,
    );
  }
  return details;
}

function hasIssues(details: SchemaValidationDetails) {
  return details.formErrors.length > 0 || Object.keys(details.fieldErrors).length > 0;
}

function buildSavePayloadResult(input: unknown) {
  const parsed = saveProjectSchemaInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, details: flattenZodIssues(parsed.error) };
  }

  const details = createValidationDetails();
  mergeDetails(details, validateSerializedSize(parsed.data));
  mergeDetails(details, inspectSchemaGraph(parsed.data.nodes as PersistedSchemaNode[], parsed.data.edges as PersistedSchemaEdge[]));

  if (hasIssues(details)) {
    return { success: false as const, details };
  }

  return {
    success: true as const,
    data: parsed.data as SaveProjectSchemaPayload,
  };
}

export function validateSaveProjectSchemaPayload(input: unknown) {
  return buildSavePayloadResult(input);
}

export function validatePortableSchemaFile(input: unknown) {
  const parsed = portableSchemaFileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, details: flattenZodIssues(parsed.error) };
  }

  const payloadResult = buildSavePayloadResult({
    projectName: parsed.data.projectName,
    nodes: parsed.data.nodes,
    edges: parsed.data.edges,
    thumbnail: null,
  });

  if (!payloadResult.success) {
    return payloadResult;
  }

  return {
    success: true as const,
    data: parsed.data as PortableSchemaFile,
  };
}

export function buildPortableSchemaFile(input: {
  projectName: string;
  nodes: PersistedSchemaNode[];
  edges: PersistedSchemaEdge[];
}): PortableSchemaFile {
  return {
    format: PORTABLE_SCHEMA_FILE_FORMAT,
    version: PORTABLE_SCHEMA_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    projectName: input.projectName,
    nodes: input.nodes,
    edges: input.edges,
  };
}

export function getFirstSchemaValidationMessage(details: SchemaValidationDetails) {
  const firstFormError = details.formErrors[0];
  if (firstFormError) return firstFormError;

  const firstFieldErrors = Object.values(details.fieldErrors)[0];
  if (firstFieldErrors?.[0]) return firstFieldErrors[0];

  return "Le schéma n'a pas pu être validé.";
}
