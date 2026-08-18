"use client";

import { useState } from "react";

// Champ mot de passe avec bouton "Afficher/Masquer" — extrait en composant
// client réutilisable car les pages qui l'utilisent (définir mot de passe,
// profil) sont des composants serveur avec Server Actions ; seul ce petit
// bout a besoin d'état côté client (le type de l'input qui bascule).
export function PasswordFieldWithToggle({
  name,
  label,
  autoComplete,
  helpText,
  inputClassName,
  value,
  onChange,
}: {
  name: string;
  label: string;
  autoComplete: "new-password" | "current-password";
  helpText?: string;
  inputClassName: string;
  // Optionnels : non fournis, le champ reste non contrôlé (lu par
  // FormData/Server Action côté page définir-mot-de-passe) ; fournis
  // (SignupForm, qui envoie la valeur via fetch en JS), le champ devient
  // contrôlé — les deux usages partagent le même composant plutôt que
  // d'en dupliquer un pour chaque cas.
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-800">{label}</span>
      <div className="relative">
        <input
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          {...(onChange ? { value: value ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})}
          className={`${inputClassName} pr-16`}
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
      {helpText ? <span className="block text-xs text-neutral-500">{helpText}</span> : null}
    </label>
  );
}
