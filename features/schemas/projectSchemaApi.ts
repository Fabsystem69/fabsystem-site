import type { ProjectAssetType, ProjectVoltage } from "@/lib/generated/prisma/client";
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

export interface CreateProjectInput {
  name: string;
  assetType: ProjectAssetType;
  voltage: ProjectVoltage;
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
  | "CONFLICT"
  | "QUOTA_REACHED"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "BAD_REQUEST"
  | "SERVICE_UNAVAILABLE"
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

export type ListProjectsResult =
  | { ok: true; projects: ProjectSummary[] }
  | { ok: false; problem: SchemaApiProblem };

export type SaveProjectSchemaResult =
  | { ok: true }
  | { ok: false; problem: SchemaApiProblem };

export type CreateProjectResult =
  | { ok: true; project: ProjectSummary }
  | { ok: false; problem: SchemaApiProblem };

export type DeleteProjectResult =
  | { ok: true }
  | { ok: false; problem: SchemaApiProblem };

function mapSchemaApiCode(status: number, code: string | null): SchemaApiErrorCode {
  if (code === "BAD_REQUEST") return "BAD_REQUEST";
  if (code === "PAYLOAD_TOO_LARGE" || status === 413) return "PAYLOAD_TOO_LARGE";
  if (code === "RATE_LIMITED" || status === 429) return "RATE_LIMITED";
  if (code === "CONFLICT" || status === 409) return "CONFLICT";
  if (code === "SERVICE_UNAVAILABLE" || status === 503) return "SERVICE_UNAVAILABLE";
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
export async function listMyProjects(): Promise<ListProjectsResult> {
  try {
    const res = await fetch("/api/projects", { credentials: "include" });
    if (!res.ok) {
      return { ok: false, problem: await readSchemaApiProblem(res) };
    }
    const data = (await res.json().catch(() => null)) as {
      projects?: Array<{ id: string; name: string }>;
    } | null;
    return {
      ok: true,
      projects: (data?.projects ?? []).map((p) => ({ id: p.id, name: p.name })),
    };
  } catch {
    return { ok: false, problem: networkProblem() };
  }
}

export async function createProjectApi(input: CreateProjectInput): Promise<CreateProjectResult> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const problem = await readSchemaApiProblem(res);
      if (problem.code === "CONFLICT") {
        return {
          ok: false,
          problem: {
            ...problem,
            code: "QUOTA_REACHED",
          },
        };
      }
      return { ok: false, problem };
    }

    const data = (await res.json().catch(() => null)) as {
      project?: { id: string; name: string };
    } | null;

    if (!data?.project) {
      return {
        ok: false,
        problem: {
          status: res.status,
          code: "UNKNOWN",
          message: "Projet cloud introuvable dans la réponse",
          retryAfterSeconds: null,
        },
      };
    }

    return {
      ok: true,
      project: {
        id: data.project.id,
        name: data.project.name,
      },
    };
  } catch {
    return { ok: false, problem: networkProblem() };
  }
}

// Retour utilisateur : "à la création du compte" et "au moment de l'achat
// ou code promo, le schéma est tout de suite intégré à un projet" — un
// schéma travaillé en local (sans compte, ou avec compte mais jamais
// encore enregistré côté cloud) ne doit plus jamais rester orphelin après
// une inscription, un déblocage payant ou une redemption de code : ce
// helper compose createProjectApi + saveProjectSchemaApi en un seul appel,
// réutilisé par SignupPromptWidget, FreemiumLimitModal et
// CoachingOfferWidget plutôt que dupliqué trois fois. Valeurs par défaut
// neutres (assetType/voltage) : l'utilisateur les précisera plus tard dans
// la fiche projet s'il le souhaite, jamais bloquant ici.
export async function saveDraftAsNewProjectApi(input: {
  projectName: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}): Promise<CreateProjectResult> {
  const created = await createProjectApi({
    name: input.projectName?.trim() || "Nouveau schéma",
    assetType: "OTHER",
    voltage: "UNKNOWN",
  });
  if (!created.ok) return created;

  const saved = await saveProjectSchemaApi(created.project.id, {
    projectName: input.projectName,
    nodes: input.nodes,
    edges: input.edges,
    thumbnail: null,
  });
  if (!saved.ok) return { ok: false, problem: saved.problem };

  return created;
}

export async function deleteProjectApi(projectId: string): Promise<DeleteProjectResult> {
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });

    if (!res.ok) {
      return { ok: false, problem: await readSchemaApiProblem(res) };
    }

    return { ok: true };
  } catch {
    return { ok: false, problem: networkProblem() };
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
