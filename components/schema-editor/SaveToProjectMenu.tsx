"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { captureSchemaThumbnail } from "@/features/schemas/export";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { listMyProjects, saveProjectSchemaApi, type ProjectSummary } from "@/features/schemas/projectSchemaApi";
import { buildCloudAssistant, buildCloudStatusMessage } from "@/lib/schema-editor/save-assistant";

// Lie le schéma courant à un Project client (retour utilisateur : "il
// manque enregistrer lié au compte client") — reste entièrement optionnel :
// l'outil fonctionne sans compte (brouillon local), ce menu n'est qu'un
// point d'entrée additionnel. Second point d'entrée symétrique : le bouton
// "Ouvrir l'éditeur de schéma" sur /mon-compte/projets/[projectId], qui
// arrive ici directement via ?projectId=.
export function SaveToProjectMenu({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded">("idle");
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const projectId = useSchemaStore((s) => s.projectId);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const projectName = useSchemaStore((s) => s.projectName);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);
  const setSaveAssistant = useSchemaStore((s) => s.setSaveAssistant);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleOpen() {
    setOpen((v) => !v);
    if (status === "idle") {
      setStatus("loading");
      const list = await listMyProjects();
      setProjects(list);
      setStatus("loaded");
    }
  }

  async function handleLink(id: string) {
    setSaving(true);
    const thumbnail = await captureSchemaThumbnail(nodes).catch(() => null);
    const result = await saveProjectSchemaApi(id, { projectName, nodes, edges, thumbnail });
    setSaving(false);
    if (result.ok) {
      setProjectId(id);
      setSaveAssistant(null);
      setSaveStatus("saved", { scope: "cloud", message: "Cloud enregistré" });
      const url = new URL(window.location.href);
      url.searchParams.set("projectId", id);
      window.history.replaceState(null, "", url.toString());
      setOpen(false);
      return;
    }

    setSaveStatus("error", {
      scope: "cloud",
      message: buildCloudStatusMessage(result.problem, "save"),
    });
    setSaveAssistant(buildCloudAssistant(result.problem, "save"));
  }

  const itemClass = `block w-full px-3 py-1.5 text-left text-sm transition-base ${
    darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
  }`;
  const linkedProject = projects?.find((p) => p.id === projectId);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        title="Enregistrer ce schéma dans un de vos projets (compte client)"
        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-base ${
          projectId
            ? darkMode
              ? "border-emerald-600/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : darkMode
              ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        {projectId ? `Lié : ${linkedProject?.name ?? "projet"}` : "Enregistrer dans mon projet"}
      </button>
      {open ? (
        <div
          className={`absolute right-0 top-full z-10 mt-1 w-64 rounded-md border py-1 shadow-lg ${
            darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
          }`}
        >
          {status === "loading" ? (
            <p className={`px-3 py-2 text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Chargement…</p>
          ) : projects === null ? (
            <div className="px-3 py-2">
              <p className={`text-xs ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>Connectez-vous pour lier ce schéma à un projet.</p>
              <Link href="/connexion-client" className={`mt-1.5 inline-block text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}>
                Se connecter
              </Link>
            </div>
          ) : projects.length === 0 ? (
            <div className="px-3 py-2">
              <p className={`text-xs ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>Aucun projet pour l&apos;instant.</p>
              <Link href="/mon-compte/projets/nouveau" className={`mt-1.5 inline-block text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}>
                Créer un projet
              </Link>
            </div>
          ) : (
            <>
              <p className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                Vos projets
              </p>
              {projects.map((p) => (
                <button key={p.id} type="button" onClick={() => handleLink(p.id)} disabled={saving} className={itemClass}>
                  {p.id === projectId ? "✓ " : ""}
                  {p.name}
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
