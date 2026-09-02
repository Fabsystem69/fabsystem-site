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
import { VersionHistoryDialog } from "./VersionHistoryDialog";
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
    <header className={`relative z-50 flex shrink-0 flex-col border-b ${darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"}`}>
      {/* Rangée 1 : identité + onglets + statut d'enregistrement */}
      <div className={`flex h-10 items-center gap-3 border-b px-4 max-md:h-14 max-md:gap-2 max-md:overflow-hidden max-md:px-3 ${darkMode ? "border-neutral-800" : "border-neutral-100"}`}>
        <Link
          href="/outils"
          className={`text-sm font-medium transition-base max-md:flex max-md:h-10 max-md:w-9 max-md:items-center max-md:justify-center max-md:text-xl ${darkMode ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"}`}
        >
          <span aria-hidden="true">←</span><span className="max-md:sr-only"> Outils</span>
        </Link>
        <span className={`max-md:hidden ${darkMode ? "text-neutral-700" : "text-neutral-300"}`}>|</span>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className={`min-w-0 rounded-md border border-transparent bg-transparent px-2 py-0.5 text-sm font-medium focus:outline-none max-md:flex-1 max-md:text-center max-md:text-base ${
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

        <span className={`ml-auto max-w-[13rem] text-right text-xs max-md:hidden ${saveToneClass}`} title={saveMessage}>
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [exportPreviewKind, setExportPreviewKind] = useState<"png" | "pdf" | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [openSchemaDialogOpen, setOpenSchemaDialogOpen] = useState(false);
  const [systemBuilder, setSystemBuilder] = useState<"solar" | "battery" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const setIconStyle = useSchemaStore((s) => s.setIconStyle);
  const setDarkMode = useSchemaStore((s) => s.setDarkMode);
  const showComponentLabels = useSchemaStore((s) => s.showComponentLabels);
  const setShowComponentLabels = useSchemaStore((s) => s.setShowComponentLabels);
  const showCableLabels = useSchemaStore((s) => s.showCableLabels);
  const setShowCableLabels = useSchemaStore((s) => s.setShowCableLabels);
  const projectName = useSchemaStore((s) => s.projectName);
  const projectId = useSchemaStore((s) => s.projectId);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/schema-unlock/status")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (!cancelled) setAdminMode(Boolean(data?.isAdmin)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const recalculateAllCableSections = useSchemaStore((s) => s.recalculateAllCableSections);
  const recalculateAllFuseRatings = useSchemaStore((s) => s.recalculateAllFuseRatings);
  const optimizeBusbarLayouts = useSchemaStore((s) => s.optimizeBusbarLayouts);
  const openInstallAssistant = useSchemaStore((s) => s.openInstallAssistant);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getNodes, getEdges } = useReactFlow();

  useEffect(() => {
    if (!openMenu && !accountOpen && !mobileActionsOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
        setAccountOpen(false);
        setMobileActionsOpen(false);
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setAccountOpen(false);
        setMobileActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [accountOpen, mobileActionsOpen, openMenu]);

  const menuButtonClass = (active: boolean) =>
    `flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-base max-md:h-10 max-md:px-2 max-md:text-xs ${
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

  function openMobileSave() {
    setMobileActionsOpen(false);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("[data-schema-header-save]")?.click());
  }

  return (
    <>
    <button type="button" onClick={() => setMobileActionsOpen(true)} className={`ml-auto hidden h-10 w-10 items-center justify-center rounded-full text-2xl font-bold max-md:flex ${darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-slate-700 hover:bg-slate-100"}`} aria-label="Ouvrir les actions">⋮</button>
    <nav ref={menuRef} className="ml-3 flex flex-1 items-center gap-1 border-l pl-3 dark:border-neutral-800 border-neutral-200 max-md:hidden" aria-label="Menu de l'éditeur">
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
            <MenubarItem darkMode={darkMode} icon={<MenubarIcon name="properties" />} title="Libellés des câbles" detail={showCableLabels ? "Nom, section et longueur affichés" : "Affichés seulement sur le câble sélectionné"} active={showCableLabels} onClick={() => { setShowCableLabels(!showCableLabels); setOpenMenu(null); }} />
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
      {projectId ? <button type="button" onClick={() => setHistoryOpen(true)} className="ml-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Historique</button> : null}
      <button type="button" onClick={() => setShareOpen(true)} className="ml-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600">Partager</button>
      <div className="relative ml-1 max-md:hidden">
        <button
          type="button"
          aria-expanded={accountOpen}
          aria-label="Ouvrir le menu du compte"
          onClick={() => setAccountOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-sm font-semibold text-amber-700 transition-base hover:bg-amber-100"
        >
          FL
        </button>
        {accountOpen ? (
          <div className={`absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border shadow-[0_16px_36px_rgba(15,23,42,0.18)] ${darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-slate-200 bg-white text-slate-900"}`}>
            <div className={`border-b px-5 py-4 ${darkMode ? "border-neutral-800" : "border-slate-100"}`}>
              <p className="text-lg font-semibold">{adminMode ? "Administration" : "Mon compte"}</p>
              <p className={`mt-1 text-sm ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>{adminMode ? "Préparez et accompagnez les projets clients." : "Gérez vos projets et vos préférences."}</p>
              <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${darkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-100 text-slate-600"}`}>{adminMode ? "Mode administration" : "Éditeur gratuit"}</span>
            </div>
            <div className="p-2">
              <Link href={adminMode ? "/dashboard" : "/mon-compte/profil"} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-base ${darkMode ? "hover:bg-neutral-800" : "hover:bg-slate-50"}`}><span aria-hidden="true">⚙</span> {adminMode ? "Retour au dashboard" : "Paramètres du compte"}</Link>
              <Link href={adminMode ? "/dashboard/customers" : "/mon-compte/projets"} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-base ${darkMode ? "hover:bg-neutral-800" : "hover:bg-slate-50"}`}><span aria-hidden="true">▣</span> {adminMode ? "Projets clients" : "Mes projets"}</Link>
              <button type="button" onClick={() => { setAccountOpen(false); select("aide"); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-base ${darkMode ? "hover:bg-neutral-800" : "hover:bg-slate-50"}`}><span aria-hidden="true">✦</span> Nouveautés et aide</button>
              <a href="mailto:contact@fabsystem.fr?subject=Retour%20%C3%A9diteur%20de%20sch%C3%A9ma" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-base ${darkMode ? "hover:bg-neutral-800" : "hover:bg-slate-50"}`}><span aria-hidden="true">✉</span> Contacter le support</a>
            </div>
            <div className={`border-t p-2 ${darkMode ? "border-neutral-800" : "border-slate-100"}`}>
              <form action={adminMode ? "/api/auth/logout" : "/api/client-auth/logout"} method="post"><button type="submit" className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-base ${darkMode ? "hover:bg-neutral-800" : "hover:bg-slate-50"}`}><span aria-hidden="true">⇥</span> Se déconnecter</button></form>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
    {mobileActionsOpen ? <MobileActionsSheet darkMode={darkMode} onClose={() => setMobileActionsOpen(false)} onNew={() => { setTemplatePickerOpen(true); setMobileActionsOpen(false); }} onOpen={() => { setOpenSchemaDialogOpen(true); setMobileActionsOpen(false); }} onSave={openMobileSave} onShare={() => { setShareOpen(true); setMobileActionsOpen(false); }} onExportPng={() => { setExportPreviewKind("png"); setMobileActionsOpen(false); }} onExportPdf={() => { setExportPreviewKind("pdf"); setMobileActionsOpen(false); }} onCableSizing={() => { runCableRecalculation(); setMobileActionsOpen(false); }} onProtectionSizing={() => { runProtectionRecalculation(); setMobileActionsOpen(false); }} onSolarBuilder={() => { setSystemBuilder("solar"); setMobileActionsOpen(false); }} onBatteryBuilder={() => { setSystemBuilder("battery"); setMobileActionsOpen(false); }} /> : null}
    {exportPreviewKind ? <ExportPreviewDialog initialKind={exportPreviewKind} initialShowGrid={showGrid} onClose={() => setExportPreviewKind(null)} /> : null}
    {templatePickerOpen ? <TemplatePickerDialog onClose={() => setTemplatePickerOpen(false)} /> : null}
    {openSchemaDialogOpen ? <OpenSchemaDialog onClose={() => setOpenSchemaDialogOpen(false)} onNew={() => { setOpenSchemaDialogOpen(false); setTemplatePickerOpen(true); }} onTemplates={() => { setOpenSchemaDialogOpen(false); setTemplatePickerOpen(true); }} /> : null}
    {systemBuilder ? <SystemBuilderDialog kind={systemBuilder} onClose={() => setSystemBuilder(null)} /> : null}
    {shareOpen ? <ShareSchemaDialog projectId={projectId} projectName={projectName} onClose={() => setShareOpen(false)} /> : null}
    {historyOpen && projectId ? <VersionHistoryDialog projectId={projectId} onClose={() => setHistoryOpen(false)} onRestored={() => window.location.reload()} /> : null}
    </>
  );
}

function MobileActionsSheet({ darkMode, onClose, onNew, onOpen, onSave, onShare, onExportPng, onExportPdf, onCableSizing, onProtectionSizing, onSolarBuilder, onBatteryBuilder }: { darkMode: boolean; onClose: () => void; onNew: () => void; onOpen: () => void; onSave: () => void; onShare: () => void; onExportPng: () => void; onExportPdf: () => void; onCableSizing: () => void; onProtectionSizing: () => void; onSolarBuilder: () => void; onBatteryBuilder: () => void }) {
  const itemClass = `flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-base font-semibold transition-base ${darkMode ? "text-neutral-100 hover:bg-neutral-800" : "text-slate-800 hover:bg-slate-50"}`;
  const headingClass = `px-4 pt-5 text-[11px] font-bold uppercase tracking-[0.24em] ${darkMode ? "text-neutral-400" : "text-slate-500"}`;
  return <div className="schema-mobile-actions-backdrop fixed inset-0 z-[80] hidden items-end bg-slate-950/65 max-md:flex" role="dialog" aria-modal="true" aria-label="Actions du schéma" onMouseDown={onClose}>
    <section className={`schema-mobile-actions-sheet max-h-[calc(100dvh-3rem)] w-full overflow-y-auto rounded-t-[1.75rem] border-t shadow-2xl ${darkMode ? "border-neutral-700 bg-neutral-950" : "border-slate-200 bg-white"}`} onMouseDown={(event) => event.stopPropagation()}>
      <div className={`sticky top-0 z-10 border-b px-5 pb-4 pt-3 ${darkMode ? "border-neutral-800 bg-neutral-950" : "border-slate-200 bg-white"}`}><div className={`mx-auto mb-4 h-1.5 w-20 rounded-full ${darkMode ? "bg-neutral-800" : "bg-slate-100"}`} /><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Actions</h2><button type="button" onClick={onClose} className={`rounded-full px-3 py-1 text-2xl ${darkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-slate-500 hover:bg-slate-100"}`} aria-label="Fermer">×</button></div></div>
      <p className={headingClass}>Fichier</p><div className="px-2"><button type="button" onClick={onNew} className={itemClass}><span>▧</span>Nouveau schéma</button><button type="button" onClick={onSave} className={itemClass}><span>▣</span>Sauvegarder</button><button type="button" onClick={onOpen} className={itemClass}><span>▱</span>Ouvrir mes schémas</button><button type="button" onClick={onShare} className={itemClass}><span>⌘</span>Partager</button></div>
      <p className={headingClass}>Outils</p><div className="px-2"><button type="button" onClick={onCableSizing} className={itemClass}><span>⌁</span>Recalculer les sections</button><button type="button" onClick={onProtectionSizing} className={itemClass}><span>▣</span>Recalculer les protections</button><button type="button" onClick={onSolarBuilder} className={itemClass}><span>☀</span>Créer un champ solaire</button><button type="button" onClick={onBatteryBuilder} className={itemClass}><span>▰</span>Créer un parc batteries</button></div>
      <p className={headingClass}>Export</p><div className="px-2"><button type="button" onClick={onExportPng} className={itemClass}><span>▧</span>Exporter en PNG</button><button type="button" onClick={onExportPdf} className={itemClass}><span>▤</span>Imprimer en PDF</button></div>
      <p className={headingClass}>Compte</p><div className="px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]"><a href="/mon-compte/profil" className={itemClass}><span>⚙</span>Paramètres du compte</a><form action="/api/client-auth/logout" method="post"><button type="submit" className={itemClass}><span>⇥</span>Se déconnecter</button></form></div>
    </section>
  </div>;
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
