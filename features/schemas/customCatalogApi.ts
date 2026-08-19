// Client léger pour /api/schema-editor/custom-items — appelé uniquement
// côté navigateur, même convention que projectSchemaApi.ts (fetch avec
// cookies de session).

export interface CustomCatalogItem {
  id: string;
  componentType: string;
  brand: string;
  model: string;
  defaults: Record<string, unknown>;
  imageDataUrl: string;
  createdAt: string;
}

export async function listCustomCatalogItemsApi(): Promise<CustomCatalogItem[]> {
  const res = await fetch("/api/schema-editor/custom-items", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

export interface CreateCustomCatalogItemInput {
  componentType: string;
  brand: string;
  model: string;
  defaults: Record<string, unknown>;
  imageDataUrl: string;
}

export async function createCustomCatalogItemApi(
  input: CreateCustomCatalogItemInput,
): Promise<{ ok: true; item: CustomCatalogItem } | { ok: false; message: string }> {
  const res = await fetch("/api/schema-editor/custom-items", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { ok: false, message: data?.error ?? "Impossible de créer cet item." };
  }
  const data = await res.json();
  return { ok: true, item: data.item };
}

export async function deleteCustomCatalogItemApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/schema-editor/custom-items/${id}`, { method: "DELETE", credentials: "include" });
  return res.ok;
}
