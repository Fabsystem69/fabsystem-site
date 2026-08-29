"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { ExportMenu } from "./ExportMenu";
import { FeedbackMenu } from "./FeedbackMenu";
import { SaveMenu } from "./SaveMenu";
import { AddComponentMenu } from "./AddComponentMenu";
import { CalculatorMenu } from "./CalculatorMenu";
import { PropertiesTab } from "./PropertiesTab";
import { DarkModeToggle } from "./DisplayMenu";
import { MenubarHeading, MenubarIcon, MenubarItem, MenubarPanel, MenubarSection, RibbonButton, RibbonDivider, RibbonGroup, RibbonPanel } from "./RibbonControls";
import { getSchemaTemplatesByVehicleGroup } from "@/features/schemas/templates";
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

      {/* Rangée 2 : groupe d'actions de l'onglet actif */}
      <div className="flex h-14 items-center gap-2 px-4">
        {activeTab === "accueil" ? <AccueilGroup darkMode={darkMode} showGrid={showGrid} setShowGrid={setShowGrid} /> : null}
        {activeTab === "ajouter" ? <AjouterGroup darkMode={darkMode} /> : null}
        {activeTab === "export" ? <ExportGroup darkMode={darkMode} showGrid={showGrid} /> : null}
        {activeTab === "aide" ? <AideGroup darkMode={darkMode} /> : null}
        {activeTab === "proprietes" ? <PropertiesTab darkMode={darkMode} /> : null}
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
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const setIconStyle = useSchemaStore((s) => s.setIconStyle);
  const setDarkMode = useSchemaStore((s) => s.setDarkMode);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <nav ref={menuRef} className="ml-3 flex items-center gap-1 border-l pl-3 dark:border-neutral-800 border-neutral-200" aria-label="Menu de l'éditeur">
      <div className="relative">
        <button type="button" aria-expanded={openMenu === "file"} onClick={() => setOpenMenu((menu) => (menu === "file" ? null : "file"))} className={menuButtonClass(openMenu === "file")}>
          Fichier <MenubarIcon name="chevron" className="h-4 w-4" />
        </button>
        {openMenu === "file" ? (
          <MenubarPanel darkMode={darkMode}>
            <MenubarHeading darkMode={darkMode}>Projet</MenubarHeading>
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="new" />} title="Nouveau schéma" detail="Partir d'un canevas vide" shortcut="⌘N" onClick={() => { onNewProject(); setOpenMenu(null); }} />
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="folder" />} title="Choisir un modèle" detail="Ouvrir un schéma de départ" shortcut="⌘O" onClick={() => select("accueil")} />
            <MenubarSection darkMode={darkMode}>
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="save" />} title="Enregistrer" detail="Brouillon local et sauvegarde" shortcut="⌘S" onClick={() => select("export")} />
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="export" />} title="Exporter ou imprimer" detail="PDF, PNG ou fichier du schéma" onClick={() => select("export")} />
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
            <MenubarHeading darkMode={darkMode}>Édition</MenubarHeading>
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="components" />} title="Ajouter un composant" detail="Équipements, protections et consommateurs" onClick={() => select("ajouter")} />
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="layout" />} title="Organisation et modèles" detail="Gabarits, zones et présentation" onClick={() => select("accueil")} />
            {hasSelection ? <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="properties" />} title="Propriétés de la sélection" detail="Modifier l'élément sélectionné" onClick={() => select("proprietes")} /> : null}
            <MenubarSection darkMode={darkMode}>
              <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="help" />} title="Aide et retours" detail="Raccourcis, assistance et signalement" onClick={() => select("aide")} />
            </MenubarSection>
          </MenubarPanel>
        ) : null}
      </div>

      <CalculatorMenu darkMode={darkMode} variant="menubar" />
    </nav>
  );
}

