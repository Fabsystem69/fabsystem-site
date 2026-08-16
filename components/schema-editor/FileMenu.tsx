"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { captureSchemaThumbnail } from "@/features/schemas/export";
import { downloadPortableSchemaFile, readPortableSchemaFile } from "@/features/schemas/file-transfer";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { SCHEMA_TEMPLATES } from "@/features/schemas/templates";
import { listMyProjects, saveProjectSchemaApi, type ProjectSummary } from "@/features/schemas/projectSchemaApi";
import { getComponentDefinition, CATEGORY_LABELS } from "@/lib/electrical-components/definitions";
import { buildCloudAssistant, buildCloudStatusMessage } from "@/lib/schema-editor/save-assistant";

// Regroupe Nouveau / Exemples / Organiser (retour utilisateur : "il commence
// à avoir beaucoup d'onglets sur le panneau principal") — actions
// ponctuelles sur le schéma entier, peu utilisées d'affilée, qui n'ont pas
// besoin de rester visibles en permanence contrairement à Filtrer/Exporter.
//
// V2 : "Exemple" (action unique) devient une petite galerie de gabarits
// (SCHEMA_TEMPLATES) — plusieurs points de départ par cas d'usage, pas un
// seul exemple figé.
export function FileMenu({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nodesCount = useSchemaStore((s) => s.nodes.length);
  const newProject = useSchemaStore((s) => s.newProject);
  const loadTemplate = useSchemaStore((s) => s.loadTemplate);
  const hydrate = useSchemaStore((s) => s.hydrate);
  const autoLayout = useSchemaStore((s) => s.autoLayout);
  const recalculateAllCableSections = useSchemaStore((s) => s.recalculateAllCableSections);
  const recalculateAllFuseRatings = useSchemaStore((s) => s.recalculateAllFuseRatings);
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
  const [linking, setLinking] = useState(false);
  const [fileFeedback, setFileFeedback] = useState<string | null>(null);
  const projectId = useSchemaStore((s) => s.projectId);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const projectName = useSchemaStore((s) => s.projectName);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const linkedProject = projects?.find((p) => p.id === projectId);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleToggleSave() {
    setSaveOpen((v) => !v);
    if (projectsStatus === "idle") {
      setProjectsStatus("loading");
      const list = await listMyProjects();
      setProjects(list);
      setProjectsStatus("loaded");
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

  function handleAutoLayout() {
    autoLayout();
    setOpen(false);
  }

  function handleRecalculateSections() {
    setOpen(false);
    if (!window.confirm("Recalculer la section de tous les câbles de puissance dont la charge en aval est estimable ? Les sections déjà saisies manuellement seront remplacées.")) {
      return;
    }
    const count = recalculateAllCableSections();
    window.alert(
      count > 0
        ? `${count} section${count > 1 ? "s" : ""} de câble mise${count > 1 ? "s" : ""} à jour.`
        : "Aucun câble de puissance à recalculer — ajoutez au moins un consommateur avec une puissance connue sur le circuit.",
    );
  }

  function handleRecalculateFuses() {
    setOpen(false);
    if (!window.confirm("Recalculer le calibre de tous les fusibles/disjoncteurs dont le courant en aval est estimable ? Les calibres déjà saisis manuellement seront remplacés.")) {
      return;
    }
    const count = recalculateAllFuseRatings();
    window.alert(
      count > 0
        ? `${count} calibre${count > 1 ? "s" : ""} mis à jour.`
        : "Aucun fusible/disjoncteur à recalculer — ajoutez au moins un consommateur avec une puissance connue sur le circuit.",
    );
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
              ) : projects === null ? (
                <div className="px-3 py-2">
                  <p className={`text-xs ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
                    Le cloud est réservé aux comptes connectés. Sans compte, utilisez l&apos;export .fabschema pour garder une copie.
                  </p>
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
                  <p className={`px-3 py-1.5 text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
                    La liaison cloud n&apos;est confirmée qu&apos;après une première sauvegarde réussie.
                  </p>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleLinkProject(p.id)}
                      disabled={linking}
                      className={`block w-full px-3 py-1.5 text-left text-sm transition-base ${
                        darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      {p.id === projectId ? "✓ " : ""}
                      {p.name}
                    </button>
                  ))}
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
          <div className={`my-1 border-t ${darkMode ? "border-neutral-700" : "border-neutral-100"}`} />
          <button
            type="button"
            onClick={handleAutoLayout}
            disabled={nodesCount === 0}
            className={itemClass}
            title="Réorganise automatiquement les composants en un bloc compact, sans toucher aux connexions"
          >
            Organiser
          </button>
          <button
            type="button"
            onClick={handleRecalculateSections}
            disabled={nodesCount === 0}
            className={itemClass}
            title="Recalcule en une fois la section de tous les câbles de puissance dont la charge en aval est estimable"
          >
            Recalculer les sections de câble
          </button>
          <button
            type="button"
            onClick={handleRecalculateFuses}
            disabled={nodesCount === 0}
            className={itemClass}
            title="Recalcule en une fois le calibre de tous les fusibles/disjoncteurs dont le courant en aval est estimable"
          >
            Recalculer les calibres de fusible
          </button>
        </div>
      ) : null}
    </div>
  );
}
