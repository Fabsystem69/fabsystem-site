"use client";

import { useEffect, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { calcSection, fusibleRecommande, AVAILABLE_FUSES_A } from "@/lib/calc/section-cable";
import { estimateEdgeAmps, estimateConnectedAmps, evaluateEdgeSection, findBatteryVoltage } from "@/lib/electrical-components/auto-size";
import { getEdgeDefaultLength } from "@/lib/electrical-components/cable-lengths";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";

// Popup de dimensionnement à la connexion (V2, retour utilisateur : "pour
// l'ajout de fusible ou câble, je veux la section et ampérage... automatique
// quand celui est connecté et ouvre le pop up pour modifier les longueurs
// si pas nominal et intensité, et explique le calcul pour un débutant dans
// un petit déroulant") — se déclenche seul depuis `onConnect` (voir
// useSchemaStore `pendingSizingTarget`), réutilise le même moteur que la
// suggestion existante du panneau propriétés (SectionSuggestion/
// FuseSuggestion), jamais imposé : "Ignorer" ferme sans rien appliquer.
export function SizingPopup() {
  const target = useSchemaStore((s) => s.pendingSizingTarget);

  if (target?.kind === "cable") return <CableSizingPopup edgeId={target.edgeId} />;
  if (target?.kind === "fuse") return <FuseSizingPopup nodeId={target.nodeId} />;
  return null;
}

// Composants de premier niveau (pas imbriqués dans SizingPopup) : chacun
// lit le store lui-même plutôt que de recevoir nodes/edges en closure —
// évite qu'un re-rendu du parent (ex. store modifié ailleurs pendant que la
// popup est ouverte) ne redéfinisse leur identité de composant et ne les
// remonte, ce qui perdrait la saisie en cours dans les champs.
function CableSizingPopup({ edgeId }: { edgeId: string }) {
  const edges = useSchemaStore((s) => s.edges);
  const nodes = useSchemaStore((s) => s.nodes);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);
  const dismissSizingPopup = useSchemaStore((s) => s.dismissSizingPopup);
  useEscapeToClose(dismissSizingPopup);
  const edge = edges.find((e) => e.id === edgeId);

  const [amps, setAmps] = useState("");
  const [length, setLength] = useState("");
  const [tension, setTension] = useState("12");
  const [explainOpen, setExplainOpen] = useState(false);

  useEffect(() => {
    if (!edge) return;
    const diagnostic = evaluateEdgeSection(edge, nodes, edges);
    const estimated = diagnostic?.amps ?? estimateEdgeAmps(edge, nodes, edges);
    setAmps(estimated !== null ? String(Math.round(estimated * 10) / 10) : "");
    const sourceType = nodes.find((n) => n.id === edge.source)?.data.componentType;
    const targetType = nodes.find((n) => n.id === edge.target)?.data.componentType;
    setLength(String(edge.data?.length ?? getEdgeDefaultLength(sourceType, targetType, edge.data?.section ?? "", edge.data?.cableType) ?? 4));
    setTension(String(findBatteryVoltage(nodes)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeId]);

  if (!edge) return null;

  const i = parseFloat(amps) || 0;
  const l = parseFloat(length) || 0;
  const v = parseFloat(tension) || 12;
  const result = i > 0 && l > 0 ? calcSection(i, l, 3, v) : null;

  function handleApply() {
    if (!result) return;
    updateEdgeData(edgeId, { section: `${String(result.section).replace(".", ",")} mm²`, length: l });
    dismissSizingPopup();
  }

  return (
    <SizingPopupShell darkMode={darkMode} onDismiss={dismissSizingPopup} eyebrow="Câble connecté" title="Section de câble suggérée">
      <SizingFields>
        <SizingField darkMode={darkMode} label="Intensité (A)" value={amps} onChange={setAmps} />
        <SizingField darkMode={darkMode} label="Longueur aller (m)" value={length} onChange={setLength} />
        <label className="block">
          <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Tension (V)</span>
          <select
            value={tension}
            onChange={(e) => setTension(e.target.value)}
            className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none ${
              darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-neutral-300 bg-white text-neutral-900"
            }`}
          >
            <option value="12">12 V</option>
            <option value="24">24 V</option>
            <option value="48">48 V</option>
          </select>
        </label>
      </SizingFields>

      {result ? (
        <div className={`mt-4 rounded-lg border p-3 ${darkMode ? "border-brand-800 bg-brand-950" : "border-brand-300 bg-brand-50"}`}>
          <p className={`text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Section minimale : {result.sMin} mm²</p>
          <p className={`text-2xl font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>{result.section} mm² recommandé</p>
          <p className={`mt-1 text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
            Calculé sur {(l * 2).toLocaleString("fr-FR")} m électriques (aller-retour compris) — la longueur enregistrée reste vos {l.toLocaleString("fr-FR")} m aller.
          </p>
        </div>
      ) : (
        <p className={`mt-4 text-sm ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Renseignez l&apos;intensité et la longueur.</p>
      )}

      <ExplainDetails darkMode={darkMode} open={explainOpen} onToggle={() => setExplainOpen((v2) => !v2)} summary="Comment ce calcul est fait ?">
        Plus un câble est long et parcouru par un courant fort, plus il faut une section épaisse pour éviter que la
        tension ne « chute » en route (l&apos;énergie se perd en chaleur dans le fil). On calcule la section minimale
        pour rester sous <strong>3 % de chute de tension</strong> (la limite habituelle), avec la résistivité du
        cuivre, puis on arrondit à la section normalisée immédiatement supérieure — jamais une valeur non
        commercialisée.
      </ExplainDetails>

      <SizingActions darkMode={darkMode} onApply={handleApply} onDismiss={dismissSizingPopup} applyLabel="Appliquer cette section" applyDisabled={!result} />
    </SizingPopupShell>
  );
}

function FuseSizingPopup({ nodeId }: { nodeId: string }) {
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const dismissSizingPopup = useSchemaStore((s) => s.dismissSizingPopup);
  useEscapeToClose(dismissSizingPopup);
  const node = nodes.find((n) => n.id === nodeId);

  const [amps, setAmps] = useState("");
  const [explainOpen, setExplainOpen] = useState(false);

  useEffect(() => {
    const estimated = estimateConnectedAmps(nodeId, nodes, edges);
    setAmps(estimated !== null ? String(Math.round(estimated * 10) / 10) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  if (!node) return null;
  const def = getComponentDefinition(node.data.componentType);
  const i = parseFloat(amps) || 0;
  const rating = i > 0 ? AVAILABLE_FUSES_A.find((f) => f >= i * 1.25) : undefined;

  function handleApply() {
    if (!rating) return;
    updateNodeData(nodeId, { amperage: rating });
    dismissSizingPopup();
  }

  return (
    <SizingPopupShell darkMode={darkMode} onDismiss={dismissSizingPopup} eyebrow={`${def?.label ?? "Protection"} connecté`} title="Calibre suggéré">
      <SizingFields>
        <SizingField darkMode={darkMode} label="Intensité du circuit (A)" value={amps} onChange={setAmps} />
      </SizingFields>

      {rating ? (
        <div className={`mt-4 rounded-lg border p-3 ${darkMode ? "border-brand-800 bg-brand-950" : "border-brand-300 bg-brand-50"}`}>
          <p className={`text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>{fusibleRecommande(i)} avec marge de 25 %</p>
          <p className={`text-2xl font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>{rating} A recommandé</p>
        </div>
      ) : (
        <p className={`mt-4 text-sm ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Renseignez l&apos;intensité du circuit.</p>
      )}

      <ExplainDetails darkMode={darkMode} open={explainOpen} onToggle={() => setExplainOpen((v) => !v)} summary="Comment ce calcul est fait ?">
        Un fusible doit couper le courant avant que le câble ne chauffe dangereusement, mais pas se déclencher pour
        rien pendant un usage normal. On part du courant réellement appelé par ce que ce composant protège, on
        ajoute une <strong>marge de sécurité de 25 %</strong>, puis on arrondit au calibre commercial immédiatement
        supérieur — jamais une valeur non standard.
      </ExplainDetails>

      <SizingActions darkMode={darkMode} onApply={handleApply} onDismiss={dismissSizingPopup} applyLabel="Appliquer ce calibre" applyDisabled={!rating} />
    </SizingPopupShell>
  );
}

function SizingPopupShell({
  darkMode,
  onDismiss,
  eyebrow,
  title,
  children,
}: {
  darkMode: boolean;
  onDismiss: () => void;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onDismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${darkMode ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white"}`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{eyebrow}</p>
        <h2 className={`mt-1 text-xl font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function SizingFields({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 grid grid-cols-2 gap-3">{children}</div>;
}

function SizingField({ darkMode, label, value, onChange }: { darkMode: boolean; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className={`mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none ${
          darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100" : "border-neutral-300 bg-white text-neutral-900"
        }`}
      />
    </label>
  );
}

function ExplainDetails({
  darkMode,
  open,
  onToggle,
  summary,
  children,
}: {
  darkMode: boolean;
  open: boolean;
  onToggle: () => void;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mt-3 rounded-lg border ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold ${
          darkMode ? "text-neutral-300" : "text-neutral-700"
        }`}
      >
        {summary}
        <span className={darkMode ? "text-neutral-500" : "text-neutral-400"}>{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <p className={`border-t px-3 py-2.5 text-xs leading-relaxed ${darkMode ? "border-neutral-800 text-neutral-400" : "border-neutral-200 text-neutral-600"}`}>
          {children}
        </p>
      ) : null}
    </div>
  );
}

function SizingActions({
  darkMode,
  onApply,
  onDismiss,
  applyLabel,
  applyDisabled,
}: {
  darkMode: boolean;
  onApply: () => void;
  onDismiss: () => void;
  applyLabel: string;
  applyDisabled: boolean;
}) {
  return (
    <div className="mt-5 flex gap-2">
      <button
        type="button"
        onClick={onDismiss}
        className={`flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-semibold transition-base ${
          darkMode ? "border-neutral-700 text-neutral-400 hover:bg-neutral-900" : "border-neutral-300 text-neutral-500 hover:bg-neutral-50"
        }`}
      >
        Ignorer
      </button>
      <button
        type="button"
        onClick={onApply}
        disabled={applyDisabled}
        className="flex-1 rounded-lg bg-brand-400 px-4 py-2.5 text-center text-sm font-bold text-neutral-900 transition-base hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {applyLabel}
      </button>
    </div>
  );
}
