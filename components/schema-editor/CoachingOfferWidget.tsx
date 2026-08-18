"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";

// v2.1 : proposition du pack "Coaching 30 min" (59€, visio ou téléphone)
// quand l'utilisateur semble bloqué — retour utilisateur : "analyser les
// clics ou temps de recherche pour faire apparaître un popup 'coincé, besoin
// d'un conseil'". Deux signaux, volontairement simples et lisibles plutôt
// qu'un score comportemental opaque :
// 1) inactivité prolongée (aucun ajout/câblage depuis IDLE_THRESHOLD_MS)
//    alors que le schéma a déjà du contenu ET des points "À vérifier" non
//    résolus — la combinaison "il y a quelque chose à faire mais plus rien
//    ne bouge" est un vrai signal de blocage, pas juste une pause café ;
// 2) plusieurs annulations d'affilée du sélecteur de marque/modèle sans
//    ajout réussi entre deux — hésitation immédiate, plus rapide à détecter
//    qu'un minuteur.
// Ne se montre qu'une fois par session (ref, pas de nag après un premier
// refus) et respecte un cooldown localStorage de plusieurs jours entre deux
// sessions différentes.
const IDLE_THRESHOLD_MS = 90_000;
const MIN_NODES_FOR_IDLE_SIGNAL = 2;
const CANCEL_STREAK_THRESHOLD = 3;
const CHECK_INTERVAL_MS = 15_000;
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_STORAGE_KEY = "fabsystem-coaching-offer-dismissed-until";

function isDismissedForNow(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && Date.now() < until;
}

function recordDismissal() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now() + DISMISS_COOLDOWN_MS));
}

export function CoachingOfferWidget() {
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const lastMeaningfulActionAt = useSchemaStore((s) => s.lastMeaningfulActionAt);
  const pickerCancelStreak = useSchemaStore((s) => s.pickerCancelStreak);
  const touchMeaningfulAction = useSchemaStore((s) => s.touchMeaningfulAction);

  const [open, setOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error" | "unauthenticated">("idle");
  const shownThisSessionRef = useRef(false);

  useEscapeToClose(() => setOpen(false));

  useEffect(() => {
    const timer = setInterval(() => {
      if (shownThisSessionRef.current || isDismissedForNow()) return;

      const idleFor = Date.now() - lastMeaningfulActionAt;
      const hasUnresolvedIssues = computeSchemaIssues(nodes, edges).length > 0;
      const idleSignal = idleFor > IDLE_THRESHOLD_MS && nodes.length >= MIN_NODES_FOR_IDLE_SIGNAL && hasUnresolvedIssues;
      const hesitationSignal = pickerCancelStreak >= CANCEL_STREAK_THRESHOLD;

      if (idleSignal || hesitationSignal) {
        shownThisSessionRef.current = true;
        setOpen(true);
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [nodes, edges, lastMeaningfulActionAt, pickerCancelStreak]);

  function handleDismiss() {
    recordDismissal();
    touchMeaningfulAction();
    setOpen(false);
  }

  async function handleBook() {
    setCheckoutStatus("loading");
    try {
      const response = await fetch("/api/coaching/checkout", { method: "POST" });
      if (response.status === 401) {
        setCheckoutStatus("unauthenticated");
        return;
      }
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={handleDismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-w-md flex-col rounded-2xl border p-6 shadow-2xl ${
          darkMode ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
          Besoin d&apos;un coup de main ?
        </p>
        <h2 className={`mt-1 text-xl font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>
          30 min de conseil avec Fabien — 59€
        </h2>
        <p className={`mt-1 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
          Un créneau en visio ou par téléphone pour relire votre schéma ensemble, répondre à vos questions et vous
          débloquer — pas besoin de tout comprendre seul.
        </p>

        <div className="mt-4">
          {checkoutStatus === "unauthenticated" ? (
            <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-neutral-700 text-neutral-300" : "border-neutral-200 text-neutral-600"}`}>
              Connectez-vous (ou créez un compte) pour réserver ce créneau.
              <Link
                href="/connexion-client"
                className={`mt-1.5 block text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}
              >
                Se connecter / créer un compte
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleBook}
              disabled={checkoutStatus === "loading"}
              className={`w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-base disabled:opacity-60 ${
                darkMode ? "bg-emerald-600 hover:bg-emerald-500" : "bg-emerald-700 hover:bg-emerald-600"
              }`}
            >
              {checkoutStatus === "loading" ? "Redirection…" : "Réserver mon créneau (59€)"}
            </button>
          )}
          {checkoutStatus === "error" ? (
            <p className="mt-2 text-xs text-red-500">Une erreur est survenue, réessayez dans un instant.</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className={`mt-3 text-center text-xs font-medium ${darkMode ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"}`}
        >
          Non merci, je continue seul
        </button>
      </div>
    </div>
  );
}
