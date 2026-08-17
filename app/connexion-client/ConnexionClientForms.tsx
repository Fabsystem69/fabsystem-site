"use client";

import { useState } from "react";
import { LoginRequestForm } from "@/components/customer/LoginRequestForm";
import { PasswordLoginForm } from "@/components/customer/PasswordLoginForm";

export function ConnexionClientForms() {
  const [mode, setMode] = useState<"password" | "magic-link">("password");

  if (mode === "magic-link") {
    return <LoginRequestForm onBack={() => setMode("password")} />;
  }

  return <PasswordLoginForm onSwitchToMagicLink={() => setMode("magic-link")} />;
}
