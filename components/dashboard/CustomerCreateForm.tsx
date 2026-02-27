"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      address: String(formData.get("address") || "").trim(),
    };

    try {
      const res = await fetch("/api/internal/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(json.error || "Impossible de créer le client.");
      }

      router.replace("/dashboard/customers");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-4"
    >
      <h2 className="text-lg font-semibold text-neutral-900">Nouveau client</h2>
      <div className="mt-4 grid gap-3">
        <input
          name="name"
          placeholder="Nom"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="phone"
          placeholder="Téléphone"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <textarea
          name="address"
          placeholder="Adresse"
          rows={3}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Création..." : "Créer le client"}
      </button>
    </form>
  );
}
