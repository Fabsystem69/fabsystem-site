import { getComponentDefinition, getConsumerPreset, CATEGORY_LABELS } from "./definitions";
import { getCableType } from "./cable-types";
import { getBrandModel, type BrandModel } from "./brand-models";
import { compareBySectionOrder, getRecommendedLugStudDiameter } from "./cable-lugs";
import { getAwgEquivalent } from "./section-to-awg";
import { getCableHarmonizationSuggestions, type CableHarmonizationSuggestion } from "./cable-harmonization";
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
  // Type de câble (couleur) — retour utilisateur : "savoir le nombre de
  // mètres rouge et noir à prendre". Une ligne par section ET par couleur :
  // deux câbles de même section mais l'un "Puissance +" et l'autre
  // "Puissance −" ne sont plus fusionnés en un seul total qui masquerait
  // combien acheter de chaque couleur.
  cableTypeLabel: string;
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
  // Suggestion d'achat (retour utilisateur, voir cable-harmonization.ts) :
  // toujours calculée sur les sections RÉELLES, que ce Bom soit "réel" ou
  // "optimisé" — sert à afficher ce qui a été (ou pourrait être) harmonisé.
  cableHarmonizationSuggestions: CableHarmonizationSuggestion[];
  // true si `computeBom` a été appelé avec `harmonizeSmallSections: true` —
  // les sections réelles n'ont pas changé, seul cet affichage regroupe les
  // petites sections vers leur cible (voir computeBom).
  optimized: boolean;
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
  // Un modèle de marque choisi (brand-models.ts) ne changeait jusqu'ici que
  // les caractéristiques numériques, jamais le nom affiché — la liste de
  // matériel montrait "Régulateur MPPT" même pour un Victron SmartSolar
  // précis. Nécessaire pour que l'export fournisseur porte un nom
  // identifiable (retour utilisateur : "avec leur appellation"). Vérifié
  // AVANT le préréglage générique ci-dessous : un appareil "consumer" avec
  // à la fois un presetType (ex. "pompe-eau") ET un brandModelId (ex.
  // Pentair Shurflo) doit afficher le produit précis, pas retomber sur le
  // libellé générique du préréglage juste parce que presetType est déjà
  // renseigné.
  if (typeof data.brand === "string" && data.brand && typeof data.model === "string" && data.model) {
    return `${data.brand} ${data.model}`;
  }
  if (componentType === "consumer" && typeof data.presetType === "string") {
    const preset = getConsumerPreset(data.presetType);
    if (preset && preset.value !== "generique") return preset.label;
  }
  return label;
}

