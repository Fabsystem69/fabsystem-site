"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
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
  solar: "border-amber-500",
  battery: "border-emerald-500",
  charger: "border-violet-500",
  converter: "border-neutral-500",
  wiring: "border-red-500",
  measurement: "border-neutral-500",
  consumers: "border-sky-500",
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
  const darkMode = useSchemaStore((s) => s.darkMode);
  // Retour utilisateur : seules les bornes réellement polarisées (+/−)
  // gardent une couleur fixe (rouge/noir) — une borne non polarisée
  // (communication, terre, bus de données…) reste noire tant que rien n'est
  // branché, puis reprend la couleur réelle du câble connecté, plutôt
  // qu'une couleur générique par "kind" qui peut induire en erreur.
  const edges = useSchemaStore((s) => s.edges);
  const rotateNode = useSchemaStore((s) => s.rotateNode);
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const select = useSchemaStore((s) => s.select);
  const openItemPropertiesPopup = useSchemaStore((s) => s.openItemPropertiesPopup);
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

  // Calculs sûrs même si `def` est introuvable (repli sur des tableaux
  // vides) : les Hooks ci-dessous doivent s'exécuter dans le même ordre à
  // chaque rendu, donc le "if (!def) return null" ne peut arriver qu'après
  // eux — jamais avant un Hook (règle de React).
  const effectiveHandles = def ? getEffectiveHandles(def, data) : [];
  const handlesWithSide = effectiveHandles.map((handle) => ({
    handle,
    side: rotateSide(handle.side, rotation),
  }));
  const bySide: Record<Side, typeof handlesWithSide> = { left: [], top: [], right: [], bottom: [] };
  for (const entry of handlesWithSide) bySide[entry.side].push(entry);

  // Bornes dont la polarité dépend d'une propriété du composant (ex.
  // busbar) plutôt que d'être fixe dans la définition.
  const dynamicAccent = def?.resolveHandleKind
    ? { borderColor: HANDLE_DOT_COLOR[def.resolveHandleKind(data, effectiveHandles[0])] }
    : undefined;

  // La boîte icône (juste l'icône + son liseré, pas les étiquettes) grandit
  // seulement si un côté porte plusieurs bornes empilées (MPPT, DC-DC…
  // jusqu'à 4 par côté), pour ne jamais les faire se chevaucher — sinon
  // elle reste au format compact minimal. Plafonnée : au-delà d'un certain
  // nombre de bornes par côté, on rapproche les points plutôt que de faire
  // grossir la vignette indéfiniment — retour utilisateur : "éviter de
  // faire grossir les busbar... trop imposant par rapport aux autres
  // éléments".
  const maxPerSide = Math.max(bySide.left.length, bySide.right.length, bySide.top.length, bySide.bottom.length, 1);
  const baseBoxSize = Math.min(84, Math.max(BOX_BASE, def?.minIconBoxSize ?? 0, maxPerSide * 14 + 16));
  // Retour utilisateur : "possibilité d'agrandir une vignette pour la mettre
  // plus en valeur", limité à la famille batterie et aux boîtiers
  // (chargeurs/régulateurs/convertisseurs/tableau de distribution) via
  // `def.allowDisplayScale` — voir le contrôle dans ItemPropertiesPopup.
  // Le curseur garde 5 niveaux distincts (retour utilisateur), mais
  // l'agrandissement réel est ré-échelonné pour que le niveau 5 (max) ne
  // dépasse jamais ce que donnait l'ancien niveau 3 — répartition linéaire
  // entre ×1 (niveau 1) et ×3 (niveau 5), donc niveau 3 = ×2.
  const displayLevel = def?.allowDisplayScale ? Math.min(5, Math.max(1, Number(data.displayScale) || 1)) : 1;
  const displayScale = 1 + (displayLevel - 1) * 0.5;
  const boxSize = baseBoxSize * displayScale;

  // Étiquettes de bornes intégrées à l'intérieur du contour (V2, retour
  // utilisateur : "les indications de voie sont toujours chevauchées par le
  // câble... mieux vaut les intégrer à l'intérieur de la vignette, cela
  // l'agrandit et gagne en visibilité") — un câble s'arrête toujours pile au
  // bord du contour (là où vit le point de connexion), donc un texte purement
  // à l'intérieur de ce contour ne peut plus jamais se faire traverser. La
  // grille CSS ci-dessous laisse le navigateur calculer la vraie largeur du
  // texte (pas d'estimation approximative en JS, source d'un bug précédent
  // avec les vignettes de câble) ; les colonnes/lignes vides se réduisent
  // naturellement à 0 pour les composants à 2 bornes (apparence inchangée).
  const showLabels = effectiveHandles.length > 2 || def?.alwaysShowHandleLabels === true;
  const sideLabels = (side: Side) => (showLabels && def ? bySide[side].map(({ handle }) => getHandleLabel(def, data, handle)) : []);
  const leftLabels = sideLabels("left");
  const rightLabels = sideLabels("right");
  const topLabels = sideLabels("top");
  const bottomLabels = sideLabels("bottom");

  const sideColumnClass = (align: "start" | "end" | "center", axis: "row" | "col") =>
    `grid gap-0.5 whitespace-nowrap text-[7px] font-semibold leading-none text-neutral-500 ${
      axis === "col" ? `items-center justify-items-${align}` : `justify-items-center`
    }`;

  // Symétrie gauche/droite et haut/bas mesurée pour de vrai (bug constaté :
  // `1fr auto 1fr` ne suffit pas à égaliser des colonnes/lignes dans un
  // conteneur dimensionné par son contenu — les pistes `fr` ne se
  // répartissent un espace excédentaire que si le conteneur a une taille
  // définie, ce qui n'est pas le cas ici. On mesure donc la largeur/hauteur
  // réelle de chaque côté après rendu, et on impose la plus grande des deux
  // aux deux — l'icône reste au vrai centre quel que soit le texte.
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const leftRightKey = `${leftLabels.join("|")}::${rightLabels.join("|")}`;
  const topBottomKey = `${topLabels.join("|")}::${bottomLabels.join("|")}`;

  // Mutation DOM directe plutôt qu'un state React : un simple ajustement
  // visuel de largeur/hauteur après mesure, pas une donnée qui doit vivre
  // dans le rendu React (évite aussi un aller-retour setState-dans-effet).
  useLayoutEffect(() => {
    const w = Math.max(leftRef.current?.scrollWidth ?? 0, rightRef.current?.scrollWidth ?? 0);
    if (leftRef.current) leftRef.current.style.width = w ? `${w}px` : "";
    if (rightRef.current) rightRef.current.style.width = w ? `${w}px` : "";
  }, [leftRightKey]);

  useLayoutEffect(() => {
    const h = Math.max(topRef.current?.scrollHeight ?? 0, bottomRef.current?.scrollHeight ?? 0);
    if (topRef.current) topRef.current.style.height = h ? `${h}px` : "";
    if (bottomRef.current) bottomRef.current.style.height = h ? `${h}px` : "";
  }, [topBottomKey]);

  if (!def) return null;
  const icon = getNodeIcon(def, data, iconStyle);

  // Retour utilisateur : "un bouton zoom +- et aussi un bouton rotation"
  // directement sur la vignette — plus rapide que d'ouvrir le panneau de
  // propriétés juste pour pivoter ou changer la taille d'affichage.
  // `nodrag`/`nopan` (convention React Flow) empêchent un clic sur ces
  // boutons de démarrer un glisser du nœud ou un pan du canvas.
  const quickActionButtonClass = `nodrag nopan flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold leading-none transition-base ${
    darkMode ? "text-neutral-300 hover:bg-neutral-700" : "text-neutral-600 hover:bg-neutral-200"
  }`;

  return (
    <div className="relative flex w-fit flex-col items-center gap-1">
      {selected ? (
        <div
          className={`nodrag nopan absolute -top-7 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-md border px-1 py-0.5 shadow-sm ${
            darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              select("node", id);
              openItemPropertiesPopup();
            }}
            title="Voir les informations du composant"
            className={quickActionButtonClass}
          >
            ⓘ
          </button>
          <div className={`mx-0.5 h-3.5 w-px ${darkMode ? "bg-neutral-700" : "bg-neutral-200"}`} />
          <button type="button" onClick={(e) => { e.stopPropagation(); rotateNode(id); }} title="Pivoter 90° (raccourci : R)" className={quickActionButtonClass}>
            ↻
          </button>
          {def.allowDisplayScale ? (
            <>
              <div className={`mx-0.5 h-3.5 w-px ${darkMode ? "bg-neutral-700" : "bg-neutral-200"}`} />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateNodeData(id, { displayScale: Math.max(1, displayLevel - 1) });
                }}
                title="Réduire la vignette"
                className={quickActionButtonClass}
              >
                −
              </button>
              <span className={`w-3 text-center text-[10px] font-semibold ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>{displayLevel}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateNodeData(id, { displayScale: Math.min(5, displayLevel + 1) });
                }}
                title="Agrandir la vignette"
                className={quickActionButtonClass}
              >
                +
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      <div
        className={`relative grid rounded-lg border-2 bg-white shadow-sm transition-shadow ${
          dynamicAccent ? "" : (CATEGORY_ACCENT[def.category] ?? "border-neutral-400")
        } ${selected ? "ring-2 ring-brand-400 ring-offset-1" : ""}`}
        style={{
          ...dynamicAccent,
          gridTemplateColumns: "auto auto auto",
          gridTemplateRows: "auto auto auto",
          gridTemplateAreas: `"tl top tr" "left icon right" "bl bottom br"`,
        }}
      >
        {topLabels.length > 0 && (
          <div
            ref={topRef}
            style={{ gridArea: "top", gridTemplateColumns: `repeat(${topLabels.length}, 1fr)` }}
            className={`${sideColumnClass("center", "row")} px-1.5 pt-1`}
          >
            {topLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        )}
        {leftLabels.length > 0 && (
          <div
            ref={leftRef}
            style={{ gridArea: "left", gridTemplateRows: `repeat(${leftLabels.length}, 1fr)` }}
            className={`${sideColumnClass("end", "col")} py-1.5 pl-1.5`}
          >
            {leftLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        )}

        <div style={{ gridArea: "icon", width: boxSize, height: boxSize }} className="relative flex items-center justify-center">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element -- icônes de bibliothèque à chemin dynamique, pas des images de contenu
            <img src={icon} alt="" className="h-[70%] w-[70%] object-contain" />
          ) : (
            <span className="px-1 text-center text-[9px] font-semibold uppercase leading-tight text-neutral-400">{def.label}</span>
          )}
        </div>

        {def.badge && data[def.badge.field] ? (
          // Ancré au coin de la vignette entière (pas de l'icône seule,
          // devenue une cellule centrale plus étroite depuis l'intégration
          // des étiquettes de bornes) — sinon le badge chevauche le texte
          // de la borne du bas quand il y en a une (bug constaté : "30A" sur
          // "Communication").
          <span className="absolute -bottom-1.5 -right-1.5 rounded-full border border-white bg-neutral-900 px-1 text-[8px] font-bold leading-tight text-white shadow-sm">
            {String(data[def.badge.field])}
            {def.badge.unit ?? ""}
          </span>
        ) : null}

        {rightLabels.length > 0 && (
          <div
            ref={rightRef}
            style={{ gridArea: "right", gridTemplateRows: `repeat(${rightLabels.length}, 1fr)` }}
            className={`${sideColumnClass("start", "col")} py-1.5 pr-1.5`}
          >
            {rightLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        )}
        {bottomLabels.length > 0 && (
          <div
            ref={bottomRef}
            style={{ gridArea: "bottom", gridTemplateColumns: `repeat(${bottomLabels.length}, 1fr)` }}
            className={`${sideColumnClass("center", "row")} px-1.5 pb-1`}
          >
            {bottomLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        )}

        {handlesWithSide.map(({ handle, side }) => {
          const group = bySide[side];
          const indexInGroup = group.findIndex((e) => e.handle.id === handle.id);
          // Même formule que la répartition des étiquettes ci-dessus
          // (`repeat(N, 1fr)`, dont chaque case centre son contenu au milieu
          // de sa fraction 1/N) : le point de connexion s'aligne pile avec
          // son étiquette, plutôt que sur une répartition légèrement
          // différente.
          const percent = ((indexInGroup + 0.5) / group.length) * 100;
          const isVertical = side === "left" || side === "right";
          const kind = def.resolveHandleKind ? def.resolveHandleKind(data, handle) : handle.kind;
          const isPolarized = kind === "positive" || kind === "negative";
          const connectedEdge = isPolarized
            ? undefined
            : edges.find(
                (e) =>
                  (e.source === id && e.sourceHandle === handle.id) ||
                  (e.target === id && e.targetHandle === handle.id)
              );
          const dotColor = isPolarized
            ? HANDLE_DOT_COLOR[kind]
            : (connectedEdge?.data?.color ?? "#111827");
          // Grandit un peu avec la vignette (racine carrée : évite un point
          // de connexion disproportionné aux niveaux de zoom élevés).
          const dotSize = 9 * Math.sqrt(displayScale);

          return (
            <Handle
              key={handle.id}
              id={handle.id}
              type="source"
              position={SIDE_TO_POSITION[side]}
              style={{
                [isVertical ? "top" : "left"]: `${percent}%`,
                background: dotColor,
                width: dotSize,
                height: dotSize,
                border: "2px solid white",
              }}
              title={`${def.label} · ${getHandleLabel(def, data, handle)}`}
            />
          );
        })}
      </div>

      <div
        // Fond opaque même hors sélection (retour utilisateur : les câbles
        // qui passent sous un nœud traversaient visuellement son nom) —
        // même logique que le fond ajouté aux étiquettes de bornes.
        className={`max-w-full truncate rounded px-1 font-medium leading-tight ${
          selected ? "bg-brand-100 text-neutral-700" : darkMode ? "bg-neutral-950 text-neutral-300" : "bg-white text-neutral-700"
        }`}
        style={{ fontSize: 10 + (displayScale - 1) * 1.5 }}
        title={String(data.label ?? def.label)}
      >
        {String(data.label ?? def.label)}
      </div>
    </div>
  );
}
