"use client";

import { useState } from "react";
import Link from "next/link";
import { useSchemaStore, FREE_CONSUMER_LIMIT } from "@/features/schemas/store/useSchemaStore";
import { saveDraftAsNewProjectApi } from "@/features/schemas/projectSchemaApi";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { InlineSignupForm } from "./InlineSignupForm";

// Popup de limite gratuite : l'upgrade proposé est désormais un abonnement
// de compte Éditeur Plus, pas un achat ponctuel attaché à un seul projet.
//
// Retour utilisateur : "ça évite les retours de gens qui ont un code promo
// mais ça ne marche pas car ils n'ont pas de compte" (une dizaine de
// signalements) — les deux issues (achat, code) exigent un compte ; on
// propose maintenant l'inscription directement ici plutôt qu'un simple
// lien vers la page de connexion.
export function FreemiumLimitModal() {
  const open = useSchemaStore((s) => s.freemiumLimitPopupOpen);
  const dismiss = useSchemaStore((s) => s.dismissFreemiumLimitPopup);
  const projectId = useSchemaStore((s) => s.projectId);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const projectName = useSchemaStore((s) => s.projectName);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const isLoggedIn = useSchemaStore((s) => s.isLoggedIn);
  const setHasUnlimitedConsumers = useSchemaStore((s) => s.setHasUnlimitedConsumers);
  const darkMode = useSchemaStore((s) => s.darkMode);
  useEscapeToClose(dismiss);

  const [tab, setTab] = useState<"plus" | "code">("plus");
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [code, setCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error">("idle");

  if (!open) return null;

  // Retour utilisateur : "au moment de l'achat ou code promo le schéma est
  // tout de suite intégré à un projet" — jamais laissé orphelin une fois
  // qu'un compte existe et qu'une action payante/de redemption a lieu.
  async function ensureProjectId(): Promise<string | null> {
    if (projectId) return projectId;
    if (nodes.length === 0) return null;
    const result = await saveDraftAsNewProjectApi({ projectName, nodes, edges });
    if (!result.ok) return null;
    setProjectId(result.project.id);
    return result.project.id;
  }

  async function handleUnlock() {
    setCheckoutStatus("loading");
    try {
      const response = await fetch("/api/schema-editor-plus/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setCheckoutStatus("error");
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutStatus("error");
    }
  }

  async function handleRedeemCode(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setRedeemStatus("loading");
    setRedeemError(null);
    try {
      const response = await fetch("/api/schema-unlock/trial-code/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRedeemStatus("error");
        setRedeemError(data.error ?? "Code invalide ou déjà utilisé.");
        return;
      }
      setRedeemStatus("success");
      // Bug corrigé (retour utilisateur : "après utilisation du code le
      // popup revient quand même après 3 consommateurs") : lève la limite
      // tout de suite, sans attendre un rechargement de page — le fetch de
      // statut au montage de l'éditeur (voir Editor.tsx) confirmera au
      // prochain chargement, mais l'utilisateur ne doit pas être bloqué
      // entre-temps dans la même session.
      setHasUnlimitedConsumers(true);
      void ensureProjectId();
    } catch {
      setRedeemStatus("error");
      setRedeemError("Une erreur est survenue.");
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-base ${
      active
        ? darkMode
          ? "border-white bg-white text-neutral-900"
          : "border-neutral-900 bg-neutral-900 text-white"
        : darkMode
          ? "border-neutral-700 text-neutral-300 hover:bg-neutral-700/50"
          : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={dismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-w-md flex-col rounded-2xl border p-6 shadow-2xl ${
          darkMode ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
          Limite gratuite atteinte
        </p>
        <h2 className={`mt-1 text-xl font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>
          {FREE_CONSUMER_LIMIT} consommateurs max en gratuit
        </h2>
        <p className={`mt-1 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
          L&apos;éditeur reste complet (dimensionnement, vérifications, export) mais ce projet a atteint la limite
          d&apos;installation basique gratuite.
        </p>

        {!isLoggedIn ? (
          <div className="mt-4">
            <p className={`mb-2 text-sm ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
              Un compte est nécessaire pour débloquer ou saisir un code promo — votre schéma en cours y sera
              automatiquement enregistré.
            </p>
            <InlineSignupForm darkMode={darkMode} onSuccess={() => void ensureProjectId()} />
          </div>
        ) : (
          <>
            <div className="mt-4 flex gap-1.5">
              <button type="button" className={tabClass(tab === "plus")} onClick={() => setTab("plus")}>
                Éditeur Plus
              </button>
              <button type="button" className={tabClass(tab === "code")} onClick={() => setTab("code")}>
                J&apos;ai un code
              </button>
            </div>

            {tab === "plus" ? (
              <div className="mt-4">
                <p className={`text-sm ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
                  Dimensionnement automatique du câblage et des fusibles, détail et correction des alertes de
                  vérification, projets et consommateurs illimités, historique des versions, partage de schéma et
                  exports sans filigrane.
                </p>
                <Link
                  href="/mon-compte/editeur"
                  className={`mt-1 inline-block text-xs font-semibold underline-offset-2 hover:underline ${darkMode ? "text-amber-400" : "text-amber-700"}`}
                >
                  Voir le détail des offres →
                </Link>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPlan("monthly")} className={`rounded-lg border px-3 py-2 text-left text-sm ${plan === "monthly" ? "border-amber-400 bg-amber-50 font-semibold text-neutral-950" : darkMode ? "border-neutral-700 text-neutral-300" : "border-neutral-300 text-neutral-600"}`}>
                    6,90 € / mois
                  </button>
                  <button type="button" onClick={() => setPlan("yearly")} className={`rounded-lg border px-3 py-2 text-left text-sm ${plan === "yearly" ? "border-amber-400 bg-amber-50 font-semibold text-neutral-950" : darkMode ? "border-neutral-700 text-neutral-300" : "border-neutral-300 text-neutral-600"}`}>
                    59 € / an
                    <span className="block text-xs font-normal">4,92 € / mois</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={checkoutStatus === "loading"}
                  className={`mt-3 w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-base ${
                    darkMode ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
                  } disabled:opacity-60`}
                >
                  {checkoutStatus === "loading" ? "Redirection…" : plan === "yearly" ? "Passer à Éditeur Plus annuel" : "Passer à Éditeur Plus mensuel"}
                </button>
                {checkoutStatus === "error" ? (
                  <p className="mt-2 text-xs text-red-500">Impossible de démarrer le paiement, réessayez.</p>
                ) : null}
              </div>
            ) : (
              <form className="mt-4" onSubmit={handleRedeemCode}>
                {redeemStatus === "success" ? (
                  <p className={`text-sm font-medium ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                    Code appliqué — accès complet activé sur vos projets.
                  </p>
                ) : (
                  <>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Votre code promo"
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-neutral-300 bg-white text-neutral-900"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={redeemStatus === "loading"}
                      className={`mt-3 w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-base ${
                        darkMode ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
                      } disabled:opacity-60`}
                    >
                      {redeemStatus === "loading" ? "Vérification…" : "Appliquer le code"}
                    </button>
                    {redeemStatus === "error" ? <p className="mt-2 text-xs text-red-500">{redeemError}</p> : null}
                  </>
                )}
              </form>
            )}
          </>
        )}

        <div className={`mt-5 border-t pt-4 text-center ${darkMode ? "border-neutral-800" : "border-neutral-100"}`}>
          <p className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
            Ou faites-vous accompagner directement pour ce projet.
          </p>
          <Link
            href="/prestations"
            className={`mt-1 inline-block text-sm font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}
          >
            Voir l&apos;accompagnement →
          </Link>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className={`mt-4 w-full rounded-lg border border-dashed px-4 py-2.5 text-center text-sm font-semibold transition-base ${
            darkMode
              ? "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              : "border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
          }`}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
