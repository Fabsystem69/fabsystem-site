"use client";

import Link from "next/link";
import { downloadPortableSchemaFile } from "@/features/schemas/file-transfer";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

function buttonClass(darkMode: boolean) {
  return `inline-flex min-h-9 items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition-base ${
    darkMode ? "border border-neutral-700 text-neutral-100 hover:bg-neutral-800" : "border border-neutral-300 text-neutral-800 hover:bg-neutral-100"
  }`;
}

function linkClass(darkMode: boolean) {
  return `inline-flex min-h-9 items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition-base ${
    darkMode ? "bg-brand-400 text-neutral-950 hover:bg-brand-300" : "bg-neutral-900 text-white hover:bg-neutral-800"
  }`;
}

export function SaveAssistantBanner() {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const notice = useSchemaStore((s) => s.saveAssistant);
  const projectId = useSchemaStore((s) => s.projectId);
  const projectName = useSchemaStore((s) => s.projectName);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);
  const setSaveAssistant = useSchemaStore((s) => s.setSaveAssistant);

  if (!notice) return null;

  const primaryHref =
    notice.code === "AUTH_REQUIRED"
      ? "/connexion-client"
      : notice.code === "ACCESS_DENIED" || notice.code === "PROJECT_NOT_FOUND"
        ? "/mon-compte/projets"
        : null;

  function handleContinueLocal() {
    setProjectId(null);
    setSaveAssistant(null);
    setSaveStatus("saved", { scope: "local", message: "Mode local actif" });

    const url = new URL(window.location.href);
    url.searchParams.delete("projectId");
    window.history.replaceState(null, "", url.toString());
  }

  function handleDownloadFile() {
    downloadPortableSchemaFile({ projectName, nodes, edges });
  }

  return (
    <div
      className={`border-b px-4 py-3 ${
        darkMode ? "border-amber-900 bg-amber-950/70 text-amber-50" : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{notice.title}</p>
          <p className={`mt-1 text-sm leading-relaxed ${darkMode ? "text-amber-100/90" : "text-amber-900/90"}`}>{notice.message}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {primaryHref ? (
            <Link href={primaryHref} className={linkClass(darkMode)}>
              {notice.code === "AUTH_REQUIRED" ? "Se connecter" : "Voir mes projets"}
            </Link>
          ) : null}

          <button type="button" onClick={handleDownloadFile} className={buttonClass(darkMode)}>
            Télécharger .fabschema
          </button>

          {projectId ? (
            <button type="button" onClick={handleContinueLocal} className={buttonClass(darkMode)}>
              Continuer en local
            </button>
          ) : null}

          <button type="button" onClick={() => setSaveAssistant(null)} className={buttonClass(darkMode)}>
            Masquer
          </button>
        </div>
      </div>
    </div>
  );
}
