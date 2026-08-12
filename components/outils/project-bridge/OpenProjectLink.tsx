"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

// UI-13 §17 (Autonomie batterie, MPPT) — l'audit d'architecture confirme
// qu'aucun mapping fiable n'existe entre ces deux outils et un moteur
// existant (logique inversée pour Autonomie batterie, domaine différent
// pour MPPT — voir docs/audits/UI-13-GUIDED-PROJECT-TOOLS-BRIDGE.md,
// "Mapping outils → moteurs"). Mission §17 : "Ne pas inventer une
// correspondance." Ce composant ne transfère donc AUCUNE donnée — il
// ouvre simplement la liste des projets du client pour qu'il y reporte
// le résultat lui-même dans le bon module.
export function OpenProjectLink({ label }: { label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="tertiary" onClick={() => setOpen(true)}>
        {label} →
      </Button>
      {open ? (
        <Modal open onClose={() => setOpen(false)} title="Continuer dans mon projet">
          <div className="space-y-3 text-sm text-neutral-700">
            <p>
              Ce résultat ne se reporte pas automatiquement (le calcul de cet outil ne correspond pas
              directement à un module technique du projet). Ouvrez votre projet pour saisir vous-même la
              valeur dans le module concerné.
            </p>
            <Button href="/mon-compte/projets" variant="primary">
              Voir mes projets →
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
