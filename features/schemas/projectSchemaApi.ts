import type { SchemaNode, SchemaEdge } from "@/features/schemas/store/useSchemaStore";

// Client léger pour l'API projects/[projectId]/schema (retour utilisateur :
// "il manque enregistrer lié au compte client") — appelé uniquement côté
// navigateur (fetch avec cookies de session, jamais depuis un composant
// serveur). Retourne `null` plutôt que de lever une erreur pour les cas
// attendus (pas connecté, pas encore de schéma sauvegardé) : à l'appelant
// de décider quoi faire, ce n'est pas une panne.

export interface ProjectSummary {
  id: string;
  name: string;
}

export interface RemoteSchema {
  projectName: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}

// Liste les projets du client connecté — null si pas connecté (401),
// jamais une exception pour ce cas attendu.
export async function listMyProjects(): Promise<ProjectSummary[] | null> {
  const res = await fetch("/api/projects", { credentials: "include" });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return (data.projects ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
}

export async function fetchProjectSchema(projectId: string): Promise<RemoteSchema | null> {
  const res = await fetch(`/api/projects/${projectId}/schema`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.schema) return null;
  return { projectName: data.schema.projectName, nodes: data.schema.nodes, edges: data.schema.edges };
}

export async function saveProjectSchemaApi(projectId: string, data: RemoteSchema): Promise<boolean> {
  const res = await fetch(`/api/projects/${projectId}/schema`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}
