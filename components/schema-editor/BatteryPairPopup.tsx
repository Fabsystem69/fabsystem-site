"use client";

import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";

// Retour bêta : "j'ai mis 2 batteries (en quantité)... pas demandé si elles
// étaient en série ou en parallèle" — se déclenche seul dès qu'une 2e
// batterie apparaît sur un schéma qui n'en avait qu'une (voir
// `pendingBatteryPairPrompt`/`findSoleOtherBattery` dans useSchemaStore).
// N'affiche rien tant qu'un choix de marque/modèle est en cours pour ne pas
// empiler deux popups (voir ModelPickerModal).
export function BatteryPairPopup() {
  const prompt = useSchemaStore((s) => s.pendingBatteryPairPrompt);
  const pendingModelPickerNodeId = useSchemaStore((s) => s.pendingModelPickerNodeId);
  const pendingLibraryPick = useSchemaStore((s) => s.pendingLibraryPick);
  const nodes = useSchemaStore((s) => s.nodes);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const resolveBatteryPairPrompt = useSchemaStore((s) => s.resolveBatteryPairPrompt);

  const dismiss = () => resolveBatteryPairPrompt("skip");
  useEscapeToClose(dismiss);

  if (!prompt || pendingModelPickerNodeId || pendingLibraryPick) return null;
  const partner = nodes.find((n) => n.id === prompt.partnerId);
  const added = nodes.find((n) => n.id === prompt.nodeId);
  if (!partner || !added) return null;

  const partnerLabel = String(partner.data.label ?? "Batterie");
  const addedLabel = String(added.data.label ?? "Batterie");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={dismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${darkMode ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white"}`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
          « {addedLabel} » ajoutée
        </p>
        <h2 className={`mt-1 text-xl font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>
          Est-ce le même parc de batteries que « {partnerLabel} » ?
        </h2>
        <p className={`mt-1 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
          Si oui, on relie les deux batteries tout de suite. Sinon (ex. batterie moteur et batterie auxiliaire),
          ignorez et câblez-les séparément.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => resolveBatteryPairPrompt("parallel")}
            className={`rounded-lg border px-4 py-3 text-left text-sm transition-base ${
              darkMode
                ? "border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-brand-400 hover:bg-neutral-800"
                : "border-neutral-200 bg-white text-neutral-800 hover:border-brand-400 hover:bg-neutral-50"
            }`}
          >
            <span className="block font-semibold">En parallèle</span>
            <span className={`block text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
              Même tension, capacité cumulée — + avec +, − avec −.
            </span>
          </button>
          <button
            type="button"
            onClick={() => resolveBatteryPairPrompt("series")}
            className={`rounded-lg border px-4 py-3 text-left text-sm transition-base ${
              darkMode
                ? "border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-brand-400 hover:bg-neutral-800"
                : "border-neutral-200 bg-white text-neutral-800 hover:border-brand-400 hover:bg-neutral-50"
            }`}
          >
            <span className="block font-semibold">En série</span>
            <span className={`block text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
              Tension cumulée — + de l&apos;une reliée au − de l&apos;autre.
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className={`mt-3 w-full rounded-lg border border-dashed px-4 py-2.5 text-center text-sm font-semibold transition-base ${
            darkMode
              ? "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              : "border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
          }`}
        >
          Non, batteries indépendantes
        </button>
      </div>
    </div>
  );
}
