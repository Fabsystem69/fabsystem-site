import { formatCustomerDisplayName } from "@/lib/format";

// Appels navigateur réservés à l'Admin dans l'éditeur (routes
// /api/internal/*, protégées par la session admin) : retrouver le client
// pour lequel on travaille, pour que Ouvrir / Sauvegarder se comportent
// "comme si j'étais sur son compte".

export interface ActingCustomer {
  id: string;
  label: string;
}

type CustomerRow = { id: string; name: string | null; email: string };

function toActingCustomer(row: CustomerRow): ActingCustomer {
  return { id: row.id, label: formatCustomerDisplayName(row) };
}

export async function searchCustomersApi(query: string): Promise<ActingCustomer[]> {
  try {
    const res = await fetch(`/api/internal/customers?search=${encodeURIComponent(query)}&limit=8`, { credentials: "include" });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { customers?: CustomerRow[] } | null;
    return (data?.customers ?? []).map(toActingCustomer);
  } catch {
    return [];
  }
}

export async function fetchCustomerSummaryApi(customerId: string): Promise<ActingCustomer | null> {
  try {
    const res = await fetch(`/api/internal/customers/${encodeURIComponent(customerId)}`, { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { customer?: CustomerRow } | null;
    return data?.customer ? toActingCustomer(data.customer) : null;
  } catch {
    return null;
  }
}

export async function fetchProjectOwnerIdApi(projectId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { project?: { customerId?: string } } | null;
    return data?.project?.customerId ?? null;
  } catch {
    return null;
  }
}
