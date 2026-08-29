"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import {
  COMPONENT_DEFINITIONS,
  CATEGORY_LABELS,
  CONSUMER_PRESETS,
  CONSUMER_PRESET_GROUP_ORDER,
  getComponentIcon,
  getNodeIcon,
} from "@/lib/electrical-components/definitions";
import { getBrandModelsForType } from "@/lib/electrical-components/brand-models";
import { SPLICEABLE_COMPONENT_TYPES } from "@/lib/schema-editor/cable-splice";
import { getVisibleCanvasCenter } from "@/lib/schema-editor/viewport";
import { CategoryIcon } from "./icons/CategoryIcons";
import { RibbonButton, RibbonDivider, RibbonPanel } from "./RibbonControls";

// Onglet "Ajouter" du ruban (retour utilisateur : "je suis sûr que tu peux
// créer tout dans ce bandeau supérieur, aussi un onglet pour rajouter [des
// composants] et laisser réduit le bandeau gauche mais pas le supprimer non
// plus") — un bouton par famille, chacun ouvrant un petit panneau listant
// ses composants (même esprit que Word Insertion : Pages/Tableaux/
// Illustrations, chacun avec sa propre petite galerie). Réutilise
// exactement la même logique d'ajout que ComponentLibrary.tsx
// (addComponent/openLibraryPick, cascade de position, popup marque/modèle
// si catalogué) — le panneau gauche reste la référence complète avec
// recherche, cet onglet est un raccourci, pas un remplacement.
const CATEGORY_ORDER = ["solar", "battery", "charger", "charger-converter", "converter", "wiring", "measurement", "consumers"];

interface Item {
  key: string;
  type: string;
  label: string;
  subtitle?: string;
  presetValue?: string;
  icon?: string;
  group?: string;
}

const NO_GROUP = "_";

const CONSUMER_LIBRARY_PRESETS = [
  CONSUMER_PRESETS.find((p) => p.value === "generique")!,
  ...CONSUMER_PRESETS.filter((p) => p.value !== "generique"),
];

