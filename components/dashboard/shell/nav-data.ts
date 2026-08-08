import type { ComponentType, SVGProps } from "react";
import {
  AccountingIcon,
  CustomersIcon,
  DashboardIcon,
  DiscountIcon,
  FilesIcon,
  InvoicesIcon,
  OrdersIcon,
  ProductsIcon,
  QuotesIcon,
  TestimonialsIcon,
} from "@/components/dashboard-preview/icons";

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

// Structure V1 validee (voir le lot d'integration dashboard). Devis et
// Facturation restent des routes/pages/donnees intactes, simplement
// relocalisees dans une section secondaire avec un badge "Inactif" : la
// facturation et les devis operationnels sont geres hors de FabSystem.
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Tableau de bord",
    items: [{ label: "Vue d'ensemble", href: "/dashboard", icon: DashboardIcon }],
  },
  {
    title: "Ventes",
    items: [
      { label: "Commandes", href: "/dashboard/orders", icon: OrdersIcon },
      { label: "Clients", href: "/dashboard/customers", icon: CustomersIcon },
    ],
  },
  {
    title: "Boutique",
    items: [
      { label: "Produits", href: "/dashboard/catalog", icon: ProductsIcon },
      { label: "Fichiers numériques", href: "/dashboard/catalog/assets", icon: FilesIcon },
      { label: "Codes réduction", href: "/dashboard/discounts", icon: DiscountIcon },
    ],
  },
  {
    title: "Contenu",
    items: [{ label: "Témoignages", href: "/dashboard/content/testimonials", icon: TestimonialsIcon }],
  },
  {
    title: "Gestion",
    items: [{ label: "Récap URSSAF", href: "/dashboard/accounting", icon: AccountingIcon }],
  },
  {
    title: "Historique",
    items: [
      { label: "Devis", href: "/dashboard/quotes", icon: QuotesIcon, badge: "Inactif" },
      { label: "Facturation", href: "/dashboard/invoices", icon: InvoicesIcon, badge: "Inactif" },
    ],
  },
];
