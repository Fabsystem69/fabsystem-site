"use client";

import { useEffect, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { getConsumerPreset } from "@/lib/electrical-components/definitions";
import { getBrandModelsForType, getBrandModel } from "@/lib/electrical-components/brand-models";
import { calcSection, fusibleRecommande } from "@/lib/calc/section-cable";
import { estimateConnectedAmps, estimateEdgeAmps, evaluateEdgeSection, findBatteryVoltage } from "@/lib/electrical-components/auto-size";
import { getEdgeDefaultLength } from "@/lib/electrical-components/cable-lengths";
import { VoltaAvatar } from "@/components/volta/VoltaAvatar";
import type { SchemaNode, SchemaEdge } from "@/features/schemas/store/useSchemaStore";

// v2.2, retour utilisateur : "intègre le bandeau droit propriété avec les
// mêmes fonctions mais dans le bandeau supérieur" — remplace le popup plein
// écran par un onglet contextuel du ruban (voir PropertiesTab.tsx +
// Ribbon.tsx). v2.3, retour utilisateur : "intégre dans le bandeau du haut
// les spécificités directement sans avoir à cliquer dessus" — le panneau
// déroulant "Spécificité" (NodePropertiesCard/EdgePropertiesCard/
// ZonePropertiesCard/CardShell) a été retiré entièrement : PropertiesTab.tsx
// affiche maintenant TOUS les champs directement dans la rangée du ruban, en
// réutilisant seulement la logique métier ci-dessous (hooks + widgets
// conseil Volta), plus aucun conteneur "carte".
export { useBrandModelSelector, useNodeFieldChange, FuseSuggestion, SectionSuggestion, FuseBlockOutputs };

// Extrait de NodePropertiesCard (retour utilisateur : "rajoute marque
// modèle juste après le nom" dans le ruban) — réutilisé tel quel par
// PropertiesTab.tsx pour éviter de dupliquer la logique de filtrage par
// technologie et de fusion avec le catalogue perso du compte. `node`
// optionnel : PropertiesTab doit pouvoir appeler ce Hook sans condition même
// quand c'est un câble/une zone qui est sélectionné (règle des Hooks —
// jamais d'appel conditionnel), donc tout est no-op tant qu'il n'y a pas de
// composant sélectionné.
function useBrandModelSelector(node: SchemaNode | undefined) {
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const customCatalogItems = useSchemaStore((s) => s.customCatalogItems);

  const componentType = node?.data.componentType;
  const selectedTechnology = componentType === "battery" ? String(node?.data.technology ?? "") : null;
  const officialBrandModels = componentType
    ? getBrandModelsForType(componentType).filter((m) => !selectedTechnology || m.defaults.technology === selectedTechnology)
    : [];
  const ownCustomItems = componentType
    ? customCatalogItems
        .filter((i) => i.componentType === componentType)
        .filter((i) => !selectedTechnology || i.defaults.technology === selectedTechnology)
    : [];
  const brandModels = [
    ...officialBrandModels,
    ...ownCustomItems.map((i) => ({ id: `custom:${i.id}`, brand: `${i.brand} (perso)`, model: i.model })),
  ];
  const brandModelsByBrand = new Map<string, typeof brandModels>();
  for (const m of brandModels) {
    const list = brandModelsByBrand.get(m.brand) ?? [];
    list.push(m);
    brandModelsByBrand.set(m.brand, list);
  }

  function handleBrandModelChange(value: string) {
    if (!node) return;
    if (!value) {
      updateNodeData(node.id, { brandModelId: "", brand: "", model: "", customItemIconDataUrl: undefined });
      return;
    }
    if (value.startsWith("custom:")) {
      const item = customCatalogItems.find((i) => `custom:${i.id}` === value);
      if (!item) return;
      updateNodeData(node.id, {
        brandModelId: value,
        brand: item.brand,
        model: item.model,
        customItemIconDataUrl: item.imageDataUrl,
        ...item.defaults,
      });
      return;
    }
    const brandModel = getBrandModel(value);
    if (!brandModel) return;
    updateNodeData(node.id, {
      brandModelId: brandModel.id,
      brand: brandModel.brand,
      model: brandModel.model,
      customItemIconDataUrl: undefined,
      ...brandModel.defaults,
    });
  }

  return { brandModels, brandModelsByBrand, handleBrandModelChange };
}

// Extrait de l'ancien NodePropertiesCard — gère les cas spéciaux où changer
// un champ doit aussi affecter autre chose qu'une simple écriture directe
// (préréglage consommateur, nombre de sorties, changement de technologie
// batterie). `node` optionnel pour la même raison que `useBrandModelSelector`
// ci-dessus (règle des Hooks, jamais d'appel conditionnel dans
// PropertiesTab.tsx).
function useNodeFieldChange(node: SchemaNode | undefined) {
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const setOutputCount = useSchemaStore((s) => s.setOutputCount);
  const customCatalogItems = useSchemaStore((s) => s.customCatalogItems);

  return function handleFieldChange(key: string, value: string | number) {
    if (!node) return;
    // Cas spécial : le type d'appareil d'un consommateur préremplit nom +
    // puissance typique (retour utilisateur : liste déroulante de
    // consommateurs basiques) — reste modifiable ensuite comme un champ
    // normal.
    if (key === "presetType" && node.data.componentType === "consumer") {
      const preset = getConsumerPreset(String(value));
      updateNodeData(node.id, {
        presetType: value,
        label: preset?.label ?? String(value),
        powerW: preset?.typicalPowerW ?? 0,
      });
      return;
    }
    // Cas spécial : changer le nombre de sorties d'un busbar / tableau de
    // distribution / platine de fusibles doit aussi retirer les câbles
    // reliés aux sorties supprimées (voir setOutputCount).
    if (key === "outputCount") {
      setOutputCount(node.id, Number(value));
      return;
    }
    // Retour utilisateur : "je veux que les batteries soient classées par
    // type, quand tu sélectionnes le type ça filtre les autres" — changer
    // la technologie retire la sélection marque/modèle si elle ne
    // correspond plus (ex. passer de LiFePO4 à GEL avec un modèle LiFePO4
    // choisi n'aurait plus de sens), pour ne jamais laisser un modèle
    // affiché en décalage avec la technologie affichée juste en dessous.
    const currentBrandModelId = node.data.componentType === "battery" ? String(node.data.brandModelId ?? "") : "";
    if (key === "technology" && currentBrandModelId) {
      const current = currentBrandModelId.startsWith("custom:")
        ? customCatalogItems.find((i) => `custom:${i.id}` === currentBrandModelId)?.defaults.technology
        : getBrandModel(currentBrandModelId)?.defaults.technology;
      if (current !== value) {
        updateNodeData(node.id, { technology: value, brandModelId: "", brand: "", model: "", customItemIconDataUrl: undefined });
        return;
      }
    }
    updateNodeData(node.id, { [key]: value });
  };
}

// Un champ de calibre par sortie (retour utilisateur : "possibilité de
// modifier l'intensité de chaque sortie") — générés dynamiquement selon
// `outputCount` plutôt qu'une liste statique dans la définition du
// composant, puisque le nombre de sorties varie par instance.
function FuseBlockOutputs({
  node,
  onChange,
  darkMode,
}: {
  node: SchemaNode;
  onChange: (id: string, patch: Record<string, unknown>) => void;
  darkMode: boolean;
}) {
  const outputCount = Math.max(1, Number(node.data.outputCount) || 1);
  const outputs = Array.from({ length: outputCount }, (_, i) => i + 1);

  return (
    <div className={`rounded-md border p-3 ${darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-neutral-50"}`}>
      <p className={`text-xs font-semibold ${darkMode ? "text-neutral-200" : "text-neutral-700"}`}>Calibre par sortie</p>
      <p className={`mt-0.5 text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
        Chaque fusible de la platine peut avoir son propre calibre.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {outputs.map((i) => (
          <label key={i} className="block">
            <span className={`mb-1 block text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Sortie {i}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={Number(node.data[`outAmp${i}`] ?? 0)}
                onChange={(e) => onChange(node.id, { [`outAmp${i}`]: Number(e.target.value) })}
                className={`w-full rounded-md border px-2 py-1 text-sm focus:outline-none ${
                  darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
                }`}
              />
              <span className={`text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>A</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// Indication automatique pour débutant (retour utilisateur : "pour les
// débutants le calcul automatique en indication") : dès qu'un consommateur
// est relié directement au fusible, son calibre conseillé s'affiche tout
// seul, sans bouton ni saisie — juste une suggestion, jamais appliquée
// automatiquement à la place de l'utilisateur.
function FuseSuggestion({ nodeId, nodes, edges, darkMode }: { nodeId: string; nodes: SchemaNode[]; edges: SchemaEdge[]; darkMode: boolean }) {
  const amps = estimateConnectedAmps(nodeId, nodes, edges);
  if (amps === null) return null;
  return (
    <div
      className={`flex items-start gap-2 rounded-md border p-2.5 ${
        darkMode ? "border-brand-800 bg-brand-950" : "border-brand-200 bg-brand-50"
      }`}
    >
      <VoltaAvatar pose="action" size={32} />
      <p className={`text-[11px] leading-snug ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
        Le consommateur relié appelle environ <strong>{amps.toFixed(1)} A</strong> — je te conseille un calibre{" "}
        <strong>{fusibleRecommande(amps)}</strong> (marge de 25 %).
      </p>
    </div>
  );
}

// Assistant de section, sous forme de conseil parlé par Volta plutôt qu'un
// calculateur à remplir (retour utilisateur : "on peut faire parler Volta ?")
// — dès qu'un courant est estimable (même moteur que le recalcul en masse,
// voir evaluateEdgeSection), la section conseillée est calculée et affichée
// directement, sans bouton "Calculer" à cliquer. Repli sur les champs
// manuels seulement quand rien n'est estimable (aucun consommateur en aval
// connu) — l'utilisateur reste toujours libre de choisir une autre section
// dans le menu au-dessus, ceci n'est qu'une suggestion.
function SectionSuggestion({
  edge,
  nodes,
  edges,
  onApply,
  darkMode,
}: {
  edge: SchemaEdge;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  onApply: (section: string) => void;
  darkMode: boolean;
}) {
  const [amps, setAmps] = useState("");
  const [length, setLength] = useState("4");
  const [tension, setTension] = useState("12");
  const [autoEstimated, setAutoEstimated] = useState(false);

  useEffect(() => {
    const v = findBatteryVoltage(nodes);
    setTension(String(v));
    // Somme des consommateurs en aval (retour utilisateur : "il ne calcule
    // pas la section des câbles les plus importants, ceux de la batterie
    // au coupe-circuit ou à la platine de distribution") — pas seulement un
    // consommateur directement raccordé aux deux bouts. Si un fusible
    // principal est plus dimensionnant, on l'utilise comme référence.
    const diagnostic = evaluateEdgeSection(edge, nodes, edges);
    const estimated = diagnostic?.amps ?? estimateEdgeAmps(edge, nodes, edges);
    setAmps(estimated !== null ? String(Math.round(estimated * 10) / 10) : "");
    setAutoEstimated(estimated !== null);
    const sourceType = nodes.find((n) => n.id === edge.source)?.data.componentType;
    const targetType = nodes.find((n) => n.id === edge.target)?.data.componentType;
    setLength(String(edge.data?.length ?? getEdgeDefaultLength(sourceType, targetType, edge.data?.section ?? "", edge.data?.cableType) ?? 4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edge.id]);

  const i = parseFloat(amps);
  const l = parseFloat(length);
  const t = parseFloat(tension);
  const result = i > 0 && l > 0 && t > 0 ? calcSection(i, l, 3, t) : null;

  const inputClass = `w-full rounded-md border px-2 py-1 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
  }`;

  return (
    <div className={`rounded-md border p-3 ${darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-neutral-50"}`}>
      <div className="flex items-start gap-2">
        <VoltaAvatar pose={result ? "action" : "perplexe"} size={32} />
        <div className="flex-1">
          {result ? (
            <p className={`text-[11px] leading-snug ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
              {autoEstimated ? (
                <>D&apos;après le consommateur relié (≈{amps} A), je te conseille</>
              ) : (
                <>Avec les valeurs ci-dessous, je te conseille</>
              )}{" "}
              une section de <strong>{result.section} mm²</strong> (mini {result.sMin} mm²) — fusible conseillé{" "}
              <strong>{fusibleRecommande(i)}</strong>.
            </p>
          ) : (
            <p className={`text-[11px] leading-snug ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
              Je n&apos;ai pas assez d&apos;infos pour te conseiller une section — indique le courant estimé si tu le
              connais.
            </p>
          )}
          {result ? (
            <p className={`mt-1 text-[10px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
              Calcul basé sur {(l * 2).toLocaleString("fr-FR")} m électriques (aller-retour compris).
            </p>
          ) : null}
        </div>
      </div>

      <details className="mt-2">
        <summary className={`cursor-pointer text-[11px] font-medium ${darkMode ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-700"}`}>
          {autoEstimated ? "Ajuster les hypothèses" : "Renseigner le courant"}
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="block">
            <span className={`mb-1 block text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Courant (A)</span>
            <input type="number" value={amps} onChange={(e) => setAmps(e.target.value)} placeholder="ex : 10" className={inputClass} />
          </label>
          <label className="block">
            <span className={`mb-1 block text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Longueur aller (m)</span>
            <input type="number" value={length} onChange={(e) => setLength(e.target.value)} className={inputClass} />
          </label>
        </div>
        <label className="mt-2 block">
          <span className={`mb-1 block text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>Tension (V)</span>
          <select value={tension} onChange={(e) => setTension(e.target.value)} className={inputClass}>
            <option value="12">12 V</option>
            <option value="24">24 V</option>
            <option value="48">48 V</option>
          </select>
        </label>
        <p className={`mt-1.5 text-[10px] leading-snug ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>
          Hypothèse par défaut : 4 m aller (8 m aller-retour), fourchette haute usuelle.
        </p>
      </details>

      {result ? (
        <button
          type="button"
          onClick={() => onApply(`${String(result.section).replace(".", ",")} mm²`)}
          className={`mt-2 w-full rounded-md px-2.5 py-1.5 text-xs font-semibold transition-base ${
            darkMode ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
          }`}
        >
          Appliquer cette section
        </button>
      ) : null}
    </div>
  );
}
