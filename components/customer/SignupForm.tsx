"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PasswordFieldWithToggle } from "@/components/customer/PasswordFieldWithToggle";

const inputClass =
  "mt-2 block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900";

// v2.1 : inscription accessible directement depuis /connexion-client
// (retour utilisateur : "la possibilité d'en créer un [compte] en client
// sur mon compte, genre un popup de connexion et si pas inscrit bascule
// sur une inscription") — même service que l'inscription proposée dans
// l'éditeur de schéma (InlineSignupForm.tsx), formulaire dédié ici pour
// suivre le style de carte pleine page de PasswordLoginForm plutôt que le
// format compact des popups de l'éditeur.
export function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/client-auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, marketingConsent }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; status?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error || "Impossible de créer le compte.");
      }

      router.push("/mon-compte");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Impossible de créer le compte.");
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-neutral-950">Créer un compte</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">
        Créez votre espace FabSystem pour sauvegarder vos projets, retrouver vos ressources et préparer vos achats.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="signup-first-name" className="block text-sm font-medium text-neutral-900">
              Prénom
            </label>
            <input
              id="signup-first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="signup-last-name" className="block text-sm font-medium text-neutral-900">
              Nom
            </label>
            <input
              id="signup-last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-neutral-900">
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            placeholder="client@example.com"
          />
        </div>

        <PasswordFieldWithToggle
          name="password"
          label="Mot de passe"
          autoComplete="new-password"
          helpText="8 caractères minimum."
          inputClassName="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900"
          value={password}
          onChange={setPassword}
        />

        <label className="flex items-start gap-2 text-xs leading-snug text-neutral-600">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(event) => setMarketingConsent(event.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <span>Je souhaite recevoir les informations et nouveautés FabSystem par email. Facultatif.</span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="mt-5 block text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
      >
        Déjà un compte ? Se connecter
      </button>
    </div>
  );
}