export function computeBom(
  nodes: Node[],
  edges: Edge[],
  options?: { harmonizeSmallSections?: boolean }
): Bom {
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

  // Passe 1 : total réel par section ET PAR COULEUR (câbles avec longueur
  // connue, hors bus de données) — une bobine s'achète par couleur (retour
  // utilisateur : "1mm² 18m mais en fait ça fait une bobine de rouge et une
  // noire, la suggestion doit faire attention à la couleur pas juste la
  // section"), donc le seuil doit s'évaluer par couleur, jamais sur le
  // total toutes couleurs confondues.
  const rawTotalsByColor = new Map<string, { section: string; cableTypeLabel: string; totalLengthM: number }>();
  for (const edge of edges) {
    if (edge.data?.cableType === "data-bus") continue;
    const length = Number(edge.data?.length);
    if (!(Number.isFinite(length) && length > 0)) continue;
    const section = String(edge.data?.section || "Section non renseignée");
    const cableTypeLabel = getCableType(String(edge.data?.cableType ?? ""))?.label ?? "Autre";
    const key = `${section}__${cableTypeLabel}`;
    const entry = rawTotalsByColor.get(key) ?? { section, cableTypeLabel, totalLengthM: 0 };
    entry.totalLengthM += length;
    rawTotalsByColor.set(key, entry);
  }
  const cableHarmonizationSuggestions = getCableHarmonizationSuggestions(rawTotalsByColor);
  // Vue "optimisée" (retour utilisateur : "possibilité du coup de passer
  // tout le schéma en version câble optimisé") : ici, purement un affichage
  // différent du même schéma — les sections réelles ne sont modifiées que
  // par l'action dédiée applyCableHarmonization (useSchemaStore.ts), jamais
  // par un simple calcul d'affichage. Clé section+couleur : ne redirige que
  // la couleur réellement sous le seuil, jamais l'autre couleur de la même
  // section si elle en a assez pour justifier sa propre bobine.
  const sectionRedirect = options?.harmonizeSmallSections
    ? new Map(cableHarmonizationSuggestions.map((s) => [`${s.section}__${s.cableTypeLabel}`, s.targetSection]))
    : new Map<string, string>();

  const bySection = new Map<string, { section: string; cableTypeLabel: string; count: number; totalLengthM: number; missingLengthCount: number }>();
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

    const rawSection = String(edge.data?.section || "Section non renseignée");
    const cableTypeLabel = getCableType(String(edge.data?.cableType ?? ""))?.label ?? "Autre";
    const section = sectionRedirect.get(`${rawSection}__${cableTypeLabel}`) ?? rawSection;
    const key = `${section}__${cableTypeLabel}`;
    const entry = bySection.get(key) ?? { section, cableTypeLabel, count: 0, totalLengthM: 0, missingLengthCount: 0 };
    entry.count += 1;
    if (hasLength) entry.totalLengthM += length;
    else entry.missingLengthCount += 1;
    bySection.set(key, entry);

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

  const cableRows: BomCableRow[] = Array.from(bySection.values())
    .map((v) => ({
      section: v.section,
      cableTypeLabel: v.cableTypeLabel,
      awg: getAwgEquivalent(v.section),
      count: v.count,
      totalLengthM: v.totalLengthM > 0 ? Math.round(v.totalLengthM * 10) / 10 : null,
      missingLengthCount: v.missingLengthCount,
    }))
    .sort((a, b) => compareBySectionOrder(a.section, b.section) || a.cableTypeLabel.localeCompare(b.cableTypeLabel));

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

  return {
    componentGroups,
    cableRows,
    dataBusRows,
    lugRows,
    cableHarmonizationSuggestions,
    optimized: Boolean(options?.harmonizeSmallSections),
    totalComponents: nodes.length,
    totalCables: edges.length,
  };
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
    lines.push(bom.optimized ? "Câbles (sections optimisées)" : "Câbles");
    for (const row of bom.cableRows) {
      const metrage =
        row.totalLengthM !== null
          ? `${String(row.totalLengthM).replace(".", ",")} m`
          : `métrage non renseigné`;
      const awg = row.awg ? ` (AWG ${row.awg})` : "";
      lines.push(`- Section ${row.section}${awg} — ${row.cableTypeLabel} : ${row.count} câble${row.count > 1 ? "s" : ""} (${metrage})`);
    }
    lines.push("");
  }

  if (bom.cableHarmonizationSuggestions.length > 0) {
    lines.push(
      bom.optimized
        ? "Sections harmonisées automatiquement (regroupées ci-dessus, aucune bobine dédiée pour un petit métrage) :"
        : "💡 Suggestion — sections harmonisables (regrouper évite d'acheter une bobine dédiée pour un petit métrage) :"
    );
    for (const suggestion of bom.cableHarmonizationSuggestions) {
      const total = String(Math.round(suggestion.totalLengthM * 10) / 10).replace(".", ",");
      lines.push(`- ${suggestion.section} — ${suggestion.cableTypeLabel} (${total} m au total) → ${suggestion.targetSection}`);
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

// Export Excel (retour utilisateur : "un bouton export en excel") — CSV
// avec point-virgule (convention Excel en locale française, où la virgule
// est déjà le séparateur décimal) et BOM UTF-8 (voir downloadMaterialListCsv,
// features/schemas/export.ts) pour qu'Excel affiche correctement les
// accents sans passer par un assistant d'import.
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function csvLine(cells: string[]): string {
  return cells.map(csvCell).join(";");
}

export function buildMaterialListCsv(bom: Bom, projectName: string): string {
  const lines: string[] = [csvLine([`Liste de matériel — ${projectName || "Schéma"}`]), ""];

  for (const group of bom.componentGroups) {
    lines.push(csvLine([group.category]));
    lines.push(csvLine(["Élément", "Caractéristiques", "Quantité", "Référence", "URL"]));
    for (const row of group.rows) {
      lines.push(csvLine([row.name, row.spec, String(row.count), row.supplier?.ref ?? "", row.supplier?.url ?? ""]));
    }
    lines.push("");
  }

  if (bom.cableRows.length > 0) {
    lines.push(csvLine([bom.optimized ? "Câbles (sections optimisées)" : "Câbles"]));
    lines.push(csvLine(["Section", "Couleur / type", "Équivalent AWG", "Nombre de câbles", "Métrage total (m)"]));
    for (const row of bom.cableRows) {
      const metrage = row.totalLengthM !== null ? String(row.totalLengthM).replace(".", ",") : "Non renseigné";
      lines.push(csvLine([row.section, row.cableTypeLabel, row.awg ?? "", String(row.count), metrage]));
    }
    lines.push("");
  }

  if (bom.cableHarmonizationSuggestions.length > 0) {
    lines.push(csvLine([bom.optimized ? "Sections harmonisées automatiquement" : "Suggestion — sections harmonisables"]));
    lines.push(csvLine(["Section", "Couleur / type", "Total (m)", "Vers"]));
    for (const suggestion of bom.cableHarmonizationSuggestions) {
      const total = String(Math.round(suggestion.totalLengthM * 10) / 10).replace(".", ",");
      lines.push(csvLine([suggestion.section, suggestion.cableTypeLabel, total, suggestion.targetSection]));
    }
    lines.push("");
  }

  if (bom.dataBusRows.length > 0) {
    lines.push(csvLine(["Câbles de données"]));
    lines.push(csvLine(["Type", "Nombre de câbles", "Longueur moyenne (m)"]));
    for (const row of bom.dataBusRows) {
      lines.push(csvLine([row.label, String(row.count), row.averageLengthM !== null ? String(row.averageLengthM).replace(".", ",") : "Non renseigné"]));
    }
    lines.push("");
  }

  if (bom.lugRows.length > 0) {
    lines.push(csvLine(["Cosses (diamètre indicatif, à vérifier selon la borne réelle)"]));
    lines.push(csvLine(["Section", "Diamètre de vis", "Quantité"]));
    for (const row of bom.lugRows) {
      lines.push(csvLine([row.section, row.studDiameter, String(row.count)]));
    }
    lines.push("");
  }

  return lines.join("\r\n").trim();
}
