"use client";

import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { useGuidedStep } from "@/lib/schema-editor/useGuidedStep";

// Curseur jour/nuit (retour utilisateur : "remet le petit curseur pour mode
// jour nuit" — après un premier passage en menu déroulant jugé de trop pour
// un simple bascule) — le style d'icônes, lui, a rejoint le menu principal
// (FileMenu) avec le filtre par catégorie, mais le mode nuit reste un
// accès direct à un seul geste, cohérent avec sa fréquence d'usage plus
// élevée (bateau/van de nuit, retour utilisateur d'origine).
export function DarkModeToggle({ darkMode }: { darkMode: boolean }) {
  const setDarkMode = useSchemaStore((s) => s.setDarkMode);
  // Mode guidé (retour utilisateur : "montre à la fin le mode jour nuit et
  // le pdf") — mis en avant à la toute dernière étape, quand l'instruction
  // en parle explicitement, plutôt qu'un texte seul.
  const guided = useGuidedStep();
  const spotlight = guided.active && guided.step.id === "outro";

  return (
    <button
      type="button"
      onClick={() => setDarkMode(!darkMode)}
      title={darkMode ? "Passer en vue jour" : "Passer en vue nuit"}
      aria-pressed={darkMode}
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-base ${
        darkMode ? "border-neutral-600 bg-neutral-700" : "border-amber-200 bg-amber-100"
      } ${spotlight ? "ring-2 ring-emerald-400 ring-offset-1" : ""}`}
    >
      <span className="sr-only">{darkMode ? "Passer en vue jour" : "Passer en vue nuit"}</span>
      <span className="flex w-full items-center justify-between px-1.5 text-[10px] leading-none">
        <span className={darkMode ? "opacity-30" : "opacity-90"}>☾</span>
        <span className={darkMode ? "opacity-90" : "opacity-30"}>☀︎</span>
      </span>
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full shadow-sm transition-base ${
          darkMode ? "translate-x-[1.625rem] bg-neutral-900" : "translate-x-0.5 bg-white"
        }`}
      />
    </button>
  );
}
