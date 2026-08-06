"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginPageContent() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return "Erreur";
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Identifiants invalides");

      window.location.assign(next);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">Espace interne</h1>
      <p className="mt-2 text-sm text-neutral-600">Connexion par identifiants (admin).</p>

      <div className="mt-8 space-y-4">
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="text-sm font-semibold text-neutral-900">Email / mot de passe</div>
          <form onSubmit={handlePassword} className="mt-3 space-y-3">
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              autoComplete="username"
              required
            />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="text-left text-sm font-medium text-neutral-700 underline underline-offset-4"
            >
              {showPassword ? "Masquer" : "Afficher"}
            </button>
            <button
              disabled={loading}
              className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
