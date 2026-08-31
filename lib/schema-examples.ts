import { getSchemaTemplate } from "@/features/schemas/templates";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import {
  FEATURED_SCHEMA_EXAMPLE_SLUG,
  SCHEMA_EXAMPLES,
  SCHEMA_EXAMPLE_COUNT,
  SCHEMA_EXAMPLE_SLUGS,
  getSchemaEditorTemplateHref,
  getSchemaExampleAbsoluteUrl,
  getSchemaExampleBySlug,
  getSchemaExampleHref,
  getSchemaExampleThumbnailAbsoluteUrl,
  getSchemaExampleThumbnailSrc,
  getRelatedSchemaExamples,
  type SchemaExample,
} from "@/lib/schema-examples-data";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

export {
  FEATURED_SCHEMA_EXAMPLE_SLUG,
  SCHEMA_EXAMPLES,
  SCHEMA_EXAMPLE_COUNT,
  SCHEMA_EXAMPLE_SLUGS,
  getSchemaEditorTemplateHref,
  getSchemaExampleAbsoluteUrl,
  getSchemaExampleBySlug,
  getSchemaExampleHref,
  getSchemaExampleThumbnailAbsoluteUrl,
  getSchemaExampleThumbnailSrc,
  getRelatedSchemaExamples,
};

export type { SchemaExample };

export function getSchemaExampleTemplate(slug: string) {
  const example = getSchemaExampleBySlug(slug);
  if (!example) return null;
  return getSchemaTemplate(example.templateId) ?? null;
}

export interface SchemaExampleComponentSummary {
  key: string;
  label: string;
  typeLabel: string;
  brand?: string;
  model?: string;
  count: number;
}

function isRealComponentNode(data: ElectricalNodeData | undefined): data is ElectricalNodeData {
  return data !== undefined && data.componentType !== "zone";
}

export function getSchemaExampleComponents(slug: string): SchemaExampleComponentSummary[] {
  const template = getSchemaExampleTemplate(slug);
  if (!template) return [];

  const { nodes } = template.build();
  const grouped = new Map<string, SchemaExampleComponentSummary>();

  for (const node of nodes) {
    const data = node.data as ElectricalNodeData | undefined;
    if (!isRealComponentNode(data)) continue;

    const def = getComponentDefinition(data.componentType);
    const typeLabel = def?.label ?? data.componentType;
    const brand = typeof data.brand === "string" && data.brand.trim() ? data.brand.trim() : undefined;
    const model = typeof data.model === "string" && data.model.trim() ? data.model.trim() : undefined;
    const hasKnownBrand = Boolean(data.brandModelId) || Boolean(brand && model);
    const label = hasKnownBrand && brand && model ? `${brand} ${model}` : typeLabel;
    const key = hasKnownBrand && brand && model ? `brand:${data.componentType}:${brand}:${model}` : `generic:${data.componentType}`;

    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(key, { key, label, typeLabel, brand, model, count: 1 });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label, "fr");
  });
}

export interface SchemaExampleWiringRow {
  id: string;
  fromLabel: string;
  toLabel: string;
  section: string;
  length: number | null;
  polarity: "positif" | "négatif";
}

const MAX_WIRING_ROWS = 12;

function parseSectionMm2(section: string): number {
  const matches = section.match(/\d+(?:[.,]\d+)?/g);
  const raw = matches?.[matches.length - 1];
  if (!raw) return 0;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) ? value : 0;
}

function nodeLabel(nodes: { id: string; data: ElectricalNodeData }[], nodeId: string): string {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return nodeId;
  const def = getComponentDefinition(node.data.componentType);
  return String(node.data.label ?? def?.label ?? node.data.componentType);
}

export function getSchemaExampleWiring(slug: string): SchemaExampleWiringRow[] {
  const template = getSchemaExampleTemplate(slug);
  if (!template) return [];

  const { nodes, edges } = template.build();
  const typedNodes = nodes as { id: string; data: ElectricalNodeData }[];
  const rows: (SchemaExampleWiringRow & { sortSection: number })[] = [];
  const seen = new Set<string>();

  for (const edge of edges) {
    const data = edge.data as CableEdgeData | undefined;
    if (!data) continue;

    const polarity = data.polarity === "negative" ? "négatif" : data.polarity === "positive" ? "positif" : null;
    if (!polarity) continue;

    const section = typeof data.cableSize === "string" ? data.cableSize.trim() : "";
    if (!section) continue;

    const fromLabel = nodeLabel(typedNodes, edge.source);
    const toLabel = nodeLabel(typedNodes, edge.target);
    const id = `${edge.source}:${edge.target}:${polarity}:${section}`;
    if (seen.has(id)) continue;
    seen.add(id);

    rows.push({
      id,
      fromLabel,
      toLabel,
      section,
      length: typeof data.lengthMeters === "number" ? data.lengthMeters : null,
      polarity,
      sortSection: parseSectionMm2(section),
    });
  }

  return rows
    .sort((a, b) => {
      if (b.sortSection !== a.sortSection) return b.sortSection - a.sortSection;
      return a.fromLabel.localeCompare(b.fromLabel, "fr");
    })
    .slice(0, MAX_WIRING_ROWS)
    .map(({ sortSection: _sortSection, ...row }) => row);
}
