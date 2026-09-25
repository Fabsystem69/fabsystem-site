import { getComponentDefinition, getNodeIcon } from "@/lib/electrical-components/definitions";
import type { SchemaEdge, SchemaNode } from "@/features/schemas/store/useSchemaStore";

// Extrait de TemplatePickerDialog.tsx (retour utilisateur dashboard : "je
// voudrais... pouvoir choisir un template de départ" avec aperçu visuel) —
// composant partagé pour ne pas dupliquer ce rendu SVG entre le sélecteur de
// l'éditeur et celui du dashboard admin.
export function TemplateDiagramPreview({ nodes, edges, darkMode }: { nodes: SchemaNode[]; edges: SchemaEdge[]; darkMode: boolean }) {
  const drawableNodes = nodes.filter((node) => node.type !== "zone");
  const xs = nodes.map((node) => node.position.x);
  const ys = nodes.map((node) => node.position.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...nodes.map((node) => node.position.x + (node.measured?.width ?? node.width ?? 120)));
  const maxY = Math.max(...nodes.map((node) => node.position.y + (node.measured?.height ?? node.height ?? 80)));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const toX = (value: number) => ((value - minX) / width) * 100;
  const toY = (value: number) => ((value - minY) / height) * 100;
  const nodeById = new Map(drawableNodes.map((node) => [node.id, node]));

  return (
    <div className={`relative h-72 overflow-hidden rounded-xl border ${darkMode ? "border-neutral-700 bg-neutral-950" : "border-slate-200 bg-slate-50"}`} aria-label="Aperçu du schéma sélectionné">
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.32)_1px,transparent_0)] [background-size:16px_16px]" />
      {nodes.filter((node) => node.type === "zone").map((zone) => {
        const zoneWidth = zone.measured?.width ?? zone.width ?? 0;
        const zoneHeight = zone.measured?.height ?? zone.height ?? 0;
        return <div key={zone.id} className="absolute rounded-md border" style={{ left: `${toX(zone.position.x)}%`, top: `${toY(zone.position.y)}%`, width: `${(zoneWidth / width) * 100}%`, height: `${(zoneHeight / height) * 100}%`, borderColor: String(zone.data.color ?? "#94a3b8"), backgroundColor: `${String(zone.data.color ?? "#94a3b8")}12` }} />;
      })}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {edges.map((edge) => {
          const source = nodeById.get(edge.source);
          const target = nodeById.get(edge.target);
          if (!source || !target) return null;
          const sourceWidth = source.measured?.width ?? source.width ?? 120;
          const sourceHeight = source.measured?.height ?? source.height ?? 80;
          const targetWidth = target.measured?.width ?? target.width ?? 120;
          const targetHeight = target.measured?.height ?? target.height ?? 80;
          return <line key={edge.id} x1={`${toX(source.position.x + sourceWidth / 2)}%`} y1={`${toY(source.position.y + sourceHeight / 2)}%`} x2={`${toX(target.position.x + targetWidth / 2)}%`} y2={`${toY(target.position.y + targetHeight / 2)}%`} stroke={String(edge.data?.color ?? "#64748b")} strokeWidth="1.5" opacity="0.75" />;
        })}
      </svg>
      {drawableNodes.slice(0, 48).map((node) => {
        const def = getComponentDefinition(node.data.componentType);
        const icon = def ? getNodeIcon(def, node.data, "pro") : undefined;
        const nodeWidth = node.measured?.width ?? node.width ?? 120;
        const nodeHeight = node.measured?.height ?? node.height ?? 80;
        return <div key={node.id} title={String(node.data.label ?? "Composant")} className={`absolute flex items-center justify-center rounded border shadow-sm ${darkMode ? "border-neutral-600 bg-neutral-900" : "border-white bg-white"}`} style={{ left: `${toX(node.position.x)}%`, top: `${toY(node.position.y)}%`, width: `${Math.max(3.5, (nodeWidth / width) * 100)}%`, height: `${Math.max(3.5, (nodeHeight / height) * 100)}%` }}>{icon ? <img src={icon} alt="" className="h-full w-full object-contain p-0.5" /> : <span className="text-[8px]">{String(node.data.label ?? "?").slice(0, 2)}</span>}</div>;
      })}
      <span className={`absolute bottom-3 left-3 rounded-md px-2 py-1 text-xs ${darkMode ? "bg-neutral-800 text-neutral-400" : "bg-white text-slate-500 shadow-sm"}`}>Aperçu du câblage du modèle</span>
    </div>
  );
}
