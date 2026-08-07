// DONNEES DE DEMONSTRATION UNIQUEMENT.
//
// Tout ce qui est exporte par ce fichier est fictif, prefixe DEMO_, et sert
// uniquement a juger la direction visuelle de la preview (/dashboard-preview).
// Rien ici n'est lu depuis la base ni ecrit dedans. Voir app/dashboard-preview/page.tsx
// pour la liste de ce qui, a l'inverse, provient reellement de l'application
// (KPI et "A traiter" sont, eux, des donnees reelles lues en base).

export type DemoActivityItem = {
  id: string;
  label: string;
  detail: string;
  time: string;
  kind: "order" | "quote" | "customer" | "invoice" | "download";
};

export const DEMO_ACTIVITY_ITEMS: DemoActivityItem[] = [
  {
    id: "demo-activity-1",
    label: "Commande payée",
    detail: "FS-20260808-K3RT9 — Ebook Électricité Bateau",
    time: "Il y a 12 min",
    kind: "order",
  },
  {
    id: "demo-activity-2",
    label: "Devis signé",
    detail: "DV-0229 — Sophie Martin, Van Ducato",
    time: "Il y a 1 h",
    kind: "quote",
  },
  {
    id: "demo-activity-3",
    label: "Nouveau client",
    detail: "julien.b@example.com",
    time: "Il y a 3 h",
    kind: "customer",
  },
  {
    id: "demo-activity-4",
    label: "Facture émise",
    detail: "FA-2026-0142 — 1 240,00 €",
    time: "Hier, 17:20",
    kind: "invoice",
  },
  {
    id: "demo-activity-5",
    label: "Téléchargement",
    detail: "Ebook Électricité Van — version poche",
    time: "Hier, 14:05",
    kind: "download",
  },
];

export type DemoRevenuePoint = {
  day: string;
  amountCents: number;
};

// 30 points illustratifs (tendance haussiere legere avec variation realiste)
// — sert uniquement a valider le traite visuel du graphique.
export const DEMO_REVENUE_LAST_30_DAYS: DemoRevenuePoint[] = [
  320, 0, 490, 0, 0, 1470, 290, 0, 980, 490, 0, 0, 1960, 290, 0, 490, 1470, 0, 0, 980, 2450, 0, 290,
  0, 1470, 980, 0, 490, 1960, 2940,
].map((euros, index) => ({
  day: `J-${29 - index}`,
  amountCents: euros * 100,
}));
