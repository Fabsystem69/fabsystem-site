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
};

export type NavGroup = {
  title: string | null;
  items: NavItem[];
};

// Structure validee : chaque entree pointe vers une route /dashboard reelle
// et deja existante. Aucune fonction non implementee n'est representee ici
// (contrairement a la premiere proposition, "Projets clients" et "Schemas
// partages" sont volontairement absents tant qu'ils n'existent pas).
export const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [{ label: "Tableau de bord", href: "/dashboard-preview", icon: DashboardIcon }],
  },
  {
    title: "Ventes",
    items: [
      { label: "Commandes", href: "/dashboard/orders", icon: OrdersIcon },
      { label: "Devis", href: "/dashboard/quotes", icon: QuotesIcon },
      { label: "Factures", href: "/dashboard/invoices", icon: InvoicesIcon },
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
];
