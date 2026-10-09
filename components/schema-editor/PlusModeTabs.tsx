"use client";

// Onglets "Manuel" (gratuit) / "Automatique" (Éditeur Plus) — retour client :
// "j'ai le message à chaque fil". Partout où une aide de l'éditeur a une
// version faisable à la main, le gratuit arrive sur "Manuel" et utilise la
// fonction ; le rappel Éditeur Plus n'apparaît que s'il ouvre lui-même
// l'onglet "Automatique" (voir SizingPopup, SchemaIssuesWidget).
export type PlusMode = "manual" | "auto";

export function PlusModeTabs({
  darkMode,
  mode,
  onChange,
  className = "mt-4",
}: {
  darkMode: boolean;
  mode: PlusMode;
  onChange: (mode: PlusMode) => void;
  className?: string;
}) {
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
    <div role="tablist" className={`flex gap-1.5 ${className}`}>
      <button type="button" role="tab" aria-selected={mode === "manual"} className={tabClass(mode === "manual")} onClick={() => onChange("manual")}>
        Manuel
      </button>
      <button type="button" role="tab" aria-selected={mode === "auto"} className={tabClass(mode === "auto")} onClick={() => onChange("auto")}>
        Automatique{" "}
        <span className={`text-[10px] font-semibold uppercase ${mode === "auto" ? "" : darkMode ? "text-amber-400" : "text-amber-700"}`}>Plus</span>
      </button>
    </div>
  );
}
