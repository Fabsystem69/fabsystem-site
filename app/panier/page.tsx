import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getCurrentCartFromRequest } from "@/lib/server/cart-session";
import { getCartSummary } from "@/lib/services/cart";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";

export const metadata: Metadata = {
  title: "Panier",
  description: "Consultez les produits numériques actuellement présents dans votre panier FabSystem.",
  alternates: {
    canonical: "/panier",
  },
  robots: { index: false, follow: false },
};

function getEmptyCartSummary() {
  return {
    cartId: "",
    status: "ACTIVE" as const,
    itemCount: 0,
    currency: "EUR",
    subtotalCents: 0,
    lines: [],
  };
}

export const dynamic = "force-dynamic";

export default async function PanierPage() {
  const [cart, session] = await Promise.all([getCurrentCartFromRequest(), getCustomerSessionFromCookie()]);
  const summary = cart ? await getCartSummary(cart.id) : getEmptyCartSummary();

  return (
    <CartView
      cart={summary}
      customerSession={session ? { email: session.customer.email, name: session.customer.name } : null}
    />
  );
}
