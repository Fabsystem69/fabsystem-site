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

    // Ajout du "source" dans le FormData pour que l’API sache que c’est la visio
    formData.set("source", "visio");

    try {
      // On envoie en multipart/form-data (FormData) pour supporter les fichiers
      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
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

  // UX mobile:
  // - text-base sur inputs => évite le zoom automatique iOS
  const fieldClass =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base leading-snug placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300";
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
    <form className="space-y-6" onSubmit={onSubmit}>
      {/* ✅ Honeypot (anti-spam) : doit rester vide */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* INTRO */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-sm leading-relaxed text-neutral-700">
          Remplissez le <strong>minimum</strong> ci-dessous. Vous pouvez ensuite ajouter des détails techniques (optionnels)
          et joindre des photos : ça rend la visio beaucoup plus efficace.
        </p>
      </div>

      {/* ✅ ÉTAPE 1 — ESSENTIEL */}
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
            <input name="bookingDate" type="text" placeholder="Ex: mardi 18h" className={fieldClass} />
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
              placeholder="Ex: autonomie / sécuriser / ajouter du solaire / refaire la distribution…"
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
              Conseil : écrivez comme si vous m'envoyiez un message WhatsApp. Simple, direct.
            </p>
          </div>
        </div>
      </section>

      {/* ✅ NIVEAU 2 — PHOTOS (upload direct) */}
      <section className="rounded-xl border border-neutral-200 p-6">
        <h4 className={sectionTitleClass}>Photos (recommandé)</h4>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
          Ajoutez 1 à 3 photos (tableau, batteries, protections, MPPT/chargeur, câblage). Sur mobile, vous pouvez prendre une photo directement.
        </p>

        <div className="mt-4 space-y-2">
          <label className={labelClass}>Fichiers (jpg/png) — 3 max</label>
          <input
            name="photos"
            type="file"
            accept="image/*"
            multiple
            className="block w-full text-sm"
          />
          <p className={hintClass}>
            Astuce : si ça échoue (réseau/poids), mets un lien Drive/iCloud dans “Photos / schéma” (section technique).
          </p>
        </div>
      </section>

      {/* ✅ TOGGLE TECH */}
      <button
        type="button"
        onClick={() => setShowTech((v) => !v)}
        className="w-full rounded-xl border border-neutral-200 bg-white px-6 py-4 text-left hover:bg-neutral-50 active:scale-[0.99] transition"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Détails techniques (optionnel mais recommandé)
            </p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              Batteries, charge, 230V, équipements, photos… (ça fait gagner du temps en visio)
            </p>
          </div>
          <span className="mt-0.5 text-lg leading-none text-neutral-700">{showTech ? "−" : "+"}</span>
        </div>
      </button>

      {/* ✅ ÉTAPE 2 — TECH */}
      {showTech && (
        <div className="space-y-6">
          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Contexte / problème</h4>
            <textarea
              name="currentProblems"
              rows={4}
              placeholder="Décrivez ce qui ne va pas / ce que vous voulez améliorer…"
              className={`${fieldClass} mt-4`}
            />
          </section>

          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Installation actuelle</h4>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className={labelClass}>Nb batteries</label>
                <input name="batteryCount" type="text" placeholder="Ex: 2" className={fieldClass} />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Type</label>
                <input name="batteryType" type="text" placeholder="Plomb / AGM / Lithium…" className={fieldClass} />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Capacité</label>
                <input name="batteryCapacity" type="text" placeholder="Ah / Wh (si connu)" className={fieldClass} />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={labelClass}>Sources de charge</label>
                <input name="chargingSources" type="text" placeholder="Alternateur, secteur, solaire, chargeur…" className={fieldClass} />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Branchement secteur/quai</label>
                <input name="shorePower" type="text" placeholder="Oui/non + détails" className={fieldClass} />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Convertisseur 230V</label>
                <input name="inverterPresent" type="text" placeholder="Oui/non + puissance" className={fieldClass} />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Solaire</label>
                <input name="solarPresent" type="text" placeholder="Oui/non + W + MPPT" className={fieldClass} />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <label className={labelClass}>Équipements à alimenter</label>
              <textarea name="equipmentList" rows={4} placeholder="Frigo, guindeau, électronique, chauffage…" className={fieldClass} />
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Objectif & contraintes</h4>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={labelClass}>Échéance</label>
                <input name="deadline" type="text" placeholder="Ex: avant départ en août" className={fieldClass} />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Budget (optionnel)</label>
                <input name="budgetRange" type="text" placeholder="Fourchette" className={fieldClass} />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Vos 3 questions prioritaires</h4>

            <div className="mt-4 grid gap-3">
              <input name="priorityQ1" type="text" placeholder="Question 1" className={fieldClass} />
              <input name="priorityQ2" type="text" placeholder="Question 2" className={fieldClass} />
              <input name="priorityQ3" type="text" placeholder="Question 3" className={fieldClass} />
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 p-6">
            <h4 className={sectionTitleClass}>Photos / schéma (lien)</h4>

            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Si vous préférez : mettez un lien Drive / iCloud / Dropbox vers vos photos.
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
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Envoi..." : "Envoyer la demande"}
        </button>

        {status === "ok" && (
          <p className="mt-3 text-sm text-neutral-800">
            Demande envoyée ✅ Vous recevrez une réponse par email.
          </p>
        )}

        {status === "error" && (
          <p className="mt-3 text-sm text-neutral-800">
            Erreur d’envoi. Réessayez ou contactez-nous par email.
          </p>
        )}

        <p className="mt-3 text-xs text-neutral-500">
          Si l’envoi échoue, écrivez directement à{" "}
          <a className="underline" href="mailto:fabien.lages@fabsystem.fr">
            fabien.lages@fabsystem.fr
          </a>
          .
        </p>
      </div>
    </form>
  );
}