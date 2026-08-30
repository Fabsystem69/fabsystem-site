"use client";

import { Suspense } from "react";
import { Editor } from "@/components/schema-editor/Editor";

export function SchemaEditorRuntime() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white px-6 text-sm text-neutral-500">
          Chargement de l&apos;editeur…
        </div>
      }
    >
      <Editor />
    </Suspense>
  );
}
