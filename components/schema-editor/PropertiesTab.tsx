"use client";

import { Fragment } from "react";
import { useSchemaStore, ZONE_COLORS } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { useBrandModelSelector, useNodeFieldChange, FuseSuggestion, SectionSuggestion, FuseBlockOutputs } from "./ItemPropertiesPopup";
import { getEdgeDefaultLength } from "@/lib/electrical-components/cable-lengths";
import { CABLE_SECTIONS } from "@/types/schema";
import { CABLE_TYPES, getCableType } from "@/lib/electrical-components/cable-types";
import { RibbonButton, RibbonDivider } from "./RibbonControls";

// Onglet contextuel "Propriétés" (retour utilisateur : "intègre le bandeau
// droit propriété avec les mêmes fonctions mais dans le bandeau supérieur,
// toujours même principe, c'est pour l'autre reste réduit") — n'existe dans
// la barre d'onglets QUE quand un élément est sélectionné (voir Ribbon.tsx,
// qui bascule aussi dessus automatiquement à la sélection), sur le modèle
// des onglets contextuels "Format" de Word/Excel qui n'apparaissent que
// pour une image/un tableau sélectionné.
//
// v2.3, retour utilisateur : "intègre dans le bandeau du haut les
// spécificités directement sans avoir à cliquer dessus" — le bouton
// "Spécificité" (panneau déroulant avec tous les champs) a été retiré
// entièrement : TOUS les champs de l'élément sélectionné sont maintenant
// des champs directs dans la rangée, chacun dans son propre petit groupe
// séparé par une mini-barre ("vraiment aéré", retour utilisateur précédent)
// — plus aucun clic nécessaire pour atteindre un champ, quel qu'il soit.
const inlineInputClass = (darkMode: boolean) =>
  `rounded border px-1.5 py-1 text-xs focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 bg-white focus:border-neutral-900"
  }`;

// Petit champ générique réutilisé pour chaque entrée de `def.fields` restant
// après Nom/Marque-modèle — un seul rendu pour text/number/select plutôt que
// de dupliquer la logique par type d'entrée à chaque appel.
function InlineField({
  darkMode,
  label,
  unit,
  children,
}: {
  darkMode: boolean;
  label: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-0.5 px-2">
      <span className={`text-[9px] font-medium uppercase tracking-wide ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>{label}</span>
      <div className="flex items-center gap-1">
        {children}
        {unit ? <span className={`text-[11px] ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{unit}</span> : null}
      </div>
    </label>
  );
}

