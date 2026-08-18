"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { loadDraft, saveDraft, type DraftEnvelope } from "@/features/schemas/storage/localDraftStorage";
import {
  fetchProjectSchema,
  saveProjectSchemaApi,
} from "@/features/schemas/projectSchemaApi";
import { captureSchemaThumbnail } from "@/features/schemas/export";
import { getSchemaTemplate } from "@/features/schemas/templates";
import {
  buildCloudAssistant,
  buildCloudStatusMessage,
  buildLocalDraftAssistant,
} from "@/lib/schema-editor/save-assistant";
import { Toolbar } from "./Toolbar";
import { ComponentLibrary } from "./ComponentLibrary";
import { Canvas } from "./Canvas";
import { ItemPropertiesPopup } from "./ItemPropertiesPopup";
import { EditorStartPicker } from "./EditorStartPicker";
import { ModelPickerModal } from "./ModelPickerModal";
import { FreemiumLimitModal } from "./FreemiumLimitModal";
import { CoachingOfferWidget } from "./CoachingOfferWidget";
import { SaveAssistantBanner } from "./SaveAssistantBanner";
import { SizingPopup } from "./SizingPopup";
import { GuidedTutorial } from "./GuidedTutorial";
import { SchemaIssuesWidget } from "./SchemaIssuesWidget";

const AUTOSAVE_DELAY_MS = 700;

