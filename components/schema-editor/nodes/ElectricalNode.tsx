"use client";

import { useEffect, type CSSProperties } from "react";
import { Handle, Position, useUpdateNodeInternals, type NodeProps, type Node } from "@xyflow/react";
import { getComponentDefinition, getNodeIcon, getEffectiveHandles, getHandleLabel } from "@/lib/electrical-components/definitions";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import type { ElectricalNodeData, HandleKind } from "@/types/schema";

// Rendu générique piloté par la définition du composant
// (docs/schema/CDC_FabSystem_Schema_V1.md §45-46) : un seul composant React
// Flow pour tous les types, pas un fichier par composant électrique — ajouter
// un composant à la bibliothèque n'impose donc pas de toucher au canvas.
// Vignette compacte (retour utilisateur : "quasiment que l'icône, pas une
// grosse vignette") : un carré liseré par catégorie autour de l'icône, le
// nom en petit texte en dessous — plus proche d'un symbole de schéma que
// d'une carte d'information.
const CATEGORY_ACCENT: Record<string, string> = {
  sources: "border-emerald-500",
  protection: "border-red-500",
  distribution: "border-amber-500",
  consommateurs: "border-sky-500",
  charge: "border-violet-500",
  mesure: "border-neutral-500",
  conversion: "border-neutral-500",
};

const HANDLE_DOT_COLOR: Record<HandleKind, string> = {
  positive: "#dc2626",
  negative: "#111827",
  neutral: "#6b7280",
  earth: "#84cc16",
};

type Side = "left" | "top" | "right" | "bottom";
const SIDE_CYCLE: Side[] = ["left", "top", "right", "bottom"];

// Rotation par pas de 90° (retour utilisateur : "orienter les éléments pour
// garder un alignement propre"). On ne fait pas pivoter la carte elle-même
// (le texte resterait lisible mais de travers) : seul le côté effectif de
// chaque borne change, cycliquement dans le sens horaire.
function rotateSide(side: Side, rotation: number): Side {
  const steps = (((rotation / 90) % 4) + 4) % 4;
  const index = (SIDE_CYCLE.indexOf(side) + steps) % 4;
  return SIDE_CYCLE[index];
}

const SIDE_TO_POSITION: Record<Side, Position> = {
  left: Position.Left,
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
};

const BOX_BASE = 44;

