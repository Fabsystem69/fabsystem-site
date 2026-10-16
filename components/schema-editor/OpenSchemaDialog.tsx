"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { readPortableSchemaFile } from "@/features/schemas/file-transfer";
import { fetchProjectSchema, listMyProjects, type ProjectSummary, type SchemaApiProblem } from "@/features/schemas/projectSchemaApi";
import { useAdminCustomerStore } from "@/features/schemas/store/useAdminCustomerStore";
import { resolveProjectAccountScope } from "@/lib/schema-editor/project-account-scope";
import { AdminCustomerBar } from "./AdminCustomerBar";

/** Ouvre un schéma sauvegardé ou un fichier local depuis une seule fenêtre. */
export function OpenSchemaDialog({ onClose, onNew, onTemplates }: { onClose: () => void; onNew: () => void; onTemplates: () => void }) {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const nodes = useSchemaStore((s) => s.nodes);
  const hydrate = useSchemaStore((s) => s.hydrate);
  const projectId = useSchemaStore((s) => s.projectId);
  const isAdmin = useSchemaStore((s) => s.isAdmin);
  const actingCustomerId = useAdminCustomerStore((s) => s.actingCustomer?.id ?? null);
  const needsCustomer = resolveProjectAccountScope({ isAdmin, actingCustomerId }).kind === "needs-customer";
  const lastKnownSchemaUpdatedAt = useSchemaStore((s) => s.lastKnownSchemaUpdatedAt);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const setSaveAssistant = useSchemaStore((s) => s.setSaveAssistant);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [problem, setProblem] = useState<SchemaApiProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin : projets du client choisi ("comme si j'étais sur son compte"),
  // jamais ceux de sa propre session client éventuelle.
  async function loadProjects(customerIdOverride?: string) {
    const scope = resolveProjectAccountScope({ isAdmin, actingCustomerId: customerIdOverride ?? actingCustomerId });
    if (scope.kind === "needs-customer") {
      setProjects([]);
      setProblem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await listMyProjects(scope.listUrl);
    if (result.ok) {
      setProjects(result.projects);
      setProblem(null);
    } else {
      setProjects([]);
      setProblem(result.problem);
    }
    setLoading(false);
  }

  useEffect(() => { void loadProjects(); }, []);

  function syncProjectInUrl(id: string | null) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("projectId", id);
    else url.searchParams.delete("projectId");
    window.history.replaceState(null, "", url.toString());
  }

  async function openProject(project: ProjectSummary) {
    if (nodes.some((node) => node.type !== "zone") && !window.confirm(`Ouvrir « ${project.name} » à la place du schéma actuel ?`)) return;
    setOpeningId(project.id);
    const result = await fetchProjectSchema(project.id);
    setOpeningId(null);
    if (!result.ok) {
      setProblem(result.problem);
      return;
    }
    if (!result.schema) {
      setSaveStatus("error", { scope: "local", message: "Ce projet ne contient pas encore de schéma enregistré" });
      return;
    }
    hydrate(result.schema);
    setProjectId(project.id);
    setSaveAssistant(null);
    setSaveStatus("saved", { scope: "cloud", message: `Schéma ouvert : ${project.name}` });
    syncProjectInUrl(project.id);
    onClose();
  }

  async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = await readPortableSchemaFile(file);
    if (!result.ok) {
      setSaveStatus("error", { scope: "local", message: result.message });
      return;
    }
    // Retour utilisateur : "je charge mon schéma local pour le coller à un
    // client, ça me remet sur mon compte" — si un projet est ouvert (ex. :
    // projet créé depuis la fiche client puis ouvert dans l'éditeur), le
    // fichier importé REMPLACE son contenu et reste enregistré dans ce
    // projet, au lieu de détacher l'éditeur vers le mode local.
    if (projectId) {
      if (!window.confirm(`Remplacer le contenu du projet ouvert par « ${file.name} » ? Le schéma importé sera enregistré dans ce projet.`)) return;
      hydrate({ ...result.schema, updatedAt: lastKnownSchemaUpdatedAt });
      setSaveAssistant(null);
      onClose();
      return;
    }
    if (nodes.some((node) => node.type !== "zone") && !window.confirm(`Importer « ${file.name} » à la place du schéma actuel ?`)) return;
    hydrate(result.schema);
    setProjectId(null);
    setSaveAssistant(null);
    setSaveStatus("saved", { scope: "local", message: `Fichier importé : ${result.schema.projectName}` });
    syncProjectInUrl(null);
    onClose();
  }

  const filteredProjects = projects.filter((project) => project.name.toLocaleLowerCase("fr").includes(query.trim().toLocaleLowerCase("fr")));
  const panelClass = darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-slate-200 bg-white text-slate-900";
  const controlClass = darkMode ? "border-neutral-700 bg-neutral-950 text-neutral-100" : "border-slate-300 bg-white text-slate-800";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="open-schema-title">
      <div className={`flex min-h-[32rem] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${panelClass}`}>
        <header className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
          <div>
            <h2 id="open-schema-title" className="text-lg font-semibold">Ouvrir un schéma</h2>
            <p className={`mt-0.5 text-sm ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>Retrouvez un schéma sauvegardé ou importez une copie locale.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white" aria-label="Fermer">×</button>
        </header>

        <div className={`flex flex-wrap items-center gap-2 border-b px-5 py-3 ${darkMode ? "border-neutral-800" : "border-slate-200"}`}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un schéma…" className={`min-w-[15rem] flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-500 ${controlClass}`} />
          <button type="button" onClick={onTemplates} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${controlClass}`}>Modèles</button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${controlClass}`}>Importer</button>
          <button type="button" onClick={onNew} className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600">Nouveau</button>
          <input ref={fileInputRef} type="file" accept=".fabschema,application/json" className="hidden" onChange={importFile} />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          {isAdmin ? (
            <div className="mb-4">
              <AdminCustomerBar darkMode={darkMode} onChange={(customer) => void loadProjects(customer.id)} />
            </div>
          ) : null}
          {loading ? <p className={darkMode ? "text-neutral-400" : "text-slate-500"}>Chargement des schémas sauvegardés…</p> : null}
          {problem ? (
            <div className={`rounded-xl border p-4 text-sm ${darkMode ? "border-amber-500/40 bg-amber-500/10 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              {problem.code === "AUTH_REQUIRED" || problem.code === "ACCESS_DENIED" ? <><p>Connectez-vous pour ouvrir vos schémas sauvegardés.</p><Link href="/connexion-client" className="mt-2 inline-block font-semibold underline">Se connecter</Link></> : <><p>Impossible de charger les schémas pour le moment.</p><button type="button" onClick={() => void loadProjects()} className="mt-2 font-semibold underline">Réessayer</button></>}
            </div>
          ) : null}
          {!loading && !problem && !needsCustomer && filteredProjects.length === 0 ? <div className={`flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center ${darkMode ? "border-neutral-700 text-neutral-400" : "border-slate-300 text-slate-500"}`}><span className="text-4xl">▤</span><p className="mt-3 font-semibold">Aucun schéma sauvegardé</p><p className="mt-1 text-sm">Créez un schéma, chargez un modèle ou importez un fichier.</p></div> : null}
          {!loading && !problem && filteredProjects.length > 0 ? <div className="grid gap-2 sm:grid-cols-2">{filteredProjects.map((project) => <button key={project.id} type="button" onClick={() => void openProject(project)} disabled={openingId !== null} className={`rounded-xl border p-4 text-left transition-base disabled:opacity-50 ${darkMode ? "border-neutral-700 bg-neutral-950 hover:border-brand-500 hover:bg-neutral-800" : "border-slate-200 hover:border-brand-500 hover:bg-brand-50"}`}><span className="block text-sm font-semibold">{project.name}</span><span className={`mt-1 block text-xs ${darkMode ? "text-neutral-500" : "text-slate-500"}`}>{openingId === project.id ? "Ouverture…" : "Ouvrir ce schéma"}</span></button>)}</div> : null}
        </main>
      </div>
    </div>
  );
}
