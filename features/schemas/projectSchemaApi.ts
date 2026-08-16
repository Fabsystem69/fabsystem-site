import type { SchemaNode, SchemaEdge } from "@/features/schemas/store/useSchemaStore";

// Client léger pour l'API projects/[projectId]/schema (retour utilisateur :
// "il manque enregistrer lié au compte client") — appelé uniquement côté
// navigateur (fetch avec cookies de session, jamais depuis un composant
// serveur). Retourne maintenant un résultat structuré pour distinguer les
// cas attendus (pas connecté, projet introuvable, quota, etc.) et afficher
// une aide compréhensible dans l'éditeur au lieu d'un simple "Erreur
// d'enregistrement".

export interface ProjectSummary {
  id: string;
  name: string;
}

export interface RemoteSchema {
  projectName: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  thumbnail?: string | null;
}

export type SchemaApiErrorCode =
  | "AUTH_REQUIRED"
  | "ACCESS_DENIED"
  | "PROJECT_NOT_FOUND"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "BAD_REQUEST"
  | "NETWORK"
  | "UNKNOWN";

export interface SchemaApiProblem {
  status: number;
  code: SchemaApiErrorCode;
  message: string;
  retryAfterSeconds: number | null;
}

export type FetchProjectSchemaResult =
  | { ok: true; schema: RemoteSchema | null }
  | { ok: false; problem: SchemaApiProblem };

export type SaveProjectSchemaResult =
  | { ok: true }
  | { ok: false; problem: SchemaApiProblem };

function mapSchemaApiCode(status: number, code: string | null): SchemaApiErrorCode {
  if (code === "BAD_REQUEST") return "BAD_REQUEST";
  if (code === "PAYLOAD_TOO_LARGE" || status === 413) return "PAYLOAD_TOO_LARGE";
  if (code === "RATE_LIMITED" || status === 429) return "RATE_LIMITED";
  if (status === 401) return "AUTH_REQUIRED";
  if (status === 403) return "ACCESS_DENIED";
  if (status === 404) return "PROJECT_NOT_FOUND";
  return "UNKNOWN";
}

async function readSchemaApiProblem(response: Response): Promise<SchemaApiProblem> {
  const body = (await response.json().catch(() => null)) as { code?: string; error?: string } | null;
  const retryAfterHeader = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : Number.NaN;
  const message = body?.error?.trim() || `HTTP ${response.status}`;

  return {
    status: response.status,
    code: mapSchemaApiCode(response.status, body?.code ?? null),
    message,
    retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : null,
  };
}

function networkProblem(): SchemaApiProblem {
  return {
    status: 0,
    code: "NETWORK",
    message: "Network request failed",
    retryAfterSeconds: null,
  };
}

// Liste les projets du client connecté — null si pas connecté (401),
// jamais une exception pour ce cas attendu.
export async function listMyProjects(): Promise<ProjectSummary[] | null> {
  try {
    const res = await fetch("/api/projects", { credentials: "include" });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return (data.projects ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
  } catch {
    return null;
  }
}

export async function fetchProjectSchema(projectId: string): Promise<FetchProjectSchemaResult> {
  try {
    const res = await fetch(`/api/projects/${projectId}/schema`, { credentials: "include" });
    if (!res.ok) {
      return { ok: false, problem: await readSchemaApiProblem(res) };
    }

    const data = (await res.json()) as { schema?: RemoteSchema | null };
    if (!data.schema) {
      return { ok: true, schema: null };
    }

    return {
      ok: true,
      schema: {
        projectName: data.schema.projectName,
        nodes: data.schema.nodes,
        edges: data.schema.edges,
        thumbnail: data.schema.thumbnail ?? null,
      },
    };
  } catch {
    return { ok: false, problem: networkProblem() };
  }
}

export async function saveProjectSchemaApi(projectId: string, data: RemoteSchema): Promise<SaveProjectSchemaResult> {
  try {
    const res = await fetch(`/api/projects/${projectId}/schema`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      return { ok: false, problem: await readSchemaApiProblem(res) };
    }

    return { ok: true };
  } catch {
    return { ok: false, problem: networkProblem() };
  }
}
