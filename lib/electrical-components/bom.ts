import { getComponentDefinition, getConsumerPreset, CATEGORY_LABELS } from "./definitions";
import type { Node, Edge } from "@xyflow/react";

// Récapitulatif matériel (retour utilisateur : "un dossier récap des
// éléments... pour faire la liste de courses par catégorie") : regroupe les
// composants par catégorie et les câbles par section, avec les métrages
// quand la longueur a été renseignée. Purement indicatif — voir le
// disclaimer affiché avec l'export.
export interface BomComponentRow {
  name: string;
  spec: string;
  count: number;
}

export interface BomCategoryGroup {
  category: string;
  rows: BomComponentRow[];
}

export interface BomCableRow {
  section: string;
  count: number;
  totalLengthM: number | null;
  missingLengthCount: number;
}

export interface Bom {
  componentGroups: BomCategoryGroup[];
  cableRows: BomCableRow[];
  totalComponents: number;
  totalCables: number;
}

function specLabel(data: Record<string, unknown>): string {
  const parts: string[] = [];
  const amperage = Number(data.amperage);
  if (Number.isFinite(amperage) && amperage > 0) parts.push(`${amperage} A`);
  const powerW = Number(data.powerW);
  if (Number.isFinite(powerW) && powerW > 0) parts.push(`${powerW} W`);
  const capacityAh = Number(data.capacityAh);
  if (Number.isFinite(capacityAh) && capacityAh > 0) parts.push(`${capacityAh} Ah`);
  const chargeAmperage = Number(data.chargeAmperage);
  if (Number.isFinite(chargeAmperage) && chargeAmperage > 0) parts.push(`${chargeAmperage} A charge`);
  const outputCount = Number(data.outputCount);
  if (Number.isFinite(outputCount) && outputCount > 0) parts.push(`${outputCount} sorties`);
  return parts.join(" · ");
}

function displayName(componentType: string, label: string, data: Record<string, unknown>): string {
  if (componentType === "consumer" && typeof data.presetType === "string") {
    const preset = getConsumerPreset(data.presetType);
    if (preset && preset.value !== "generique") return preset.label;
  }
  return label;
}

export function computeBom(nodes: Node[], edges: Edge[]): Bom {
  const byCategory = new Map<string, Map<string, BomComponentRow>>();

  for (const node of nodes) {
    const def = getComponentDefinition(String(node.data.componentType));
    if (!def) continue;
    const name = displayName(def.type, String(node.data.label ?? def.label), node.data);
    const spec = specLabel(node.data);
    const key = `${name}__${spec}`;
    const categoryLabel = CATEGORY_LABELS[def.category] ?? def.category;

    if (!byCategory.has(categoryLabel)) byCategory.set(categoryLabel, new Map());
    const rows = byCategory.get(categoryLabel)!;
    const existing = rows.get(key);
    if (existing) existing.count += 1;
    else rows.set(key, { name, spec, count: 1 });
  }

  const componentGroups: BomCategoryGroup[] = Array.from(byCategory.entries())
    .map(([category, rows]) => ({ category, rows: Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const bySection = new Map<string, { count: number; totalLengthM: number; missingLengthCount: number }>();
  for (const edge of edges) {
    const section = String(edge.data?.section || "Section non renseignée");
    const length = Number(edge.data?.length);
    const hasLength = Number.isFinite(length) && length > 0;
    const entry = bySection.get(section) ?? { count: 0, totalLengthM: 0, missingLengthCount: 0 };
    entry.count += 1;
    if (hasLength) entry.totalLengthM += length;
    else entry.missingLengthCount += 1;
    bySection.set(section, entry);
  }

  const cableRows: BomCableRow[] = Array.from(bySection.entries())
    .map(([section, v]) => ({
      section,
      count: v.count,
      totalLengthM: v.totalLengthM > 0 ? Math.round(v.totalLengthM * 10) / 10 : null,
      missingLengthCount: v.missingLengthCount,
    }))
    .sort((a, b) => a.section.localeCompare(b.section));

  return { componentGroups, cableRows, totalComponents: nodes.length, totalCables: edges.length };
}
