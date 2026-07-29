"use client";

import { useState } from "react";

export default function EbookCheckoutForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");

    try {
      const res = await fetch("/api/ebook/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Erreur serveur");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("EBOOK CHECKOUT ERROR:", err);
      setError("Une erreur est survenue. Réessayez dans un instant.");
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base leading-snug placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300";
  const labelClass = "text-xs font-medium text-neutral-700";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Nom</span>
        <input name="name" type="text" required maxLength={120} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Email</span>
        <input name="email" type="email" required maxLength={320} className={fieldClass} />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-neutral-900 transition-colors duration-150 hover:bg-yellow-300 disabled:opacity-60"
      >
        {loading ? "Redirection vers le paiement…" : "Acheter l'ebook — 49,99 €"}
      </button>

      <p className="text-center text-xs text-neutral-500">
        Paiement sécurisé par Stripe · téléchargement immédiat par email
      </p>
    </form>
  );
}
