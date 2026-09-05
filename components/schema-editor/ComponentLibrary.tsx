"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { COMPONENT_DEFINITIONS, CATEGORY_LABELS, SUBCATEGORY_LABELS, CONSUMER_PRESETS, getComponentIcon, getNodeIcon } from "@/lib/electrical-components/definitions";
import { getBrandModelsForType } from "@/lib/electrical-components/brand-models";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { useGuidedStep } from "@/lib/schema-editor/useGuidedStep";
import { CategoryIcon } from "./icons/CategoryIcons";
import { CreateCustomItemModal } from "./CreateCustomItemModal";
import { SPLICEABLE_COMPONENT_TYPES } from "@/lib/schema-editor/cable-splice";
import { getVisibleCanvasCenter } from "@/lib/schema-editor/viewport";

interface LibraryItem {
  key: string;
  type: string;
  label: string;
  subtitle?: string;
  category: string;
  subcategory?: string;
  presetValue?: string;
  icon?: string;
}

// Ordre d'affichage des familles (indépendant de l'ordre d'apparition dans
// COMPONENT_DEFINITIONS) — "layout" (Zone) toujours en tête, comme avant.
const CATEGORY_ORDER = ["layout", "solar", "battery", "charger", "charger-converter", "converter", "wiring", "measurement", "consumers"];

const NO_SUBCATEGORY = "_";

// Tous les préréglages consommateurs (retour utilisateur : "rajoute tous
// les appareils maintenant que c'est déroulant" — la famille Appareils
// n'est plus limitée aux 5 plus courants puisqu'elle est repliable comme
// les autres). "Au choix" ("generique") en premier plutôt qu'en dernier
// (retour utilisateur explicite) : l'option libre, pas un appareil précis.
// Le composant sous-jacent reste unique ("consumer") ; seul le préréglage
// déposé change (nom + puissance + icône).
const CONSUMER_LIBRARY_PRESETS = [
  CONSUMER_PRESETS.find((p) => p.value === "generique")!,
  ...CONSUMER_PRESETS.filter((p) => p.value !== "generique"),
];

// Colonne gauche desktop (CDC §7, §17) : recherche + catégories, drag & drop
// comme méthode principale, clic comme repli qui ajoute au centre du viewport.
// Repère visuel, pas un composant électrique (V2, retour utilisateur : "le
// bouton zone n'est pas explicite... pense intuitif pour un débutant") —
// ajouté ici plutôt que dans la barre d'outils : c'est l'endroit où
// l'utilisateur a déjà l'habitude de glisser-déposer ou cliquer pour ajouter
// quelque chose au canvas (le texte "Ajouter : Zone" au survol suffit alors
// à expliquer le geste, sans bouton mystère en plus dans une barre déjà
// chargée).
const ZONE_LIBRARY_ITEM: LibraryItem = { key: "zone", type: "zone", label: "Zone", category: "layout", subtitle: "Regroupement visuel" };

// Retour utilisateur : "améliorer la recherche avec des synonymes ou noms
// d'usage — ex: BMV doit ressortir même si la catégorie technique est
// shunt". Deux sources combinées pour chaque type de composant :
// 1. Les modèles de marque catalogués (getBrandModelsForType) — couvre déjà
//    "BMV" (shunt), "Multiplus" (inverter-charger), "Orion" (dcdc),
//    "Battery Protect" (battery-switch)... sans dupliquer de données.
// 2. Un petit lexique de termes courants qui ne sont ni le libellé generique
//    ni un nom de marque (ex. "onduleur", terme grand public pour
//    "Convertisseur 12/230V").
const SEARCH_SYNONYMS: Record<string, string[]> = {
  inverter: ["onduleur"],
  "ac-charger": ["chargeur de batterie", "chargeur secteur"],
  "circuit-breaker": ["coupe-circuit", "coupe circuit"],
  "battery-switch": ["coupure basse tension", "protection batterie", "coupe circuit", "coupe-batterie"],
  "battery-protect": ["smart battery protect", "protection basse tension", "batteryprotect"],
  ground: ["masse", "terre"],
  busbar: ["bornier"],
};

