import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { LogoutButton } from "@/components/customer/LogoutButton";
import { getCustomerAccountOverview } from "@/lib/services/customer-account";
import { requireCustomerActor } from "@/lib/server/project-actor";

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Vos informations de compte FabSystem.",
  alternates: { canonical: "/mon-compte/profil" },
};

// Espace client V2 (UI-8) — Mon profil. Affichage en lecture seule des
// données réelles du compte (MASTER-04 §13). Aucun formulaire de
// modification : la seule fonction de mise à jour existante
// (lib/services/customers.ts:updateCustomer) est un service d'admin sans
// vérification de propriété — l'exposer tel quel côté client créerait une
// faille (un client pourrait modifier n'importe quel compte via son id).
// Construire une modification de profil sécurisée nécessite une nouvelle
// route avec contrôle d'appartenance, hors périmètre de cette mission —
// voir docs/audits/UI-8-SAAS-CLIENT.md, "Profil".
export default async function MonProfilPage() {
  const actor = await requireCustomerActor();
  const customerId = actor.role === "customer" ? actor.customerId : "";
  const overview = await getCustomerAccountOverview(customerId);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Mon profil</h1>
        <p className="mt-1 text-sm text-neutral-600">Vos informations de compte FabSystem.</p>
      </div>

      <Card className="p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-neutral-500">Email</dt>
            <dd className="mt-1 text-sm font-medium text-neutral-950">
              {overview.customer.email}
            </dd>
          </div>
          {overview.customer.name ? (
            <div>
              <dt className="text-sm text-neutral-500">Nom</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-950">
                {overview.customer.name}
              </dd>
            </div>
          ) : null}
        </dl>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold text-neutral-950">Accès sécurisé</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
          Votre espace est protégé par lien magique à usage unique. Votre session reste valide 30
          jours.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </Card>
    </div>
  );
}
