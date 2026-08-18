"use client";

import { NodeResizer, type NodeProps } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

// Zone colorée (retour utilisateur : "possible de créer des carrés de
// couleur pour créer des zones de schéma, exemple zone MPPT solaire, zone
// 230V" — précisé ensuite : "c'est l'utilisateur qui déplacera les éléments
// dedans", donc pas de logique de rattachement automatique ici, juste un
// repère visuel). Toujours en arrière-plan (`zIndex: -1` posé à la création
// dans le store) pour ne jamais intercepter le clic d'un composant posé
// dessus — la couleur reste volontairement pâle (fond très transparent,
// bordure plus marquée) pour ne jamais masquer ce qu'elle contient.
export function ZoneNode({ id, data }: NodeProps) {
  const color = (data.color as string) ?? "#3b82f6";
  const label = (data.label as string) ?? "Zone";
  const locked = data.locked === true;
  // Le prop `selected` de React Flow reflète SA sélection interne (gérée par
  // clic natif), pas forcément la même que `selectedNodeId` du store (posé
  // aussi par `addZone` dès la création) — sans quoi une zone qu'on vient de
  // créer n'a pas ses poignées de redimensionnement tant qu'on ne l'a pas
  // recliquée. On compare directement à notre propre sélection.
  const isSelected = useSchemaStore((s) => s.selectedNodeId === id);
  const toggleZoneLock = useSchemaStore((s) => s.toggleZoneLock);
  const darkMode = useSchemaStore((s) => s.darkMode);

  return (
    <>
      {/* Redimensionnement aussi bloqué tant qu'épinglée — pas seulement le
          déplacement (voir Canvas.tsx pour `draggable: false`). */}
      <NodeResizer minWidth={160} minHeight={120} color={color} isVisible={isSelected && !locked} />
      <div
        className="h-full w-full rounded-xl border-2"
        style={{ borderColor: color, backgroundColor: `${color}14` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className="inline-block rounded-br-lg rounded-tl-[10px] px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </div>
          {locked && !isSelected ? (
            <span className="m-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black/20 text-xs" title="Zone épinglée">
              🔒
            </span>
          ) : null}
          {isSelected ? (
            <button
              type="button"
              // nodrag/nopan (convention React Flow) : ce bouton reste
              // cliquable même quand la zone est en train d'être glissée,
              // et ne déclenche jamais lui-même un glisser/pan.
              className={`nodrag nopan m-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs shadow-sm transition-base ${
                darkMode ? "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleZoneLock(id);
              }}
              title={locked ? "Déplacer la zone (déverrouiller)" : "Épingler la zone (empêcher tout déplacement accidentel)"}
            >
              {locked ? "🔒" : "🔓"}
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
