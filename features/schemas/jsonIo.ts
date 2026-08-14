import type { SchemaNode, SchemaEdge } from "@/features/schemas/store/useSchemaStore";
import { DRAFT_FORMAT_VERSION, type DraftEnvelope } from "@/features/schemas/storage/localDraftStorage";
import { slugify } from "@/features/schemas/export";

// Export/import complet du schéma en JSON (retour utilisateur : "si on peut
// importer") — sauvegarde/transfert fidèle (toutes les données, pas un
// rendu image), même enveloppe que le brouillon local (features/schemas/
// storage/localDraftStorage.ts) : un fichier exporté ici peut aussi bien
// être réimporté ici que restauré comme brouillon local.
export function exportSchemaJson(nodes: SchemaNode[], edges: SchemaEdge[], projectName: string): void {
  const envelope: DraftEnvelope = {
    format: "fabsystem-schema-draft",
    version: DRAFT_FORMAT_VERSION,
    projectName,
    nodes,
    edges,
    updatedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(projectName)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export class SchemaJsonImportError extends Error {}

// Validation minimale (pas de schéma Zod complet ici) : suffisant pour
// distinguer "ce n'est pas un fichier FabSystem Schéma" d'un JSON valide,
// sans bloquer un fichier légèrement différent d'une future version.
export async function importSchemaJson(file: File): Promise<DraftEnvelope> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SchemaJsonImportError("Ce fichier n'est pas un JSON valide.");
  }
  const envelope = parsed as Partial<DraftEnvelope>;
  if (envelope.format !== "fabsystem-schema-draft") {
    throw new SchemaJsonImportError("Ce fichier n'est pas un schéma FabSystem (format non reconnu).");
  }
  if (!Array.isArray(envelope.nodes) || !Array.isArray(envelope.edges)) {
    throw new SchemaJsonImportError("Ce fichier de schéma est incomplet ou corrompu.");
  }
  return {
    format: "fabsystem-schema-draft",
    version: envelope.version ?? DRAFT_FORMAT_VERSION,
    projectName: envelope.projectName || "Schéma importé",
    nodes: envelope.nodes,
    edges: envelope.edges,
    updatedAt: envelope.updatedAt ?? new Date().toISOString(),
  };
}