export function AddComponentMenu({ darkMode }: { darkMode: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const addComponent = useSchemaStore((s) => s.addComponent);
  const spliceNodeOnEdge = useSchemaStore((s) => s.spliceNodeOnEdge);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const openLibraryPick = useSchemaStore((s) => s.openLibraryPick);
  const addZone = useSchemaStore((s) => s.addZone);
  const guidedMode = useSchemaStore((s) => s.guidedMode);
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const { screenToFlowPosition, getZoom } = useReactFlow();

  const byCategory = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const def of COMPONENT_DEFINITIONS) {
      if (def.libraryVisible === false) continue;
      const list = map.get(def.category) ?? [];
      if (def.type === "consumer") {
        for (const preset of CONSUMER_LIBRARY_PRESETS) {
          list.push({
            key: `consumer-${preset.value}`,
            type: "consumer",
            label: preset.label,
            subtitle: preset.value === "generique" ? "Modifiable" : undefined,
            presetValue: preset.value,
            icon: getNodeIcon(def, { presetType: preset.value }, iconStyle),
            group: preset.group,
          });
        }
      } else {
        list.push({ key: def.type, type: def.type, label: def.label, subtitle: def.subtitle, icon: getComponentIcon(def, iconStyle) });
      }
      map.set(def.category, list);
    }
    return map;
  }, [iconStyle]);

  useEffect(() => {
    if (!activeCategory) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setActiveCategory(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeCategory]);

  // Même cascade que ComponentLibrary.handleClickAdd : évite d'empiler
  // plusieurs composants ajoutés d'affilée exactement au même endroit.
  function handleAdd(type: string, presetValue?: string) {
    const center = screenToFlowPosition(getVisibleCanvasCenter());
    const selectedEdge = selectedEdgeId ? edges.find((edge) => edge.id === selectedEdgeId) : undefined;
    if (selectedEdge && SPLICEABLE_COMPONENT_TYPES.has(type)) {
      const source = nodes.find((node) => node.id === selectedEdge.source);
      const target = nodes.find((node) => node.id === selectedEdge.target);
      if (source && target) {
        spliceNodeOnEdge(selectedEdge.id, type, {
          x: (source.position.x + target.position.x) / 2,
          y: (source.position.y + target.position.y) / 2,
        });
        setActiveCategory(null);
        return;
      }
    }
    const zoom = getZoom() || 1;
    const electricalCount = nodes.filter((n) => n.type === "electrical").length;
    const col = electricalCount % 5;
    const row = Math.floor(electricalCount / 5) % 4;
    const position = { x: center.x + (col * 220) / zoom, y: center.y + (row * 160) / zoom };
    const preset = presetValue ? CONSUMER_PRESETS.find((p) => p.value === presetValue) : undefined;
    const dataOverride = preset ? { presetType: preset.value, label: preset.label, powerW: preset.typicalPowerW } : undefined;
    const hasBrandModels = !guidedMode && getBrandModelsForType(type).length > 0;
    if (hasBrandModels) {
      openLibraryPick(type, position, dataOverride);
    } else {
      addComponent(type, position, dataOverride);
    }
    setActiveCategory(null);
  }

  function handleAddZone() {
    const center = screenToFlowPosition(getVisibleCanvasCenter());
    addZone({ x: center.x - 190, y: center.y - 130 });
  }

  // Sous-familles (retour utilisateur : "fait des sous-famille dans
  // appareils") — uniquement "Appareils" a des groupes renseignés
  // (CONSUMER_PRESET_GROUP_ORDER) ; les autres familles restent une liste
  // plate faute de donnée de sous-famille par composant.
  function groupItems(items: Item[]): Map<string, Item[]> {
    const groups = new Map<string, Item[]>();
    for (const item of items) {
      const key = item.group ?? NO_GROUP;
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    const ordered = new Map<string, Item[]>();
    if (groups.has(NO_GROUP)) ordered.set(NO_GROUP, groups.get(NO_GROUP)!);
    for (const label of CONSUMER_PRESET_GROUP_ORDER) {
      if (groups.has(label)) ordered.set(label, groups.get(label)!);
    }
    for (const [key, list] of groups) {
      if (!ordered.has(key)) ordered.set(key, list);
    }
    return ordered;
  }

  return (
    <div className="flex items-center gap-1" ref={containerRef}>
      <RibbonButton darkMode={darkMode} onClick={handleAddZone} icon="▭" label="Zone" title="Regroupement visuel, pas un composant électrique" />
      <RibbonDivider darkMode={darkMode} />
      {CATEGORY_ORDER.map((category, index) => {
        const items = byCategory.get(category) ?? [];
        if (items.length === 0) return null;
        return (
          <div className="flex items-center gap-1" key={category}>
            {index > 0 ? <RibbonDivider darkMode={darkMode} /> : null}
            <div className="relative">
            <RibbonButton
              darkMode={darkMode}
              onClick={() => setActiveCategory((prev) => (prev === category ? null : category))}
              active={activeCategory === category}
              icon={<CategoryIcon category={category} className="h-5 w-5" />}
              label={CATEGORY_LABELS[category] ?? category}
            />
            {activeCategory === category ? (
              <RibbonPanel darkMode={darkMode} width="w-64">
                <div className="max-h-80 overflow-y-auto py-1">
                  {Array.from(groupItems(items)).map(([group, groupItemsList]) => (
                    <div key={group}>
                      {group !== NO_GROUP ? (
                        <p className={`px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                          {group}
                        </p>
                      ) : null}
                      {groupItemsList.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleAdd(item.type, item.presetValue)}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-base ${
                            darkMode ? "text-neutral-200 hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            {item.icon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.icon} alt="" className="h-4 w-4 shrink-0 object-contain" />
                            ) : null}
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.subtitle ? (
                            <span className={`shrink-0 text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{item.subtitle}</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </RibbonPanel>
            ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
