"use client";

import { useState } from "react";
import { track } from "@/lib/client/track";

const CUSTOMER_TYPE_OPTIONS = [
  { value: "", label: "Choisir…" },
  { value: "VAN", label: "Van aménagé" },
  { value: "CAMPING_CAR", label: "Camping-car" },
  { value: "BOAT", label: "Bateau" },
  { value: "OTHER", label: "Autre" },
] as const;

const RATING_OPTIONS = [
  { value: "", label: "Choisir…" },
  { value: "5", label: "5 étoiles — très satisfait" },
  { value: "4", label: "4 étoiles — satisfait" },
  { value: "3", label: "3 étoiles — retour mitigé" },
  { value: "2", label: "2 étoiles" },
  { value: "1", label: "1 étoile" },
] as const;

type Status = null | "ok" | "error";

export function PublicTestimonialForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => String(Date.now()));

  const fieldClass =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base leading-snug text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20";
  const labelClass = "text-xs font-medium text-neutral-700";
  const hintClass = "text-xs text-neutral-500";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const honeypot = String(payload.company || "");
    if (honeypot.trim().length > 0) {
      setStatus("ok");
      setErrorMessage(null);
      form.reset();
      setStartedAt(String(Date.now()));
      return;
    }

    setLoading(true);
    setStatus(null);
    setErrorMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 250));

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Erreur serveur");
      }

      track("submit_testimonial_form");
      setStatus("ok");
      form.reset();
      setStartedAt(String(Date.now()));
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Erreur d’envoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="testimonial-company">Company</label>
        <input
          id="testimonial-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
        <input name="startedAt" type="hidden" value={startedAt} readOnly />
      </div>

      <p className={hintClass}>
        Votre avis n&apos;est jamais publié automatiquement. Il arrive d&apos;abord dans le
        dashboard, puis il est relu avant mise en ligne.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="displayName">
            Nom ou prénom *
          </label>
          <input
            id="displayName"
            name="displayName"
            required
            minLength={1}
            maxLength={80}
            type="text"
            placeholder="Ex : Gaspard V"
            className={fieldClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass} htmlFor="customerType">
            Support concerné *
          </label>
          <select
            id="customerType"
            name="customerType"
            required
            defaultValue=""
            className={fieldClass}
          >
            {CUSTOMER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} disabled={option.value === ""}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="vehicleModel">
            Modèle / projet
          </label>
          <input
            id="vehicleModel"
            name="vehicleModel"
            maxLength={160}
            type="text"
            placeholder="Ex : T4, Oceanis 34, fourgon L2H2…"
            className={fieldClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass} htmlFor="region">
            Région
          </label>
          <input
            id="region"
            name="region"
            maxLength={160}
            type="text"
            placeholder="Ex : Rhône, Bretagne…"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="rating">
            Note *
          </label>
          <select id="rating" name="rating" required defaultValue="" className={fieldClass}>
            {RATING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} disabled={option.value === ""}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className={labelClass} htmlFor="relatedOffer">
            Accompagnement concerné
          </label>
          <input
            id="relatedOffer"
            name="relatedOffer"
            maxLength={160}
            type="text"
            placeholder="Ex : Copilote, visio, diagnostic…"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="quote">
          Votre témoignage *
        </label>
        <textarea
          id="quote"
          name="quote"
          required
          minLength={20}
          maxLength={2000}
          rows={7}
          placeholder="Expliquez ce qui vous a aidé, ce qui a changé pour votre projet, ou pourquoi l’accompagnement vous a été utile."
          className={fieldClass}
        />
        <p className={hintClass}>
          Quelques phrases simples suffisent. La mention “Avis vérifié” ne peut être ajoutée que
          manuellement après vérification.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Envoi..." : "Envoyer mon témoignage"}
      </button>

      {status === "ok" ? (
        <p className="text-sm text-neutral-700" role="status" aria-live="polite">
          Merci. Votre témoignage a bien été envoyé et attend maintenant validation avant
          publication.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="text-sm text-neutral-700" role="status" aria-live="polite">
          {errorMessage || "Erreur d’envoi."} Réessayez dans un instant, ou passez par{" "}
          <a className="underline" href="/contact">
            la page contact
          </a>
          .
        </p>
      ) : null}

      <p className="pt-2 text-xs text-neutral-500">
        Anti-spam activé. Les envois abusifs ou trop rapides sont bloqués automatiquement.
      </p>
    </form>
  );
}
