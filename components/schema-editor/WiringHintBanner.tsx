"use client";

import { useEffect, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

// Retour bêta (hisseetoh) : "je bloque sur comment ajouter des câbles" — le
// survol d'une borne affiche déjà une infobulle (voir ElectricalNode), mais
// une infobulle native met ~1s à apparaître et personne ne survole une borne
// par hasard au premier essai. Bandeau non bloquant (pas une popup à
// fermer) : ne s'affiche que tant qu'aucun câble n'existe alors que déjà
// plusieurs composants sont posés — dès le premier câble créé, il disparaît
// et ne revient jamais (localStorage), y compris sur un futur schéma.
const DISMISS_STORAGE_KEY = "fabsystem-wiring-hint-dismissed";
const MIN_NODES_TO_SHOW = 2;

export function WiringHintBanner() {
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const guidedMode = useSchemaStore((s) => s.guidedMode);

  // Par défaut masqué côté serveur/premier rendu client (évite un mismatch
  // d'hydratation), puis révélé après montage si vraiment jamais fermé.
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    // localStorage n'existe pas côté serveur : lecture différée au montage,
    // pas de meilleure alternative pour éviter un mismatch d'hydratation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1");
  }, []);

  const electricalCount = nodes.filter((n) => n.type === "electrical").length;
  const cableCount = edges.filter((e) => e.type === "cable").length;

  if (guidedMode || cableCount > 0 || electricalCount < MIN_NODES_TO_SHOW || dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div
      className={`pointer-events-auto absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-2 text-sm shadow-lg ${
        darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-200" : "border-neutral-200 bg-white text-neutral-700"
      }`}
    >
      <span>
        💡 Pour relier deux appareils : cliquez sur une <strong>borne</strong> (le petit point coloré) et glissez
        jusqu&apos;à l&apos;appareil cible.
      </span>
      <button
        type="button"
        onClick={dismiss}
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold transition-base ${
          darkMode ? "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        }`}
      >
        ✕
      </button>
    </div>
  );
}
