import type { ComponentType, SVGProps } from "react";
import {
  AccompagnementIcon,
  CrmIcon,
  CustomersIcon,
  DashboardIcon,
  DiscountIcon,
  ErrorsIcon,
  FilesIcon,
  OrdersIcon,
  ProductsIcon,
  TestimonialsIcon,
} from "@/components/dashboard/shell/icons";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  // Badge discret affiche a cote du libelle (ex. "Inactif") : purement
  // informatif, ne conditionne ni l'acces ni le routage de la page.
  badge?: string;
};

export type NavGroup = {
  title: string | null;
  items: NavItem[];
};

// Determine le SEUL item actif pour un pathname donne, meme quand plusieurs
// hrefs sont prefixes l'un de l'autre (ex. /dashboard/catalog et
// /dashboard/catalog/assets) : on retient le href correspondant le plus
// long/le plus specifique, jamais plusieurs a la fois. Partage entre
// Sidebar et MobileDrawer pour ne jamais diverger entre desktop et mobile.
export function resolveActiveNavHref(pathname: string | null): string | null {
  if (!pathname) return null;

  let best: string | null = null;

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const matches =
        item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

      if (matches && (!best || item.href.length > best.length)) {
        best = item.href;
      }
    }
  }

  return best;
}

// Structure V2 (refonte dashboard, retour utilisateur : "je veux que le
// dashboard soit utilisé pour uniquement toute les presta du site virtuel").
// Devis, Facturation et Récap URSSAF ont été retirés entièrement (pas
// seulement relégués en "Inactif" comme en V1) : la facturation et les
// devis opérationnels sont désormais gérés hors de FabSystem (Indy), et le
// dashboard se recentre sur les seules prestations du site (projets,
// clients, boutique, contenu, support technique).
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Tableau de bord",
    items: [{ label: "Vue d'ensemble", href: "/dashboard", icon: DashboardIcon }],
  },
  {
    title: "Clients & projets",
    items: [
      { label: "Clients", href: "/dashboard/customers", icon: CustomersIcon },
      { label: "Projets", href: "/dashboard/projects", icon: FilesIcon },
      // Suivi des prestations d'accompagnement achetees (lib/services/dossier-client.ts)
      // — independant des Project de l'editeur de schema.
      { label: "Accompagnements", href: "/dashboard/accompagnements", icon: AccompagnementIcon },
      // Bundles d'achat assignables a un projet (lib/services/kit.ts) —
      // corrige le suivi qui affichait a tort la liste AFERIY P280 partout.
      { label: "Kits", href: "/dashboard/kits", icon: ProductsIcon },
    ],
  },
  {
    title: "Commandes & catalogue",
    items: [
      { label: "Commandes", href: "/dashboard/orders", icon: OrdersIcon },
      { label: "Produits", href: "/dashboard/catalog", icon: ProductsIcon },
      { label: "Fichiers numériques", href: "/dashboard/catalog/assets", icon: FilesIcon },
      { label: "Codes réduction", href: "/dashboard/discounts", icon: DiscountIcon },
      { label: "Codes promo éditeur", href: "/dashboard/schema-unlock-codes", icon: DiscountIcon },
    ],
  },
  {
    title: "Contenu & support",
    items: [
      { label: "Témoignages", href: "/dashboard/content/testimonials", icon: TestimonialsIcon },
      // Retour utilisateur : "avoir les remontées d'erreur avec l'id du
      // client directement dans mon dashboard" — voir lib/services/error-reports.ts.
      { label: "Erreurs", href: "/dashboard/errors", icon: ErrorsIcon },
    ],
  },
  {
    title: "CRM & opérations",
    items: [
      // Retour utilisateur : "un visu des compte crm pour pouvoir faire des
      // opée" — segment "utilise l'éditeur, jamais souscrit Éditeur Plus",
      // voir lib/services/editor-crm.ts.
      { label: "Éditeur sans abonnement", href: "/dashboard/crm/editor-sans-abonnement", icon: CrmIcon },
    ],
  },
];
