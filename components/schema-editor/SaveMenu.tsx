"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { captureSchemaThumbnail } from "@/features/schemas/export";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import {
  createProjectApi,
  deleteProjectApi,
  listMyProjects,
  saveProjectSchemaApi,
  type ProjectSummary,
  type SchemaApiProblem,
} from "@/features/schemas/projectSchemaApi";
import type { ProjectAssetType, ProjectVoltage } from "@/lib/generated/prisma/client";
import { PROJECT_ASSET_TYPE_LABELS, PROJECT_VOLTAGE_LABELS } from "@/lib/project-labels";
import { buildCloudAssistant, buildCloudStatusMessage } from "@/lib/schema-editor/save-assistant";
import { RibbonButton, RibbonPanel } from "./RibbonControls";

// Retour utilisateur : "supprime cette idée de cloud et mets plutôt
// sauvegarder, et mets-le aussi dans l'accueil" — même mécanisme
// qu'auparavant (associer ce schéma à un projet client, "cloud" côté
// technique/API) mais sans jamais employer ce mot côté utilisateur ; monté à
// la fois dans l'onglet Accueil et dans l'onglet Enregistrer/Imprimer du
// ruban (voir Ribbon.tsx), chaque montage garde son propre état local
// (panneau ouvert ou non) sans conflit puisqu'un seul onglet est visible à
// la fois.
export function SaveMenu({ darkMode, variant = "ribbon" }: { darkMode: boolean; variant?: "ribbon" | "header" }) {
  const DEFAULT_CLOUD_ASSET_TYPE: ProjectAssetType = "BOAT";
  const DEFAULT_CLOUD_VOLTAGE: ProjectVoltage = "UNKNOWN";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);
  const setSaveAssistant = useSchemaStore((s) => s.setSaveAssistant);
  const [projectsStatus, setProjectsStatus] = useState<"idle" | "loading" | "loaded">("idle");
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [projectsProblem, setProjectsProblem] = useState<SchemaApiProblem | null>(null);
  const [linking, setLinking] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [createName, setCreateName] = useState("");
  const [createAssetType, setCreateAssetType] = useState<ProjectAssetType>(DEFAULT_CLOUD_ASSET_TYPE);
  const [createVoltage, setCreateVoltage] = useState<ProjectVoltage>(DEFAULT_CLOUD_VOLTAGE);
  const projectId = useSchemaStore((s) => s.projectId);
  const saveStatus = useSchemaStore((s) => s.saveStatus);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const projectName = useSchemaStore((s) => s.projectName);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const linkedProject = projects?.find((p) => p.id === projectId);
  const savedProjects = projects ?? [];
  const busy = linking || createPending || deletingProjectId !== null;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function buildProjectsLoadMessage(problem: SchemaApiProblem) {
    if (problem.code === "AUTH_REQUIRED" || problem.code === "ACCESS_DENIED") {
      return "La sauvegarde est réservée aux comptes connectés. Connectez-vous pour retrouver vos projets ou en créer un nouveau.";
    }
    if (problem.code === "NETWORK") {
      return "Impossible de joindre le serveur pour l'instant. Réessayez dans quelques secondes.";
    }
    return "Impossible de charger vos projets pour le moment.";
  }

  function buildCreateProjectMessage(problem: SchemaApiProblem) {
    if (problem.code === "AUTH_REQUIRED" || problem.code === "ACCESS_DENIED") {
      return "Votre session client n'est plus active. Reconnectez-vous pour créer un projet.";
    }
    if (problem.code === "QUOTA_REACHED") {
      return "La limite actuelle de projets est atteinte. Archivez ou supprimez un projet existant pour libérer une place.";
    }
    if (problem.code === "BAD_REQUEST") {
      return "Le projet n'a pas pu être créé. Vérifiez le nom puis réessayez.";
    }
    if (problem.code === "NETWORK") {
      return "Impossible de joindre le serveur pour créer le projet.";
    }
    return "Le projet n'a pas pu être créé pour le moment.";
  }

  function buildDeleteProjectMessage(problem: SchemaApiProblem) {
    if (problem.code === "AUTH_REQUIRED" || problem.code === "ACCESS_DENIED") {
      return "Votre session client n'est plus active. Reconnectez-vous pour supprimer ce projet.";
    }
    if (problem.code === "PROJECT_NOT_FOUND") {
      return "Ce projet a déjà disparu. Rechargez la liste pour repartir sur l'état réel.";
    }
    if (problem.code === "CONFLICT") {
      return "Ce projet ne peut pas être supprimé immédiatement pour le moment. Ouvrez-le dans le dashboard si vous devez d'abord annuler une suppression programmée.";
    }
    if (problem.code === "NETWORK") {
      return "Impossible de joindre le serveur pour supprimer ce projet.";
    }
    return "Le projet n'a pas pu être supprimé pour le moment.";
  }

  async function loadProjects() {
    setProjectsStatus("loading");
    setProjectsProblem(null);
    setSaveFeedback(null);
    const result = await listMyProjects();
    if (result.ok) {
      setProjects(result.projects);
      setProjectsProblem(null);
      const shouldOpenCreate = result.projects.length === 0;
      setCreateOpen(shouldOpenCreate);
      if (shouldOpenCreate && createName.trim().length === 0) {
        setCreateName(projectName.trim() || "Mon projet");
      }
    } else {
      setProjects(null);
      setProjectsProblem(result.problem);
    }
    setProjectsStatus("loaded");
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && projectsStatus === "idle") await loadProjects();
  }

  async function handleHeaderSave() {
    if (projectId) {
      await handleLinkProject(projectId);
      return;
    }
    await toggleOpen();
  }

  function syncProjectInUrl(id: string | null) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("projectId", id);
    else url.searchParams.delete("projectId");
    window.history.replaceState(null, "", url.toString());
  }

  async function handleLinkProject(id: string) {
    setLinking(true);
    setSaveFeedback(null);
    const thumbnail = await captureSchemaThumbnail(nodes).catch(() => null);
    const result = await saveProjectSchemaApi(id, { projectName, nodes, edges, thumbnail });
    setLinking(false);
    if (result.ok) {
      setProjectId(id);
      setSaveAssistant(null);
      setSaveStatus("saved", { scope: "cloud", message: "Sauvegardé" });
      syncProjectInUrl(id);
      setOpen(false);
      return;
    }

    setSaveStatus("error", {
      scope: "cloud",
      message: buildCloudStatusMessage(result.problem, "save"),
    });
    setSaveAssistant(buildCloudAssistant(result.problem, "save"));
  }

  async function handleCreateProject() {
    const trimmedName = createName.trim();
    if (!trimmedName) {
      setCreateError("Le nom du projet est obligatoire.");
      return;
    }

    setCreatePending(true);
    setCreateError(null);
    setSaveFeedback(null);
    const result = await createProjectApi({
      name: trimmedName,
      assetType: createAssetType,
      voltage: createVoltage,
    });
    setCreatePending(false);

    if (!result.ok) {
      setCreateError(buildCreateProjectMessage(result.problem));
      return;
    }

    setProjects((current) => {
      const next = current ? current.filter((project) => project.id !== result.project.id) : [];
      return [result.project, ...next];
    });
    setProjectsProblem(null);
    setCreateOpen(false);
    await handleLinkProject(result.project.id);
  }

  async function handleDeleteProject(project: ProjectSummary) {
    const confirmed = window.confirm(
      `Supprimer définitivement le projet « ${project.name} » ? Cette action efface aussi son schéma sauvegardé et ne peut pas être annulée.`,
    );
    if (!confirmed) return;

    setDeletingProjectId(project.id);
    setSaveFeedback(null);
    const result = await deleteProjectApi(project.id);
    setDeletingProjectId(null);

    if (!result.ok) {
      setSaveFeedback({ tone: "error", message: buildDeleteProjectMessage(result.problem) });
      return;
    }

    const nextProjects = savedProjects.filter((item) => item.id !== project.id);
    setProjects(nextProjects);
    setSaveFeedback({ tone: "success", message: `Projet supprimé : ${project.name}` });

    if (projectId === project.id) {
      setProjectId(null);
      setSaveAssistant(null);
      setSaveStatus("saved", {
        scope: "local",
        message: "Projet supprimé, mode local actif",
      });
      syncProjectInUrl(null);
    }

    if (nextProjects.length === 0) {
      setCreateOpen(true);
      if (!createName.trim()) {
        setCreateName(projectName.trim() || "Mon projet");
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {variant === "header" ? (
        projectId && saveStatus !== "error" ? (
          <button
            type="button"
            data-schema-header-save
            onClick={() => void handleHeaderSave()}
            disabled={busy}
            title="Sauvegardé dans votre projet. Cliquez pour enregistrer de nouveau."
            className={`flex h-8 w-10 items-center justify-center rounded-lg transition-base disabled:cursor-not-allowed disabled:opacity-60 max-md:h-10 max-md:w-10 ${darkMode ? "text-emerald-300 hover:bg-emerald-400/10" : "text-emerald-700 hover:bg-emerald-50"}`}
          >
            <span className="text-lg" aria-hidden="true">☁✓</span>
            <span className="sr-only">Sauvegardé dans le projet</span>
          </button>
        ) : (
          <button
            type="button"
            data-schema-header-save
            onClick={() => void handleHeaderSave()}
            disabled={busy}
            className="group flex h-9 items-center overflow-hidden rounded-lg bg-amber-500 px-2.5 text-sm font-semibold text-white shadow-sm transition-base hover:bg-amber-600 hover:px-3 disabled:cursor-not-allowed disabled:opacity-60 max-md:h-10 max-md:w-10 max-md:justify-center max-md:px-0"
            title="Sauvegarder ce schéma dans votre projet"
          >
            <span aria-hidden="true">💾</span>
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:ml-1.5 group-hover:max-w-[6rem] group-hover:opacity-100 max-md:sr-only">
              {busy ? "Sauvegarde…" : "Sauvegarder"}
            </span>
          </button>
        )
      ) : (
        <RibbonButton
          darkMode={darkMode}
          onClick={() => void toggleOpen()}
          active={open}
          icon="💾"
          label={projectId ? "Sauvegardé" : "Sauvegarder"}
          title="Associer ce schéma à un projet de votre compte — réservé aux utilisateurs connectés"
        />
      )}
      {open ? (
        <RibbonPanel darkMode={darkMode} width="w-72">
          {projectId ? (
            <p className={`px-3 pb-1 pt-1.5 text-xs font-medium ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
              Enregistré dans : {linkedProject?.name ?? "projet"}
            </p>
          ) : null}
          {projectsStatus === "loading" ? (
            <p className={`px-3 py-2 text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Chargement…</p>
          ) : projectsProblem ? (
            <div className="px-3 py-2">
              <p className={`text-xs ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>{buildProjectsLoadMessage(projectsProblem)}</p>
              {projectsProblem.code === "AUTH_REQUIRED" || projectsProblem.code === "ACCESS_DENIED" ? (
                <Link href="/connexion-client" className={`mt-1.5 inline-block text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}>
                  Se connecter
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void loadProjects()}
                  className={`mt-1.5 inline-block text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}
                >
                  Réessayer
                </button>
              )}
            </div>
          ) : savedProjects.length === 0 ? (
            <div className="px-3 py-2">
              <p className={`text-xs ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
                Aucun projet pour l&apos;instant. Créez-en un ici et FabSystem y enregistrera ce schéma automatiquement.
              </p>
              {saveFeedback ? (
                <p className={`mt-2 text-xs ${saveFeedback.tone === "error" ? (darkMode ? "text-amber-300" : "text-amber-700") : darkMode ? "text-emerald-300" : "text-emerald-700"}`}>
                  {saveFeedback.message}
                </p>
              ) : null}
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  maxLength={120}
                  placeholder="Nom du projet"
                  className={`w-full rounded-md border px-2.5 py-1.5 text-sm outline-none ${
                    darkMode
                      ? "border-neutral-700 bg-neutral-950 text-neutral-100 placeholder:text-neutral-500"
                      : "border-neutral-300 bg-white text-neutral-800 placeholder:text-neutral-400"
                  }`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className={`text-[11px] ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                    Type
                    <select
                      value={createAssetType}
                      onChange={(event) => setCreateAssetType(event.target.value as ProjectAssetType)}
                      className={`mt-1 block w-full rounded-md border px-2 py-1.5 text-sm ${
                        darkMode ? "border-neutral-700 bg-neutral-950 text-neutral-100" : "border-neutral-300 bg-white text-neutral-800"
                      }`}
                    >
                      {Object.entries(PROJECT_ASSET_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={`text-[11px] ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                    Tension
                    <select
                      value={createVoltage}
                      onChange={(event) => setCreateVoltage(event.target.value as ProjectVoltage)}
                      className={`mt-1 block w-full rounded-md border px-2 py-1.5 text-sm ${
                        darkMode ? "border-neutral-700 bg-neutral-950 text-neutral-100" : "border-neutral-300 bg-white text-neutral-800"
                      }`}
                    >
                      {Object.entries(PROJECT_VOLTAGE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {createError ? <p className={`text-xs ${darkMode ? "text-amber-300" : "text-amber-700"}`}>{createError}</p> : null}
                <button
                  type="button"
                  onClick={() => void handleCreateProject()}
                  disabled={busy}
                  className={`w-full rounded-md border px-3 py-1.5 text-sm font-medium transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
                    darkMode ? "border-emerald-600/60 text-emerald-300 hover:bg-emerald-500/10" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {busy ? "Création..." : "Créer et enregistrer"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={`px-3 py-1.5 text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
                La liaison n&apos;est confirmée qu&apos;après une première sauvegarde réussie.
              </p>
              {savedProjects.map((p) => (
                <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 ${darkMode ? "hover:bg-neutral-800/70" : "hover:bg-neutral-100/80"}`}>
                  <button
                    type="button"
                    onClick={() => handleLinkProject(p.id)}
                    disabled={busy}
                    className={`min-w-0 flex-1 text-left text-sm transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
                      darkMode ? "text-neutral-200" : "text-neutral-700"
                    }`}
                    title={p.id === projectId ? "Projet actuellement lié" : "Lier ce schéma à ce projet"}
                  >
                    {p.id === projectId ? "✓ " : ""}
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteProject(p)}
                    disabled={busy}
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
                      darkMode ? "text-red-300 hover:bg-red-500/10" : "text-red-700 hover:bg-red-50"
                    }`}
                    title={`Supprimer définitivement ${p.name}`}
                  >
                    {deletingProjectId === p.id ? "..." : "Supprimer"}
                  </button>
                </div>
              ))}
              {saveFeedback ? (
                <p className={`px-3 pb-1 pt-1 text-xs ${saveFeedback.tone === "error" ? (darkMode ? "text-amber-300" : "text-amber-700") : darkMode ? "text-emerald-300" : "text-emerald-700"}`}>
                  {saveFeedback.message}
                </p>
              ) : null}
              <div className={`mt-1 border-t px-3 py-2 ${darkMode ? "border-neutral-700" : "border-neutral-200"}`}>
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen((value) => !value);
                    setCreateError(null);
                    if (!createName.trim()) setCreateName(projectName.trim() || "Mon projet");
                  }}
                  className={`text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}
                >
                  {createOpen ? "Masquer la création" : "+ Nouveau projet"}
                </button>
                {createOpen ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={createName}
                      onChange={(event) => setCreateName(event.target.value)}
                      maxLength={120}
                      placeholder="Nom du projet"
                      className={`w-full rounded-md border px-2.5 py-1.5 text-sm outline-none ${
                        darkMode
                          ? "border-neutral-700 bg-neutral-950 text-neutral-100 placeholder:text-neutral-500"
                          : "border-neutral-300 bg-white text-neutral-800 placeholder:text-neutral-400"
                      }`}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`text-[11px] ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                        Type
                        <select
                          value={createAssetType}
                          onChange={(event) => setCreateAssetType(event.target.value as ProjectAssetType)}
                          className={`mt-1 block w-full rounded-md border px-2 py-1.5 text-sm ${
                            darkMode ? "border-neutral-700 bg-neutral-950 text-neutral-100" : "border-neutral-300 bg-white text-neutral-800"
                          }`}
                        >
                          {Object.entries(PROJECT_ASSET_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={`text-[11px] ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                        Tension
                        <select
                          value={createVoltage}
                          onChange={(event) => setCreateVoltage(event.target.value as ProjectVoltage)}
                          className={`mt-1 block w-full rounded-md border px-2 py-1.5 text-sm ${
                            darkMode ? "border-neutral-700 bg-neutral-950 text-neutral-100" : "border-neutral-300 bg-white text-neutral-800"
                          }`}
                        >
                          {Object.entries(PROJECT_VOLTAGE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {createError ? <p className={`text-xs ${darkMode ? "text-amber-300" : "text-amber-700"}`}>{createError}</p> : null}
                    <button
                      type="button"
                      onClick={() => void handleCreateProject()}
                      disabled={busy}
                      className={`w-full rounded-md border px-3 py-1.5 text-sm font-medium transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
                        darkMode ? "border-emerald-600/60 text-emerald-300 hover:bg-emerald-500/10" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {busy ? "Création..." : "Créer et enregistrer"}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </RibbonPanel>
      ) : null}
    </div>
  );
}