// Audit UX (recherche bibliothèque) : "frigo" et "ampoule" sont les mots
// réellement tapés par les utilisateurs, pas les libellés techniques des
// préréglages "consumer" ("Réfrigérateur à compression", "Plafonnier LED"…).
// Ces préréglages partagent tous le même type "consumer" et donc le même
// SEARCH_SYNONYMS ci-dessus — un synonyme par préréglage est nécessaire ici,
// indexé par `value` plutôt que par `type`.
const CONSUMER_PRESET_SEARCH_SYNONYMS: Record<string, string[]> = {
  refrigerateur: ["frigo"],
  "refrigerateur-trimix": ["frigo"],
  "eclairage-led": ["ampoule", "lampe"],
  "spot-led": ["ampoule", "lampe"],
  "ruban-led": ["ampoule", "lampe"],
  "liseuse-led": ["ampoule", "lampe"],
  "plafonnier-led": ["ampoule", "lampe"],
  "pompe-eau": ["douche"],
  "pompe-eau-immergee-25l": ["douche"],
  "pompe-eau-immergee-10l": ["douche"],
};

// Retire espaces/tirets avant comparaison : les noms de produit reels
// ("BatteryProtect", "Smart-Shunt") ne s'ecrivent pas toujours comme les
// gens les tapent ("battery protect", "smart shunt").
function normalizeForSearch(value: string) {
  return value.toLowerCase().replace(/[\s-]+/g, "");
}

function buildSearchHaystack(type: string, label: string, subtitle?: string, description?: string) {
  const brandTerms = getBrandModelsForType(type).flatMap((m) => [m.brand, m.model]);
  const synonyms = SEARCH_SYNONYMS[type] ?? [];
  return normalizeForSearch(
    [label, subtitle, description, ...brandTerms, ...synonyms].filter(Boolean).join(" ")
  );
}

