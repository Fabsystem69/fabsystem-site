"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // L'installation PWA reste optionnelle: une erreur de cache ne doit
      // jamais empêcher l'accès normal au site ou à l'éditeur.
    });
  }, []);

  return null;
}
