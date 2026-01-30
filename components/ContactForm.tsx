"use client";

import { useState } from "react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | "ok" | "error">(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Erreur serveur");
      }

      setStatus("ok");
      form.reset();
    } catch (err) {
      console.error("CONTACT FORM ERROR:", err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      {/* ✅ Honeypot (anti-spam) : doit rester vide */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <input
        name="name"
        required
        type="text"
        placeholder="Nom *"
        className="w-full rounded-md border px-4 py-2"
      />

      <input
        name="email"
        required
        type="email"
        placeholder="Email *"
        className="w-full rounded-md border px-4 py-2"
      />

      <input
        name="phone"
        type="text"
        placeholder="Téléphone (optionnel)"
        className="w-full rounded-md border px-4 py-2"
      />

      <textarea
        name="message"
        required
        placeholder="Votre message *"
        rows={5}
        className="w-full rounded-md border px-4 py-2"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Envoi..." : "Envoyer"}
      </button>

      {status === "ok" && (
        <p className="text-sm text-green-700">Message envoyé ✅</p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-700">
          Erreur d’envoi. Réessaie ou écris-nous par email.
        </p>
      )}
    </form>
  );
}