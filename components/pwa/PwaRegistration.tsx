"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Portee alignee sur manifest.webmanifest ("scope": "/outils/schema") :
    // retour utilisateur, seul l'editeur doit se comporter comme une appli
    // installable, pas le reste du site (dashboard admin en particulier,
    // qui proposait a tort "Ouvrir dans l'appli" a chaque visite).
    void navigator.serviceWorker.register("/sw.js", { scope: "/outils/schema" }).catch(() => {
      // L'installation PWA reste optionnelle: une erreur de cache ne doit
      // jamais empêcher l'accès normal au site ou à l'éditeur.
    });
  }, []);

  return null;
}
