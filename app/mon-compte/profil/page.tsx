import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { LogoutButton } from "@/components/customer/LogoutButton";
import { PasswordFieldWithToggle } from "@/components/customer/PasswordFieldWithToggle";
import { updateOwnPasswordAction, updateOwnProfileAction } from "@/app/mon-compte/profil/actions";
import { getOwnCustomerProfile } from "@/lib/services/customer-profile";
import { requireCustomerActor } from "@/lib/server/project-actor";

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Vos informations de compte FabSystem.",
  alternates: { canonical: "/mon-compte/profil" },
  robots: { index: false, follow: false },
};

const inputClass =
  "block min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-900";
const labelClass = "block space-y-1.5";
const labelTextClass = "text-sm font-medium text-neutral-800";

// Espace client V2 (UI-8) — Mon profil, formulaire de modification.
// updateOwnCustomerProfile (lib/services/customer-profile.ts) n'opere
// jamais que sur actor.customerId, deduit de la session : contrairement a
// lib/services/customers.ts:updateCustomer (Admin, id explicite, sans
// verification d'appartenance), une modification croisee entre comptes est
// structurellement impossible ici, pas seulement filtree.
export default async function MonProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const actor = await requireCustomerActor();
  const customer = await getOwnCustomerProfile(actor);
  const { error, success } = await searchParams;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Mon profil</h1>
        <p className="mt-1 text-sm text-neutral-600">Vos informations de compte FabSystem.</p>
      </div>

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <Card className="p-6">
        <p className="text-sm text-neutral-500">Email</p>
        <p className="mt-1 text-sm font-medium text-neutral-950">{customer.email}</p>
        <p className="mt-1 text-xs text-neutral-400">
          Non modifiable ici — c&apos;est l&apos;adresse utilisée pour votre lien de connexion.
        </p>
      </Card>

      <Card className="p-6">
        <form action={updateOwnProfileAction} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              <span className={labelTextClass}>Prénom</span>
              <input
                name="firstName"
                type="text"
                required
                defaultValue={customer.firstName ?? ""}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Nom</span>
              <input
                name="lastName"
                type="text"
                required
                defaultValue={customer.lastName ?? ""}
                className={inputClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            <span className={labelTextClass}>Téléphone</span>
            <input
              name="phone"
              type="tel"
              defaultValue={customer.phone ?? ""}
              className={inputClass}
              placeholder="06 12 34 56 78"
            />
          </label>

          <label className={labelClass}>
            <span className={labelTextClass}>Adresse</span>
            <input
              name="address"
              type="text"
              defaultValue={customer.address ?? ""}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            <span className={labelTextClass}>
              Niveau en électricité
              <span className="ml-2 font-normal text-neutral-400">(optionnel)</span>
            </span>
            <select
              name="electricalSkillLevel"
              defaultValue={customer.electricalSkillLevel ?? ""}
              className={inputClass}
            >
              <option value="">Non renseigné</option>
              <option value="DEBUTANT">Débutant</option>
              <option value="INTERMEDIAIRE">Intermédiaire</option>
              <option value="AVANCE">Avancé</option>
            </select>
            <span className="block text-xs text-neutral-500">
              Nous aide à vous proposer des contenus adaptés à votre niveau.
            </span>
          </label>

          <div className="border-t border-neutral-100 pt-5">
            <p className="text-sm font-medium text-neutral-800">Véhicule / bateau</p>
            <p className="mt-1 text-xs text-neutral-500">
              Utile pour vous proposer des conseils et contenus adaptés.
            </p>

            <div className="mt-3 space-y-4">
              <label className={labelClass}>
                <span className={labelTextClass}>Type</span>
                <select name="assetType" defaultValue={customer.assetType} className={inputClass}>
                  <option value="VEHICLE">Van / camping-car</option>
                  <option value="BOAT">Bateau</option>
                  <option value="OTHER">Autre / pas encore décidé</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className={labelClass}>
                  <span className={labelTextClass}>Marque</span>
                  <input
                    name="assetBrand"
                    type="text"
                    defaultValue={customer.assetBrand ?? ""}
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Modèle</span>
                  <input
                    name="assetModel"
                    type="text"
                    defaultValue={customer.assetModel ?? ""}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className={labelClass}>
                <span className={labelTextClass}>Immatriculation</span>
                <input
                  name="registration"
                  type="text"
                  defaultValue={customer.registration ?? ""}
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-5">
            <label className={labelClass}>
              <span className={labelTextClass}>
                Lien vers mon drive
                <span className="ml-2 font-normal text-neutral-400">(optionnel)</span>
              </span>
              <input
                name="driveLinkUrl"
                type="url"
                defaultValue={customer.driveLinkUrl ?? ""}
                className={inputClass}
                placeholder="https://drive.google.com/..."
              />
              <span className="block text-xs text-neutral-500">
                Un lien vers un dossier partagé (Google Drive, Dropbox...) où vous déposez vos schémas
                et calculs — FabSystem pourra y accéder pour vous accompagner.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-neutral-800"
          >
            Enregistrer
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold text-neutral-950">Changer mon mot de passe</p>
        <form action={updateOwnPasswordAction} className="mt-4 space-y-4">
          <PasswordFieldWithToggle
            name="password"
            label="Nouveau mot de passe"
            autoComplete="new-password"
            helpText="8 caractères minimum."
            inputClassName={inputClass}
          />
          <PasswordFieldWithToggle
            name="confirmPassword"
            label="Confirmer le mot de passe"
            autoComplete="new-password"
            inputClassName={inputClass}
          />
          <button
            type="submit"
            className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors duration-150 hover:bg-neutral-100"
          >
            Mettre à jour le mot de passe
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold text-neutral-950">Accès sécurisé</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
          Votre session reste valide 30 jours. En cas de mot de passe oublié, un lien de
          réinitialisation peut être envoyé à votre adresse email depuis la page de connexion.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </Card>
    </div>
  );
}
