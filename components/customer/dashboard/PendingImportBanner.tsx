"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { readPendingImport, clearPendingImport, type PendingImportPayload } from "@/lib/client/pending-import-storage";
import { EnergyImportModal } from "@/components/outils/project-bridge/EnergyImportModal";
import { CableImportModal } from "@/components/outils/project-bridge/CableImportModal";
import { SolarImportModal } from "@/components/outils/project-bridge/SolarImportModal";
import type { BilanConsoAppareil, SectionCableForm, MpptSolarForm } from "@/lib/outils-project-bridge";

// UI-13 §15 — "Après connexion réussie : restaurer le contexte du calcul
// si possible." Plutôt que de brancher un `returnTo` dans la chaîne
// d'authentification magic link (zone sensible, hors périmètre de cette
// mission — voir docs/audits/UI-13-GUIDED-PROJECT-TOOLS-BRIDGE.md,
// Arbitrages), ce bandeau lit le calcul en attente laissé en localStorage
// avant la redirection vers /connexion-client et propose de le reprendre
// une fois le client de retour sur /mon-compte. Rien n'est envoyé au
// serveur tant que l'utilisateur n'a pas validé l'import (même flux que
// depuis l'outil public).
export function PendingImportBanner() {
  const [pending, setPending] = useState<PendingImportPayload | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setPending(readPendingImport());
  }, []);

  if (!pending) return null;

  function dismiss() {
    clearPendingImport();
    setPending(null);
  }

  return (
    <>
      <Card className="border-brand-300 bg-brand-50 p-5">
        <p className="text-sm font-semibold text-neutral-950">Vous avez un calcul en attente</p>
        <p className="mt-1 text-sm text-neutral-700">
          Résultat de l&apos;outil « {pending.sourceTool} », pas encore ajouté à un projet.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onClick={() => setModalOpen(true)}>
            Continuer →
          </Button>
          <Button type="button" variant="tertiary" onClick={dismiss}>
            Ignorer
          </Button>
        </div>
      </Card>

      {modalOpen && pending.kind === "energy" ? (
        <EnergyImportModal
          appareils={pending.data as BilanConsoAppareil[]}
          onClose={() => {
            setModalOpen(false);
            dismiss();
          }}
        />
      ) : null}
      {modalOpen && pending.kind === "cable" ? (
        <CableImportModal
          form={pending.data as SectionCableForm}
          onClose={() => {
            setModalOpen(false);
            dismiss();
          }}
        />
      ) : null}
      {modalOpen && pending.kind === "solar" ? (
        <SolarImportModal
          form={pending.data as MpptSolarForm}
          onClose={() => {
            setModalOpen(false);
            dismiss();
          }}
        />
      ) : null}
    </>
  );
}
