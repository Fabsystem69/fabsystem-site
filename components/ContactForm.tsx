"use client";

import { useMemo, useState } from "react";

type Status = null | "ok" | "error";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const fieldClass =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm leading-snug text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20";
  const labelClass = "text-xs font-medium text-neutral-700";
  const hintClass = "text-xs text-neutral-500";

  const supportOptions = useMemo(
    () => [
      { value: "", label: "Choisir…" },
      { value: "Bateau", label: "Bateau" },
      { value: "Van", label: "Van" },
      { value: "Camping-car", label: "Camping-car" },
      { value: "Autre", label: "Autre" },
    ],
    []
  );

  const requestOptions = useMemo(
    () => [
      { value: "", label: "Choisir…" },
      { value: "Diagnostic / sécurisation", label: "Diagnostic / sécurisation" },
      { value: "Refonte / remise à plat", label: "Refonte / remise à plat" },
      { value: "Solaire / charge / batteries", label: "Solaire / charge / batteries" },
      { value: "Tableau / protections / distribution", label: "Tableau / protections / distribution" },
      { value: "Panne / comportement anormal", label: "Panne / comportement anormal" },
      { value: "Autre", label: "Autre" },
    ],
    []
  );

  const urgencyOptions = useMemo(
    () => [
      { value: "", label: "Choisir…" },
      { value: "Pas urgent", label: "Pas urgent" },
      { value: "Cette semaine", label: "Cette semaine" },
      { value: "Urgent (sécurité)", label: "Urgent (sécurité)" },
    ],
    []
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot anti-spam : doit rester vide
    const hp = String(formData.get("company") || "");
    if (hp.trim().length > 0) {
      setStatus("ok");
      form.reset();
      return;
    }

    // Confirmation avant envoi
    const email = String(formData.get("email") || "").trim();
    if (!window.confirm(`Confirmer l'envoi à ${email} ?`)) {
      return;
    }

    setLoading(true);
    setStatus(null);

    // Petit "délai humain" anti-bot (optionnel)
    await new Promise((r) => setTimeout(r, 250));

    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, source: "contact" }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Erreur serveur");

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
      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Ligne 1 : Nom / Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Nom *</label>
          <input name="name" required type="text" placeholder="Votre nom" className={fieldClass} />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Email *</label>
          <input name="email" required type="email" placeholder="votre@email.fr" className={fieldClass} />
        </div>
      </div>

      {/* Ligne 2 : Téléphone / Support */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Téléphone (optionnel)</label>
          <input name="phone" type="text" placeholder="Ex : 06..." className={fieldClass} />
          <p className={hintClass}>Utile si vous souhaitez être rappelé.</p>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Support concerné</label>
          <select name="supportType" className={fieldClass} defaultValue="">
            {supportOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className={hintClass}>Bateau / van / camping-car…</p>
        </div>
      </div>

      {/* Ligne 3 : Type / Urgence */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Type de demande</label>
          <select name="requestType" className={fieldClass} defaultValue="">
            {requestOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Urgence</label>
          <select name="urgency" className={fieldClass} defaultValue="">
            {urgencyOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modèle / infos rapides */}
      <div className="space-y-1">
        <label className={labelClass}>Modèle / infos utiles (optionnel)</label>
        <input
          name="context"
          type="text"
          placeholder="Ex : Bayliner 2556 / fourgon L2H2 / 2 batteries lithium / solaire 400W…"
          className={fieldClass}
        />
        <p className={hintClass}>Une ligne suffit, ça aide énormément.</p>
      </div>

      {/* Message */}
      <div className="space-y-1">
        <label className={labelClass}>Message *</label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Décris le problème / l’objectif en 5–10 lignes : ce qui existe, ce qui ne va pas, ce que vous souhaitez obtenir."
          className={fieldClass}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Envoi..." : "Envoyer"}
      </button>

      {/* Messages */}
      {status === "ok" && (
        <p className="text-sm text-neutral-700">
          Message envoyé ✅ Je vous réponds par email dès que possible.
        </p>
      )}

      {status === "error" && (
        <p className="text-sm text-neutral-700">
          Erreur d’envoi. Réessaie ou écris directement à{" "}
          <a className="underline" href="mailto:fabien.lages@fabsystem.fr">
            fabien.lages@fabsystem.fr
          </a>
          .
        </p>
      )}

      <p className="pt-2 text-xs text-neutral-500">
        Anti-spam activé. Si vous n’avez pas de réponse, vérifiez vos indésirables.
      </p>
    </form>
  );
}