"use client";

import { useEffect, useState, type ReactNode } from "react";

type Tab = "distance" | "terrain";

const TAB_ANCHOR: Record<Tab, string> = {
  distance: "accompagnement-distance",
  terrain: "prestations-terrain",
};

type PrestationsSectionTabsProps = {
  distanceContent: ReactNode;
  terrainContent: ReactNode;
};

// Mission 6a/6b : un seul mécanisme de choix "À distance / Sur place" (plus
// de doublon avec les boutons du hero, qui pointent simplement vers
// #accompagnement-distance / #prestations-terrain et sélectionnent
// automatiquement le bon onglet ici). La barre reste visible en scrollant
// (sticky) pour ne jamais perdre de vue le choix actif.
export function PrestationsSectionTabs({
  distanceContent,
  terrainContent,
}: PrestationsSectionTabsProps) {
  const [active, setActive] = useState<Tab>("distance");

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      if (hash === TAB_ANCHOR.terrain) {
        setActive("terrain");
      } else if (hash === TAB_ANCHOR.distance) {
        setActive("distance");
      } else {
        return;
      }
      // Le panneau cible n'existe peut-être pas encore dans le DOM au
      // premier rendu (l'autre onglet est masqué par défaut) : on refait le
      // scroll une fois le bon panneau affiché.
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ block: "start" });
      });
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function selectTab(tab: Tab) {
    setActive(tab);
    window.history.replaceState(null, "", `#${TAB_ANCHOR[tab]}`);
  }

  return (
    <div>
      <div className="sticky top-14 z-20 border-b border-neutral-200 bg-white/95 py-3 backdrop-blur-md sm:top-16">
        <div
          role="tablist"
          aria-label="Choisir accompagnement à distance ou prestation terrain"
          className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 text-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={active === "distance"}
            onClick={() => selectTab("distance")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
              active === "distance"
                ? "bg-neutral-900 text-white"
                : "border border-neutral-300 text-neutral-700 hover:border-yellow-400 hover:text-neutral-950"
            }`}
          >
            À distance
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={active === "terrain"}
            onClick={() => selectTab("terrain")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
              active === "terrain"
                ? "bg-neutral-900 text-white"
                : "border border-neutral-300 text-neutral-700 hover:border-yellow-400 hover:text-neutral-950"
            }`}
          >
            Sur place
          </button>
        </div>
      </div>

      <div
        id={TAB_ANCHOR.distance}
        className={active === "distance" ? "scroll-mt-28" : "hidden"}
      >
        {distanceContent}
      </div>
      <div id={TAB_ANCHOR.terrain} className={active === "terrain" ? "scroll-mt-28" : "hidden"}>
        {terrainContent}
      </div>
    </div>
  );
}
