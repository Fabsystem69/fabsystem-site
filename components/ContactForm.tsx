"use client";

import { track } from "@/lib/client/track";
import { useMemo, useState } from "react";

type Status = null | "ok" | "error";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [urgent, setUrgent] = useState(false);
  const [startedAt] = useState(() => String(Date.now()));

  const fieldClass =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base leading-snug text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20";
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

      track("submit_contact_form");
      setStatus("ok");
      form.reset();
      setUrgent(false);
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
        <input name="startedAt" type="hidden" value={startedAt} readOnly />
      </div>

      <p className={hintClass}>
        Les champs marqués <span className="font-semibold text-neutral-700">*</span> sont
        nécessaires pour vous répondre. Le reste est facultatif.
      </p>

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

      {/* Message */}
      <div className="space-y-1">
        <label className={labelClass}>Message *</label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Expliquez-nous simplement votre besoin — quelques phrases suffisent."
          className={fieldClass}
        />
      </div>

      {/* Champs optionnels, repliés par défaut */}
      <details className="group rounded-md border border-neutral-200 bg-neutral-50 p-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-neutral-800 marker:content-none">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-neutral-400 transition-transform group-open:rotate-90">›</span>
            Ajouter plus de détails (optionnel)
          </span>
        </summary>

        <div className="mt-4 space-y-4">
          {/* Téléphone / Support */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={labelClass}>Téléphone</label>
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

          {/* Type de demande + urgence regroupés */}
          <div className="space-y-1">
            <label className={labelClass}>Type de demande</label>
            <select name="requestType" className={fieldClass} defaultValue="">
              {requestOptions.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                  {opt.label}
                </option>
              ))}
            </select>
            <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              C&apos;est urgent (problème de sécurité)
            </label>
            <input type="hidden" name="urgency" value={urgent ? "Urgent (sécurité)" : ""} />
          </div>

          {/* Modèle / infos rapides */}
          <div className="space-y-1">
            <label className={labelClass}>Modèle / infos utiles</label>
            <input
              name="context"
              type="text"
              placeholder="Ex : Bayliner 2556 / fourgon L2H2 / 2 batteries lithium / solaire 400W…"
              className={fieldClass}
            />
            <p className={hintClass}>Une ligne suffit, ça aide énormément.</p>
          </div>
        </div>
      </details>

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
        <p className="text-sm text-neutral-700" role="status" aria-live="polite">
          Message envoyé ✅ Je vous réponds par email dès que possible.
        </p>
      )}

      {status === "error" && (
        <p className="text-sm text-neutral-700" role="status" aria-live="polite">
          Erreur d’envoi. Réessayez ou écrivez directement à{" "}
          <a className="underline" href="mailto:contact@fabsystem.fr">
            contact@fabsystem.fr
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
