"use client";

import { useMemo, useState } from "react";

export default function VisioForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | "ok" | "error">(null);

  // UX: on cache les détails techniques par défaut
  const [showTech, setShowTech] = useState(false);

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
        body: JSON.stringify({ ...payload, source: "visio" }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Erreur serveur");
      }

      setStatus("ok");
      form.reset();
      setShowTech(false);
    } catch (err) {
      console.error("VISIO FORM ERROR:", err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  // Style commun (lisible, pas coupé)
  const fieldClass =
    "w-full rounded-md border px-3 py-2 text-sm leading-snug placeholder:text-neutral-400";
  const labelClass = "text-xs font-medium text-neutral-700";
  const hintClass = "text-xs text-neutral-500";
  const sectionTitleClass = "text-sm font-semibold text-neutral-900";

  const supportOptions = useMemo(
    () => [
      { value: "", label: "Type de support" },
      { value: "Bateau", label: "Bateau" },
      { value: "Van", label: "Van" },
      { value: "Camping-car", label: "Camping-car" },
      { value: "Autre", label: "Autre" },
    ],
    []
  );

  return (
    <form className="mt-6 space-y-6" onSubmit={onSubmit}>
      {/* ✅ Honeypot (anti-spam) : doit rester vide */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* INTRO */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-sm text-neutral-700">
          Remplissez le <strong>minimum</strong> ci-dessous, puis vous pouvez ajouter des détails techniques
          (optionnels mais recommandés) pour que la visio soit ultra efficace.
        </p>
      </div>

      {/* ✅ ÉTAPE 1 — ESSENTIEL (court, conversion-friendly) */}
      <section className="rounded-xl border border-neutral-200 p-6">
        <h4 className={sectionTitleClass}>Essentiel</h4>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Nom *</label>
            <input name="name" required type="text" placeholder="Votre nom" className={fieldClass} />
          </div>

          <div className="space-y-1">
            <label className={labelClass}>Email *</label>
            <input name="email" required type="email" placeholder="Votre email" className={fieldClass} />
          </div>

          <div className="space-y-1">
            <label className={labelClass}>Téléphone (optionnel)</label>
            <input name="phone" type="text" placeholder="Ex: 06..." className={fieldClass} />
          </div>

          <div className="space-y-1">
            <label className={labelClass}>Date/heure Cal.com (si déjà réservé)</label>
            <input
              name="bookingDate"
              type="text"
              placeholder="Ex: mardi 18h"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className={labelClass}>Support concerné</label>
            <div className="grid gap-4 sm:grid-cols-2">
              <select name="supportType" className={fieldClass} defaultValue="">
                {supportOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <input
                name="supportModel"
                type="text"
                placeholder="Modèle / référence (optionnel)"
                className={fieldClass}
              />
            </div>
            <p className={hintClass}>Ex: Bayliner 2556 / fourgon L2H2 / etc.</p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className={labelClass}>Votre objectif principal</label>
            <input
              name="goal"
              type="text"
              placeholder="Ex: gagner en autonomie / sécuriser / ajouter du solaire / refaire la distribution…"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className={labelClass}>Résumé (obligatoire) *</label>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Décrivez votre situation + ce que vous attendez de la visio (2-5 lignes suffisent) *"
              className={fieldClass}
            />
            <p className={hintClass}>
              Conseil: écris comme si tu m’envoyais un message WhatsApp. Simple, direct.
            </p>
          </div>
        </div>
      </section>

      {/* ✅ TOGGLE TECH */}
      <button
        type="button"
        onClick={() => setShowTech((v) => !v)}
        className="w-full rounded-xl border border-neutral-200 bg-white px-6 py-4 text-left hover:bg-neutral-50"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Détails techniques (optionnel mais recommandé)
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              Batteries, charge, 230V, équipements, photos… (ça fait gagner beaucoup de temps en visio)
            </p>
          </div>
          <span className="text-sm text-neutral-600">{showTech ? "−" : "+"}</span>
        </div>
      </button>

      {/* ✅ ÉTAPE 2 — TECH (complet mais caché) */}
      {showTech && (
        <div className="space-y-6">
          {/* 3) Contexte / problème */}
          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Contexte / problème</h4>
            <textarea
              name="currentProblems"
              rows={4}
              placeholder="Décrivez ce qui ne va pas / ce que vous souhaitez améliorer (pannes, autonomie, sécurité, câblage, ajout d’équipements, etc.)"
              className={`${fieldClass} mt-4`}
            />
          </section>

          {/* 4) Installation actuelle */}
          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Installation actuelle</h4>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className={labelClass}>Nb batteries</label>
                <input name="batteryCount" type="text" placeholder="Ex: 2" className={fieldClass} />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Type</label>
                <input
                  name="batteryType"
                  type="text"
                  placeholder="Plomb / AGM / Lithium…"
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Capacité</label>
                <input
                  name="batteryCapacity"
                  type="text"
                  placeholder="Ah / Wh (si connu)"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={labelClass}>Sources de charge</label>
                <input
                  name="chargingSources"
                  type="text"
                  placeholder="Alternateur, secteur, solaire, chargeur…"
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Branchement secteur/quai</label>
                <input
                  name="shorePower"
                  type="text"
                  placeholder="Oui/non + détails"
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Convertisseur 230V</label>
                <input
                  name="inverterPresent"
                  type="text"
                  placeholder="Oui/non + puissance"
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Solaire</label>
                <input
                  name="solarPresent"
                  type="text"
                  placeholder="Oui/non + W + MPPT"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <label className={labelClass}>Équipements à alimenter</label>
              <textarea
                name="equipmentList"
                rows={4}
                placeholder="Frigo, guindeau, électronique, chauffage, pompe, prises 230V..."
                className={fieldClass}
              />
            </div>
          </section>

          {/* 5) Objectif & contraintes (compléments) */}
          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Objectif & contraintes (compléments)</h4>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={labelClass}>Échéance</label>
                <input
                  name="deadline"
                  type="text"
                  placeholder="Ex: avant départ en août"
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Budget (optionnel)</label>
                <input
                  name="budgetRange"
                  type="text"
                  placeholder="Fourchette"
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          {/* 6) Questions prioritaires */}
          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Vos 3 questions prioritaires</h4>

            <div className="mt-4 grid gap-3">
              <input name="priorityQ1" type="text" placeholder="Question 1" className={fieldClass} />
              <input name="priorityQ2" type="text" placeholder="Question 2" className={fieldClass} />
              <input name="priorityQ3" type="text" placeholder="Question 3" className={fieldClass} />
            </div>
          </section>

          {/* 7) Photos/schéma */}
          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Photos / schéma</h4>

            <p className="mt-2 text-sm text-neutral-600">
              Recommandé : tableau électrique, batteries, chargeur/MPPT, câblage, protections, convertisseur.
              Mets un lien (Drive, iCloud, Dropbox…).
            </p>

            <input
              name="photosLink"
              type="text"
              placeholder="Lien de partage (optionnel)"
              className={`${fieldClass} mt-4`}
            />
          </section>
        </div>
      )}

      {/* SUBMIT */}
      <div className="rounded-xl bg-neutral-900 p-6 text-white">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Envoi..." : "Envoyer la demande"}
        </button>

        {status === "ok" && (
          <p className="mt-3 text-sm text-white/90">
            Demande envoyée ✅ Vous recevrez une réponse par email.
          </p>
        )}

        {status === "error" && (
          <p className="mt-3 text-sm text-white/90">
            Erreur d’envoi. Réessaie ou contacte-nous par email.
          </p>
        )}
      </div>
    </form>
  );
}