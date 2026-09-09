import { getComponentDefinition, getConsumerPreset, CATEGORY_LABELS } from "./definitions";
import { getCableType } from "./cable-types";
import { lookupSolarisProduct, type SolarisProductMatch } from "./solaris-catalog";
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
  solaris: SolarisProductMatch | null;
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

// Câbles de bus de données (VE.Direct, NMEA2000…) — pas de section en mm²,
// et un métrage total n'a pas de sens (ce sont des câbles préconfectionnés
// achetés à l'unité, pas au mètre) : longueur moyenne + nombre de câbles à
// la place (retour utilisateur).
export interface BomDataBusRow {
  label: string;
  count: number;
  averageLengthM: number | null;
  missingLengthCount: number;
}

export interface Bom {
  componentGroups: BomCategoryGroup[];
  cableRows: BomCableRow[];
  dataBusRows: BomDataBusRow[];
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
    const key = `${def.type}__${name}__${spec}`;
    const categoryLabel = CATEGORY_LABELS[def.category] ?? def.category;

    if (!byCategory.has(categoryLabel)) byCategory.set(categoryLabel, new Map());
    const rows = byCategory.get(categoryLabel)!;
    const existing = rows.get(key);
    if (existing) existing.count += 1;
    else rows.set(key, { name, spec, count: 1, solaris: lookupSolarisProduct(def.type) });
  }

  const componentGroups: BomCategoryGroup[] = Array.from(byCategory.entries())
    .map(([category, rows]) => ({ category, rows: Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const bySection = new Map<string, { count: number; totalLengthM: number; missingLengthCount: number }>();
  const byDataBus = new Map<string, { count: number; totalLengthM: number; missingLengthCount: number }>();
  for (const edge of edges) {
    const length = Number(edge.data?.length);
    const hasLength = Number.isFinite(length) && length > 0;

    if (edge.data?.cableType === "data-bus") {
      const label = getCableType("data-bus")?.label ?? "Bus de données";
      const entry = byDataBus.get(label) ?? { count: 0, totalLengthM: 0, missingLengthCount: 0 };
      entry.count += 1;
      if (hasLength) entry.totalLengthM += length;
      else entry.missingLengthCount += 1;
      byDataBus.set(label, entry);
      continue;
    }

    const section = String(edge.data?.section || "Section non renseignée");
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

  const dataBusRows: BomDataBusRow[] = Array.from(byDataBus.entries()).map(([label, v]) => {
    const lengthedCount = v.count - v.missingLengthCount;
    return {
      label,
      count: v.count,
      averageLengthM: lengthedCount > 0 ? Math.round((v.totalLengthM / lengthedCount) * 10) / 10 : null,
      missingLengthCount: v.missingLengthCount,
    };
  });

  return { componentGroups, cableRows, dataBusRows, totalComponents: nodes.length, totalCables: edges.length };
}

// Texte simple, prêt à copier-coller dans un email de demande de devis
// fournisseur (retour utilisateur : "le but est de simplifier toute la
// démarche") — reprend le même regroupement que la liste de matériel
// imprimable, mais en texte brut plutôt qu'un document à imprimer. Utilise
// le nom/référence fournisseur quand une correspondance existe
// (solaris-catalog.ts), sinon le nom générique déjà affiché dans l'éditeur.
export function buildMaterialListText(bom: Bom, projectName: string): string {
  const lines: string[] = [`Liste de matériel — ${projectName || "Schéma"}`, ""];

  for (const group of bom.componentGroups) {
    lines.push(group.category);
    for (const row of group.rows) {
      const label = row.solaris?.solarisName ?? row.name;
      const ref = row.solaris?.solarisRef ? ` (réf. ${row.solaris.solarisRef})` : "";
      const spec = row.spec ? ` — ${row.spec}` : "";
      lines.push(`- ${row.count}x ${label}${ref}${spec}`);
    }
    lines.push("");
  }

  if (bom.cableRows.length > 0) {
    lines.push("Câbles");
    for (const row of bom.cableRows) {
      const metrage =
        row.totalLengthM !== null
          ? `${String(row.totalLengthM).replace(".", ",")} m`
          : `métrage non renseigné`;
      lines.push(`- Section ${row.section} : ${row.count} câble${row.count > 1 ? "s" : ""} (${metrage})`);
    }
    lines.push("");
  }

  if (bom.dataBusRows.length > 0) {
    lines.push("Câbles de données");
    for (const row of bom.dataBusRows) {
      lines.push(`- ${row.label} : ${row.count} câble${row.count > 1 ? "s" : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
