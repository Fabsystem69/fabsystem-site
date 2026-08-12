"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EnergyImportModal } from "./EnergyImportModal";
import type { BilanConsoAppareil } from "@/lib/outils-project-bridge";

// UI-13 §14 — CTA affiché après un calcul réussi (mission : "après un
// calcul réussi, si utilisateur connecté : afficher Ajouter à mon
// projet"). Le statut connecté/non connecté n'est vérifié qu'au clic
// (dans la modale), pas de vérification de session préalable ici — évite
// un aller-retour réseau supplémentaire juste pour afficher le bouton.
export function AddEnergyToProjectButton({ appareils }: { appareils: BilanConsoAppareil[] }) {
  const [open, setOpen] = useState(false);
  const hasValidAppareil = appareils.some((a) => a.nom.trim());

  return (
    <>
      <Button type="button" variant="secondary" disabled={!hasValidAppareil} onClick={() => setOpen(true)}>
        Ajouter à mon projet →
      </Button>
      {open ? <EnergyImportModal appareils={appareils} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
