"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { OUTILS_CALCULATEURS, type OutilMeta } from "@/lib/outils-catalog";
import { RibbonButton, RibbonPanel } from "./RibbonControls";

// Retour utilisateur : "tu pourrais faire un menu outils/calculateur et ça
// ouvre en popup l'outil sélectionné" — réutilise tels quels les
// composants calculateur du site public (components/outils/calculators/*),
// mêmes calculs, mêmes champs, jamais dupliqués : seule la coquille change
// (popup dans l'éditeur au lieu d'une page /outils/<id> dédiée). "Schéma
// électrique" est exclu de la liste : on est déjà dedans.
const CALCULATOR_COMPONENTS: Partial<Record<OutilMeta["id"], ReturnType<typeof dynamic>>> = {
  "section-cable": dynamic(() => import("@/components/outils/calculators/SectionCableCalculator")),
  "bilan-consommation": dynamic(() => import("@/components/outils/calculators/BilanConsommationCalculator")),
  mppt: dynamic(() => import("@/components/outils/calculators/MpptCalculator")),
  "soc-batterie": dynamic(() => import("@/components/outils/calculators/SocBatterieCalculator")),
  "charge-secteur": dynamic(() => import("@/components/outils/calculators/ChargeSecteurCalculator")),
  fusible: dynamic(() => import("@/components/outils/calculators/FuseSizeCalculator")),
  onduleur: dynamic(() => import("@/components/outils/calculators/InverterSizeCalculator")),
  "dcdc-alternateur": dynamic(() => import("@/components/outils/calculators/DcdcChargerSizeCalculator")),
  batterie: dynamic(() => import("@/components/outils/calculators/BatteryBankCalculator")),
};

const MENU_TOOLS = OUTILS_CALCULATEURS.filter((o) => o.id !== "schema");

export function CalculatorMenu({ darkMode }: { darkMode: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openToolId, setOpenToolId] = useState<OutilMeta["id"] | null>(null);
  useEscapeToClose(() => (openToolId ? setOpenToolId(null) : setMenuOpen(false)));

  const openTool = MENU_TOOLS.find((o) => o.id === openToolId);
  const OpenToolComponent = openToolId ? CALCULATOR_COMPONENTS[openToolId] : undefined;

  return (
    <>
      <div className="relative">
        <RibbonButton darkMode={darkMode} onClick={() => setMenuOpen((v) => !v)} active={menuOpen} icon="🧮" label="Calculateurs" title="Ouvrir un calculateur sans quitter l'éditeur" />
        {menuOpen ? (
          <RibbonPanel darkMode={darkMode} width="w-56">
            {MENU_TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setOpenToolId(tool.id);
                  setMenuOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-base ${
                  darkMode ? "text-neutral-200 hover:bg-neutral-700" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {tool.title}
              </button>
            ))}
          </RibbonPanel>
        ) : null}
      </div>

      {openTool && OpenToolComponent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpenToolId(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-3.5">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">{openTool.title}</h2>
                <p className="text-sm text-neutral-500">{openTool.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenToolId(null)}
                title="Fermer"
                className="shrink-0 rounded-md border border-neutral-300 p-1.5 text-xs text-neutral-600 transition-base hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <OpenToolComponent />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