function AccueilGroup({
  darkMode,
  showGrid,
  setShowGrid,
}: {
  darkMode: boolean;
  showGrid: boolean;
  setShowGrid: (value: boolean) => void;
}) {
  const templateGroups = getSchemaTemplatesByVehicleGroup();
  const nodesCount = useSchemaStore((s) => s.nodes.filter((node) => node.type !== "zone").length);
  const openInstallAssistant = useSchemaStore((s) => s.openInstallAssistant);
  const newProject = useSchemaStore((s) => s.newProject);
  const loadTemplate = useSchemaStore((s) => s.loadTemplate);
  const past = useSchemaStore((s) => s.past);
  const future = useSchemaStore((s) => s.future);
  const undo = useSchemaStore((s) => s.undo);
  const redo = useSchemaStore((s) => s.redo);
  const applyGuidedPlanLayout = useSchemaStore((s) => s.applyGuidedPlanLayout);
  const guidedPlanMode = useSchemaStore((s) => s.guidedPlanMode);
  const setGuidedPlanMode = useSchemaStore((s) => s.setGuidedPlanMode);
  const nodeCount = useSchemaStore((s) => s.nodes.filter((n) => n.type !== "zone").length);
  const darkModeValue = useSchemaStore((s) => s.darkMode);
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const setIconStyle = useSchemaStore((s) => s.setIconStyle);
  const nodesForFilter = useSchemaStore((s) => s.nodes);
  const hiddenCategories = useSchemaStore((s) => s.hiddenCategories);
  const toggleCategoryVisibility = useSchemaStore((s) => s.toggleCategoryVisibility);
  const showAllCategories = useSchemaStore((s) => s.showAllCategories);

  const [activePanel, setActivePanel] = useState<"gabarits" | "filtrer" | null>(null);
  const panelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePanel) return;
    function handleClickOutside(event: MouseEvent) {
      if (panelsRef.current && !panelsRef.current.contains(event.target as Node)) setActivePanel(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activePanel]);

  function togglePanel(panel: "gabarits" | "filtrer") {
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

  function handleNewProject() {
    if (nodesCount > 0 && !window.confirm("Repartir d'un schéma vierge ? Le schéma actuel restera sauvegardé jusqu'à la prochaine modification.")) {
      return;
    }
    newProject();
  }

  function handleLoadTemplate(id: string, label: string) {
    if (nodesCount > 0 && !window.confirm(`Charger « ${label} » à la place du schéma actuel ? Le schéma actuel restera sauvegardé jusqu'à la prochaine modification.`)) {
      return;
    }
    loadTemplate(id);
    setActivePanel(null);
  }

  return (
    // display:contents : invisible pour la mise en page (les enfants
    // restent des flex items directs de la rangée 2 du ruban), juste un
    // point d'ancrage DOM unique pour panelsRef — sans ça, la détection de
    // clic extérieur ne couvrait que le panneau Gabarits et fermait Filtrer/
    // Options dès qu'on cliquait DEDANS (bug réel trouvé en ajoutant Options
    // ici).
    <div className="contents" ref={panelsRef}>
      {/* Retour utilisateur : "un module débutant guidé genre chat box où
          il dit ce qu'il veut... tu viens rajouter les panneaux dans un
          autre zone" — voir InstallAssistant.tsx. Groupe séparé et placé en
          premier : c'est le point d'entrée pensé pour un débutant qui ne
          sait pas par où commencer. */}
      <RibbonGroup darkMode={darkMode} label="Assistant">
        <RibbonButton darkMode={darkMode} onClick={openInstallAssistant} icon="💬" label="Débutant" title="Assistant guidé pour ajouter un équipement à ton schéma" />
        {/* Retour utilisateur : "un menu outils/calculateur et ça ouvre en
            popup l'outil sélectionné" — voir CalculatorMenu.tsx. */}
        <CalculatorMenu darkMode={darkMode} />
      </RibbonGroup>

      <RibbonDivider darkMode={darkMode} />

      <RibbonGroup darkMode={darkMode} label="Fichier">
        <RibbonButton darkMode={darkMode} onClick={handleNewProject} icon="📄" label="Nouveau" title="Nouveau schéma vierge" />
        <SaveMenu darkMode={darkMode} />
        <div className="relative">
          <RibbonButton
            darkMode={darkMode}
            onClick={() => togglePanel("gabarits")}
            active={activePanel === "gabarits"}
            icon="🗂️"
            label="Modèles"
            title="Charger un modèle de départ"
          />
          {activePanel === "gabarits" ? (
            <RibbonPanel darkMode={darkMode}>
              {templateGroups.map((group) => (
                <div key={group.id} className="py-1">
                  <p className={`px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{group.label}</p>
                  {group.templates.map((template) => (
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
              ))}
            </RibbonPanel>
          ) : null}
        </div>
      </RibbonGroup>

      <RibbonDivider darkMode={darkMode} />

      <RibbonGroup darkMode={darkMode} label="Annuler">
        <RibbonButton darkMode={darkMode} onClick={undo} disabled={past.length === 0} icon="↶" label="Annuler" title="Annuler (Ctrl/Cmd+Z)" />
        <RibbonButton darkMode={darkMode} onClick={redo} disabled={future.length === 0} icon="↷" label="Rétablir" title="Rétablir (Ctrl/Cmd+Shift+Z)" />
      </RibbonGroup>

      <RibbonDivider darkMode={darkMode} />

      <RibbonGroup darkMode={darkMode} label="Organisation">
        <RibbonButton
          darkMode={darkMode}
          onClick={applyGuidedPlanLayout}
          disabled={nodeCount === 0}
          icon="▦"
          label="Plan guidé"
          title="Réorganise selon le tableau de câblage A2 (Ctrl/Cmd+Z pour annuler)"
        />
        <RibbonButton
          darkMode={darkMode}
          onClick={() => setGuidedPlanMode(!guidedPlanMode)}
          icon={guidedPlanMode ? "▣" : "□"}
          label={guidedPlanMode ? "Guidé" : "Libre"}
          title={guidedPlanMode ? "Passer en plan libre : les prochains clics ne seront plus suggérés dans une zone" : "Activer les suggestions de placement par zone"}
        />
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

      <RibbonDivider darkMode={darkMode} />

      <RibbonGroup darkMode={darkMode} label="Affichage">
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => setIconStyle(iconStyle === "pro" ? "simple" : "pro")}
            title={iconStyle === "pro" ? "Passer aux icônes symboles" : "Passer aux icônes illustrations"}
            aria-pressed={iconStyle === "pro"}
            className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-base ${
              darkMode ? "border-neutral-600 bg-neutral-700" : "border-neutral-300 bg-neutral-200"
            }`}
          >
            <span className="sr-only">{iconStyle === "pro" ? "Passer aux icônes symboles" : "Passer aux icônes illustrations"}</span>
            <span className="flex w-full items-center justify-between px-1.5 text-[9px] font-semibold leading-none">
              <span className={iconStyle === "pro" ? "opacity-30" : "opacity-90"}>Sym</span>
              <span className={iconStyle === "pro" ? "opacity-90" : "opacity-30"}>Illu</span>
            </span>
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-base ${
                iconStyle === "pro" ? "translate-x-[1.625rem]" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className={`text-[10px] font-medium leading-tight ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>Icônes</span>
        </div>
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <DarkModeToggle darkMode={darkModeValue} />
          <span className={`text-[10px] font-medium leading-tight ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>Jour/Nuit</span>
        </div>
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="Inclure la grille dans les exports/impressions"
            aria-pressed={showGrid}
            className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-base ${
              showGrid ? (darkMode ? "border-brand-500 bg-brand-600" : "border-brand-400 bg-brand-400") : darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-300 bg-neutral-200"
            }`}
          >
            <span className="sr-only">{showGrid ? "Masquer la grille (exports/impressions)" : "Inclure la grille (exports/impressions)"}</span>
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full shadow-sm transition-base ${
                showGrid ? "translate-x-[1.625rem] bg-white" : "translate-x-0.5 bg-white"
              }`}
            />
          </button>
          <span className={`text-[10px] font-medium leading-tight ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>Grille</span>
        </div>
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