export function ElectricalNode({ id, data, selected }: NodeProps<Node<ElectricalNodeData>>) {
  const def = getComponentDefinition(data.componentType);
  const iconStyle = useSchemaStore((s) => s.iconStyle);
  const updateNodeInternals = useUpdateNodeInternals();
  const rotation = Number(data.rotation) || 0;
  const outputCount = Number(data.outputCount) || 0;

  // React Flow met en cache la position de chaque borne pour tracer les
  // câbles ; changer le côté effectif d'une borne (pivot) ou leur nombre
  // (sorties variables) sans l'en avertir laisse les câbles pointer vers
  // l'ancien emplacement — retour utilisateur : "les points d'attache ne
  // pivotent pas".
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, rotation, outputCount, updateNodeInternals]);

  if (!def) return null;

  const icon = getNodeIcon(def, data, iconStyle);
  const effectiveHandles = getEffectiveHandles(def, data);
  const handlesWithSide = effectiveHandles.map((handle) => ({
    handle,
    side: rotateSide(handle.side, rotation),
  }));
  const bySide: Record<Side, typeof handlesWithSide> = { left: [], top: [], right: [], bottom: [] };
  for (const entry of handlesWithSide) bySide[entry.side].push(entry);

  // Bornes dont la polarité dépend d'une propriété du composant (ex.
  // busbar) plutôt que d'être fixe dans la définition.
  const dynamicAccent = def.resolveHandleKind
    ? { borderColor: HANDLE_DOT_COLOR[def.resolveHandleKind(data, effectiveHandles[0])] }
    : undefined;

  // La boîte (liseré + icône) grandit seulement si un côté porte plusieurs
  // bornes empilées (MPPT, DC-DC… jusqu'à 4 par côté), pour ne jamais les
  // faire se chevaucher — sinon elle reste au format compact minimal.
  // Plafonnée : au-delà d'un certain nombre de bornes par côté, on rapproche
  // les points plutôt que de faire grossir la vignette indéfiniment — retour
  // utilisateur : "éviter de faire grossir les busbar... trop imposant par
  // rapport aux autres éléments".
  const maxPerSide = Math.max(bySide.left.length, bySide.right.length, bySide.top.length, bySide.bottom.length, 1);
  const boxSize = Math.min(84, Math.max(BOX_BASE, maxPerSide * 14 + 16));

  return (
    <div className="relative flex w-24 flex-col items-center gap-1">
      <div
        className={`relative flex items-center justify-center rounded-lg border-2 bg-white shadow-sm transition-shadow ${
          dynamicAccent ? "" : (CATEGORY_ACCENT[def.category] ?? "border-neutral-400")
        } ${selected ? "ring-2 ring-brand-400 ring-offset-1" : ""}`}
        style={{ ...dynamicAccent, width: boxSize, height: boxSize }}
      >
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element -- icônes de bibliothèque à chemin dynamique, pas des images de contenu
          <img src={icon} alt="" className="h-[70%] w-[70%] object-contain" />
        ) : (
          <span className="px-1 text-center text-[9px] font-semibold uppercase leading-tight text-neutral-400">
            {def.label}
          </span>
        )}

        {def.badge && data[def.badge.field] ? (
          <span className="absolute -bottom-1.5 -right-1.5 rounded-full border border-white bg-neutral-900 px-1 text-[8px] font-bold leading-tight text-white shadow-sm">
            {String(data[def.badge.field])}
            {def.badge.unit ?? ""}
          </span>
        ) : null}

        {handlesWithSide.map(({ handle, side }) => {
          const group = bySide[side];
          const indexInGroup = group.findIndex((e) => e.handle.id === handle.id);
          const percent = ((indexInGroup + 1) / (group.length + 1)) * 100;
          const isVertical = side === "left" || side === "right";
          const kind = def.resolveHandleKind ? def.resolveHandleKind(data, handle) : handle.kind;

          return (
            <Handle
              key={handle.id}
              id={handle.id}
              type="source"
              position={SIDE_TO_POSITION[side]}
              style={{
                [isVertical ? "top" : "left"]: `${percent}%`,
                background: HANDLE_DOT_COLOR[kind],
                width: 9,
                height: 9,
                border: "2px solid white",
              }}
              title={`${def.label} · ${getHandleLabel(def, data, handle)}`}
            />
          );
        })}

        {/* Repère visible des bornes sur les boîtiers à plusieurs entrées/
            sorties (MPPT, DC-DC, chargeur secteur, convertisseur, busbar,
            platine de fusibles…) — retour utilisateur : identifier le
            boîtier sans avoir à survoler chaque borne. Inutile sur un
            composant à 2 bornes (+/− déjà clair par la couleur). */}
        {effectiveHandles.length > 2
          ? handlesWithSide.map(({ handle, side }) => {
              const group = bySide[side];
              const indexInGroup = group.findIndex((e) => e.handle.id === handle.id);
              const percent = ((indexInGroup + 1) / (group.length + 1)) * 100;
              const labelStyle: CSSProperties =
                side === "left"
                  ? { left: -3, top: `${percent}%`, transform: "translate(-100%, -50%)", textAlign: "right" }
                  : side === "right"
                    ? { right: -3, top: `${percent}%`, transform: "translate(100%, -50%)", textAlign: "left" }
                    : side === "top"
                      ? { top: -3, left: `${percent}%`, transform: "translate(-50%, -100%)", textAlign: "center" }
                      : { bottom: -3, left: `${percent}%`, transform: "translate(-50%, 100%)", textAlign: "center" };

              return (
                <span
                  key={`label-${handle.id}`}
                  className="pointer-events-none absolute whitespace-nowrap text-[7px] font-semibold leading-none text-neutral-500"
                  style={labelStyle}
                >
                  {getHandleLabel(def, data, handle)}
                </span>
              );
            })
          : null}
      </div>

      <div
        className={`max-w-full truncate rounded px-1 text-[10px] font-medium leading-tight text-neutral-700 ${
          selected ? "bg-brand-100" : ""
        }`}
        title={String(data.label ?? def.label)}
      >
        {String(data.label ?? def.label)}
      </div>
    </div>
  );
}
