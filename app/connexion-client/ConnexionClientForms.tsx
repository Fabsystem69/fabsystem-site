"use client";

import { useState } from "react";
import { LoginRequestForm } from "@/components/customer/LoginRequestForm";
import { PasswordLoginForm } from "@/components/customer/PasswordLoginForm";
import { SignupForm } from "@/components/customer/SignupForm";

// v2.1 : bascule à trois états — retour utilisateur : "la possibilité d'en
// créer un [compte], genre un popup de connexion et si pas inscrit bascule
// sur une inscription" ("c'est un montage basique de beaucoup de site").
export function ConnexionClientForms({ returnTo }: { returnTo?: string | null }) {
  const [mode, setMode] = useState<"password" | "magic-link" | "signup">("password");

  if (mode === "magic-link") {
    return <LoginRequestForm onBack={() => setMode("password")} />;
  }

  if (mode === "signup") {
    return <SignupForm onSwitchToLogin={() => setMode("password")} returnTo={returnTo} />;
  }

  return (
    <div className="space-y-3">
      <PasswordLoginForm onSwitchToMagicLink={() => setMode("magic-link")} returnTo={returnTo} />
      <button
        type="button"
        onClick={() => setMode("signup")}
        className="block w-full text-center text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
      >
        Pas encore de compte ? Créer un compte
      </button>
    </div>
  );
}
