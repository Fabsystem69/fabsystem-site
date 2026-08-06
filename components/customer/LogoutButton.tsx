"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/client-auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Impossible de vous déconnecter.");
      }

      router.push("/connexion-client");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Impossible de vous déconnecter."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Déconnexion..." : "Se déconnecter"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
