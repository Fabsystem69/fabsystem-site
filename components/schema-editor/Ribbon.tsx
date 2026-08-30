"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { downloadPortableSchemaFile } from "@/features/schemas/file-transfer";
import { openPrintableBom } from "@/features/schemas/export";
import { computeBom } from "@/lib/electrical-components/bom";
import { ExportMenu } from "./ExportMenu";
import { FeedbackMenu } from "./FeedbackMenu";
import { SaveMenu } from "./SaveMenu";
import { AddComponentMenu } from "./AddComponentMenu";
import { CalculatorMenu } from "./CalculatorMenu";
import { ExportPreviewDialog } from "./ExportPreviewDialog";
import { OpenSchemaDialog } from "./OpenSchemaDialog";
import { TemplatePickerDialog } from "./TemplatePickerDialog";
import { SystemBuilderDialog } from "./SystemBuilderDialog";
import { ShareSchemaDialog } from "./ShareSchemaDialog";
import { SchemaIssuesWidget } from "./SchemaIssuesWidget";
import { PropertiesTab } from "./PropertiesTab";
import { MenubarHeading, MenubarIcon, MenubarItem, MenubarPanel, MenubarSection, RibbonButton, RibbonDivider, RibbonGroup, RibbonPanel } from "./RibbonControls";
import { getComponentDefinition, CATEGORY_LABELS } from "@/lib/electrical-components/definitions";

// Bandeau type ruban (retour utilisateur : "chargé sans avoir beaucoup de
// fonction... réfléchir à un bandeau type Word/Excel avec des boutons
// graphiques assez simples et des menus déroulants") — remplace l'ancien
// Toolbar (une seule rangée avec tout visible en même temps) par deux
// rangées : une barre d'onglets, puis seulement le groupe d'actions de
// l'onglet actif.
//
// Retour utilisateur : "fichier doit être fusionné dans accueil et un autre
// partie dans export qui change de nom et devient enregistrer/imprimer" —
// l'ex-onglet "Fichier" (ex-FileMenu.tsx) a disparu : Nouveau/Gabarits/
// Icônes/Filtrer ont migré dans Accueil, Fichier local (.fabschema) et
// Sauvegarde (ex-"Cloud", voir SaveMenu.tsx) dans Export — renommé
// "Enregistrer / Imprimer" — avec Sauvegarder dupliqué dans Accueil aussi
// (retour utilisateur explicite : "mets-le aussi dans l'accueil").
// Retour utilisateur : "intègre le bandeau droit propriété avec les mêmes
// fonctions mais dans le bandeau supérieur, toujours même principe, c'est
// pour l'autre reste réduit" — nouvel onglet "proprietes", CONTEXTUEL :
// n'apparaît dans la barre d'onglets que quand un élément est sélectionné
// (voir `visibleTabs` plus bas), et le ruban bascule dessus automatiquement
// dès qu'on passe de "rien sélectionné" à "quelque chose sélectionné" (même
// principe que les onglets contextuels "Format" de Word/Excel). Remplace
// l'ancien popup plein écran ItemPropertiesPopup (voir PropertiesTab.tsx).
type RibbonTab = "accueil" | "ajouter" | "export" | "aide" | "proprietes";

const BASE_TABS: { id: RibbonTab; label: string }[] = [
  { id: "accueil", label: "Accueil" },
  { id: "ajouter", label: "Composants" },
  { id: "export", label: "Enregistrer / Imprimer" },
  { id: "aide", label: "Aide" },
];

