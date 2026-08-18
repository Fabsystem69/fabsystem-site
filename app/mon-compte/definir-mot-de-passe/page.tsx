import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { PasswordFieldWithToggle } from "@/components/customer/PasswordFieldWithToggle";
import { setPasswordAction } from "@/app/mon-compte/definir-mot-de-passe/actions";

export const metadata: Metadata = {
  title: "Définir mon mot de passe",
  description: "Définissez votre mot de passe FabSystem.",
  alternates: { canonical: "/mon-compte/definir-mot-de-passe" },
  robots: { index: false, follow: false },
};

const inputClass =
  "block min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-900";

// v2.1 : destination du lien magique reconverti (voir
// app/api/client-auth/verify) — sert aussi bien au premier mot de passe
// (compte existant sans passwordHash) qu'a une reinitialisation (mot de
// passe oublie). Meme formulaire dans les deux cas.
export default async function DefinirMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          Définir mon mot de passe
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Choisissez un mot de passe pour vous connecter directement la prochaine fois, sans lien
          magique.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <Card className="p-6">
        <form action={setPasswordAction} className="space-y-5">
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
            className="h-11 w-full rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-neutral-800"
          >
            Enregistrer et continuer
          </button>
        </form>
      </Card>
    </div>
  );
}
