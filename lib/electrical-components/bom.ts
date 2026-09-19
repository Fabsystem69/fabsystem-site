import { getComponentDefinition, getConsumerPreset, CATEGORY_LABELS } from "./definitions";
import { getCableType } from "./cable-types";
import { getBrandModel, type BrandModel } from "./brand-models";
import { compareBySectionOrder, getRecommendedLugStudDiameter, getScrewTerminalConnectorLabel, isScrewTerminalComponentType } from "./cable-lugs";
import { getAwgEquivalent } from "./section-to-awg";
import { getCableHarmonizationSuggestions, type CableHarmonizationSuggestion } from "./cable-harmonization";
import { formatEuroFromCents } from "@/lib/format";
import { getLugPrices, getCablePricesPerMeter, getFusePrices, type ConsumablePrice } from "./consumable-pricing";
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
  // Prix unitaire connu (brand-models.ts, `supplier.priceCents`) — repris ici
  // au moment de construire la ligne, jamais recalculé ailleurs. `null` (pas
  // 0) quand aucun prix n'est connu, pour ne jamais laisser croire à un
  // composant gratuit dans le total (retour utilisateur : "sortir un devis
  // complet du schéma" — les prix déjà connus n'étaient jusqu'ici jamais
  // affichés ni totalisés nulle part).
  priceCents: number | null;
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
  // Options de prix au mètre (consumable-pricing.ts), triées du moins cher
  // au plus cher — TOUTES affichées, jamais une seule "meilleure" retenue
  // (retour utilisateur : "avoir les deux liens... pour avoir une remise
  // fabsystem négocié avec les partenaire"). Tableau vide si aucun
  // fournisseur ne couvre cette section/couleur.
  priceOptionsPerMeter: ConsumablePrice[];
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

// Cosses/embouts nécessaires pour sertir les câbles (retour utilisateur :
// "un moteur pour calculer les consommables cosses... avec les diamètres de
// vis et la section", puis "un moteur pour le calcul de cosse [tubulaire
// coudée pour] MPPT et DC-DC [et] embout de câble basique pour les petites
// sections") — 1 connecteur par extrémité de câble, sauf bus de données
// (connecteurs préconfectionnés, jamais de cosse à sertir). Le type dépend
// du composant à chaque extrémité (voir SCREW_TERMINAL_COMPONENT_TYPES dans
// cable-lugs.ts) : borne à vis/cage (MPPT, PWM, DC-DC, disjoncteur DC) →
// embout ou cosse tubulaire coudée selon la section ; sinon → cosse à
// œillet, diamètre déduit uniquement de la section. Reste indicatif dans
// tous les cas, un appareil réel précis pouvant différer du cas général.
export interface BomLugRow {
  section: string;
  connectorLabel: string;
  count: number;
  // Options de prix (consumable-pricing.ts), triées du moins cher au plus
  // cher — toutes affichées, même principe que BomCableRow.priceOptionsPerMeter.
  priceOptions: ConsumablePrice[];
}

// Une ligne "panier" pour un fournisseur donné — voir Bom.itemsBySupplier.
export interface BomSupplierItem {
  label: string;
  // Texte libre plutôt qu'un simple nombre : "2x" pour un composant/une
  // cosse, "12,5 m" pour un câble — deux unités différentes selon la ligne,
  // jamais mélangées dans un seul champ numérique.
  quantityLabel: string;
  priceCents: number;
  url: string;
  ref?: string;
}

