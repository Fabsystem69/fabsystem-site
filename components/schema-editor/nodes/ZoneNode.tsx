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
  // Le prop `selected` de React Flow reflète SA sélection interne (gérée par
  // clic natif), pas forcément la même que `selectedNodeId` du store (posé
  // aussi par `addZone` dès la création) — sans quoi une zone qu'on vient de
  // créer n'a pas ses poignées de redimensionnement tant qu'on ne l'a pas
  // recliquée. On compare directement à notre propre sélection.
  const isSelected = useSchemaStore((s) => s.selectedNodeId === id);

  return (
    <>
      <NodeResizer minWidth={160} minHeight={120} color={color} isVisible={isSelected} />
      <div
        className="h-full w-full rounded-xl border-2"
        style={{ borderColor: color, backgroundColor: `${color}14` }}
      >
        <div
          className="inline-block rounded-br-lg rounded-tl-[10px] px-2.5 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {label}
        </div>
      </div>
    </>
  );
}
