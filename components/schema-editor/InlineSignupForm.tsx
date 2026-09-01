"use client";

import { useState } from "react";
import Link from "next/link";

// Formulaire d'inscription compact, réutilisé partout où l'éditeur a besoin
// d'un compte (bandeau à l'ouverture, popup de limite gratuite, offre de
// coaching) — retour utilisateur : "ça évite les retours de gens qui ont un
// code promo mais ça ne marche pas car ils n'ont pas de compte" (une
// dizaine de signalements). Un seul composant plutôt que trois formulaires
// dupliqués, `onSuccess` laisse chaque appelant décider de la suite
// (rattacher le schéma en cours à un projet, continuer la redemption de
// code, continuer le checkout…).
export function InlineSignupForm({ darkMode, onSuccess }: { darkMode: boolean; onSuccess: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "email_taken">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/client-auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, marketingConsent }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (data?.status === "email_taken") {
          setStatus("email_taken");
          return;
        }
        setStatus("error");
        setError(data?.error ?? "Une erreur est survenue.");
        return;
      }
      onSuccess();
    } catch {
      setStatus("error");
      setError("Une erreur est survenue.");
    }
  }

  const inputClass = `w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
  }`;

  if (status === "email_taken") {
    return (
      <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-neutral-700 text-neutral-300" : "border-neutral-200 text-neutral-600"}`}>
        Un compte existe déjà avec cet email.
        <Link href="/connexion-client" className={`mt-1.5 block text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}>
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Prénom"
          autoComplete="given-name"
          className={inputClass}
        />
        <input
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Nom"
          autoComplete="family-name"
          className={inputClass}
        />
      </div>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoComplete="email"
        className={inputClass}
      />
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe (8 caractères min.)"
          autoComplete="new-password"
          className={`${inputClass} pr-14`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          tabIndex={-1}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[11px] font-medium ${
            darkMode ? "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          {showPassword ? "Masquer" : "Afficher"}
        </button>
      </div>
      <label className={`flex items-start gap-2 text-[11px] leading-snug ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>Je souhaite recevoir les informations et nouveautés FabSystem par email. Facultatif.</span>
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className={`w-full rounded-md px-2.5 py-1.5 text-sm font-semibold transition-base disabled:opacity-60 ${
          darkMode ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
        }`}
      >
        {status === "loading" ? "Création…" : "Créer mon compte"}
      </button>
      {status === "error" && error ? <p className="text-xs text-red-500">{error}</p> : null}
      <p className={`text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
        Déjà un compte ?{" "}
        <Link href="/connexion-client" className={`font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}>
          Se connecter
        </Link>
      </p>
    </form>
  );
}