export interface BomSupplierGroup {
  name: string;
  items: BomSupplierItem[];
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
  // Coût total connu (retour utilisateur : "sortir un devis complet du
  // schéma") — somme des lignes de composants dont le prix est connu.
  // `null` (jamais 0) tant qu'aucune ligne n'a de prix connu, pour ne
  // jamais afficher un total qui ferait croire que le matériel ne coûte
  // rien — même principe que `BomCableRow.totalLengthM` ci-dessus.
  totalPriceCents: number | null;
  // true dès qu'au moins un composant du schéma n'a aucun prix connu —
  // permet d'afficher "Total partiel" plutôt qu'un total qui a l'air
  // complet alors qu'il ne couvre qu'une partie du matériel.
  hasUnpricedComponents: boolean;
  // Détail par fournisseur (regroupé sur `supplier.name`, déjà orthographié
  // de façon identique dans tout brand-models.ts) — jamais un seul nom de
  // fournisseur codé en dur : ce tableau reste correct que 0, 1 ou N
  // fournisseurs apparaissent dans ce schéma précis.
  totalPriceCentsByFournisseur: { name: string; priceCents: number }[];
  // Retour utilisateur : "faciliter aussi le travail si je dois créer des
  // panier pour les client" — les mêmes lignes que ci-dessus (composants,
  // câbles, cosses), regroupées par fournisseur plutôt que par catégorie,
  // pour remplir un panier fournisseur par fournisseur sans reparcourir
  // toute la liste. Une ligne par option de prix connue : un câble avec
  // deux fournisseurs apparaît dans les deux groupes, jamais un seul choisi
  // à la place de l'utilisateur.
  itemsBySupplier: BomSupplierGroup[];
}