export function Ribbon() {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const projectName = useSchemaStore((s) => s.projectName);
  const setProjectName = useSchemaStore((s) => s.setProjectName);
  const saveStatus = useSchemaStore((s) => s.saveStatus);
  const saveMessage = useSchemaStore((s) => s.saveMessage);
  const [activeTab, setActiveTab] = useState<RibbonTab>("accueil");
  // Retour utilisateur : "onglet Options doit se trouver dans Accueil avec
  // les autres réglages d'affichage" puis "le bouton Options ne peut être
  // supprimé et doit être juste un switch Grille" — plus de panneau du
  // tout : un simple interrupteur, comme jour/nuit. Le périmètre par zone
  // (isoler l'export/impression à une zone) a été retiré à la demande de
  // l'utilisateur plutôt que déplacé ailleurs — export/impression portent
  // maintenant toujours sur tout le schéma.
  // `showGrid` vit dans le store (retour utilisateur : "le bouton Grille ne
  // fait pas apparaître/disparaître la grille, elle y est toujours sur le
  // canvas" — un état local au ruban ne pouvait pas piloter Canvas.tsx,
  // composant frère non descendant).
  const showGrid = useSchemaStore((s) => s.showGrid);
  const setShowGrid = useSchemaStore((s) => s.setShowGrid);

  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const hasSelection = selectedNodeId !== null || selectedEdgeId !== null;
  const hadSelectionRef = useRef(false);

  // Bascule automatique sur l'onglet contextuel "Propriétés" au moment où
  // une sélection apparaît (front montant "rien" → "quelque chose"), jamais
  // en reprenant un autre item déjà sélectionné pendant qu'on est sur un
  // autre onglet — respecte le choix d'onglet en cours de l'utilisateur.
  useEffect(() => {
    if (hasSelection && !hadSelectionRef.current) setActiveTab("proprietes");
    if (!hasSelection && activeTab === "proprietes") setActiveTab("accueil");
    hadSelectionRef.current = hasSelection;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSelection]);

  const visibleTabs = hasSelection
    ? [...BASE_TABS.slice(0, 1), { id: "proprietes" as const, label: "Propriétés" }, ...BASE_TABS.slice(1)]
    : BASE_TABS;

  const saveToneClass =
    saveStatus === "error"
      ? darkMode
        ? "text-amber-300"
        : "text-amber-700"
      : saveStatus === "saving"
        ? darkMode
          ? "text-sky-300"
          : "text-sky-700"
        : darkMode
          ? "text-emerald-300"
          : "text-emerald-700";

  return (
    <header className={`flex shrink-0 flex-col border-b ${darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"}`}>
      {/* Rangée 1 : identité + onglets + statut d'enregistrement */}
      <div className={`flex h-10 items-center gap-3 border-b px-4 ${darkMode ? "border-neutral-800" : "border-neutral-100"}`}>
        <Link
          href="/outils"
          className={`text-sm font-medium transition-base ${darkMode ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"}`}
        >
          ← Outils
        </Link>
        <span className={darkMode ? "text-neutral-700" : "text-neutral-300"}>|</span>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className={`rounded-md border border-transparent bg-transparent px-2 py-0.5 text-sm font-medium focus:outline-none ${
            darkMode
              ? "text-neutral-100 hover:border-neutral-700 focus:border-neutral-400"
              : "text-neutral-800 hover:border-neutral-200 focus:border-neutral-900"
          }`}
          aria-label="Nom du schéma"
        />
        <SaveMenu darkMode={darkMode} variant="header" />

        <EditorMenuBar
          darkMode={darkMode}
          hasSelection={hasSelection}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onSelectTab={setActiveTab}
          onNewProject={() => {
            if (useSchemaStore.getState().nodes.some((node) => node.type !== "zone") && !window.confirm("Repartir d'un schéma vierge ? Le brouillon actuel restera sauvegardé localement jusqu'à la prochaine modification.")) return;
            useSchemaStore.getState().newProject();
            setActiveTab("accueil");
          }}
        />

        <span className={`ml-auto max-w-[13rem] text-right text-xs ${saveToneClass}`} title={saveMessage}>
          {saveMessage}
        </span>
      </div>

    </header>
  );
}

