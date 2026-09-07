"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";

// Remplace l'ancien CoachingOfferWidget (popup plein écran vendant un appel
// payant 30 min/59€ dès le premier signal de blocage) — retour utilisateur :
// "trop agressive [...] l'offre est de 1H à 69€ propose moi de nouvelle
// proposition plus ciblé client". Décision retenue : ne plus jamais proposer
// un paiement automatiquement pendant un moment de blocage. Deux paliers,
// jamais bloquants (pas de fond plein écran), jamais de bouton "payer" :
// 1) une carte discrète en coin d'écran vers un exemple déjà câblé (aide
//    gratuite, contenu déjà public) ;
// 2) si le blocage persiste après le palier 1, l'appel découverte gratuit
//    déjà existant (/prestations/appel-decouverte) — c'est Fabien qui
//    qualifie et propose un accompagnement payant ensuite, à son rythme.
// Le produit Stripe "coaching-30min" n'est plus vendu depuis l'éditeur ; il
// reste actif dans le catalogue si Fabien veut le proposer autrement.
const IDLE_THRESHOLD_MS = 90_000;
const MIN_NODES_FOR_IDLE_SIGNAL = 2;
const CANCEL_STREAK_THRESHOLD = 3;
const CHECK_INTERVAL_MS = 15_000;
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_STORAGE_KEY = "fabsystem-help-nudge-dismissed-until";

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

type Tier = 0 | 1 | 2;

export function HelpNudgeWidget() {
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const lastMeaningfulActionAt = useSchemaStore((s) => s.lastMeaningfulActionAt);
  const pickerCancelStreak = useSchemaStore((s) => s.pickerCancelStreak);

  const [tier, setTier] = useState<Tier>(0);
  const tier1ShownRef = useRef(false);
  const tier2ShownRef = useRef(false);

  // Échap sur le palier 2 doit compter comme un vrai refus (même cooldown
  // que le bouton "Non merci") — sinon le widget réapparaît dès la
  // prochaine session malgré le refus (retour de vérification).
  useEscapeToClose(() => (tier === 2 ? dismissTier2() : setTier(0)));

  useEffect(() => {
    const timer = setInterval(() => {
      if (tier !== 0 || isDismissedForNow()) return;

      const idleFor = Date.now() - lastMeaningfulActionAt;
      const hasUnresolvedIssues = computeSchemaIssues(nodes, edges).length > 0;
      const idleSignal = idleFor > IDLE_THRESHOLD_MS && nodes.length >= MIN_NODES_FOR_IDLE_SIGNAL && hasUnresolvedIssues;
      const hesitationSignal = pickerCancelStreak >= CANCEL_STREAK_THRESHOLD;

      if (!idleSignal && !hesitationSignal) return;

      if (!tier1ShownRef.current) {
        tier1ShownRef.current = true;
        setTier(1);
      } else if (!tier2ShownRef.current) {
        tier2ShownRef.current = true;
        setTier(2);
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [tier, nodes, edges, lastMeaningfulActionAt, pickerCancelStreak]);

  // Palier 1 fermé : pas de cooldown, le palier 2 (plus utile s'il reste
  // bloqué) peut encore apparaître plus tard dans la même session.
  function dismissTier1() {
    setTier(0);
  }

  // Palier 2 fermé : dernier palier, on respecte le refus pour de bon.
  function dismissTier2() {
    recordDismissal();
    setTier(0);
  }

  if (tier === 1) {
    return (
      <div
        role="status"
        className={`fixed bottom-4 right-4 z-40 w-full max-w-xs rounded-xl border p-4 shadow-lg ${
          darkMode ? "border-neutral-800 bg-neutral-950 text-neutral-100" : "border-neutral-200 bg-white text-neutral-900"
        }`}
      >
        <button
          type="button"
          onClick={dismissTier1}
          aria-label="Fermer"
          className={`absolute right-2 top-2 rounded-md p-1 text-lg leading-none ${darkMode ? "text-neutral-500 hover:bg-neutral-800 hover:text-white" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"}`}
        >
          ×
        </button>
        <p className="pr-5 text-sm font-semibold">Un peu de mal à avancer ?</p>
        <p className={`mt-1 text-xs leading-relaxed ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
          Jetez un œil à un schéma déjà réalisé, ça aide souvent à voir comment s&apos;y prendre.
        </p>
        <Link
          href="/schemas-electriques"
          target="_blank"
          onClick={dismissTier1}
          className={`mt-3 inline-block text-xs font-semibold underline underline-offset-2 ${darkMode ? "text-brand-300" : "text-brand-700"}`}
        >
          Voir des exemples de schémas →
        </Link>
      </div>
    );
  }

  if (tier === 2) {
    return (
      <div className="fixed inset-x-4 bottom-4 z-40 flex justify-center sm:inset-x-auto sm:right-4">
        <div
          className={`w-full max-w-sm rounded-xl border p-4 shadow-xl ${
            darkMode ? "border-neutral-800 bg-neutral-950 text-neutral-100" : "border-neutral-200 bg-white text-neutral-900"
          }`}
        >
          <p className="text-sm font-semibold">Toujours bloqué ?</p>
          <p className={`mt-1 text-xs leading-relaxed ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
            Un appel découverte gratuit avec Fabien pour faire le point sur votre projet — sans engagement, sans
            paiement.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/prestations/appel-decouverte"
              target="_blank"
              onClick={dismissTier2}
              className={`rounded-lg px-3 py-2 text-center text-xs font-semibold text-white ${darkMode ? "bg-emerald-600 hover:bg-emerald-500" : "bg-emerald-700 hover:bg-emerald-600"}`}
            >
              Réserver l&apos;appel découverte (gratuit)
            </Link>
            <button
              type="button"
              onClick={dismissTier2}
              className={`text-xs font-medium ${darkMode ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"}`}
            >
              Non merci, je continue seul
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
