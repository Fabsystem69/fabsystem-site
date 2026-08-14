"use client";

import { useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { COMPONENT_DEFINITIONS, CATEGORY_LABELS, CONSUMER_PRESETS, getComponentIcon, getNodeIcon } from "@/lib/electrical-components/definitions";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

interface LibraryItem {
  key: string;
  type: string;
  label: string;
  subtitle?: string;
  category: string;
  presetValue?: string;
  icon?: string;
}

// Les consommateurs les plus courants (retour utilisateur : "il n'y a
// toujours que 220V et générique... rajoute des consommateurs courants
// pompe, frigo etc., et un modifiable") — mêmes 5 préréglages déjà en tête
// de CONSUMER_PRESETS, plus "Au choix" toujours en dernier comme option
// libre. Le composant sous-jacent reste unique ("consumer") ; seul le
// préréglage déposé change (nom + puissance + icône).
const CONSUMER_LIBRARY_PRESETS = [...CONSUMER_PRESETS.slice(0, 5), CONSUMER_PRESETS[CONSUMER_PRESETS.length - 1]];

// Colonne gauche desktop (CDC §7, §17) : recherche + catégories, drag & drop
// comme méthode principale, clic comme repli qui ajoute au centre du viewport.
export function ComponentLibrary() {
  const [query, setQuery] = useState("");
  const addComponent = useSchemaStore((s) => s.addComponent);
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const { screenToFlowPosition } = useReactFlow();

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: LibraryItem[] = [];
    for (const def of COMPONENT_DEFINITIONS) {
      if (def.type === "consumer") {
        for (const preset of CONSUMER_LIBRARY_PRESETS) {
          if (q && !preset.label.toLowerCase().includes(q) && !def.label.toLowerCase().includes(q)) continue;
          items.push({
            key: `consumer-${preset.value}`,
            type: "consumer",
            label: preset.label,
            subtitle: preset.value === "generique" ? "Modifiable" : undefined,
            category: def.category,
            presetValue: preset.value,
            icon: getNodeIcon(def, { presetType: preset.value }, iconStyle),
          });
        }
        continue;
      }
      if (q && !def.label.toLowerCase().includes(q)) continue;
      items.push({
        key: def.type,
        type: def.type,
        label: def.label,
        subtitle: def.subtitle,
        category: def.category,
        icon: getComponentIcon(def, iconStyle),
      });
    }
    const byCategory = new Map<string, LibraryItem[]>();
    for (const item of items) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return byCategory;
  }, [query, iconStyle]);

  function handleClickAdd(type: string, presetValue?: string) {
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const preset = presetValue ? CONSUMER_PRESETS.find((p) => p.value === presetValue) : undefined;
    const dataOverride = preset ? { presetType: preset.value, label: preset.label, powerW: preset.typicalPowerW } : undefined;
    addComponent(type, center, dataOverride);
  }

  return (
    <aside
      className={`flex h-full w-64 shrink-0 flex-col border-r ${
        darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-neutral-50"
      }`}
    >
      <div className={`border-b p-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un composant…"
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
            darkMode
              ? "border-neutral-700 bg-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-400"
              : "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900"
          }`}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {grouped.size === 0 ? (
          <p className={`mt-4 text-center text-sm ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Aucun composant trouvé.</p>
        ) : (
          Array.from(grouped.entries()).map(([category, defs]) => (
            <div key={category} className="mb-4">
              <h3 className={`mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <div className="space-y-1">
                {defs.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/fabsystem-component", item.type);
                      if (item.presetValue) e.dataTransfer.setData("application/fabsystem-preset", item.presetValue);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => handleClickAdd(item.type, item.presetValue)}
                    className={`flex w-full cursor-grab items-center justify-between rounded-md border px-2.5 py-2 text-left text-sm shadow-sm transition-base active:cursor-grabbing ${
                      darkMode
                        ? "border-neutral-700 bg-neutral-800 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-700"
                        : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-100"
                    }`}
                    title={`Ajouter : ${item.label}`}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.icon} alt="" className="h-4 w-4 shrink-0 object-contain" />
                      ) : null}
                      <span className="font-medium">{item.label}</span>
                    </span>
                    {item.subtitle ? (
                      <span className={`text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{item.subtitle}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
