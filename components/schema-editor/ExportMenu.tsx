"use client";

import { useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { useGuidedStep } from "@/lib/schema-editor/useGuidedStep";
import { downloadPortableSchemaFile, readPortableSchemaFile } from "@/features/schemas/file-transfer";
import {
  captureSchemaSvg,
  captureSchemaCarousel,
  downloadDataUrl,
  downloadCarouselZip,
  openPrintableBom,
  slugify,
} from "@/features/schemas/export";
import { computeBom } from "@/lib/electrical-components/bom";
import { RibbonButton, RibbonDivider, RibbonGroup } from "./RibbonControls";
import { ExportPreviewDialog } from "./ExportPreviewDialog";

// Export PNG / PDF / liste de matériel (CDC §36-40) : capture uniquement le
// canvas, jamais une capture d'écran de l'éditeur avec ses boutons.
// Retour utilisateur : "Accueil est parfait mais les autres ouvrent un CTA
// qui ouvre un ruban ou autre" — chaque format d'export est son propre
// bouton direct.
// Retour utilisateur : "fichier doit être fusionné dans accueil et un autre
// partie dans export qui change de nom et devient enregistrer/imprimer" —
// cet onglet (renommé "Enregistrer / Imprimer" dans Ribbon.tsx) absorbe
// aussi le fichier local (.fabschema) et la sauvegarde (voir SaveMenu),
// ex-FileMenu.tsx, dont le reste (Nouveau/Gabarits/Icônes/Filtrer) a migré
// dans l'onglet Accueil.
// Retour utilisateur : "onglet Options doit se trouver dans Accueil avec les
// autres réglages d'affichage" puis "le bouton Options ne peut être
// supprimé et doit être juste un switch Grille" — `showGrid` est désormais
// réglé depuis Ribbon.tsx > AccueilGroup (levé au niveau du ruban pour
// survivre à un changement d'onglet) et simplement CONSOMMÉ ici en lecture
// seule. Le périmètre par zone (isoler l'export/impression à une zone) a
// été retiré à la demande explicite de l'utilisateur plutôt que déplacé
// ailleurs — export/impression portent toujours sur tout le schéma.
export function ExportMenu({ darkMode, showGrid }: { darkMode: boolean; showGrid: boolean }) {
  const [busy, setBusy] = useState(false);
  const [exportPreviewKind, setExportPreviewKind] = useState<"png" | "pdf" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileFeedback, setFileFeedback] = useState<string | null>(null);
  const { getNodes, getEdges } = useReactFlow();
  const projectName = useSchemaStore((s) => s.projectName);
  const nodesCount = useSchemaStore((s) => s.nodes.length);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const hydrate = useSchemaStore((s) => s.hydrate);
  const setProjectId = useSchemaStore((s) => s.setProjectId);
  const setSaveStatus = useSchemaStore((s) => s.setSaveStatus);
  const setSaveAssistant = useSchemaStore((s) => s.setSaveAssistant);
  // Mode guidé (retour utilisateur : "montre à la fin le mode jour nuit et
  // le pdf") — mis en avant à la toute dernière étape.
  const guided = useGuidedStep();
  const spotlight = guided.active && guided.step.id === "outro";

  async function handleExportSvg() {
    setBusy(true);
    try {
      const capture = await captureSchemaSvg(getNodes());
      if (capture) downloadDataUrl(capture.dataUrl, `${slugify(projectName)}.svg`);
    } finally {
      setBusy(false);
    }
  }

  function handleExportBom() {
    const bom = computeBom(getNodes(), getEdges());
    openPrintableBom(bom, projectName);
  }

  // Carrousel (retour utilisateur : un schéma dense posté en une seule image
  // de fil d'actualité reste illisible même en haute résolution) — 1 vue
  // d'ensemble + 3 zooms par tiers, regroupés dans une seule archive zip
  // (retour utilisateur : plus simple qu'un téléchargement par image).
  async function handleExportCarousel() {
    setBusy(true);
    try {
      const parts = await captureSchemaCarousel(getNodes(), getEdges(), projectName, showGrid);
      if (parts) await downloadCarouselZip(parts, projectName);
    } finally {
      setBusy(false);
    }
  }

  function syncProjectInUrl(id: string | null) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("projectId", id);
    else url.searchParams.delete("projectId");
    window.history.replaceState(null, "", url.toString());
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
  }

  const disabled = nodesCount === 0 || busy;

  return (
    <div className="flex items-center gap-1">
      <RibbonGroup darkMode={darkMode} label="Enregistrer">
        <RibbonButton
          darkMode={darkMode}
          onClick={handleExportFile}
          disabled={nodesCount === 0}
          icon="⬇️"
          label="Télécharger"
          title="Télécharge une copie complète du schéma dans un fichier .fabschema"
        />
        <RibbonButton
          darkMode={darkMode}
          onClick={handleOpenImport}
          icon="⬆️"
          label="Importer"
          title="Remplace le schéma courant par un fichier .fabschema exporté plus tôt"
        />
        <input ref={fileInputRef} type="file" accept=".fabschema,application/json" className="hidden" onChange={handleImportFile} />
      </RibbonGroup>
      {fileFeedback ? <p className={`max-w-[10rem] text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>{fileFeedback}</p> : null}

      <RibbonDivider darkMode={darkMode} />

      <RibbonGroup darkMode={darkMode} label="Imprimer">
        <RibbonButton
          darkMode={darkMode}
          onClick={() => setExportPreviewKind("png")}
          disabled={disabled}
          icon="🖼️"
          label="PNG"
          title={nodesCount === 0 ? "Ajoutez au moins un composant pour exporter" : "Prévisualiser une image PNG"}
          active={spotlight}
        />
        <RibbonButton
          darkMode={darkMode}
          onClick={() => setExportPreviewKind("pdf")}
          disabled={disabled}
          icon="🖨️"
          label="PDF"
          title="Prévisualiser avant impression"
        />
        <RibbonButton
          darkMode={darkMode}
          onClick={handleExportSvg}
          disabled={disabled}
          icon="✏️"
          label={busy ? "…" : "SVG"}
          title="Sans filigrane ni cartouche — s'ouvre correctement dans un navigateur ; le support est variable dans les logiciels vectoriels (le contenu est encapsulé, pas de tracés éditables un par un)"
        />
        <RibbonButton
          darkMode={darkMode}
          onClick={handleExportCarousel}
          disabled={disabled}
          icon="🔍"
          label={busy ? "…" : "Par zone"}
          title="Impression par zone — 1 vue d'ensemble + 3 zooms par tiers, pour une impression détaillée ou un post en carrousel (réseaux sociaux)"
        />
      </RibbonGroup>

      <RibbonDivider darkMode={darkMode} />

      <RibbonGroup darkMode={darkMode} label="Matériel">
        <RibbonButton darkMode={darkMode} onClick={handleExportBom} disabled={disabled} icon="📋" label="Matériel" title="Liste de matériel" />
      </RibbonGroup>
      {exportPreviewKind ? <ExportPreviewDialog initialKind={exportPreviewKind} initialShowGrid={showGrid} onClose={() => setExportPreviewKind(null)} /> : null}
    </div>
  );
}