export function PropertiesTab({ darkMode }: { darkMode: boolean }) {
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const selectedEdgeId = useSchemaStore((s) => s.selectedEdgeId);
  const rotateNode = useSchemaStore((s) => s.rotateNode);
  const duplicateNode = useSchemaStore((s) => s.duplicateNode);
  const deleteSelected = useSchemaStore((s) => s.deleteSelected);
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const updateEdgeData = useSchemaStore((s) => s.updateEdgeData);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : undefined;
  // Retour utilisateur : "rajoute marque modèle juste après le nom" —
  // appelés sans condition (règle des Hooks), no-op tant qu'il n'y a pas de
  // composant sélectionné (voir la signature `node | undefined` des Hooks).
  const { brandModels, brandModelsByBrand, handleBrandModelChange } = useBrandModelSelector(selectedNode);
  const handleFieldChange = useNodeFieldChange(selectedNode);

  if (!selectedNode && !selectedEdge) return null;

  const isZone = selectedNode?.data.componentType === "zone";
  const def = selectedNode && !isZone ? getComponentDefinition(selectedNode.data.componentType) : undefined;
  const title = isZone ? "Zone" : def ? def.label : selectedEdge ? "Câble" : "";
  const mirrored = selectedNode ? Boolean(selectedNode.data.mirrored) : false;
  const zoneColor = isZone && selectedNode ? String(selectedNode.data.color ?? ZONE_COLORS[0]) : null;

  // Tous les champs du composant sauf "label" (Nom, déjà son propre bloc
  // dédié en tête de rangée).
  const remainingFields = def ? def.fields.filter((f) => f.key !== "label") : [];

  function applySection(section: string) {
    if (!selectedEdge) return;
    const patch: Record<string, unknown> = { section };
    if (selectedEdge.data?.length === undefined) {
      const sourceType = nodes.find((n) => n.id === selectedEdge.source)?.data.componentType;
      const targetType = nodes.find((n) => n.id === selectedEdge.target)?.data.componentType;
      const avg = getEdgeDefaultLength(sourceType, targetType, section, selectedEdge.data?.cableType);
      if (avg !== undefined) patch.length = avg;
    }
    updateEdgeData(selectedEdge.id, patch);
  }

  return (
    <>
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
      <div className="flex w-24 shrink-0 flex-col items-center gap-0.5 overflow-hidden px-1.5 py-1.5 text-center">
        <span className="text-lg leading-none">{isZone ? "▭" : selectedEdge ? "⏤" : "🔧"}</span>
        <span className={`block w-full min-w-0 truncate text-[10px] font-medium leading-tight ${darkMode ? "text-neutral-300" : "text-neutral-600"}`} title={title}>
          {title}
        </span>
      </div>

      <RibbonDivider darkMode={darkMode} />

      {/* Retour utilisateur : "pareil pour nom et capacité, pense à
          vraiment aérer" — chaque champ dans son propre groupe séparé par
          une mini-barre, plutôt qu'un seul bloc tassé. */}
      {selectedNode ? (
        <InlineField darkMode={darkMode} label="Nom">
          <input
            type="text"
            value={String(selectedNode.data.label ?? "")}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className={`${inlineInputClass(darkMode)} w-28`}
          />
        </InlineField>
      ) : selectedEdge ? (
        <InlineField darkMode={darkMode} label="Nom">
          <input
            type="text"
            value={String(selectedEdge.data?.label ?? "")}
            onChange={(e) => updateEdgeData(selectedEdge.id, { label: e.target.value })}
            placeholder="Facultatif"
            className={`${inlineInputClass(darkMode)} w-28`}
          />
        </InlineField>
      ) : null}

      {/* Retour utilisateur : "rajoute marque modèle juste après le nom" —
          même sélecteur que l'ancien panneau "Spécificité", absent pour les
          composants sans modèle catalogué (busbar…) ou pour une zone. */}
      {selectedNode && !isZone && brandModels.length > 0 ? (
        <>
          <RibbonDivider darkMode={darkMode} />
          <InlineField darkMode={darkMode} label="Marque / modèle">
            <select
              value={String(selectedNode.data.brandModelId ?? "")}
              onChange={(e) => handleBrandModelChange(e.target.value)}
              className={`${inlineInputClass(darkMode)} w-40`}
            >
              <option value="">Générique</option>
              {Array.from(brandModelsByBrand.entries())
                .sort(([a], [b]) => a.localeCompare(b, "fr"))
                .map(([brand, models]) => (
                  <optgroup key={brand} label={brand}>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>
          </InlineField>
        </>
      ) : null}

      {/* Tous les autres champs du composant, un par un — plus de bouton
          "Spécificité" à cliquer pour les atteindre. */}
      {selectedNode && !isZone
        ? remainingFields.map((field) => (
            <Fragment key={field.key}>
              <RibbonDivider darkMode={darkMode} />
              <InlineField darkMode={darkMode} label={field.label} unit={field.type === "number" ? field.unit : undefined}>
                {field.type === "select" ? (
                  <select
                    value={String(selectedNode.data[field.key] ?? "")}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className={`${inlineInputClass(darkMode)} w-32`}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "number" ? (
                  <input
                    type="number"
                    value={Number(selectedNode.data[field.key] ?? 0)}
                    onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={`${inlineInputClass(darkMode)} w-16`}
                  />
                ) : (
                  <input
                    type="text"
                    value={String(selectedNode.data[field.key] ?? "")}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className={`${inlineInputClass(darkMode)} w-28`}
                  />
                )}
              </InlineField>
            </Fragment>
          ))
        : null}

      {/* Retour utilisateur : "bug de volta" — le conseil (avatar + texte +
          formulaire dépliable) était bien trop haut pour tenir dans une
          rangée de ruban de 56px, il débordait par-dessus le reste de
          l'interface. Déplacé en bulle flottante bas de l'écran (voir plus
          bas dans ce composant), même style que GuidedTutorial.tsx —
          "fait apparaître le message en bulle en bas avec volta déjà en
          place". */}
      {selectedNode && (def?.type === "fuse-block" || (def?.type === "distribution-panel" && selectedNode.data.layout === "with-fuses")) ? (
        <>
          <RibbonDivider darkMode={darkMode} />
          <FuseBlockOutputs node={selectedNode} onChange={updateNodeData} darkMode={darkMode} compact />
        </>
      ) : null}

      {/* Zone : Nom déjà couvert ci-dessus, seule la couleur reste. */}
      {isZone && selectedNode && zoneColor ? (
        <>
          <RibbonDivider darkMode={darkMode} />
          <InlineField darkMode={darkMode} label="Couleur">
            <div className="flex items-center gap-1">
              {ZONE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateNodeData(selectedNode.id, { color: c })}
                  title={c}
                  className="h-5 w-5 rounded-full border-2 transition-base"
                  style={{ backgroundColor: c, borderColor: c === zoneColor ? (darkMode ? "#fff" : "#111827") : "transparent" }}
                />
              ))}
            </div>
          </InlineField>
        </>
      ) : null}

      {/* Câble : type + section + longueur + couleur, tous en direct. */}
      {selectedEdge ? (
        <>
          <RibbonDivider darkMode={darkMode} />
          <InlineField darkMode={darkMode} label="Type de câble">
            <select
              value={String(selectedEdge.data?.cableType ?? "other")}
              onChange={(e) => {
                const type = getCableType(e.target.value);
                updateEdgeData(selectedEdge.id, { cableType: e.target.value, color: type?.color });
              }}
              className={`${inlineInputClass(darkMode)} w-32`}
            >
              {CABLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </InlineField>

          <RibbonDivider darkMode={darkMode} />
          <InlineField darkMode={darkMode} label="Section">
            <select value={String(selectedEdge.data?.section ?? "")} onChange={(e) => applySection(e.target.value)} className={`${inlineInputClass(darkMode)} w-24`}>
              <option value="">—</option>
              {CABLE_SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </InlineField>

          <RibbonDivider darkMode={darkMode} />
          <InlineField darkMode={darkMode} label="Longueur" unit="m">
            <input
              type="number"
              min={0}
              step={0.5}
              value={selectedEdge.data?.length ?? ""}
              onChange={(e) => updateEdgeData(selectedEdge.id, { length: e.target.value === "" ? undefined : Number(e.target.value) })}
              className={`${inlineInputClass(darkMode)} w-16`}
            />
          </InlineField>

          <RibbonDivider darkMode={darkMode} />
          <InlineField darkMode={darkMode} label="Couleur">
            <input
              type="color"
              value={String(selectedEdge.data?.color ?? "#6b7280")}
              onChange={(e) => updateEdgeData(selectedEdge.id, { color: e.target.value })}
              className={`h-6 w-8 cursor-pointer rounded border ${darkMode ? "border-neutral-700" : "border-neutral-300"}`}
            />
          </InlineField>
        </>
      ) : null}

      {/* Retour utilisateur : "intègre le zoom aussi" puis "sépare avec
          mini barre et zoom renomme en taille" — "Taille d'affichage"
          (agrandit uniquement cette vignette, ×1 à ×5), pas un champ de
          `def.fields` (réglage d'affichage, pas une donnée du composant). */}
      {selectedNode && !isZone ? (
        <>
          <RibbonDivider darkMode={darkMode} />
          <InlineField darkMode={darkMode} label={`Taille ×${Number(selectedNode.data.displayScale) || 1}`}>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={Number(selectedNode.data.displayScale) || 1}
              onChange={(e) => updateNodeData(selectedNode.id, { displayScale: Number(e.target.value) })}
              title="Taille d'affichage de cette vignette"
              className="w-20"
            />
          </InlineField>

          <RibbonDivider darkMode={darkMode} />
          <InlineField darkMode={darkMode} label="Libellé">
            <select
              value={String(selectedNode.data.labelPosition ?? "auto")}
              onChange={(e) => updateNodeData(selectedNode.id, { labelPosition: e.target.value })}
              title="Position du libellé autour de la vignette"
              className={`${inlineInputClass(darkMode)} w-28`}
            >
              <option value="auto">Auto</option>
              <option value="top">Haut</option>
              <option value="right">Droite</option>
              <option value="bottom">Bas</option>
              <option value="left">Gauche</option>
            </select>
          </InlineField>
        </>
      ) : null}

      <RibbonDivider darkMode={darkMode} />

      {selectedNode && !isZone ? (
        <>
          <RibbonButton darkMode={darkMode} onClick={() => rotateNode(selectedNode.id)} icon="↻" label="Pivoter" title="Pivoter 90° (raccourci : R)" />
          <RibbonButton
            darkMode={darkMode}
            onClick={() => updateNodeData(selectedNode.id, { mirrored: !mirrored })}
            active={mirrored}
            icon="⇋"
            label="Miroir"
            title="Miroir horizontal (inverse gauche/droite des bornes)"
          />
        </>
      ) : null}
      {selectedNode ? (
        <RibbonButton darkMode={darkMode} onClick={() => duplicateNode(selectedNode.id)} icon="⧉" label="Dupliquer" title="Dupliquer" />
      ) : null}
      <RibbonButton
        darkMode={darkMode}
        onClick={deleteSelected}
        icon="🗑️"
        label="Supprimer"
        title={selectedEdge ? "Supprimer le câble" : isZone ? "Supprimer la zone" : "Supprimer"}
      />
      </div>

      {/* Conseil Volta (calibre fusible / section câble) — bulle flottante
          bas d'écran plutôt qu'inline dans le ruban (retour utilisateur :
          "bug de volta", le widget avatar+texte+formulaire dépliable était
          trop haut pour une rangée de 56px et débordait par-dessus le reste
          de l'interface ; "fait apparaître le message en bulle en bas avec
          volta déjà en place" — même style que GuidedTutorial.tsx). Toujours
          visible dès qu'un fusible ou un câble de puissance est sélectionné,
          aucun clic requis.
          `pointer-events-none` sur le conteneur pour ne jamais bloquer un
          clic sur le canvas en dessous, `pointer-events-auto` sur la bulle
          elle-même pour rester utilisable (bouton "Appliquer cette
          section", détails dépliables). */}
      {selectedNode && def?.type === "fuse" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-lg">
            <FuseSuggestion nodeId={selectedNode.id} nodes={nodes} edges={edges} darkMode={darkMode} />
          </div>
        </div>
      ) : null}
      {selectedEdge ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-lg">
            <SectionSuggestion edge={selectedEdge} nodes={nodes} edges={edges} onApply={applySection} darkMode={darkMode} />
          </div>
        </div>
      ) : null}
    </>
  );
}