// Retour utilisateur : "on doit noter de manière claire avec un coaching
// ils ont droit à une remise particulière chez les fournisseurs
// partenaire" — affiché dès qu'au moins un lien fournisseur apparaît dans
// le récap, jamais un pourcentage exact promis (variable selon le
// fournisseur/la négociation) ni un nom de fournisseur en dur.
export const COACHING_DISCOUNT_NOTE =
  "💡 Remise partenaire : l'accompagnement FabSystem donne accès à une remise de 5 à 10 % chez nos fournisseurs partenaires. Renseignements : https://www.fabsystem.fr/prestations/accompagnement";

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
  const componentTypeById = new Map(nodes.map((node) => [node.id, String(node.data?.componentType ?? "")]));

  for (const node of nodes) {
    const def = getComponentDefinition(String(node.data.componentType));
    if (!def) continue;
    const name = displayName(def.type, String(node.data.label ?? def.label), node.data);
    const spec = specLabel(node.data);
    const brandModelId = typeof node.data.brandModelId === "string" ? node.data.brandModelId : null;
    let supplier = brandModelId ? getBrandModel(brandModelId)?.supplier ?? null : null;
    // Repli automatique pour un fusible sans modèle de marque choisi : un
    // fusible EST un composant du schéma (pas dessiné à la volée comme une
    // cosse), donc il a déjà sa ligne ici — un modèle de marque
    // explicitement choisi par l'utilisateur passe toujours avant ce repli
    // (voir consumable-pricing.ts).
    if (!supplier && def.type === "fuse") {
      const fuseType = typeof node.data.fuseType === "string" ? node.data.fuseType : "";
      const amperage = Number(node.data.amperage) || 0;
      const fallback = amperage > 0 ? getFusePrices(fuseType, amperage)[0] : undefined;
      if (fallback) supplier = { name: fallback.supplierName, priceCents: fallback.priceCents, url: fallback.url, ref: fallback.ref };
    }
    const priceCents = supplier?.priceCents ?? null;
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
    else rows.set(key, { name, spec, count: 1, supplier, priceCents });
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
  const byLug = new Map<string, { section: string; connectorLabel: string; count: number }>();
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

    // 1 connecteur par extrémité de câble — rien si la section n'est pas
    // renseignée, impossible de recommander quoi que ce soit sans elle. Le
    // type dépend du composant à CHAQUE extrémité : un câble busbar → MPPT
    // a besoin d'une cosse à œillet d'un côté et d'un embout/cosse coudée
    // de l'autre, jamais du même connecteur aux deux bouts.
    const ringLugStud = getRecommendedLugStudDiameter(section);
    const ringLugLabel = ringLugStud ? `Cosse à œillet / ${ringLugStud}` : null;
    const addConnector = (componentType: string | undefined) => {
      const label = isScrewTerminalComponentType(componentType) ? getScrewTerminalConnectorLabel(section) : ringLugLabel;
      if (!label) return;
      const lugKey = `${section}__${label}`;
      const lugEntry = byLug.get(lugKey) ?? { section, connectorLabel: label, count: 0 };
      lugEntry.count += 1;
      byLug.set(lugKey, lugEntry);
    };
    addConnector(componentTypeById.get(edge.source));
    addConnector(componentTypeById.get(edge.target));
  }

  const cableRows: BomCableRow[] = Array.from(bySection.values())
    .map((v) => ({
      section: v.section,
      cableTypeLabel: v.cableTypeLabel,
      awg: getAwgEquivalent(v.section),
      count: v.count,
      totalLengthM: v.totalLengthM > 0 ? Math.round(v.totalLengthM * 10) / 10 : null,
      missingLengthCount: v.missingLengthCount,
      priceOptionsPerMeter: getCablePricesPerMeter(v.section, v.cableTypeLabel),
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

  const lugRows: BomLugRow[] = Array.from(byLug.values())
    .map((v) => ({ ...v, priceOptions: getLugPrices(v.section, v.connectorLabel) }))
    .sort((a, b) => compareBySectionOrder(a.section, b.section) || a.connectorLabel.localeCompare(b.connectorLabel));

  // Total connu + détail par fournisseur (retour utilisateur : "sortir un
  // devis complet du schéma", puis reprécisé "une vraie liste de courses
  // avec les liens") — `null` tant qu'aucune ligne n'a de prix connu, jamais
  // 0 (voir le commentaire sur Bom.totalPriceCents). Le total retient la
  // moins chère des options affichées par ligne (cosses/câbles montrent
  // TOUTES leurs options, voir priceOptions/priceOptionsPerMeter, mais un
  // seul chiffre doit entrer dans le total pour ne pas compter deux fois le
  // même achat).
  let totalPriceCents: number | null = null;
  let hasUnpricedComponents = false;
  const priceByFournisseur = new Map<string, number>();
  const addToTotal = (priceCents: number | null, supplierName: string | undefined, count: number) => {
    if (priceCents === null) {
      hasUnpricedComponents = true;
      return;
    }
    const lineTotal = priceCents * count;
    totalPriceCents = (totalPriceCents ?? 0) + lineTotal;
    if (supplierName) priceByFournisseur.set(supplierName, (priceByFournisseur.get(supplierName) ?? 0) + lineTotal);
  };
  for (const group of componentGroups) {
    for (const row of group.rows) addToTotal(row.priceCents, row.supplier?.name, row.count);
  }
  for (const row of cableRows) {
    // Jamais deviner un coût pour un métrage non renseigné.
    if (row.totalLengthM === null) continue;
    const cheapest = row.priceOptionsPerMeter[0];
    addToTotal(cheapest ? Math.round(cheapest.priceCents * row.totalLengthM) : null, cheapest?.supplierName, 1);
  }
  for (const row of lugRows) {
    const cheapest = row.priceOptions[0];
    addToTotal(cheapest?.priceCents ?? null, cheapest?.supplierName, row.count);
  }
  const totalPriceCentsByFournisseur = Array.from(priceByFournisseur.entries())
    .map(([name, priceCents]) => ({ name, priceCents }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  // Retour utilisateur : "faciliter aussi le travail si je dois créer des
  // panier pour les client" — TOUTES les options connues (pas seulement la
  // moins chère retenue pour le total ci-dessus), pour pouvoir remplir un
  // panier fournisseur par fournisseur.
  const itemsBySupplierMap = new Map<string, BomSupplierItem[]>();
  const addSupplierItem = (supplierName: string, item: BomSupplierItem) => {
    const items = itemsBySupplierMap.get(supplierName) ?? [];
    items.push(item);
    itemsBySupplierMap.set(supplierName, items);
  };
  for (const group of componentGroups) {
    for (const row of group.rows) {
      if (!row.supplier || row.priceCents === null) continue;
      addSupplierItem(row.supplier.name, {
        label: row.name,
        quantityLabel: `${row.count}x`,
        priceCents: row.priceCents,
        url: row.supplier.url,
        ref: row.supplier.ref,
      });
    }
  }
  for (const row of cableRows) {
    if (row.totalLengthM === null) continue;
    for (const option of row.priceOptionsPerMeter) {
      addSupplierItem(option.supplierName, {
        label: `Câble ${row.section} (${row.cableTypeLabel})`,
        quantityLabel: `${String(row.totalLengthM).replace(".", ",")} m`,
        priceCents: option.priceCents,
        url: option.url,
        ref: option.ref,
      });
    }
  }
  for (const row of lugRows) {
    for (const option of row.priceOptions) {
      addSupplierItem(option.supplierName, {
        label: `${row.connectorLabel} — ${row.section}`,
        quantityLabel: `${row.count}x`,
        priceCents: option.priceCents,
        url: option.url,
        ref: option.ref,
      });
    }
  }
  const itemsBySupplier: BomSupplierGroup[] = Array.from(itemsBySupplierMap.entries())
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return {
    componentGroups,
    cableRows,
    dataBusRows,
    lugRows,
    cableHarmonizationSuggestions,
    optimized: Boolean(options?.harmonizeSmallSections),
    totalComponents: nodes.length,
    totalCables: edges.length,
    totalPriceCents,
    hasUnpricedComponents,
    totalPriceCentsByFournisseur,
    itemsBySupplier,
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
      // Prix seulement quand connu : jamais "0 €" pour un composant dont le
      // prix n'a simplement pas été renseigné (retour utilisateur : "sortir
      // un devis complet du schéma").
      const price = row.priceCents !== null ? ` — ${formatEuroFromCents(row.priceCents * row.count)}` : "";
      lines.push(`- ${row.count}x ${label}${ref}${spec}${price}`);
      // Lien produit sur sa propre ligne : reste lisible même repris tel
      // quel dans un email, et le destinataire retrouve le bon produit sans
      // ambiguïté (retour utilisateur : "simplifier toute la démarche").
      if (row.supplier?.url) lines.push(`  ${row.supplier.url}`);
    }
    lines.push("");
  }

  if (bom.totalPriceCents !== null) {
    const partiel = bom.hasUnpricedComponents ? " (partiel — composants sans prix connu exclus)" : "";
    lines.push(`Total estimé${partiel} : ${formatEuroFromCents(bom.totalPriceCents)}`);
    for (const entry of bom.totalPriceCentsByFournisseur) {
      lines.push(`  dont ${formatEuroFromCents(entry.priceCents)} chez ${entry.name}`);
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
      // Toutes les options fournisseur, pas seulement la moins chère (retour
      // utilisateur : "avoir les deux liens").
      for (const option of row.priceOptionsPerMeter) {
        lines.push(`  ${formatEuroFromCents(option.priceCents)}/m chez ${option.supplierName} — ${option.url}`);
      }
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
    lines.push("Cosses / embouts (indicatif, à vérifier selon la borne réelle)");
    for (const row of bom.lugRows) {
      lines.push(`- ${row.count}x ${row.connectorLabel} — ${row.section}`);
      for (const option of row.priceOptions) {
        lines.push(`  ${formatEuroFromCents(option.priceCents)} chez ${option.supplierName} — ${option.url}`);
      }
    }
    lines.push("");
  }

  // Retour utilisateur : "faciliter aussi le travail si je dois créer des
  // panier pour les client" — les mêmes lignes que ci-dessus, regroupées
  // par fournisseur pour remplir un panier fournisseur par fournisseur sans
  // reparcourir toute la liste.
  if (bom.itemsBySupplier.length > 0) {
    lines.push("Panier par fournisseur");
    for (const supplierGroup of bom.itemsBySupplier) {
      lines.push(supplierGroup.name);
      for (const item of supplierGroup.items) {
        const ref = item.ref ? ` (réf. ${item.ref})` : "";
        lines.push(`- ${item.quantityLabel} ${item.label}${ref} — ${formatEuroFromCents(item.priceCents)}`);
        lines.push(`  ${item.url}`);
      }
    }
    lines.push("");
  }

  if (bom.totalPriceCentsByFournisseur.length > 0) {
    lines.push(COACHING_DISCOUNT_NOTE);
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
    lines.push(csvLine(["Élément", "Caractéristiques", "Quantité", "Prix", "Référence", "URL"]));
    for (const row of group.rows) {
      const price = row.priceCents !== null ? formatEuroFromCents(row.priceCents * row.count) : "";
      lines.push(csvLine([row.name, row.spec, String(row.count), price, row.supplier?.ref ?? "", row.supplier?.url ?? ""]));
    }
    lines.push("");
  }

  if (bom.totalPriceCents !== null) {
    const label = bom.hasUnpricedComponents ? "Total estimé (partiel — composants sans prix connu exclus)" : "Total estimé";
    lines.push(csvLine([label, formatEuroFromCents(bom.totalPriceCents)]));
    for (const entry of bom.totalPriceCentsByFournisseur) {
      lines.push(csvLine([`dont chez ${entry.name}`, formatEuroFromCents(entry.priceCents)]));
    }
    lines.push("");
  }

  if (bom.cableRows.length > 0) {
    lines.push(csvLine([bom.optimized ? "Câbles (sections optimisées)" : "Câbles"]));
    lines.push(csvLine(["Section", "Couleur / type", "Équivalent AWG", "Nombre de câbles", "Métrage total (m)", "Prix/m", "Fournisseur", "URL"]));
    for (const row of bom.cableRows) {
      const metrage = row.totalLengthM !== null ? String(row.totalLengthM).replace(".", ",") : "Non renseigné";
      const base = [row.section, row.cableTypeLabel, row.awg ?? "", String(row.count), metrage];
      // Une ligne par option fournisseur (retour utilisateur : "avoir les
      // deux liens") — jamais une seule "meilleure" ligne qui en cacherait
      // une autre ; une seule ligne, colonnes vides, si aucune option connue.
      if (row.priceOptionsPerMeter.length === 0) {
        lines.push(csvLine([...base, "", "", ""]));
      } else {
        for (const option of row.priceOptionsPerMeter) {
          lines.push(csvLine([...base, formatEuroFromCents(option.priceCents), option.supplierName, option.url]));
        }
      }
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
    lines.push(csvLine(["Cosses / embouts (indicatif, à vérifier selon la borne réelle)"]));
    lines.push(csvLine(["Section", "Type de cosse / embout", "Quantité", "Prix unitaire", "Fournisseur", "URL"]));
    for (const row of bom.lugRows) {
      const base = [row.section, row.connectorLabel, String(row.count)];
      if (row.priceOptions.length === 0) {
        lines.push(csvLine([...base, "", "", ""]));
      } else {
        for (const option of row.priceOptions) {
          lines.push(csvLine([...base, formatEuroFromCents(option.priceCents), option.supplierName, option.url]));
        }
      }
    }
    lines.push("");
  }

  if (bom.itemsBySupplier.length > 0) {
    lines.push(csvLine(["Panier par fournisseur"]));
    for (const supplierGroup of bom.itemsBySupplier) {
      lines.push(csvLine([supplierGroup.name]));
      lines.push(csvLine(["Élément", "Quantité", "Prix", "Référence", "URL"]));
      for (const item of supplierGroup.items) {
        lines.push(csvLine([item.label, item.quantityLabel, formatEuroFromCents(item.priceCents), item.ref ?? "", item.url]));
      }
      lines.push("");
    }
  }

  if (bom.totalPriceCentsByFournisseur.length > 0) {
    lines.push(csvLine([COACHING_DISCOUNT_NOTE]));
  }

  return lines.join("\r\n").trim();
}
