import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getCurrentCartFromRequest } from "@/lib/server/cart-session";
import { getCartSummary } from "@/lib/services/cart";

export const metadata: Metadata = {
  title: "Panier",
  description: "Consultez les produits numériques actuellement présents dans votre panier FabSystem.",
  alternates: {
    canonical: "/panier",
  },
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
  const cart = await getCurrentCartFromRequest();
  const summary = cart ? await getCartSummary(cart.id) : getEmptyCartSummary();

  return <CartView cart={summary} />;
}
