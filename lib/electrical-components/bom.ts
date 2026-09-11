import { getComponentDefinition, getConsumerPreset, CATEGORY_LABELS } from "./definitions";
import { getCableType } from "./cable-types";
import { getBrandModel, type BrandModel } from "./brand-models";
import { compareBySectionOrder, getRecommendedLugStudDiameter } from "./cable-lugs";
import { getAwgEquivalent } from "./section-to-awg";
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
  // Fournisseur du modèle exact choisi (brand-models.ts, champ `supplier`) —
  // null si aucun modèle précis n'a été choisi ou si ce modèle n'a pas de
  // correspondance fournisseur vérifiée.
  supplier: BrandModel["supplier"] | null;
}

export interface BomCategoryGroup {
  category: string;
  rows: BomComponentRow[];
}

export interface BomCableRow {
  section: string;
  // Équivalent AWG (retour utilisateur : "un moteur pour passer de mm2 à
  // awg") — null si la section n'est pas renseignée ou ne correspond à
  // aucune entrée connue.
  awg: string | null;
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

// Cosses à œillet nécessaires pour sertir les câbles (retour utilisateur :
// "un moteur pour calculer les consommables cosses... avec les diamètres de
// vis et la section") — 2 cosses par câble (une à chaque extrémité), sauf
// bus de données (connecteurs préconfectionnés, jamais de cosse à sertir).
// Diamètre déduit uniquement de la section (voir cable-lugs.ts) : reste
// indicatif, une même section existant couramment en plusieurs diamètres de
// trou selon la borne réelle du composant.
export interface BomLugRow {
  section: string;
  studDiameter: string;
  count: number;
}

export interface Bom {
  componentGroups: BomCategoryGroup[];
  cableRows: BomCableRow[];
  dataBusRows: BomDataBusRow[];
  lugRows: BomLugRow[];
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

export function displayName(componentType: string, label: string, data: Record<string, unknown>): string {
  if (componentType === "consumer" && typeof data.presetType === "string") {
    const preset = getConsumerPreset(data.presetType);
    if (preset && preset.value !== "generique") return preset.label;
  }
  // Un modèle de marque choisi (brand-models.ts) ne changeait jusqu'ici que
  // les caractéristiques numériques, jamais le nom affiché — la liste de
  // matériel montrait "Régulateur MPPT" même pour un Victron SmartSolar
  // précis. Nécessaire pour que l'export fournisseur porte un nom
  // identifiable (retour utilisateur : "avec leur appellation").
  if (typeof data.brand === "string" && data.brand && typeof data.model === "string" && data.model) {
    return `${data.brand} ${data.model}`;
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
    const brandModelId = typeof node.data.brandModelId === "string" ? node.data.brandModelId : null;
    const supplier = brandModelId ? getBrandModel(brandModelId)?.supplier ?? null : null;
    // La clé inclut le modèle choisi : deux composants identiques en
    // caractéristiques mais l'un avec modèle Solaris et l'autre générique ne
    // doivent jamais fusionner en une seule ligne (le fournisseur serait
    // perdu pour la moitié de la quantité réelle).
    const key = `${def.type}__${name}__${spec}__${brandModelId ?? ""}`;
    const categoryLabel = CATEGORY_LABELS[def.category] ?? def.category;

    if (!byCategory.has(categoryLabel)) byCategory.set(categoryLabel, new Map());
    const rows = byCategory.get(categoryLabel)!;
    const existing = rows.get(key);
    if (existing) existing.count += 1;
    else rows.set(key, { name, spec, count: 1, supplier });
  }

  const componentGroups: BomCategoryGroup[] = Array.from(byCategory.entries())
    .map(([category, rows]) => ({ category, rows: Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const bySection = new Map<string, { count: number; totalLengthM: number; missingLengthCount: number }>();
  const byDataBus = new Map<string, { count: number; totalLengthM: number; missingLengthCount: number }>();
  const byLug = new Map<string, { section: string; studDiameter: string; count: number }>();
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

    // 2 cosses par câble (une à chaque extrémité) — rien si la section n'est
    // pas renseignée, impossible de recommander un diamètre sans elle.
    const studDiameter = getRecommendedLugStudDiameter(section);
    if (studDiameter) {
      const lugKey = `${section}__${studDiameter}`;
      const lugEntry = byLug.get(lugKey) ?? { section, studDiameter, count: 0 };
      lugEntry.count += 2;
      byLug.set(lugKey, lugEntry);
    }
  }

  const cableRows: BomCableRow[] = Array.from(bySection.entries())
    .map(([section, v]) => ({
      section,
      awg: getAwgEquivalent(section),
      count: v.count,
      totalLengthM: v.totalLengthM > 0 ? Math.round(v.totalLengthM * 10) / 10 : null,
      missingLengthCount: v.missingLengthCount,
    }))
    .sort((a, b) => compareBySectionOrder(a.section, b.section));

  const dataBusRows: BomDataBusRow[] = Array.from(byDataBus.entries()).map(([label, v]) => {
    const lengthedCount = v.count - v.missingLengthCount;
    return {
      label,
      count: v.count,
      averageLengthM: lengthedCount > 0 ? Math.round((v.totalLengthM / lengthedCount) * 10) / 10 : null,
      missingLengthCount: v.missingLengthCount,
    };
  });

  const lugRows: BomLugRow[] = Array.from(byLug.values()).sort(
    (a, b) => compareBySectionOrder(a.section, b.section) || a.studDiameter.localeCompare(b.studDiameter)
  );

  return { componentGroups, cableRows, dataBusRows, lugRows, totalComponents: nodes.length, totalCables: edges.length };
}

// Texte simple, prêt à copier-coller dans un email de demande de devis
// fournisseur (retour utilisateur : "le but est de simplifier toute la
// démarche") — reprend le même regroupement que la liste de matériel
// imprimable, mais en texte brut plutôt qu'un document à imprimer. Le nom
// affiché est déjà celui de la marque/modèle choisi (voir displayName
// ci-dessus) ; la référence fournisseur s'ajoute quand un modèle a une
// correspondance vérifiée (brand-models.ts, champ `supplier`).
export function buildMaterialListText(bom: Bom, projectName: string): string {
  const lines: string[] = [`Liste de matériel — ${projectName || "Schéma"}`, ""];

  for (const group of bom.componentGroups) {
    lines.push(group.category);
    for (const row of group.rows) {
      const label = row.name;
      const ref = row.supplier?.ref ? ` (réf. ${row.supplier.ref})` : "";
      const spec = row.spec ? ` — ${row.spec}` : "";
      lines.push(`- ${row.count}x ${label}${ref}${spec}`);
      // Lien produit sur sa propre ligne : reste lisible même repris tel
      // quel dans un email, et le destinataire retrouve le bon produit sans
      // ambiguïté (retour utilisateur : "simplifier toute la démarche").
      if (row.supplier?.url) lines.push(`  ${row.supplier.url}`);
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
      const awg = row.awg ? ` (AWG ${row.awg})` : "";
      lines.push(`- Section ${row.section}${awg} : ${row.count} câble${row.count > 1 ? "s" : ""} (${metrage})`);
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

  if (bom.lugRows.length > 0) {
    lines.push("Cosses (diamètre indicatif, à vérifier selon la borne réelle)");
    for (const row of bom.lugRows) {
      lines.push(`- ${row.count}x Cosse à œillet ${row.section} / ${row.studDiameter}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
