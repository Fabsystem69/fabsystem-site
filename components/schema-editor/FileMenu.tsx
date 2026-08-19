"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { captureSchemaThumbnail } from "@/features/schemas/export";
import { downloadPortableSchemaFile, readPortableSchemaFile } from "@/features/schemas/file-transfer";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { SCHEMA_TEMPLATES } from "@/features/schemas/templates";
import {
  createProjectApi,
  deleteProjectApi,
  listMyProjects,
  saveProjectSchemaApi,
  type ProjectSummary,
  type SchemaApiProblem,
} from "@/features/schemas/projectSchemaApi";
import { getComponentDefinition, CATEGORY_LABELS } from "@/lib/electrical-components/definitions";
import type { ProjectAssetType, ProjectVoltage } from "@/lib/generated/prisma/client";
import { PROJECT_ASSET_TYPE_LABELS, PROJECT_VOLTAGE_LABELS } from "@/lib/project-labels";
import { buildCloudAssistant, buildCloudStatusMessage } from "@/lib/schema-editor/save-assistant";

// Regroupe Nouveau / Exemples (retour utilisateur : "il commence à avoir
// beaucoup d'onglets sur le panneau principal") — actions ponctuelles sur le
// schéma entier, peu utilisées d'affilée, qui n'ont pas besoin de rester
// visibles en permanence contrairement à Filtrer/Exporter. ("Organiser"
// retiré, retour utilisateur : "l'option organiser est chaotique, elle ne
// sert à rien" — le tri auto produisait un agencement peu lisible.)
//
// V2 : "Exemple" (action unique) devient une petite galerie de gabarits
// (SCHEMA_TEMPLATES) — plusieurs points de départ par cas d'usage, pas un
// seul exemple figé.
export function FileMenu({ darkMode }: { darkMode: boolean }) {
  const DEFAULT_CLOUD_ASSET_TYPE: ProjectAssetType = "BOAT";
  const DEFAULT_CLOUD_VOLTAGE: ProjectVoltage = "UNKNOWN";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nodesCount = useSchemaStore((s) => s.nodes.length);
  const newProject = useSchemaStore((s) => s.newProject);
  const loadTemplate = useSchemaStore((s) => s.loadTemplate);
  const hydrate = useSchemaStore((s) => s.hydrate);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);
  const setSaveAssistant = useSchemaStore((s) => s.setSaveAssistant);

  // Style d'icône (retour utilisateur : "rajoute... les choix de symbole
  // [dans Menu]") — anciennement DisplayMenu, un menu à part entière pour
  // deux boutons ; regroupé ici avec le reste des préférences ponctuelles.
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const setIconStyle = useSchemaStore((s) => s.setIconStyle);

  // Filtre par catégorie (retour utilisateur : "rajoute filtrer dans
  // menu") — anciennement CategoryFilterMenu, même logique de comptage et
  // de bascule, repliée en section ici.
  const [filterOpen, setFilterOpen] = useState(false);
  const nodesForFilter = useSchemaStore((s) => s.nodes);
  const hiddenCategories = useSchemaStore((s) => s.hiddenCategories);
  const toggleCategoryVisibility = useSchemaStore((s) => s.toggleCategoryVisibility);
  const showAllCategories = useSchemaStore((s) => s.showAllCategories);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of nodesForFilter) {
      const def = getComponentDefinition(node.data.componentType);
      if (!def) continue;
      counts.set(def.category, (counts.get(def.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count, label: CATEGORY_LABELS[category] ?? category }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [nodesForFilter]);
  const isFiltered = hiddenCategories.length > 0;

  // Enregistrement dans un projet client (retour utilisateur : "rajoute
  // enregistrer mon projet dans [ce menu]") — regroupé ici plutôt qu'en
  // bouton à part dans la barre d'outils déjà chargée ; même logique que
  // l'ancien SaveToProjectMenu autonome, juste repliée dans une section de
  // ce menu au lieu d'un second bouton.
  const [saveOpen, setSaveOpen] = useState(false);
  const [projectsStatus, setProjectsStatus] = useState<"idle" | "loading" | "loaded">("idle");
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [projectsProblem, setProjectsProblem] = useState<SchemaApiProblem | null>(null);
  const [linking, setLinking] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [cloudFeedback, setCloudFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [createName, setCreateName] = useState("");
  const [createAssetType, setCreateAssetType] = useState<ProjectAssetType>(DEFAULT_CLOUD_ASSET_TYPE);
  const [createVoltage, setCreateVoltage] = useState<ProjectVoltage>(DEFAULT_CLOUD_VOLTAGE);
  const [fileFeedback, setFileFeedback] = useState<string | null>(null);
  const projectId = useSchemaStore((s) => s.projectId);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const projectName = useSchemaStore((s) => s.projectName);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const linkedProject = projects?.find((p) => p.id === projectId);
  const cloudProjects = projects ?? [];

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
      return "Le cloud est réservé aux comptes connectés. Connectez-vous pour retrouver vos projets ou en créer un nouveau.";
    }
    if (problem.code === "NETWORK") {
      return "Impossible de joindre le cloud pour l'instant. Réessayez dans quelques secondes.";
    }
    return "Impossible de charger vos projets cloud pour le moment.";
  }

  function buildCreateProjectMessage(problem: SchemaApiProblem) {
    if (problem.code === "AUTH_REQUIRED" || problem.code === "ACCESS_DENIED") {
      return "Votre session client n'est plus active. Reconnectez-vous pour créer un projet cloud.";
    }
    if (problem.code === "QUOTA_REACHED") {
      return "La limite actuelle de projets est atteinte. Archivez ou supprimez un projet existant pour libérer une place.";
    }
    if (problem.code === "BAD_REQUEST") {
      return "Le projet cloud n'a pas pu être créé. Vérifiez le nom puis réessayez.";
    }
    if (problem.code === "NETWORK") {
      return "Impossible de joindre le cloud pour créer le projet.";
    }
    return "Le projet cloud n'a pas pu être créé pour le moment.";
  }

  function buildDeleteProjectMessage(problem: SchemaApiProblem) {
    if (problem.code === "AUTH_REQUIRED" || problem.code === "ACCESS_DENIED") {
      return "Votre session client n'est plus active. Reconnectez-vous pour supprimer ce projet.";
    }
    if (problem.code === "PROJECT_NOT_FOUND") {
      return "Ce projet a déjà disparu du cloud. Rechargez la liste pour repartir sur l'état réel.";
    }
    if (problem.code === "CONFLICT") {
      return "Ce projet ne peut pas être supprimé immédiatement pour le moment. Ouvrez-le dans le dashboard si vous devez d'abord annuler une suppression programmée.";
    }
    if (problem.code === "NETWORK") {
      return "Impossible de joindre le cloud pour supprimer ce projet.";
    }
    return "Le projet cloud n'a pas pu être supprimé pour le moment.";
  }

  async function loadCloudProjects() {
    setProjectsStatus("loading");
    setProjectsProblem(null);
    setCloudFeedback(null);
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

  async function handleToggleSave() {
    const nextOpen = !saveOpen;
    setSaveOpen(nextOpen);
    if (!nextOpen) return;
    if (projectsStatus === "idle") {
      await loadCloudProjects();
    }
  }

  function syncProjectInUrl(id: string | null) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("projectId", id);
    else url.searchParams.delete("projectId");
    window.history.replaceState(null, "", url.toString());
  }

  async function handleLinkProject(id: string) {
    setLinking(true);
    setFileFeedback(null);
    setCloudFeedback(null);
    const thumbnail = await captureSchemaThumbnail(nodes).catch(() => null);
    const result = await saveProjectSchemaApi(id, { projectName, nodes, edges, thumbnail });
    setLinking(false);
    if (result.ok) {
      setProjectId(id);
      setSaveAssistant(null);
      setSaveStatus("saved", { scope: "cloud", message: "Cloud enregistré" });
      syncProjectInUrl(id);
      setOpen(false);
      setSaveOpen(false);
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
      setCreateError("Le nom du projet cloud est obligatoire.");
      return;
    }

    setCreatePending(true);
    setCreateError(null);
    setCloudFeedback(null);
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
      `Supprimer définitivement le projet cloud « ${project.name} » ? Cette action efface aussi son schéma sauvegardé et ne peut pas être annulée.`,
    );
    if (!confirmed) return;

    setDeletingProjectId(project.id);
    setCloudFeedback(null);
    const result = await deleteProjectApi(project.id);
    setDeletingProjectId(null);

    if (!result.ok) {
      setCloudFeedback({ tone: "error", message: buildDeleteProjectMessage(result.problem) });
      return;
    }

    const nextProjects = cloudProjects.filter((item) => item.id !== project.id);
    setProjects(nextProjects);
    setCloudFeedback({ tone: "success", message: `Projet supprimé : ${project.name}` });

    if (projectId === project.id) {
      setProjectId(null);
      setSaveAssistant(null);
      setSaveStatus("saved", {
        scope: "local",
        message: "Projet cloud supprimé, mode local actif",
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

  function handleNewProject() {
    if (nodesCount > 0 && !window.confirm("Repartir d'un schéma vierge ? Le schéma actuel restera sauvegardé jusqu'à la prochaine modification.")) {
      return;
    }
    newProject();
    setOpen(false);
  }

  function handleLoadTemplate(id: string, label: string) {
    if (nodesCount > 0 && !window.confirm(`Charger « ${label} » à la place du schéma actuel ? Le schéma actuel restera sauvegardé jusqu'à la prochaine modification.`)) {
      return;
    }
    loadTemplate(id);
    setOpen(false);
  }

  function handleExportFile() {
    downloadPortableSchemaFile({ projectName, nodes, edges });
    setFileFeedback("Fichier .fabschema téléchargé.");
  }

  function handleOpenImport() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const result = await readPortableSchemaFile(file);
    if (!result.ok) {
      setFileFeedback(result.message);
      return;
    }

    if (
      nodesCount > 0 &&
      !window.confirm(
        `Importer « ${file.name} » à la place du schéma actuel ? Le schéma actuel restera disponible tant que vous ne le modifiez pas à nouveau.`,
      )
    ) {
      return;
    }

    hydrate(result.schema);
    setProjectId(null);
    setSaveAssistant(null);
    setSaveStatus("saved", { scope: "local", message: "Fichier importé" });
    syncProjectInUrl(null);
    setFileFeedback(`Fichier importé : ${result.schema.projectName}`);
    setOpen(false);
  }

  const itemClass = `block w-full px-3 py-1.5 text-left text-sm transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
    darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
  }`;
  const cloudBusy = linking || createPending || deletingProjectId !== null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Nouveau schéma, gabarits, style des icônes, filtrer les catégories, fichier local (.fabschema), projets cloud"
        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-base ${
          darkMode ? "border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10" : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        }`}
      >
        Menu
      </button>
      <input ref={fileInputRef} type="file" accept=".fabschema,application/json" className="hidden" onChange={handleImportFile} />
      {open ? (
        <div
          className={`absolute right-0 top-full z-10 mt-1 w-72 rounded-md border py-1 shadow-lg ${
            darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
          }`}
        >
          <button type="button" onClick={handleNewProject} className={itemClass}>
            Nouveau
          </button>
          <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />

          <p className={`px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
            Icônes des composants
          </p>
          <div className="flex gap-1.5 px-3 pb-2">
            <button
              type="button"
              onClick={() => setIconStyle("simple")}
              className={`flex-1 rounded-md border px-2.5 py-1 text-sm transition-base ${
                iconStyle === "simple"
                  ? darkMode
                    ? "border-white bg-white text-neutral-900"
                    : "border-neutral-900 bg-neutral-900 text-white"
                  : darkMode
                    ? "border-neutral-700 text-neutral-300 hover:bg-neutral-700/50"
                    : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              Symboles
            </button>
            <button
              type="button"
              onClick={() => setIconStyle("pro")}
              className={`flex-1 rounded-md border px-2.5 py-1 text-sm transition-base ${
                iconStyle === "pro"
                  ? darkMode
                    ? "border-white bg-white text-neutral-900"
                    : "border-neutral-900 bg-neutral-900 text-white"
                  : darkMode
                    ? "border-neutral-700 text-neutral-300 hover:bg-neutral-700/50"
                    : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              Illustrations
            </button>
          </div>
          <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />

          {categoryCounts.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-base ${
                  darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
                }`}
                title="Afficher seulement certaines catégories de composants — restreint aussi les exports"
              >
                <span className={isFiltered ? (darkMode ? "text-amber-300" : "text-amber-700") : undefined}>
                  Filtrer{isFiltered ? ` (${categoryCounts.length - hiddenCategories.length}/${categoryCounts.length})` : ""}
                </span>
                <span className={darkMode ? "text-neutral-500" : "text-neutral-400"}>{filterOpen ? "▲" : "▼"}</span>
              </button>
              {filterOpen ? (
                <div className={`mx-2 mb-1 rounded-md border ${darkMode ? "border-neutral-700 bg-neutral-900" : "border-neutral-100 bg-neutral-50"}`}>
                  <div className={`flex items-center justify-between px-3 py-1.5 text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                    <span>Catégories affichées</span>
                    {isFiltered ? (
                      <button type="button" onClick={showAllCategories} className={darkMode ? "text-amber-300 hover:underline" : "text-amber-700 hover:underline"}>
                        Tout afficher
                      </button>
                    ) : null}
                  </div>
                  {categoryCounts.map(({ category, count, label }) => {
                    const hidden = hiddenCategories.includes(category);
                    return (
                      <label
                        key={category}
                        className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm transition-base ${
                          darkMode ? "text-neutral-200 hover:bg-neutral-700/50" : "text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input type="checkbox" checked={!hidden} onChange={() => toggleCategoryVisibility(category)} className="rounded border-neutral-300" />
                          {label}
                        </span>
                        <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{count}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
              <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />
            </>
          ) : null}

          <p className={`px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
            Fichier local
          </p>
          <button
            type="button"
            onClick={handleExportFile}
            disabled={nodesCount === 0}
            className={itemClass}
            title="Télécharge une copie complète du schéma dans un fichier .fabschema"
          >
            Télécharger .fabschema
          </button>
          <button
            type="button"
            onClick={handleOpenImport}
            className={itemClass}
            title="Remplace le schéma courant par un fichier .fabschema exporté plus tôt"
          >
            Importer un fichier .fabschema
          </button>
          {fileFeedback ? (
            <p className={`px-3 pb-2 pt-1 text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>{fileFeedback}</p>
          ) : null}
          <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />

          <button
            type="button"
            onClick={handleToggleSave}
            className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-base ${
              darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
            }`}
            title="La sauvegarde cloud est réservée aux utilisateurs connectés"
          >
            <span>
              {projectId ? (
                <span className={darkMode ? "text-emerald-400" : "text-emerald-700"}>Cloud : {linkedProject?.name ?? "projet"}</span>
              ) : (
                "Sauvegarde cloud"
              )}
            </span>
            <span className={darkMode ? "text-neutral-500" : "text-neutral-400"}>{saveOpen ? "▲" : "▼"}</span>
          </button>
          {saveOpen ? (
            <div className={`mx-2 mb-1 rounded-md border ${darkMode ? "border-neutral-700 bg-neutral-900" : "border-neutral-100 bg-neutral-50"}`}>
              {projectsStatus === "loading" ? (
                <p className={`px-3 py-2 text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Chargement…</p>
              ) : projectsProblem ? (
                <div className="px-3 py-2">
                  <p className={`text-xs ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
                    {buildProjectsLoadMessage(projectsProblem)}
                  </p>
                  {projectsProblem.code === "AUTH_REQUIRED" || projectsProblem.code === "ACCESS_DENIED" ? (
                    <Link href="/connexion-client" className={`mt-1.5 inline-block text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}>
                      Se connecter
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void loadCloudProjects()}
                      className={`mt-1.5 inline-block text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-700"} hover:underline`}
                    >
                      Réessayer
                    </button>
                  )}
                </div>
              ) : cloudProjects.length === 0 ? (
                <div className="px-3 py-2">
                  <p className={`text-xs ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
                    Aucun projet cloud pour l&apos;instant. Créez-en un ici et FabSystem y enregistrera ce schéma automatiquement.
                  </p>
                  {cloudFeedback ? (
                    <p
                      className={`mt-2 text-xs ${
                        cloudFeedback.tone === "error"
                          ? darkMode
                            ? "text-amber-300"
                            : "text-amber-700"
                          : darkMode
                            ? "text-emerald-300"
                            : "text-emerald-700"
                      }`}
                    >
                      {cloudFeedback.message}
                    </p>
                  ) : null}
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={createName}
                      onChange={(event) => setCreateName(event.target.value)}
                      maxLength={120}
                      placeholder="Nom du projet cloud"
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
                    {createError ? (
                      <p className={`text-xs ${darkMode ? "text-amber-300" : "text-amber-700"}`}>{createError}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleCreateProject()}
                      disabled={createPending || linking}
                      className={`w-full rounded-md border px-3 py-1.5 text-sm font-medium transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
                        darkMode ? "border-emerald-600/60 text-emerald-300 hover:bg-emerald-500/10" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {createPending || linking ? "Création..." : "Créer et enregistrer dans le cloud"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className={`px-3 py-1.5 text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
                    La liaison cloud n&apos;est confirmée qu&apos;après une première sauvegarde réussie.
                  </p>
                  {cloudProjects.map((p) => (
                    <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 ${darkMode ? "hover:bg-neutral-800/70" : "hover:bg-neutral-100/80"}`}>
                      <button
                        type="button"
                        onClick={() => handleLinkProject(p.id)}
                        disabled={cloudBusy}
                        className={`min-w-0 flex-1 text-left text-sm transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
                          darkMode ? "text-neutral-200" : "text-neutral-700"
                        }`}
                        title={p.id === projectId ? "Projet actuellement lié" : "Lier ce schéma à ce projet cloud"}
                      >
                        {p.id === projectId ? "✓ " : ""}
                        {p.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteProject(p)}
                        disabled={cloudBusy}
                        className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
                          darkMode ? "text-red-300 hover:bg-red-500/10" : "text-red-700 hover:bg-red-50"
                        }`}
                        title={`Supprimer définitivement ${p.name}`}
                      >
                        {deletingProjectId === p.id ? "..." : "Supprimer"}
                      </button>
                    </div>
                  ))}
                  {cloudFeedback ? (
                    <p
                      className={`px-3 pb-1 pt-1 text-xs ${
                        cloudFeedback.tone === "error"
                          ? darkMode
                            ? "text-amber-300"
                            : "text-amber-700"
                          : darkMode
                            ? "text-emerald-300"
                            : "text-emerald-700"
                      }`}
                    >
                      {cloudFeedback.message}
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
                      {createOpen ? "Masquer la création" : "+ Nouveau projet cloud"}
                    </button>
                    {createOpen ? (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={createName}
                          onChange={(event) => setCreateName(event.target.value)}
                          maxLength={120}
                          placeholder="Nom du projet cloud"
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
                        {createError ? (
                          <p className={`text-xs ${darkMode ? "text-amber-300" : "text-amber-700"}`}>{createError}</p>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleCreateProject()}
                          disabled={cloudBusy}
                          className={`w-full rounded-md border px-3 py-1.5 text-sm font-medium transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
                            darkMode ? "border-emerald-600/60 text-emerald-300 hover:bg-emerald-500/10" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {createPending || linking ? "Création..." : "Créer et enregistrer dans le cloud"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          ) : null}
          <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />
          <p className={`px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
            Gabarits de départ
          </p>
          {SCHEMA_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleLoadTemplate(template.id, template.label)}
              className={`flex w-full px-3 py-1.5 text-left text-sm transition-base ${
                darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
              }`}
              title={template.description}
            >
              <span>{template.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
