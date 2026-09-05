"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

// v2.1 : mode de connexion principal (retour utilisateur sur le lien
// magique : "pas tres conventionnel, les gens ne comprennent pas"). Le lien
// magique reste utilise, mais uniquement pour definir/reinitialiser le mot
// de passe — voir LoginRequestForm, desormais accessible via
// onSwitchToMagicLink plutot qu'en mode de connexion principal.
export function PasswordLoginForm({
  onSwitchToMagicLink,
  returnTo,
}: {
  onSwitchToMagicLink: () => void;
  returnTo?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/client-auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error || "Email ou mot de passe incorrect.");
      }

      router.push(returnTo || "/mon-compte");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Impossible de se connecter.");
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-neutral-950">Connexion</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">
        Connectez-vous avec votre email et votre mot de passe.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-neutral-900">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900"
            placeholder="client@example.com"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-neutral-900">
            Mot de passe
          </label>
          <div className="relative mt-2">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 pr-16 text-sm text-neutral-950 shadow-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              {showPassword ? "Masquer" : "Afficher"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={onSwitchToMagicLink}
        className="mt-5 block text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
      >
        Mot de passe oublié ou première connexion ?
      </button>
    </div>
  );
}
