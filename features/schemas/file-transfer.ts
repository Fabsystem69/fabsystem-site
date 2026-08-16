import type { SchemaEdge, SchemaNode } from "@/features/schemas/store/useSchemaStore";
import {
  buildPortableSchemaFile,
  getFirstSchemaValidationMessage,
  validatePortableSchemaFile,
} from "@/lib/project-schema-contract";

const PORTABLE_SCHEMA_MIME = "application/json";

function slugifyFilePart(value: string) {
  return (value || "schema")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "schema";
}

export function buildPortableSchemaFilename(projectName: string) {
  return `${slugifyFilePart(projectName)}.fabschema`;
}

export function downloadPortableSchemaFile(input: {
  projectName: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}) {
  const schemaDocument = buildPortableSchemaFile({
    projectName: input.projectName,
    nodes: input.nodes,
    edges: input.edges,
  });
  const blob = new Blob([JSON.stringify(schemaDocument, null, 2)], { type: PORTABLE_SCHEMA_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = buildPortableSchemaFilename(input.projectName);
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readPortableSchemaFile(file: File) {
  try {
    const raw = await file.text();
    const json = JSON.parse(raw) as unknown;
    const result = validatePortableSchemaFile(json);
    if (!result.success) {
      return {
        ok: false as const,
        message: getFirstSchemaValidationMessage(result.details),
      };
    }

    return {
      ok: true as const,
      schema: {
        projectName: result.data.projectName,
        nodes: result.data.nodes as SchemaNode[],
        edges: result.data.edges as SchemaEdge[],
      },
    };
  } catch {
    return {
      ok: false as const,
      message: "Le fichier sélectionné n'est pas un schéma FabSystem valide.",
    };
  }
}
