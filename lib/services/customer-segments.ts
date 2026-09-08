import { prisma } from "@/lib/prisma";

// CRM (retour utilisateur : "je veux pouvoir trier le client editeur plus,
// accompagnement, ebook et juste inscrit") — un client peut appartenir à
// plusieurs segments à la fois (ex. a acheté un ebook ET est abonné Éditeur
// Plus) : ce ne sont pas des cases exclusives, sauf "juste inscrit" qui est
// par définition le complément des trois autres. Toujours recalculé depuis
// les tables sources (EditorSubscription, CustomerCapability, DossierClient,
// Order/OrderItem) — jamais un champ dupliqué sur Customer qui pourrait
// diverger.
export const CUSTOMER_SEGMENTS = ["editeur-plus", "accompagnement", "ebook", "juste-inscrit"] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

export const CUSTOMER_SEGMENT_LABELS: Record<CustomerSegment, string> = {
  "editeur-plus": "Éditeur Plus",
  accompagnement: "Accompagnement",
  ebook: "Ebook",
  "juste-inscrit": "Juste inscrit",
};

export type CustomerSegmentSets = Record<Exclude<CustomerSegment, "juste-inscrit">, Set<string>>;

// Même logique que hasSchemaEditorPlusAccess (lib/services/schema-editor-plus.ts)
// et isCapabilityCurrentlyActive (lib/entitlements.ts), mais en une seule
// paire de requêtes groupées plutôt qu'un appel par client — cette fonction
// sert justement à trier une liste entière, pas un seul client à la fois.
export async function computeCustomerSegmentSets(now: Date = new Date()): Promise<CustomerSegmentSets> {
  const [subscriptions, capabilities, dossiers, ebookOrders] = await Promise.all([
    prisma.editorSubscription.findMany({
      where: {
        status: { in: ["ACTIVE", "TRIALING"] },
        OR: [{ currentPeriodEndsAt: null }, { currentPeriodEndsAt: { gt: now } }],
      },
      select: { customerId: true },
    }),
    prisma.customerCapability.findMany({
      where: {
        capability: "schema-editor-unlimited",
        scope: "CUSTOMER",
        scopeId: null,
        status: "ACTIVE",
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { customerId: true },
    }),
    prisma.dossierClient.findMany({ select: { customerId: true } }),
    prisma.order.findMany({
      where: { status: "PAID", items: { some: { productType: "EBOOK" } } },
      select: { customerId: true },
    }),
  ]);

  return {
    "editeur-plus": new Set([...subscriptions, ...capabilities].map((row) => row.customerId)),
    accompagnement: new Set(dossiers.map((row) => row.customerId)),
    ebook: new Set(ebookOrders.flatMap((row) => (row.customerId ? [row.customerId] : []))),
  };
}

export function getCustomerSegments(customerId: string, sets: CustomerSegmentSets): CustomerSegment[] {
  const segments: CustomerSegment[] = [];
  if (sets["editeur-plus"].has(customerId)) segments.push("editeur-plus");
  if (sets.accompagnement.has(customerId)) segments.push("accompagnement");
  if (sets.ebook.has(customerId)) segments.push("ebook");
  if (segments.length === 0) segments.push("juste-inscrit");
  return segments;
}

export function customerMatchesSegment(customerId: string, segment: CustomerSegment, sets: CustomerSegmentSets) {
  if (segment === "juste-inscrit") {
    return !sets["editeur-plus"].has(customerId) && !sets.accompagnement.has(customerId) && !sets.ebook.has(customerId);
  }
  return sets[segment].has(customerId);
}
