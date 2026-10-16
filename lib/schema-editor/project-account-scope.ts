// Compte dont l'éditeur liste / crée les projets (Ouvrir, Sauvegarder).
// Retour utilisateur : "quand je bosse sur un schéma client c'est comme si
// j'étais sur son compte" — un Admin travaille toujours pour un client
// explicitement choisi (routes /api/internal/projects, protégées par la
// session admin), jamais sur sa propre session client éventuelle.
export type ProjectAccountScope =
  | { kind: "self"; listUrl: string; createUrl: string }
  | { kind: "customer"; customerId: string; listUrl: string; createUrl: string }
  | { kind: "needs-customer" };

export function resolveProjectAccountScope(input: {
  isAdmin: boolean;
  actingCustomerId: string | null;
}): ProjectAccountScope {
  if (!input.isAdmin) {
    return { kind: "self", listUrl: "/api/projects", createUrl: "/api/projects" };
  }
  if (!input.actingCustomerId) {
    return { kind: "needs-customer" };
  }
  return {
    kind: "customer",
    customerId: input.actingCustomerId,
    listUrl: `/api/internal/projects?customerId=${encodeURIComponent(input.actingCustomerId)}`,
    createUrl: "/api/internal/projects",
  };
}
