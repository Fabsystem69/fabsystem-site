import type { Metadata } from "next";
import { Suspense } from "react";
import { Editor } from "@/components/schema-editor/Editor";

// Route dédiée plein écran (docs/schema/CDC_FabSystem_Schema_V1.md §66) :
// pas de compte requis, ouverture directe de l'éditeur. Client-only (canvas
// interactif) — la page elle-même reste un Server Component minimal.
export const metadata: Metadata = {
  title: "Schéma électrique",
  description:
    "Créez votre schéma électrique 12V/24V pour bateau, van ou camping-car : glissez des composants, reliez-les, exportez. Gratuit, sans compte.",
  alternates: { canonical: "/outils/schema" },
};

export default function SchemaEditorPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-neutral-400">Chargement…</div>}>
      <Editor />
    </Suspense>
  );
}
