import { useEffect } from "react";

// Retour utilisateur : "quand on est sur le pop up de choix on ne peut pas
// annuler même en appuyant sur échap" — les popups de l'éditeur (choix de
// modèle, limite gratuite, dimensionnement...) ne se fermaient qu'au clic
// sur le fond ou un bouton dédié. Un seul hook partagé plutôt que dupliquer
// le même useEffect dans chaque popup.
export function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
}
