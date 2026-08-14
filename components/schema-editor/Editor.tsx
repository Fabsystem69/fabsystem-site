"use client";

import { useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { loadDraft, saveDraft } from "@/features/schemas/storage/localDraftStorage";
import { Toolbar } from "./Toolbar";
import { ComponentLibrary } from "./ComponentLibrary";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";

const AUTOSAVE_DELAY_MS = 700;

function EditorShortcuts() {
  const undo = useSchemaStore((s) => s.undo);
  const redo = useSchemaStore((s) => s.redo);
  const duplicateNode = useSchemaStore((s) => s.duplicateNode);
  const rotateNode = useSchemaStore((s) => s.rotateNode);
  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const select = useSchemaStore((s) => s.select);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditingField = target?.tagName === "INPUT" || target?.tagName === "SELECT" || target?.tagName === "TEXTAREA";
      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (!isEditingField && meta && event.key.toLowerCase() === "d") {
        if (selectedNodeId) {
          event.preventDefault();
          duplicateNode(selectedNodeId);
        }
        return;
      }
      if (!isEditingField && !meta && event.key.toLowerCase() === "r") {
        if (selectedNodeId) {
          event.preventDefault();
          rotateNode(selectedNodeId);
        }
        return;
      }
      if (!isEditingField && event.key === "Escape") {
        select(null, null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, duplicateNode, rotateNode, selectedNodeId, select]);

  return null;
}

// Composition (CDC §6, architecture indicative §44) : 4 zones desktop —
// toolbar, bibliothèque, canvas, propriétés — plus sauvegarde automatique
// locale avec debounce (§34) sur un unique brouillon pour cette ébauche.
export function Editor() {
  const projectName = useSchemaStore((s) => s.projectName);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const hydrated = useSchemaStore((s) => s.hydrated);
  const hydrate = useSchemaStore((s) => s.hydrate);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    hydrate(
      draft
        ? { projectName: draft.projectName, nodes: draft.nodes, edges: draft.edges }
        : { projectName: "Nouveau schéma", nodes: [], edges: [] },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDraft({ projectName, nodes, edges });
      setSaveStatus("saved");
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName, nodes, edges, hydrated]);

  const darkMode = useSchemaStore((s) => s.darkMode);

  // Ne dépend pas de darkMode : ce state (localStorage) diffère entre le
  // rendu serveur et le premier rendu client, ce qui casse l'hydratation si
  // on l'utilise avant que l'effet de montage n'ait tourné.
  if (!hydrated) {
    return <div className="flex h-screen items-center justify-center text-sm text-neutral-400">Chargement…</div>;
  }

  return (
    <ReactFlowProvider>
      <div className={`flex h-screen flex-col ${darkMode ? "bg-neutral-950" : "bg-white"}`}>
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <ComponentLibrary />
          <Canvas />
          <PropertiesPanel />
        </div>
      </div>
      <EditorShortcuts />
    </ReactFlowProvider>
  );
}
