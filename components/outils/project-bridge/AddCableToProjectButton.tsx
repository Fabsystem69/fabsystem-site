"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CableImportModal } from "./CableImportModal";
import type { SectionCableForm } from "@/lib/outils-project-bridge";

export function AddCableToProjectButton({ form }: { form: SectionCableForm }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Ajouter à mon projet →
      </Button>
      {open ? <CableImportModal form={form} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
