import { NextResponse } from "next/server";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";
import { getSessionFromCookies } from "@/lib/require-session";
import { hasUnlimitedSchemaAccess } from "@/lib/services/schema-unlock";
import { hasSchemaEditorPlusAccess } from "@/lib/services/schema-editor-plus";
import { computeAccountInitials } from "@/lib/customer-initials";

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
    const adminSession = await getSessionFromCookies();
    if (adminSession) {
      // Le dashboard est un espace de préparation et d'accompagnement : ses
      // schémas ne sont pas soumis à l'ancien palier consommateur client.
      return NextResponse.json({
        unlimited: true,
        loggedIn: true,
        isAdmin: true,
        initials: computeAccountInitials(null, adminSession.sub),
      });
    }
    return NextResponse.json({ unlimited: false, loggedIn: false, initials: null });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? "";

  const [legacyUnlimited, plus] = await Promise.all([
    hasUnlimitedSchemaAccess(session.customer.id, projectId),
    hasSchemaEditorPlusAccess(session.customer.id),
  ]);
  return NextResponse.json({
    unlimited: legacyUnlimited || plus,
    plus,
    loggedIn: true,
    initials: computeAccountInitials(session.customer.name, session.customer.email),
  });
}