function EditorMenuBar({
  darkMode,
  hasSelection,
  showGrid,
  onToggleGrid,
  onSelectTab,
  onNewProject,
}: {
  darkMode: boolean;
  hasSelection: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
  onSelectTab: (tab: RibbonTab) => void;
  onNewProject: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<"file" | "view" | "tools" | null>(null);
  const [exportPreviewKind, setExportPreviewKind] = useState<"png" | "pdf" | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [openSchemaDialogOpen, setOpenSchemaDialogOpen] = useState(false);
  const [systemBuilder, setSystemBuilder] = useState<"solar" | "battery" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const setIconStyle = useSchemaStore((s) => s.setIconStyle);
  const setDarkMode = useSchemaStore((s) => s.setDarkMode);
  const showComponentLabels = useSchemaStore((s) => s.showComponentLabels);
  const setShowComponentLabels = useSchemaStore((s) => s.setShowComponentLabels);
  const projectName = useSchemaStore((s) => s.projectName);
  const projectId = useSchemaStore((s) => s.projectId);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);
  const recalculateAllCableSections = useSchemaStore((s) => s.recalculateAllCableSections);
  const recalculateAllFuseRatings = useSchemaStore((s) => s.recalculateAllFuseRatings);
  const optimizeBusbarLayouts = useSchemaStore((s) => s.optimizeBusbarLayouts);
  const openInstallAssistant = useSchemaStore((s) => s.openInstallAssistant);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getNodes, getEdges } = useReactFlow();

  useEffect(() => {
    if (!openMenu) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [openMenu]);

  const menuButtonClass = (active: boolean) =>
    `flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-base ${
      active
        ? darkMode
          ? "bg-neutral-800 text-white"
          : "bg-neutral-100 text-neutral-950"
        : darkMode
          ? "text-neutral-300 hover:bg-neutral-800"
          : "text-neutral-700 hover:bg-neutral-100"
    }`;
  function select(tab: RibbonTab) {
    onSelectTab(tab);
    setOpenMenu(null);
  }

  function report(message: string) {
    setSaveStatus("saved", { scope: "local", message });
  }

  function exportSchemaFile() {
    if (nodes.length === 0) return;
    downloadPortableSchemaFile({ projectName, nodes, edges });
    report("Copie du schéma téléchargée");
  }

  function exportBom() {
    if (nodes.length === 0) return;
    openPrintableBom(computeBom(getNodes(), getEdges()), projectName);
    report("Liste de matériel prête à imprimer");
  }

  function runCableRecalculation() {
    const count = recalculateAllCableSections();
    report(count > 0 ? `${count} section${count > 1 ? "s" : ""} de câble recalculée${count > 1 ? "s" : ""}` : "Aucune section de câble à modifier");
    setOpenMenu(null);
  }

  function runProtectionRecalculation() {
    const count = recalculateAllFuseRatings();
    report(count > 0 ? `${count} protection${count > 1 ? "s" : ""} recalculée${count > 1 ? "s" : ""}` : "Aucune protection à modifier");
    setOpenMenu(null);
  }

  function runBusbarOptimization() {
    optimizeBusbarLayouts();
    report("Plots de busbar optimisés selon les câbles connectés");
    setOpenMenu(null);
  }

  function openOrganization() {
    setTemplatePickerOpen(true);
    setOpenMenu(null);
  }

  return (
    <>
    <nav ref={menuRef} className="ml-3 flex flex-1 items-center gap-1 border-l pl-3 dark:border-neutral-800 border-neutral-200" aria-label="Menu de l'éditeur">
      <div className="relative">
        <button type="button" aria-expanded={openMenu === "file"} onClick={() => setOpenMenu((menu) => (menu === "file" ? null : "file"))} className={menuButtonClass(openMenu === "file")}>
          Fichier <MenubarIcon name="chevron" className="h-4 w-4" />
        </button>
        {openMenu === "file" ? (
          <MenubarPanel darkMode={darkMode}>
            <MenubarHeading darkMode={darkMode}>Projet</MenubarHeading>
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="new" />} title="Nouveau schéma" detail="Choisir un modèle ou partir d'un canevas vide" shortcut="⌘N" onClick={() => { setTemplatePickerOpen(true); setOpenMenu(null); }} />
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="folder" />} title="Ouvrir un schéma" detail="Schémas sauvegardés, modèles ou import" shortcut="⌘O" onClick={() => { setOpenSchemaDialogOpen(true); setOpenMenu(null); }} />
            <MenubarSection darkMode={darkMode}>
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="save" />} title="Enregistrer" detail="Brouillon local et sauvegarde" shortcut="⌘S" onClick={() => select("export")} />
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="image" />} title="Exporter en PNG" detail="Choisir le cadrage et la qualité avant téléchargement" onClick={() => { setExportPreviewKind("png"); setOpenMenu(null); }} />
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="export" />} title="Imprimer en PDF" detail="Choisir le cadrage avant impression" onClick={() => { setExportPreviewKind("pdf"); setOpenMenu(null); }} />
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="save" />} title="Télécharger le schéma" detail="Copie complète au format .fabschema" onClick={() => { exportSchemaFile(); setOpenMenu(null); }} />
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="folder" />} title="Liste de matériel" detail="Équipements et quantités à imprimer" onClick={() => { exportBom(); setOpenMenu(null); }} />
            </MenubarSection>
            <MenubarSection darkMode={darkMode}>
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="new" />} title="Vider le canevas" detail="Repartir d'un schéma vierge après confirmation" onClick={() => { onNewProject(); setOpenMenu(null); }} />
            </MenubarSection>
          </MenubarPanel>
        ) : null}
      </div>

      <div className="relative">
        <button type="button" aria-expanded={openMenu === "view"} onClick={() => setOpenMenu((menu) => (menu === "view" ? null : "view"))} className={menuButtonClass(openMenu === "view")}>
          Vue <MenubarIcon name="chevron" className="h-4 w-4" />
        </button>
        {openMenu === "view" ? (
          <MenubarPanel darkMode={darkMode}>
            <MenubarHeading darkMode={darkMode}>Affichage du canevas</MenubarHeading>
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="components" />} title="Libellés des composants" detail={showComponentLabels ? "Noms affichés sur le schéma" : "Noms masqués sur le schéma"} active={showComponentLabels} shortcut="C" onClick={() => { setShowComponentLabels(!showComponentLabels); setOpenMenu(null); }} />
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="image" />} title="Illustrations des composants" detail={iconStyle === "pro" ? "Visuels réels activés" : "Symboles techniques activés"} active={iconStyle === "pro"} onClick={() => { setIconStyle(iconStyle === "pro" ? "simple" : "pro"); setOpenMenu(null); }} />
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="grid" />} title="Grille du canevas" detail={showGrid ? "Grille visible" : "Grille masquée"} active={showGrid} shortcut="G" onClick={() => { onToggleGrid(); setOpenMenu(null); }} />
            <MenubarSection darkMode={darkMode}>
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="theme" />} title={darkMode ? "Passer en vue jour" : "Passer en vue nuit"} detail="Changer uniquement l'affichage" onClick={() => { setDarkMode(!darkMode); setOpenMenu(null); }} />
            </MenubarSection>
          </MenubarPanel>
        ) : null}
      </div>

      <div className="relative">
        <button type="button" aria-expanded={openMenu === "tools"} onClick={() => setOpenMenu((menu) => (menu === "tools" ? null : "tools"))} className={menuButtonClass(openMenu === "tools")}>
          Outils <MenubarIcon name="chevron" className="h-4 w-4" />
        </button>
        {openMenu === "tools" ? (
          <MenubarPanel darkMode={darkMode}>
            <MenubarHeading darkMode={darkMode}>Ajout guidé</MenubarHeading>
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="components" />} title="Ajouter du solaire" detail="Assistant: panneaux, régulateur et protection" onClick={() => { openInstallAssistant(); setOpenMenu(null); }} />
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="components" />} title="Créer un champ solaire" detail="Choisir les panneaux et leur montage série ou parallèle" onClick={() => { setSystemBuilder("solar"); setOpenMenu(null); }} />
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="components" />} title="Créer un parc batteries" detail="Choisir les batteries et leur câblage série ou parallèle" onClick={() => { setSystemBuilder("battery"); setOpenMenu(null); }} />
            <MenubarSection darkMode={darkMode}>
              <MenubarHeading darkMode={darkMode}>Contrôles électriques</MenubarHeading>
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="calculator" />} title="Recalculer les sections" detail="Met à jour les câbles dont les données sont suffisantes" onClick={runCableRecalculation} />
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="calculator" />} title="Recalculer les protections" detail="Met à jour les fusibles et disjoncteurs compatibles" onClick={runProtectionRecalculation} />
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="layout" />} title="Optimiser les busbars" detail="Répartit les plots vers le côté le plus proche" onClick={runBusbarOptimization} />
            </MenubarSection>
            <MenubarSection darkMode={darkMode}>
              <MenubarHeading darkMode={darkMode}>Édition</MenubarHeading>
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="layout" />} title="Organisation et modèles" detail="Canevas structuré, zones et modèles" onClick={openOrganization} />
            {hasSelection ? <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="properties" />} title="Propriétés de la sélection" detail="Modifier l'élément sélectionné" onClick={() => select("proprietes")} /> : null}
            </MenubarSection>
            <MenubarSection darkMode={darkMode}>
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="help" />} title="Aide et retours" detail="Raccourcis, assistance et signalement" onClick={() => select("aide")} />
            </MenubarSection>
          </MenubarPanel>
        ) : null}
      </div>

      <CalculatorMenu darkMode={darkMode} variant="menubar" />
      <SchemaIssuesWidget variant="header" />
      <button type="button" onClick={() => setShareOpen(true)} className="ml-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600">Partager</button>
    </nav>
    {exportPreviewKind ? <ExportPreviewDialog initialKind={exportPreviewKind} initialShowGrid={showGrid} onClose={() => setExportPreviewKind(null)} /> : null}
    {templatePickerOpen ? <TemplatePickerDialog onClose={() => setTemplatePickerOpen(false)} /> : null}
    {openSchemaDialogOpen ? <OpenSchemaDialog onClose={() => setOpenSchemaDialogOpen(false)} onNew={() => { setOpenSchemaDialogOpen(false); setTemplatePickerOpen(true); }} onTemplates={() => { setOpenSchemaDialogOpen(false); setTemplatePickerOpen(true); }} /> : null}
    {systemBuilder ? <SystemBuilderDialog kind={systemBuilder} onClose={() => setSystemBuilder(null)} /> : null}
    {shareOpen ? <ShareSchemaDialog projectId={projectId} projectName={projectName} onClose={() => setShareOpen(false)} /> : null}
    </>
  );
}

