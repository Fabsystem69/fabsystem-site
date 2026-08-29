"use client";

import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { computeSchemaIssues, type SchemaIssueAction, type SchemaIssueSeverity } from "@/lib/electrical-components/checks";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { VoltaAvatar } from "@/components/volta/VoltaAvatar";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";

// Retour utilisateur : "les info-bulles À vérifier je veux vraiment qu'elle
// soit visible... c'est un vrai plus de l'application qui n'est pas mis en
// avant". Remplace l'ancien panneau "À vérifier" enfoui dans PropertiesPanel
// (visible seulement quand rien n'est sélectionné, donc disparaissait dès
// qu'on cliquait un composant) — Volta en bulle flottante bas-droite,
// toujours visible quel que soit l'état de sélection, avec un compteur.
export function SchemaIssuesWidget() {
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const select = useSchemaStore((s) => s.select);
  const highlightIssueTarget = useSchemaStore((s) => s.highlightIssueTarget);
  const recalculateAllCableSections = useSchemaStore((s) => s.recalculateAllCableSections);
  const recalculateAllFuseRatings = useSchemaStore((s) => s.recalculateAllFuseRatings);
  const projectName = useSchemaStore((s) => s.projectName);
  const hiddenCategories = useSchemaStore((s) => s.hiddenCategories);
  const { getNode, setCenter, getZoom } = useReactFlow();
  const [open, setOpen] = useState(false);

  const issues = computeSchemaIssues(nodes, edges);
  const issueCounts = issues.reduce(
    (counts, issue) => {
      counts[issue.severity ?? "warning"] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 } as Record<SchemaIssueSeverity, number>,
  );

  // v2.1 : infos projet du bandeau de droite supprimé, regroupées ici plutôt
  // que dans la barre d'outils — un seul point d'entrée "informations" avec
  // Volta, au lieu de disperser compteurs/vigilance à deux endroits.
  const visibleNodes =
    hiddenCategories.length === 0
      ? nodes
      : nodes.filter((n) => {
          const def = getComponentDefinition(n.data.componentType);
          return !def || !hiddenCategories.includes(def.category);
        });
  const isFiltered = visibleNodes.length !== nodes.length;
  const visibleEdges = isFiltered
    ? (() => {
        const visibleIds = new Set(visibleNodes.map((n) => n.id));
        return edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
      })()
    : edges;
  useEscapeToClose(() => setOpen(false));

  function focusTarget(targetKind: "node" | "edge", targetId: string) {
    select(targetKind, targetId);
    highlightIssueTarget(targetKind, targetId);

    // Met réellement l'élément "en évidence" (retour utilisateur) : pas
    // seulement sélectionné dans les données, mais recentré/zoomé à
    // l'écran — sinon un composant hors champ reste invisible malgré la
    // sélection.
    if (targetKind === "node") {
      const node = getNode(targetId);
      if (node) {
        const x = node.position.x + (node.measured?.width ?? node.width ?? 60) / 2;
        const y = node.position.y + (node.measured?.height ?? node.height ?? 60) / 2;
        setCenter(x, y, { zoom: Math.max(getZoom(), 1), duration: 400 });
      }
      return;
    }

    const edge = edges.find((e) => e.id === targetId);
    if (!edge) return;
    const sourceNode = getNode(edge.source);
    const targetNode = getNode(edge.target);
    if (!sourceNode || !targetNode) return;
    const x = (sourceNode.position.x + targetNode.position.x) / 2 + 30;
    const y = (sourceNode.position.y + targetNode.position.y) / 2 + 30;
    setCenter(x, y, { zoom: Math.max(getZoom(), 1), duration: 400 });
  }

  function handleIssueAction(action: SchemaIssueAction) {
    if (action === "recalculate-all-cable-sections") recalculateAllCableSections();
  }

  // Déplacé depuis le menu Fichier (retour utilisateur) — ces recalculs en
  // masse concernent la vérification du schéma, leur place naturelle est
  // donc ici plutôt que dans un menu de gestion de fichier.
  function handleRecalculateSections() {
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

  function getIssueActionLabel(action: SchemaIssueAction): string {
    if (action === "recalculate-all-cable-sections") return "Recalculer les sections";
    return "Appliquer";
  }

  function issueTone(severity: SchemaIssueSeverity | undefined) {
    if (severity === "error") {
      return darkMode ? "border-red-900 bg-red-950 text-red-300" : "border-red-200 bg-red-50 text-red-800";
    }
    if (severity === "info") {
      return darkMode ? "border-sky-900 bg-sky-950 text-sky-300" : "border-sky-200 bg-sky-50 text-sky-800";
    }
    return darkMode ? "border-amber-900 bg-amber-950 text-amber-400" : "border-amber-200 bg-amber-50 text-amber-800";
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div
          className={`pointer-events-auto w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border shadow-2xl ${
            darkMode ? "border-neutral-700 bg-neutral-900" : "border-neutral-200 bg-white"
          }`}
        >
          <div className={`flex items-center justify-between gap-2 border-b px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-100"}`}>
            <p className={`text-sm font-semibold ${darkMode ? "text-neutral-100" : "text-neutral-950"}`}>
              {issues.length === 0 ? "Rien à signaler" : `À vérifier (${issues.length})`}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`rounded-md p-1 text-xs ${darkMode ? "text-neutral-500 hover:bg-neutral-800" : "text-neutral-400 hover:bg-neutral-100"}`}
              title="Fermer"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {issues.length > 0 ? (
            <div className={`flex gap-2 border-b px-4 py-2 text-[11px] font-medium ${darkMode ? "border-neutral-800" : "border-neutral-100"}`}>
              {issueCounts.error > 0 ? <span className={darkMode ? "text-red-300" : "text-red-700"}>{issueCounts.error} erreur{issueCounts.error > 1 ? "s" : ""}</span> : null}
              {issueCounts.warning > 0 ? <span className={darkMode ? "text-amber-300" : "text-amber-700"}>{issueCounts.warning} avertissement{issueCounts.warning > 1 ? "s" : ""}</span> : null}
              {issueCounts.info > 0 ? <span className={darkMode ? "text-sky-300" : "text-sky-700"}>{issueCounts.info} information{issueCounts.info > 1 ? "s" : ""}</span> : null}
            </div>
          ) : null}

          <div className={`space-y-1 border-b px-4 py-3 text-xs ${darkMode ? "border-neutral-800 text-neutral-400" : "border-neutral-100 text-neutral-600"}`}>
            <p className={`font-medium ${darkMode ? "text-neutral-200" : "text-neutral-900"}`}>{projectName}</p>
            <p>
              {isFiltered ? `${visibleNodes.length}/${nodes.length}` : nodes.length} composant{nodes.length > 1 ? "s" : ""}
              {isFiltered ? " affichés" : ""} · {isFiltered ? `${visibleEdges.length}/${edges.length}` : edges.length} câble
              {edges.length > 1 ? "s" : ""}
              {isFiltered ? " affichés" : ""}
            </p>
            {isFiltered ? (
              <p className={darkMode ? "text-amber-400" : "text-amber-600"}>Filtre actif — l&apos;export ne prendra que ce qui est affiché.</p>
            ) : null}
          </div>

          <div className={`flex gap-1.5 border-b p-2 ${darkMode ? "border-neutral-800" : "border-neutral-100"}`}>
            <button
              type="button"
              onClick={handleRecalculateSections}
              disabled={nodes.length === 0}
              className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-base disabled:opacity-40 ${
                darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              }`}
              title="Recalcule en une fois la section de tous les câbles de puissance dont la charge en aval est estimable"
            >
              Sections câble
            </button>
            <button
              type="button"
              onClick={handleRecalculateFuses}
              disabled={nodes.length === 0}
              className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-base disabled:opacity-40 ${
                darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              }`}
              title="Recalcule en une fois le calibre de tous les fusibles/disjoncteurs dont le courant en aval est estimable"
            >
              Calibres fusible
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3">
            {issues.length === 0 ? (
              <p className={`px-1 py-2 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                Aucun point de vigilance détecté pour l&apos;instant — continuez comme ça !
              </p>
            ) : (
              <div className="space-y-1.5">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`rounded-md border px-2.5 py-1.5 text-left text-xs ${issueTone(issue.severity)}`}
                  >
                    <button
                      type="button"
                      onClick={() => focusTarget(issue.targetKind, issue.targetId)}
                      className={`block w-full text-left ${darkMode ? "hover:text-amber-300" : "hover:text-amber-900"}`}
                    >
                      {issue.message}
                    </button>
                    {issue.action ? (
                      <button
                        type="button"
                        onClick={() => handleIssueAction(issue.action!)}
                        className={`mt-2 rounded-md border px-2 py-1 text-[11px] font-semibold transition-base ${
                          darkMode ? "border-amber-700 text-amber-200 hover:bg-amber-900" : "border-amber-300 text-amber-900 hover:bg-amber-100"
                        }`}
                      >
                        {getIssueActionLabel(issue.action)}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`pointer-events-auto relative flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 shadow-lg transition-base ${
          darkMode
            ? "border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
            : "border-neutral-200 bg-white hover:bg-neutral-50"
        }`}
      >
        <span className="relative shrink-0">
          <VoltaAvatar pose={issues.length > 0 ? "perplexe" : "confiante"} size={40} />
          {issues.length > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
              {issues.length}
            </span>
          ) : null}
        </span>
        <span className={`text-xs font-semibold ${darkMode ? "text-neutral-200" : "text-neutral-800"}`}>
          {issues.length === 0 ? "Rien à signaler" : "À vérifier"}
        </span>
      </button>
    </div>
  );
}
