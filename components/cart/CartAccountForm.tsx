"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  onAccountCreated: () => void;
};

// Compte obligatoire avant validation du panier (retour utilisateur : trop
// ambigu pour le SAV/retours en guest checkout). Collecte les infos qui
// facilitent le suivi (téléphone, type de véhicule) en plus de l'identité
// minimale, et la case de partage de données (accès admin au dossier
// projet, voir Customer.dataShareConsent) — distincte de la case marketing
// déjà obligatoire pour créer un compte (voir customer-signup.ts).
// Même endpoint /api/client-auth/signup que InlineSignupForm/SignupForm,
// laissé inchangé : ces champs supplémentaires sont tous optionnels côté
// API, donc rien ne casse pour les autres appelants.
export function CartAccountForm({ onAccountCreated }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [assetType, setAssetType] = useState<"VEHICLE" | "BOAT" | "OTHER">("VEHICLE");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [dataShareConsent, setDataShareConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "email_taken">("idle");
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "mt-2 block h-11 w-full rounded-md border border-neutral-300 px-3 text-sm text-neutral-950 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100";
  const labelClass = "block text-sm font-medium text-neutral-900";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/client-auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          phone: phone || undefined,
          assetType,
          marketingConsent,
          dataShareConsent,
        }),
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
      onAccountCreated();
    } catch {
      setStatus("error");
      setError("Une erreur est survenue.");
    }
  }

  if (status === "email_taken") {
    return (
      <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-700">
        Un compte existe déjà avec cet email.
        <Link
          href="/connexion-client"
          className="mt-1.5 block text-sm font-semibold text-neutral-900 underline underline-offset-4"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-neutral-600">
        Un compte est nécessaire pour commander — il vous permet de retrouver vos achats et facilite le
        suivi de vos demandes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Prénom</span>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            className={inputClass}
          />
        </label>
        <label>
          <span className={labelClass}>Nom</span>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            className={inputClass}
          />
        </label>
      </div>

      <label>
        <span className={labelClass}>Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={inputClass}
        />
      </label>

      <label>
        <span className={labelClass}>Téléphone</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          className={inputClass}
          placeholder="06 12 34 56 78"
        />
      </label>

      <label>
        <span className={labelClass}>Type de véhicule</span>
        <select
          value={assetType}
          onChange={(e) => setAssetType(e.target.value as "VEHICLE" | "BOAT" | "OTHER")}
          className={inputClass}
        >
          <option value="VEHICLE">Van / camping-car</option>
          <option value="BOAT">Bateau</option>
          <option value="OTHER">Autre</option>
        </select>
      </label>

      <label className="relative block">
        <span className={labelClass}>Mot de passe</span>
        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={`${inputClass} pr-16`}
          placeholder="8 caractères min."
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          tabIndex={-1}
          className="absolute right-2 top-9 rounded px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          {showPassword ? "Masquer" : "Afficher"}
        </button>
      </label>

      <label className="flex items-start gap-2 text-xs leading-snug text-neutral-600">
        <input
          type="checkbox"
          required
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>J&apos;accepte de recevoir des informations de FabSystem par email.</span>
      </label>

      <label className="flex items-start gap-2 text-xs leading-snug text-neutral-600">
        <input
          type="checkbox"
          checked={dataShareConsent}
          onChange={(e) => setDataShareConsent(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>
          J&apos;autorise FabSystem à consulter mon dossier projet pour m&apos;accompagner dans mes
          demandes (devis, SAV) — optionnel.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Création du compte…" : "Créer mon compte"}
      </button>

      {status === "error" && error ? <p className="text-sm text-red-600">{error}</p> : null}

      <p className="text-xs text-neutral-500">
        Déjà un compte ?{" "}
        <Link href="/connexion-client" className="font-semibold text-neutral-900 underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
