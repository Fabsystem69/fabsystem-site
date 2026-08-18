"use client";

import { useEffect, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { saveDraftAsNewProjectApi } from "@/features/schemas/projectSchemaApi";
import { InlineSignupForm } from "./InlineSignupForm";

const DISMISS_STORAGE_KEY = "fabsystem-signup-prompt-dismissed";

// v2.1 : invite à créer un compte dès l'ouverture de l'éditeur (retour
// utilisateur : "le plus simple serait une invite à créer un compte tout
// de suite" — et "ça évite les retours de gens qui ont un code promo mais
// ça ne marche pas car ils n'ont pas de compte", une dizaine de
// signalements en ce sens). Non bloquant : fermable, l'éditeur reste
// utilisable en local sans compte comme avant (CDC "gratuit, sans
// compte") — une fois fermé, ne revient plus (mémorisé en local).
export function SignupPromptWidget() {
  const isLoggedIn = useSchemaStore((s) => s.isLoggedIn);
  const projectId = useSchemaStore((s) => s.projectId);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const projectName = useSchemaStore((s) => s.projectName);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const hydrated = useSchemaStore((s) => s.hydrated);

  const [dismissed, setDismissed] = useState(true);
  const [justCreated, setJustCreated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1");
  }, []);

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
    setDismissed(true);
  }

  async function handleSignupSuccess() {
    // Retour utilisateur : "au moment de l'achat ou code promo le schéma
    // est tout de suite intégré à un projet" — s'applique aussi à
    // l'inscription elle-même : un brouillon local avec du contenu ne doit
    // jamais rester orphelin une fois le compte créé.
    if (!projectId && nodes.length > 0) {
      const result = await saveDraftAsNewProjectApi({ projectName, nodes, edges });
      if (result.ok) setProjectId(result.project.id);
    }
    handleDismiss();
    setJustCreated(true);
    setTimeout(() => setJustCreated(false), 4000);
  }

  // `justCreated` laisse le message de confirmation s'afficher même après
  // que `isLoggedIn` devient vrai (sitôt le compte créé), qui masquerait
  // sinon la confirmation instantanément derrière la condition normale.
  if (!justCreated && (!hydrated || isLoggedIn || dismissed)) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 w-72 rounded-2xl border p-4 shadow-2xl ${
        darkMode ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white"
      }`}
    >
      {justCreated ? (
        <p className={`text-sm font-medium ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
          Compte créé — votre schéma est enregistré dans votre espace.
        </p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                Créer un compte
              </p>
              <p className={`mt-0.5 text-sm ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                Pour retrouver ce schéma plus tard et débloquer les codes promo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fermer"
              className={`shrink-0 rounded-md p-1 text-xs ${darkMode ? "text-neutral-500 hover:bg-neutral-800" : "text-neutral-400 hover:bg-neutral-100"}`}
            >
              ✕
            </button>
          </div>
          <div className="mt-3">
            <InlineSignupForm darkMode={darkMode} onSuccess={handleSignupSuccess} />
          </div>
        </>
      )}
    </div>
  );
}