function buildBlankSchema() {
  return { projectName: "Nouveau schéma", nodes: [], edges: [] };
}

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
  const setSaveAssistant = useSchemaStore((s) => s.setSaveAssistant);
  const projectId = useSchemaStore((s) => s.projectId);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const startGuidedMode = useSchemaStore((s) => s.startGuidedMode);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get("projectId");
  const urlTemplateId = searchParams.get("template");
  const urlTemplate = urlTemplateId ? getSchemaTemplate(urlTemplateId) : null;

  // Écran de démarrage guidé (V2, retour utilisateur : "le choix des
  // gabarits n'est pas ergonomique, il faut être guidé à l'ouverture") —
  // `pendingDraft` reste `undefined` tant qu'on n'a pas vérifié le
  // brouillon local ; une fois résolu (`null` = aucun brouillon, ou
  // l'enveloppe trouvée), l'écran EditorStartPicker s'affiche à la place du
  // "Chargement…" tant que l'utilisateur n'a pas choisi comment démarrer.
  const [pendingDraft, setPendingDraft] = useState<DraftEnvelope | null | undefined>(undefined);

  // Ouverture depuis une fiche projet (retour utilisateur : "il manque
  // enregistrer lié au compte client") — /outils/schema?projectId=xxx charge
  // le schéma déjà sauvegardé pour ce projet s'il existe, au lieu du
  // brouillon local. En dehors de ce cas, l'outil reste utilisable sans
  // compte (CDC : "Gratuit, sans compte"), comportement inchangé — sauf que
  // le brouillon local n'est plus repris silencieusement : voir
  // EditorStartPicker.
  useEffect(() => {
    let cancelled = false;

    async function bootEditor() {
      if (urlProjectId) {
        const remote = await fetchProjectSchema(urlProjectId);
        if (cancelled) return;

        if (remote.ok) {
          setProjectId(urlProjectId);
          hydrate(remote.schema ?? buildBlankSchema());
          setSaveAssistant(null);
          setSaveStatus("saved", {
            scope: "cloud",
            message: remote.schema ? "Projet cloud chargé" : "Projet cloud prêt",
          });
          return;
        }

        hydrate(buildBlankSchema());
        setProjectId(null);
        setPendingDraft(null);
        setSaveStatus("saved", {
          scope: "local",
          message: "Mode local actif",
        });
        setSaveAssistant(buildCloudAssistant(remote.problem, "open"));
        return;
      }

      setProjectId(null);
      setSaveAssistant(null);

      if (urlTemplate) {
        hydrate(urlTemplate.build());
        setPendingDraft(null);
        setSaveStatus("saved", {
          scope: "local",
          message: "Gabarit chargé",
        });
        return;
      }

      setPendingDraft(loadDraft());
    }

    void bootEditor();
    return () => {
      cancelled = true;
    };
  }, [hydrate, setProjectId, setSaveAssistant, setSaveStatus, urlProjectId, urlTemplate]);

  function handleChooseContinue() {
    if (!pendingDraft) return;
    setProjectId(null);
    setSaveAssistant(null);
    hydrate({ projectName: pendingDraft.projectName, nodes: pendingDraft.nodes, edges: pendingDraft.edges });
  }

  function handleChooseTemplate(id: string) {
    const template = getSchemaTemplate(id);
    if (!template) return;
    setProjectId(null);
    setSaveAssistant(null);
    hydrate(template.build());
  }

  function handleChooseBlank() {
    setProjectId(null);
    setSaveAssistant(null);
    hydrate({ projectName: "Nouveau schéma", nodes: [], edges: [] });
  }

  function handleChooseGuided() {
    setProjectId(null);
    setSaveAssistant(null);
    startGuidedMode();
  }

  useEffect(() => {
    if (!hydrated) return;
    const targetScope = projectId ? "cloud" : "local";
    setSaveStatus("saving", { scope: targetScope });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (projectId) {
        // Miniature régénérée à chaque sauvegarde liée à un projet (affichée
        // sur la carte projet du dashboard) — jamais côté brouillon local
        // seul, pas besoin d'une miniature qu'on ne montre nulle part.
        const thumbnail = await captureSchemaThumbnail(nodes).catch(() => null);
        const result = await saveProjectSchemaApi(projectId, { projectName, nodes, edges, thumbnail });
        if (result.ok) {
          setSaveAssistant(null);
          setSaveStatus("saved", { scope: "cloud", message: "Cloud enregistré" });
          return;
        }
        setSaveStatus("error", {
          scope: "cloud",
          message: buildCloudStatusMessage(result.problem, "save"),
        });
        setSaveAssistant(buildCloudAssistant(result.problem, "save"));
        return;
      }

      const localOk = saveDraft({ projectName, nodes, edges });
      if (!localOk) {
        setSaveStatus("error", {
          scope: "local",
          message: "Brouillon local indisponible",
        });
        setSaveAssistant(buildLocalDraftAssistant());
        return;
      }

      setSaveStatus("saved", { scope: "local", message: "Brouillon local enregistré" });
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName, nodes, edges, hydrated, projectId]);

  // Confirmation avant de fermer l'onglet/quitter le site (retour
  // utilisateur : "demande une validation de fermer la page si la personne
  // quitte le site ou ferme la page") — filet de sécurité en plus de la
  // sauvegarde automatique locale : celle-ci a un léger différé
  // (AUTOSAVE_DELAY_MS), et sur un schéma lié à un projet, la sauvegarde
  // distante peut échouer (hors-ligne, session expirée) sans que ce soit
  // visible avant de quitter. Les navigateurs ignorent le texte personnalisé
  // et affichent leur propre message générique — `preventDefault` +
  // `returnValue` restent la façon standard de déclencher cette boîte de
  // dialogue.
  useEffect(() => {
    if (!hydrated || nodes.length === 0) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hydrated, nodes.length]);

  const darkMode = useSchemaStore((s) => s.darkMode);

  // Ne dépend pas de darkMode : ce state (localStorage) diffère entre le
  // rendu serveur et le premier rendu client, ce qui casse l'hydratation si
  // on l'utilise avant que l'effet de montage n'ait tourné. `mounted`
  // remplace l'ancien gate sur `hydrated` seul — nécessaire maintenant que
  // l'éditeur (dépendant de darkMode) doit pouvoir s'afficher en fond
  // derrière le popup EditorStartPicker, pas seulement une fois hydraté.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex h-screen items-center justify-center text-sm text-neutral-400">Chargement…</div>;
  }

  // Popup par-dessus l'éditeur (V2, retour utilisateur : "je le voudrais en
  // pop up et avoir l'éditeur derrière") plutôt qu'un écran qui remplace
  // toute la page — l'éditeur en fond montre un canvas vide (état initial du
  // store), cohérent avec ce qu'on va afficher une fois le choix fait.
  const showStartPicker = !urlProjectId && !urlTemplate && !hydrated && pendingDraft !== undefined;

  if (!hydrated && urlProjectId) {
    return <div className="flex h-screen items-center justify-center text-sm text-neutral-400">Chargement…</div>;
  }

  return (
    <ReactFlowProvider>
      <div className={`flex h-screen flex-col ${darkMode ? "bg-neutral-950" : "bg-white"}`}>
        <Toolbar />
        <SaveAssistantBanner />
        <div className="flex min-h-0 flex-1">
          <ComponentLibrary />
          <Canvas />
        </div>
      </div>
      <EditorShortcuts />
      {showStartPicker ? (
        <EditorStartPicker
          draft={pendingDraft ?? null}
          darkMode={darkMode}
          onChooseContinue={handleChooseContinue}
          onChooseTemplate={handleChooseTemplate}
          onChooseBlank={handleChooseBlank}
          onChooseGuided={handleChooseGuided}
        />
      ) : null}
      <ModelPickerModal />
      <FreemiumLimitModal />
      <SizingPopup />
      <GuidedTutorial />
      <SchemaIssuesWidget />
      <ItemPropertiesPopup />
      <CoachingOfferWidget />
    </ReactFlowProvider>
  );
}
