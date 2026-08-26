"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SolarImportModal } from "./SolarImportModal";
import type { MpptSolarForm } from "@/lib/outils-project-bridge";

// UI-13 §14 — même CTA que AddEnergyToProjectButton, pour l'outil MPPT/solaire.
export function AddSolarToProjectButton({ form }: { form: MpptSolarForm }) {
  const [open, setOpen] = useState(false);
  const hasValidInput = form.nbPanneaux > 0 && form.wattsParPanneau > 0;

  return (
    <>
      <Button type="button" variant="secondary" disabled={!hasValidInput} onClick={() => setOpen(true)}>
        Ajouter à mon projet →
      </Button>
      {open ? <SolarImportModal form={form} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
