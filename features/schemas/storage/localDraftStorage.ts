import type { SchemaNode, SchemaEdge } from "@/features/schemas/store/useSchemaStore";

// Sauvegarde locale d'un schéma unique (docs/schema/CDC_FabSystem_Schema_V1.md
// §34-35, §41-42). Ébauche fonctionnelle : un seul brouillon, pas encore de
// gestion multi-projets ni d'IndexedDB — juste assez pour survivre à un
// refresh, avec une enveloppe versionnée pour permettre une migration future
// vers le format complet `.fabschema` sans casser les brouillons existants.
const STORAGE_KEY = "fabsystem-schema:draft:v1";
// Exportée : réutilisée par features/schemas/jsonIo.ts pour l'export/import
// de fichier .json, même enveloppe versionnée que le brouillon local.
export const DRAFT_FORMAT_VERSION = 1;
const FORMAT_VERSION = DRAFT_FORMAT_VERSION;

export interface DraftEnvelope {
  format: "fabsystem-schema-draft";
  version: number;
  projectName: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  updatedAt: string;
}

export function loadDraft(): DraftEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftEnvelope>;
    if (parsed.format !== "fabsystem-schema-draft" || parsed.version !== FORMAT_VERSION) return null;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return parsed as DraftEnvelope;
  } catch {
    return null;
  }
}

export function saveDraft(data: { projectName: string; nodes: SchemaNode[]; edges: SchemaEdge[] }): boolean {
  if (typeof window === "undefined") return false;
  try {
    const envelope: DraftEnvelope = {
      format: "fabsystem-schema-draft",
      version: FORMAT_VERSION,
      projectName: data.projectName,
      nodes: data.nodes,
      edges: data.edges,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
