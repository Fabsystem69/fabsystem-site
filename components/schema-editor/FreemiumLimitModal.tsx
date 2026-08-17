"use client";

import { useState } from "react";
import Link from "next/link";
import { useSchemaStore, FREE_CONSUMER_LIMIT } from "@/features/schemas/store/useSchemaStore";

// v2.1 : popup de limite gratuite — se déclenche quand addComponent /
// duplicateNode / spliceNodeOnEdge refusent un ajout de consommateur
// au-delà de FREE_CONSUMER_LIMIT (voir useSchemaStore). Trois issues, jamais
// bloquantes silencieusement : débloquer ce projet (achat unitaire), saisir
// un code promo, ou passer par l'accompagnement.
export function FreemiumLimitModal() {
  const open = useSchemaStore((s) => s.freemiumLimitPopupOpen);
  const dismiss = useSchemaStore((s) => s.dismissFreemiumLimitPopup);
  const projectId = useSchemaStore((s) => s.projectId);
  const darkMode = useSchemaStore((s) => s.darkMode);

  const [tab, setTab] = useState<"unlock" | "code">("unlock");
  const [code, setCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error">("idle");

  if (!open) return null;

  async function handleUnlock() {
    if (!projectId) return;
    setCheckoutStatus("loading");
    try {
      const response = await fetch("/api/schema-unlock/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={dismiss}>
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

        <div className="mt-4 flex gap-1.5">
          <button type="button" className={tabClass(tab === "unlock")} onClick={() => setTab("unlock")}>
            Débloquer (9,90€)
          </button>
          <button type="button" className={tabClass(tab === "code")} onClick={() => setTab("code")}>
            J&apos;ai un code
          </button>
        </div>

        {tab === "unlock" ? (
          <div className="mt-4">
            {!projectId ? (
              <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-neutral-700 text-neutral-300" : "border-neutral-200 text-neutral-600"}`}>
                Enregistrez d&apos;abord ce schéma dans un projet (compte requis) pour pouvoir le débloquer.
                <Link
                  href="/connexion-client"
                  className={`mt-1.5 block text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}
                >
                  Se connecter / créer un compte
                </Link>
              </div>
            ) : (
              <>
                <p className={`text-sm ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
                  Consommateurs illimités sur ce projet pendant 60 jours. Un code de réduction de 9,90€ vous est
                  aussi offert sur un ebook ou un accompagnement.
                </p>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={checkoutStatus === "loading"}
                  className={`mt-3 w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-base ${
                    darkMode ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
                  } disabled:opacity-60`}
                >
                  {checkoutStatus === "loading" ? "Redirection…" : "Débloquer ce projet — 9,90€"}
                </button>
                {checkoutStatus === "error" ? (
                  <p className="mt-2 text-xs text-red-500">Impossible de démarrer le paiement, réessayez.</p>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <form className="mt-4" onSubmit={handleRedeemCode}>
            {redeemStatus === "success" ? (
              <p className={`text-sm font-medium ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                Code appliqué — accès illimité activé sur vos projets.
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
                {!projectId ? (
                  <p className={`mt-2 text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                    Un compte est nécessaire pour saisir un code —{" "}
                    <Link href="/connexion-client" className={darkMode ? "text-emerald-400 hover:underline" : "text-emerald-700 hover:underline"}>
                      se connecter
                    </Link>
                    .
                  </p>
                ) : null}
              </>
            )}
          </form>
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