function AccueilGroup({ darkMode }: { darkMode: boolean }) {
  const past = useSchemaStore((s) => s.past);
  const future = useSchemaStore((s) => s.future);
  const undo = useSchemaStore((s) => s.undo);
  const redo = useSchemaStore((s) => s.redo);
  const nodesForFilter = useSchemaStore((s) => s.nodes);
  const hiddenCategories = useSchemaStore((s) => s.hiddenCategories);
  const toggleCategoryVisibility = useSchemaStore((s) => s.toggleCategoryVisibility);
  const showAllCategories = useSchemaStore((s) => s.showAllCategories);

  const [activePanel, setActivePanel] = useState<"filtrer" | null>(null);
  const panelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePanel) return;
    function handleClickOutside(event: MouseEvent) {
      if (panelsRef.current && !panelsRef.current.contains(event.target as Node)) setActivePanel(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activePanel]);

  function togglePanel(panel: "filtrer") {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

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

  return (
    // display:contents : invisible pour la mise en page (les enfants
    // restent des flex items directs de la rangée 2 du ruban), juste un
    // point d'ancrage DOM unique pour panelsRef — sans ça, la détection de
    // clic extérieur ne couvrait que le panneau Gabarits et fermait Filtrer/
    // Options dès qu'on cliquait DEDANS (bug réel trouvé en ajoutant Options
    // ici).
    <div className="contents" ref={panelsRef}>
      <RibbonGroup darkMode={darkMode} label="Annuler">
        <RibbonButton darkMode={darkMode} onClick={undo} disabled={past.length === 0} icon="↶" label="Annuler" title="Annuler (Ctrl/Cmd+Z)" />
        <RibbonButton darkMode={darkMode} onClick={redo} disabled={future.length === 0} icon="↷" label="Rétablir" title="Rétablir (Ctrl/Cmd+Shift+Z)" />
      </RibbonGroup>

      <RibbonDivider darkMode={darkMode} />

      <RibbonGroup darkMode={darkMode} label="Organisation">
        {categoryCounts.length > 0 ? (
          <div className="relative">
            <RibbonButton
              darkMode={darkMode}
              onClick={() => togglePanel("filtrer")}
              active={activePanel === "filtrer" || isFiltered}
              icon="🔍"
              label={isFiltered ? `Filtrer (${categoryCounts.length - hiddenCategories.length}/${categoryCounts.length})` : "Filtrer"}
              title="Afficher seulement certaines catégories de composants — restreint aussi les exports"
            />
            {activePanel === "filtrer" ? (
              <RibbonPanel darkMode={darkMode}>
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
              </RibbonPanel>
            ) : null}
          </div>
        ) : null}
      </RibbonGroup>

    </div>
  );
}

function AjouterGroup({ darkMode }: { darkMode: boolean }) {
  return <AddComponentMenu darkMode={darkMode} />;
}

function ExportGroup({ darkMode, showGrid }: { darkMode: boolean; showGrid: boolean }) {
  return <ExportMenu darkMode={darkMode} showGrid={showGrid} />;
}

function AideGroup({ darkMode }: { darkMode: boolean }) {
  return <FeedbackMenu darkMode={darkMode} />;
}
