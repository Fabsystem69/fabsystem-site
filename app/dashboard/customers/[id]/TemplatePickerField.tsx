"use client";

import { useMemo, useState } from "react";
import { getSchemaTemplate, getSchemaTemplatesByVehicleGroup } from "@/features/schemas/templates";
import { TemplateDiagramPreview } from "@/components/schema-editor/TemplateDiagramPreview";

// Retour utilisateur (dashboard admin) : "je voudrais quand je crée un
// schéma pour un client depuis mon dashboard pouvoir choisir un template de
// départ" — le champ existait déjà (simple <select>), mais sans aperçu.
// Reprend le même catalogue et le même aperçu visuel que
// TemplatePickerDialog.tsx (l'éditeur), adapté en champ de formulaire
// classique (input caché) plutôt qu'en action directe sur un store Zustand,
// puisqu'ici on ne fait que préparer la valeur soumise par le formulaire
// serveur existant (createProjectForCustomerAction).
export function TemplatePickerField() {
  const groups = useMemo(() => getSchemaTemplatesByVehicleGroup(), []);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [draftId, setDraftId] = useState("");
  const [activeGroup, setActiveGroup] = useState<"all" | (typeof groups)[number]["id"]>("all");

  const selectedTemplate = selectedId ? getSchemaTemplate(selectedId) : undefined;
  const draftTemplate = draftId ? getSchemaTemplate(draftId) : undefined;
  const snapshot = useMemo(() => draftTemplate?.build(), [draftTemplate]);
  const zones = snapshot?.nodes.filter((node) => node.type === "zone").map((node) => String(node.data.label ?? "Zone")) ?? [];
  const componentLabels = snapshot?.nodes.filter((node) => node.type !== "zone").slice(0, 6).map((node) => String(node.data.label ?? "Composant")) ?? [];
  const visibleGroups = activeGroup === "all" ? groups : groups.filter((group) => group.id === activeGroup);
  const visibleTemplates = visibleGroups.flatMap((group) => group.templates);

  function openPicker() {
    setDraftId(selectedId);
    setOpen(true);
  }

  function confirm() {
    setSelectedId(draftId);
    setOpen(false);
  }

  return (
    <div className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
      Pré-remplissage
      <input type="hidden" name="templateId" value={selectedId} />
      <button
        type="button"
        onClick={openPicker}
        className="flex h-10 min-w-[14rem] items-center justify-between gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none hover:border-neutral-500 focus:border-brand-400"
      >
        <span className="truncate">{selectedTemplate?.label ?? "Aucun (schéma vide)"}</span>
        <span className="shrink-0 text-neutral-500" aria-hidden="true">▾</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-template-picker-title" onMouseDown={() => setOpen(false)}>
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-2xl normal-case tracking-normal" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-start justify-between gap-4 border-b border-neutral-800 px-5 py-4">
              <div>
                <h2 id="admin-template-picker-title" className="text-lg font-semibold">Choisir un modèle de départ</h2>
                <p className="mt-0.5 text-sm text-neutral-400">Le schéma sera créé déjà rempli avec le modèle sélectionné.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-xl leading-none text-neutral-400 hover:bg-neutral-800 hover:text-white" aria-label="Fermer">×</button>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
              <aside className="min-h-0 border-b border-neutral-800 lg:border-b-0 lg:border-r">
                <div className="flex flex-wrap gap-1 border-b border-neutral-800 p-3">
                  <button type="button" onClick={() => setActiveGroup("all")} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeGroup === "all" ? "bg-brand-400 text-neutral-950" : "border border-neutral-700 bg-neutral-950 text-neutral-200"}`}>Tous</button>
                  {groups.map((group) => (
                    <button key={group.id} type="button" onClick={() => setActiveGroup(group.id)} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeGroup === group.id ? "bg-brand-400 text-neutral-950" : "border border-neutral-700 bg-neutral-950 text-neutral-200"}`}>{group.label}</button>
                  ))}
                </div>
                <div className="max-h-[50vh] space-y-2 overflow-y-auto p-3">
                  <button type="button" onClick={() => setDraftId("")} className={`w-full rounded-xl border p-3 text-left transition-colors ${draftId === "" ? "border-amber-500 ring-2 ring-amber-400/40" : "border-neutral-700 bg-neutral-950 hover:border-neutral-500"}`}>
                    <span className="block text-sm font-semibold">Aucun (schéma vide)</span>
                    <span className="mt-1 block text-xs leading-relaxed text-neutral-400">Un canevas vide, à construire depuis l&apos;éditeur.</span>
                  </button>
                  {visibleTemplates.map((template) => {
                    const selected = template.id === draftId;
                    return (
                      <button key={template.id} type="button" onClick={() => setDraftId(template.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${selected ? "border-amber-500 ring-2 ring-amber-400/40" : "border-neutral-700 bg-neutral-950 hover:border-neutral-500"}`}>
                        <span className="block text-sm font-semibold">{template.label}</span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-neutral-400">{template.description}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <main className="min-h-0 overflow-y-auto p-5">
                {snapshot && draftTemplate ? (
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_15rem]">
                    <section>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Aperçu du modèle</p>
                          <h3 className="mt-1 text-xl font-semibold">{draftTemplate.label}</h3>
                        </div>
                        <span className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs font-semibold text-neutral-300">{snapshot.nodes.filter((node) => node.type !== "zone").length} composants · {snapshot.edges.length} liaisons</span>
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">{draftTemplate.description}</p>
                      <div className="mt-5"><TemplateDiagramPreview nodes={snapshot.nodes} edges={snapshot.edges} darkMode /></div>
                    </section>
                    <aside className="rounded-xl border border-neutral-700 bg-neutral-950 p-4">
                      <h4 className="text-sm font-semibold">Ce que contient ce modèle</h4>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Zones</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">{zones.length > 0 ? zones.slice(0, 8).map((zone) => <span key={zone} className="rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-300">{zone}</span>) : <span className="text-xs text-neutral-400">Organisation libre</span>}</div>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Équipements principaux</p>
                      <ul className="mt-2 space-y-1.5 text-xs text-neutral-400">{componentLabels.map((label) => <li key={label}>• {label}</li>)}</ul>
                    </aside>
                  </div>
                ) : (
                  <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-950 text-center">
                    <span className="text-5xl">✎</span>
                    <h3 className="mt-4 text-xl font-semibold">Schéma vierge</h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-400">Le client (ou vous) construira l&apos;installation depuis zéro dans l&apos;éditeur.</p>
                  </div>
                )}
              </main>
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-800 px-5 py-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800">Annuler</button>
              <button type="button" onClick={confirm} className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-brand-300">{draftTemplate ? "Utiliser ce modèle" : "Créer un schéma vierge"}</button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
