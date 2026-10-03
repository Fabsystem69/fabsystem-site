import { NextResponse } from "next/server";
import { getOrCreateCartForRequest } from "@/lib/server/cart-session";
import { addProductToCart } from "@/lib/services/cart";
import { getProductBySlug } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

// Lien d'achat direct a envoyer par mail : /acheter/<slug-du-produit>.
// Ajoute le produit au panier du visiteur puis l'envoie sur /panier.
// Si le produit n'existe pas ou n'est pas achetable, on retombe sur la boutique.
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const origin = new URL(request.url).origin;

  try {
    const product = await getProductBySlug(slug);
    const cart = await getOrCreateCartForRequest();
    await addProductToCart(cart.id, product.id);

    return NextResponse.redirect(new URL("/panier", origin));
  } catch (error) {
    console.error("acheter.redirect.failed", { slug, error });
    return NextResponse.redirect(new URL("/boutique", origin));
  }
}
