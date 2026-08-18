import { NextResponse } from "next/server";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";
import { hasUnlimitedSchemaAccess } from "@/lib/services/schema-unlock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Bug corrigé (retour utilisateur : "après utilisation du code le popup
// revient quand même après 3 consommateurs") : rien ne rappelait jamais
// cette route côté client — `hasUnlimitedConsumers` restait bloqué à
// `false` dans le store, quoi qu'il arrive (achat, code promo), donc la
// limite gratuite ne se levait jamais réellement. Appelée par Editor.tsx au
// chargement et juste après une redemption de code réussie.
//
// Pas de `requireCustomerActor` ici (qui lève une erreur 401) : un visiteur
// sans compte est un état normal de l'éditeur ("gratuit, sans compte"),
// pas une erreur — on répond juste `unlimited: false`.
export async function GET(request: Request) {
  const session = await getCustomerSessionFromCookie();
  if (!session) {
    return NextResponse.json({ unlimited: false, loggedIn: false });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? "";

  const unlimited = await hasUnlimitedSchemaAccess(session.customer.id, projectId);
  return NextResponse.json({ unlimited, loggedIn: true });
}