export function ComponentLibrary() {
  const [query, setQuery] = useState("");
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const nodes = useSchemaStore((s) => s.nodes);
  const addComponent = useSchemaStore((s) => s.addComponent);
  const spliceNodeOnEdge = useSchemaStore((s) => s.spliceNodeOnEdge);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const edges = useSchemaStore((s) => s.edges);
  const openLibraryPick = useSchemaStore((s) => s.openLibraryPick);
  const guidedMode = useSchemaStore((s) => s.guidedMode);
  const addZone = useSchemaStore((s) => s.addZone);
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const collapsed = useSchemaStore((s) => s.leftPanelCollapsed);
  const setLeftPanelCollapsed = useSchemaStore((s) => s.setLeftPanelCollapsed);
  const setDraggingComponentType = useSchemaStore((s) => s.setDraggingComponentType);
  const toggleLeftPanel = useSchemaStore((s) => s.toggleLeftPanel);
  const { screenToFlowPosition, getZoom } = useReactFlow();

  // Sur téléphone, le canevas est la surface principale. La bibliothèque
  // démarre donc fermée et ne s'ouvre qu'à la demande via le bouton compact.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const collapseForMobile = () => {
      if (mediaQuery.matches) setLeftPanelCollapsed(true);
    };
    collapseForMobile();
    mediaQuery.addEventListener("change", collapseForMobile);
    return () => mediaQuery.removeEventListener("change", collapseForMobile);
  }, [setLeftPanelCollapsed]);

  // Famille à faire défiler en vue une fois le panneau rouvert (V2, retour
  // utilisateur : "quand il est rabattu, des boutons de famille pour le
  // réouvrir") — une ref plutôt qu'un state : la lecture se fait dans un
  // callback de ref (phase de commit, une fois le nœud DOM du panneau
  // rouvert monté), pas besoin d'un rendu supplémentaire ni d'un effet pour
  // consommer/réinitialiser la valeur.
  const pendingScrollCategory = useRef<string | null>(null);

  // Familles repliées par défaut (retour utilisateur : "fait qu'il puisse se
  // dérouler au lieu de tous les avoir d'un coup") — seule "Solaire" ouverte
  // au premier chargement, le reste se déplie au clic sur son en-tête. Une
  // recherche active force l'affichage des familles qui matchent, sans
  // toucher à cet état (voir `isCategoryOpen` plus bas).
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(["layout", "solar"]));

  function toggleCategory(category: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function handleOpenCategory(category: string) {
    setQuery("");
    pendingScrollCategory.current = category;
    setOpenCategories((prev) => new Set(prev).add(category));
    if (collapsed) toggleLeftPanel();
  }

  const isSearching = query.trim().length > 0;

  // Mode guidé (retour utilisateur) — met en évidence l'unique composant
  // ciblé par l'étape en cours, en réutilisant le même format de clé que
  // les items de `grouped` (`consumer-<preset>` ou `<type>`).
  const guided = useGuidedStep();
  const guidedHighlightKey =
    guided.active && guided.step.type === "task" && guided.step.libraryType
      ? guided.step.libraryPreset
        ? `consumer-${guided.step.libraryPreset}`
        : guided.step.libraryType
      : null;

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const normalizedQuery = normalizeForSearch(query.trim());
    const items: LibraryItem[] = [];
    for (const def of COMPONENT_DEFINITIONS) {
      if (def.libraryVisible === false) continue;
      const haystack = buildSearchHaystack(def.type, def.label, def.subtitle, def.description);
      if (def.type === "consumer") {
        for (const preset of CONSUMER_LIBRARY_PRESETS) {
          const presetSynonyms = CONSUMER_PRESET_SEARCH_SYNONYMS[preset.value] ?? [];
          const presetHaystack = normalizeForSearch(presetSynonyms.join(" "));
          if (
            q &&
            !preset.label.toLowerCase().includes(q) &&
            !haystack.includes(normalizedQuery) &&
            !(presetHaystack && presetHaystack.includes(normalizedQuery))
          )
            continue;
          items.push({
            key: `consumer-${preset.value}`,
            type: "consumer",
            label: preset.label,
            subtitle: preset.value === "generique" ? "Modifiable" : undefined,
            category: def.category,
            subcategory: def.subcategory,
            presetValue: preset.value,
            icon: getNodeIcon(def, { presetType: preset.value }, iconStyle),
          });
        }
        continue;
      }
      if (q && !haystack.includes(normalizedQuery)) continue;
      items.push({
        key: def.type,
        type: def.type,
        label: def.label,
        subtitle: def.subtitle,
        category: def.category,
        subcategory: def.subcategory,
        icon: getComponentIcon(def, iconStyle),
      });
    }
    // Zone en tête de liste (V2, retour utilisateur) — pas dans
    // COMPONENT_DEFINITIONS (pas un composant électrique), ajoutée à part,
    // filtrable par la recherche comme le reste.
    const byCategory = new Map<string, Map<string, LibraryItem[]>>();
    if (!q || ZONE_LIBRARY_ITEM.label.toLowerCase().includes(q)) {
      byCategory.set("layout", new Map([[NO_SUBCATEGORY, [ZONE_LIBRARY_ITEM]]]));
    }
    for (const item of items) {
      const bySub = byCategory.get(item.category) ?? new Map<string, LibraryItem[]>();
      const subKey = item.subcategory ?? NO_SUBCATEGORY;
      const list = bySub.get(subKey) ?? [];
      list.push(item);
      bySub.set(subKey, list);
      byCategory.set(item.category, bySub);
    }
    return byCategory;
  }, [query, iconStyle]);

  // Déplie et fait défiler jusqu'à la famille du composant ciblé par l'étape
  // guidée en cours — l'utilisateur n'a pas à le chercher lui-même.
  useEffect(() => {
    if (!guidedHighlightKey) return;
    for (const [category, subgroups] of grouped) {
      for (const items of subgroups.values()) {
        if (items.some((it) => it.key === guidedHighlightKey)) {
          setOpenCategories((prev) => (prev.has(category) ? prev : new Set(prev).add(category)));
          pendingScrollCategory.current = category;
          if (collapsed) toggleLeftPanel();
          return;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guidedHighlightKey, grouped]);

  function handleClickAdd(type: string, presetValue?: string) {
    const center = screenToFlowPosition(getVisibleCanvasCenter());
    const closeOnMobile = () => {
      if (window.matchMedia("(max-width: 767px)").matches) setLeftPanelCollapsed(true);
    };
    if (type === "zone") {
      addZone({ x: center.x - 190, y: center.y - 130 });
      closeOnMobile();
      return;
    }
    const selectedEdge = selectedEdgeId ? edges.find((edge) => edge.id === selectedEdgeId) : undefined;
    if (selectedEdge && SPLICEABLE_COMPONENT_TYPES.has(type)) {
      const source = nodes.find((node) => node.id === selectedEdge.source);
      const target = nodes.find((node) => node.id === selectedEdge.target);
      if (source && target) {
        spliceNodeOnEdge(selectedEdge.id, type, {
          x: (source.position.x + target.position.x) / 2,
          y: (source.position.y + target.position.y) / 2,
        });
        closeOnMobile();
        return;
      }
    }
    // Grille en cascade (retour utilisateur indirect, mode guidé) : sans
    // elle, cliquer plusieurs composants d'affilée les empile exactement au
    // même endroit (toujours le centre du viewport) — invisible l'un sous
    // l'autre, y compris leurs bornes, ce qui rend le câblage impossible
    // sans d'abord les déplacer à la main. Espacement large (220/160px) :
    // les boîtiers "gros" (batterie, MPPT…) font jusqu'à 84px de vignette
    // plus le libellé, un pas plus petit les fait quand même se chevaucher.
    // Retour utilisateur : "certains composants s'ajoutent hors de la zone
    // visible" — l'espacement de la cascade était fixe en unites flow, donc
    // au-dela d'un certain zoom (canvas zoome), le meme decalage couvre une
    // portion beaucoup plus grande de la zone visible et finit par pousser
    // les nouveaux composants hors champ. On divise par le zoom courant pour
    // que la cascade reste toujours dans la meme portion de l'ecran, quel
    // que soit le niveau de zoom.
    const zoom = getZoom() || 1;
    const electricalCount = nodes.filter((n) => n.type === "electrical").length;
    const col = electricalCount % 5;
    const row = Math.floor(electricalCount / 5) % 4;
    const cascadePosition = { x: center.x + (col * 220) / zoom, y: center.y + (row * 160) / zoom };
    // Un clic dans la bibliothèque place le composant dans la vue en cours.
    // Le placement reste toujours manuel et prévisible, sans réagencement.
    const position = cascadePosition;
    const preset = presetValue ? CONSUMER_PRESETS.find((p) => p.value === presetValue) : undefined;
    const dataOverride = preset ? { presetType: preset.value, label: preset.label, powerW: preset.typicalPowerW } : undefined;

    // v2.1, retour utilisateur : "pour item avec choix uniquement quand
    // c'est choisi" — un type catalogué (voir brand-models.ts) ne se place
    // plus directement au double-clic, le choix de modèle s'ouvre d'abord,
    // rien n'existe sur le canvas tant que rien n'est choisi (voir
    // ModelPickerModal, mode pendingLibraryPick). Même exception mode
    // guidé que addComponent (pas de popup pendant le tutoriel pas à pas).
    const hasBrandModels = !guidedMode && getBrandModelsForType(type).length > 0;
    if (hasBrandModels) {
      openLibraryPick(type, position, dataOverride);
      closeOnMobile();
      return;
    }
    addComponent(type, position, dataOverride);
    closeOnMobile();
  }

  if (collapsed) {
    return (
      <aside
        className={`schema-mobile-components-launcher absolute left-0 z-20 ml-5 mt-6 flex max-h-[calc(100dvh-7rem)] w-11 flex-col items-center gap-1 overflow-hidden rounded-2xl border py-3 shadow-[0_16px_36px_rgba(15,23,42,0.14)] max-md:hidden ${
          darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"
        }`}
      >
        <button
          type="button"
          onClick={toggleLeftPanel}
          title="Afficher la bibliothèque de composants"
          className={`rounded-md border p-1.5 text-xs transition-base max-md:flex max-md:h-9 max-md:items-center max-md:gap-1.5 max-md:rounded-full max-md:border-amber-500 max-md:bg-amber-500 max-md:px-3 max-md:text-sm max-md:font-semibold max-md:text-white ${
            darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800 max-md:border-amber-500 max-md:bg-amber-500 max-md:text-neutral-950" : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <span className="hidden max-md:inline" aria-hidden="true">＋</span><span className="max-md:hidden">›</span><span className="hidden max-md:inline">Composants</span>
        </button>
        <div className={`my-1 h-px w-6 shrink-0 max-md:hidden ${darkMode ? "bg-neutral-800" : "bg-neutral-200"}`} />
        {Object.entries(CATEGORY_LABELS)
          .sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
          .map(([category, label]) => (
          <button
            key={category}
            type="button"
            onClick={() => handleOpenCategory(category)}
            title={label}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold uppercase transition-base max-md:hidden ${
              darkMode ? "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100" : "border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            <CategoryIcon category={category} />
          </button>
        ))}
      </aside>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Fermer la bibliothèque de composants"
        onClick={toggleLeftPanel}
        className="schema-mobile-library-backdrop fixed inset-0 z-40 hidden bg-slate-950/60 max-md:block"
      />
      <aside
      className={`schema-mobile-library absolute left-0 z-20 ml-5 mt-6 flex max-h-[calc(100dvh-7rem)] w-64 flex-col overflow-hidden rounded-3xl border shadow-[0_16px_36px_rgba(15,23,42,0.14)] max-md:fixed max-md:inset-0 max-md:z-50 max-md:m-0 max-md:max-h-none max-md:w-auto max-md:rounded-none max-md:pb-[env(safe-area-inset-bottom)] ${
        darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"
      }`}
    >
      <div className={`flex items-center justify-between gap-2 border-b p-3 max-md:px-5 max-md:py-4 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
        <div className="hidden min-w-0 max-md:block"><p className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Ajouter un composant</p><p className={`text-xs ${darkMode ? "text-neutral-400" : "text-slate-500"}`}>Touchez un élément pour l&apos;ajouter au canevas.</p></div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un composant…"
          className={`w-full min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:outline-none max-md:absolute max-md:left-5 max-md:right-5 max-md:top-[5.8rem] max-md:w-auto ${
            darkMode
              ? "border-neutral-700 bg-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-400"
              : "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900"
          }`}
        />
        <button
          type="button"
          onClick={toggleLeftPanel}
          title="Réduire la bibliothèque de composants"
          className={`shrink-0 rounded-md border p-1.5 text-xs transition-base max-md:ml-auto ${
            darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <span className="max-md:hidden">‹</span><span className="hidden text-xl max-md:inline">×</span>
        </button>
      </div>
      {!collapsed ? (
        <div className={`border-b px-3 py-2 max-md:mt-16 max-md:px-5 max-md:py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
          <button
            type="button"
            onClick={() => setCreateItemOpen(true)}
            title="Créer un modèle personnalisé (marque/référence manquante), avec sa vraie photo"
            className={`w-full rounded-md border px-2.5 py-1.5 text-xs font-medium transition-base max-md:rounded-xl max-md:px-3 max-md:py-2.5 max-md:text-sm max-md:font-semibold ${
              darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            + Créer un item personnalisé
          </button>
        </div>
      ) : null}
      {createItemOpen ? <CreateCustomItemModal onClose={() => setCreateItemOpen(false)} /> : null}

      <div className="flex-1 overflow-y-auto p-3 max-md:px-5 max-md:pb-8">
        {grouped.size === 0 ? (
          <p className={`mt-4 text-center text-sm ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Aucun composant trouvé.</p>
        ) : (
          Array.from(grouped.entries())
            .sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
            .map(([category, subgroups]) => {
              const itemCount = Array.from(subgroups.values()).reduce((sum, list) => sum + list.length, 0);
              // Recherche active : la famille reste dépliée tant qu'elle a un
              // résultat, indépendamment de son état replié/déplié mémorisé.
              const isOpen = isSearching || openCategories.has(category);
              const label = category === "layout" ? "Mise en page" : (CATEGORY_LABELS[category] ?? category);

              return (
                <div
                  key={category}
                  ref={(el) => {
                    if (el && pendingScrollCategory.current === category) {
                      el.scrollIntoView({ block: "start" });
                      pendingScrollCategory.current = null;
                    }
                  }}
                  className="mb-1 scroll-mt-3"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left transition-base max-md:min-h-12 max-md:gap-3 max-md:rounded-xl max-md:px-3 max-md:py-2.5 ${
                      darkMode ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                    }`}
                  >
                    <span className={darkMode ? "text-neutral-400" : "text-neutral-500"}>
                      <CategoryIcon category={category} className="h-3.5 w-3.5 max-md:h-5 max-md:w-5" />
                    </span>
                    <span className={`flex-1 text-[11px] font-semibold uppercase tracking-wide max-md:text-sm max-md:normal-case max-md:tracking-normal ${darkMode ? "text-neutral-300 max-md:text-neutral-200" : "text-neutral-600 max-md:text-slate-700"}`}>
                      {label}
                    </span>
                    <span className={`text-[10px] tabular-nums max-md:rounded-md max-md:px-2 max-md:py-1 max-md:text-xs ${darkMode ? "text-neutral-600 max-md:bg-neutral-800 max-md:text-neutral-400" : "text-neutral-400 max-md:bg-slate-100 max-md:text-slate-500"}`}>{itemCount}</span>
                    <span
                      className={`text-[10px] transition-transform ${isOpen ? "rotate-90" : ""} ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}
                    >
                      ›
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="mt-1 space-y-2.5 px-1 pt-0.5 max-md:space-y-2 max-md:px-2 max-md:pb-2">
                      {Array.from(subgroups.entries()).map(([subcategory, items]) => (
                        <div key={subcategory} className="space-y-1">
                          {subcategory !== NO_SUBCATEGORY ? (
                            <h4 className={`px-0.5 text-[10px] font-medium uppercase tracking-wide max-md:px-1 max-md:pt-2 max-md:font-bold max-md:tracking-[0.16em] ${darkMode ? "text-neutral-600 max-md:text-neutral-500" : "text-neutral-400 max-md:text-slate-400"}`}>
                              {SUBCATEGORY_LABELS[subcategory] ?? subcategory}
                            </h4>
                          ) : null}
                          {items.map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("application/fabsystem-component", item.type);
                                if (item.presetValue) e.dataTransfer.setData("application/fabsystem-preset", item.presetValue);
                                e.dataTransfer.effectAllowed = "move";
                                setDraggingComponentType(item.type);
                              }}
                              onDragEnd={() => setDraggingComponentType(null)}
                              onClick={() => handleClickAdd(item.type, item.presetValue)}
                              className={`flex w-full cursor-grab items-center justify-between rounded-md border px-2.5 py-2 text-left text-sm shadow-sm transition-base active:cursor-grabbing max-md:min-h-12 max-md:rounded-xl max-md:px-3 max-md:py-2.5 ${
                                item.key === guidedHighlightKey
                                  ? darkMode
                                    ? "border-emerald-400 bg-emerald-950/40 text-neutral-100 ring-2 ring-emerald-400"
                                    : "border-emerald-500 bg-emerald-50 text-neutral-900 ring-2 ring-emerald-400"
                                  : darkMode
                                    ? "border-neutral-700 bg-neutral-800 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-700"
                                    : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-100"
                              }`}
                              title={selectedEdgeId && SPLICEABLE_COMPONENT_TYPES.has(item.type)
                                ? `Insérer ${item.label} dans le câble sélectionné`
                                : `Glisser-déposer sur le canvas, ou clic pour ajouter : ${item.label}`}
                            >
                              <span className="flex items-center gap-2">
                                {item.icon ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.icon} alt="" className="h-4 w-4 shrink-0 object-contain max-md:h-5 max-md:w-5" />
                                ) : null}
                                <span className="font-medium">{item.label}</span>
                              </span>
                              {item.subtitle ? (
                                <span className={`text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{item.subtitle}</span>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
        )}
      </div>
      </aside>
    </>
  );
}
