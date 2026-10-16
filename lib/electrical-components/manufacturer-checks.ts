import type { Node, Edge } from "@xyflow/react";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";
import type { SchemaIssue } from "./checks";
import { getComponentDefinition } from "./definitions";
import { findManufacturerDeviceForEdge, getEdgeParallelRuns, getEdgeSizingLength, isPowerCableType, parseSectionMm2 } from "./auto-size";
import {
  BATTERY_SIDE_HANDLES,
  bandTotalSectionMm2,
  findCableBand,
  formatCableBand,
  getManufacturerSpec,
  type ManufacturerSpec,
} from "./manufacturer-specs";

// Vérifications issues des manuels constructeur (manufacturer-specs.ts) —
// retour utilisateur (10/2026) : "tout rentrer dans les moteurs de
// vérification". Messages en clair avec la valeur du manuel : données
// publiques, visibles en gratuit (décision produit), pas une suggestion
// chiffrée du moteur réservée à Éditeur Plus.

type SchemaNode = Node<ElectricalNodeData>;
type SchemaEdge = Edge<CableEdgeData>;
type FindProtections = (startNodeId: string, startHandle: string, nodes: SchemaNode[], edges: SchemaEdge[]) => SchemaNode[];

function formatMeters(value: number): string {
  return `${value.toLocaleString("fr-FR")} m`;
}

function nodeLabel(node: SchemaNode): string {
  return String(node.data.label ?? getComponentDefinition(node.data.componentType)?.label ?? node.data.componentType);
}

function edgeLabel(edge: SchemaEdge, nodes: SchemaNode[]): string {
  const source = nodes.find((n) => n.id === edge.source);
  const target = nodes.find((n) => n.id === edge.target);
  return `Le câble ${source ? nodeLabel(source) : "?"} → ${target ? nodeLabel(target) : "?"}`;
}

function reference(spec: ManufacturerSpec): SchemaIssue["reference"] {
  return { label: spec.source, sourceUrl: spec.sourceUrl };
}

function computeCableIssues(edge: SchemaEdge, nodes: SchemaNode[]): SchemaIssue[] {
  if (!isPowerCableType(edge.data?.cableType)) return [];
  const device = findManufacturerDeviceForEdge(edge, nodes);
  if (!device) return [];
  const { spec } = device;
  const deviceName = nodeLabel(device.node);
  const issues: SchemaIssue[] = [];
  const sectionMm2 = parseSectionMm2(edge.data?.section);
  const conductors = getEdgeParallelRuns(edge);
  const explicitLength = typeof edge.data?.length === "number" ? edge.data.length : null;

  if (spec.batteryCable?.length) {
    const lengthM = getEdgeSizingLength(edge, nodes);
    const band = findCableBand(spec, lengthM);
    const total = band ? bandTotalSectionMm2(band) : null;
    if (total === null && explicitLength !== null) {
      const maxAdvisedM = Math.max(0, ...spec.batteryCable.filter((b) => b.sectionMm2 !== null).map((b) => b.maxLengthM));
      issues.push({
        id: `${edge.id}-manufacturer-length`,
        targetKind: "edge",
        targetId: edge.id,
        severity: "warning",
        category: "cabling",
        reference: reference(spec),
        message: `${edgeLabel(edge, nodes)} mesure ${formatMeters(explicitLength)} : Victron déconseille plus de ${formatMeters(maxAdvisedM)} de câble batterie pour « ${deviceName} ». Rapprochez l'appareil de la batterie.`,
      });
    } else if (band && total !== null && sectionMm2 !== null && sectionMm2 * conductors < total) {
      const current = conductors > 1 ? `${conductors} × ${sectionMm2} mm²` : `${sectionMm2} mm²`;
      issues.push({
        id: `${edge.id}-manufacturer-section`,
        targetKind: "edge",
        targetId: edge.id,
        severity: "error",
        category: "cabling",
        reference: reference(spec),
        message: `${edgeLabel(edge, nodes)} est en ${current} : Victron préconise ${formatCableBand(band)} pour « ${deviceName} » jusqu'à ${formatMeters(band.maxLengthM)} de câble.`,
      });
    }
  }

  if (spec.maxTerminalMm2 && sectionMm2 !== null && sectionMm2 > spec.maxTerminalMm2) {
    issues.push({
      id: `${edge.id}-manufacturer-terminal`,
      targetKind: "edge",
      targetId: edge.id,
      severity: "warning",
      category: "cabling",
      reference: reference(spec),
      message: `${edgeLabel(edge, nodes)} (${sectionMm2} mm²) ne rentre pas dans la borne de « ${deviceName} » : ${spec.maxTerminalMm2} mm² maximum selon Victron. Rapprochez l'appareil de la batterie, ou passez par un répartiteur (busbar) avec une courte liaison à la section de la borne.`,
    });
  }

  return issues;
}

function computeFuseIssues(device: SchemaNode, spec: ManufacturerSpec, protections: SchemaNode[], side: string): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const deviceName = `${nodeLabel(device)}${side}`;
  for (const protection of protections) {
    const rating = Number(protection.data.amperage) || 0;
    if (rating <= 0) continue;
    const protectionName = nodeLabel(protection);

    if (spec.fuseRangeA) {
      const { min, max } = spec.fuseRangeA;
      if (rating >= min && rating <= max) continue;
      const tooBig = rating > max;
      issues.push({
        id: `${protection.id}-manufacturer-fuse-range-${device.id}`,
        targetKind: "node",
        targetId: protection.id,
        severity: tooBig ? "error" : "warning",
        category: "protection",
        reference: reference(spec),
        message: tooBig
          ? `« ${protectionName} » (${rating} A) dépasse le calibre maximum imposé par Victron pour « ${deviceName} » : fusible de ${min} à ${max} A.`
          : `« ${protectionName} » (${rating} A) est sous le calibre minimum préconisé par Victron pour « ${deviceName} » (${min} à ${max} A) : il risque de sauter en fonctionnement normal.`,
      });
      continue;
    }

    if (spec.recommendedFuseA && rating !== spec.recommendedFuseA) {
      const tooSmall = rating < spec.recommendedFuseA;
      issues.push({
        id: `${protection.id}-manufacturer-fuse-${device.id}`,
        targetKind: "node",
        targetId: protection.id,
        severity: "warning",
        category: "protection",
        reference: reference(spec),
        message: tooSmall
          ? `« ${protectionName} » (${rating} A) est sous le fusible préconisé par Victron pour « ${deviceName} » (${spec.recommendedFuseA} A) : il risque de sauter au démarrage d'une forte charge.`
          : `« ${protectionName} » (${rating} A) dépasse le fusible préconisé par Victron pour « ${deviceName} » (${spec.recommendedFuseA} A) : vérifiez que le câble supporte ce calibre.`,
      });
    }
  }
  return issues;
}

function computeDeviceIssues(device: SchemaNode, spec: ManufacturerSpec, nodes: SchemaNode[], edges: SchemaEdge[], findProtections: FindProtections): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const deviceName = nodeLabel(device);
  const handleGroups = BATTERY_SIDE_HANDLES[device.data.componentType] ?? [];

  handleGroups.forEach(([positiveHandle], groupIndex) => {
    const positiveEdges = edges.filter(
      (e) => (e.source === device.id && e.sourceHandle === positiveHandle) || (e.target === device.id && e.targetHandle === positiveHandle),
    );
    if (positiveEdges.length === 0) return;
    const protections = findProtections(device.id, positiveHandle, nodes, edges);
    // DC-DC : deux fusibles (entrée et sortie) — on précise lequel.
    const side = handleGroups.length > 1 ? (groupIndex === 0 ? " (côté batterie de service)" : " (côté batterie moteur)") : "";
    issues.push(...computeFuseIssues(device, spec, protections, side));

    if (protections.length > 0) return;
    const longestM = Math.max(0, ...positiveEdges.map((e) => (typeof e.data?.length === "number" ? e.data.length : 0)));
    if (spec.externalFuseRequiredBeyondM !== undefined && longestM > spec.externalFuseRequiredBeyondM) {
      issues.push({
        id: `${device.id}-manufacturer-external-fuse`,
        targetKind: "node",
        targetId: device.id,
        severity: "error",
        category: "protection",
        reference: reference(spec),
        message: `« ${deviceName} » est à ${formatMeters(longestM)} de la batterie : au-delà de ${formatMeters(spec.externalFuseRequiredBeyondM)}, Victron impose un fusible ou disjoncteur supplémentaire près de la batterie.`,
      });
    }
    // DC-DC : la sortie est déjà couverte par le contrôle générique des
    // sources de charge ; seule l'entrée (batterie moteur) est ajoutée ici.
    if (spec.fuseBothSides && groupIndex > 0) {
      issues.push({
        id: `${device.id}-manufacturer-input-fuse`,
        targetKind: "node",
        targetId: device.id,
        severity: "error",
        category: "protection",
        reference: reference(spec),
        message: `« ${deviceName} » n'a pas de fusible côté batterie moteur : Victron demande un fusible de chaque côté (entrée et sortie).`,
      });
    }
  });

  if (spec.batteryAh) {
    const totalAh = nodes
      .filter((n) => n.data.componentType === "battery" && (Number(n.data.voltage) || 12) === 12)
      .reduce((sum, n) => sum + (Number(n.data.capacityAh) || 0), 0);
    if (totalAh > 0 && totalAh < spec.batteryAh.min) {
      const range = spec.batteryAh.max ? `${spec.batteryAh.min} à ${spec.batteryAh.max} Ah` : `au moins ${spec.batteryAh.min} Ah`;
      issues.push({
        id: `${device.id}-manufacturer-battery-capacity`,
        targetKind: "node",
        targetId: device.id,
        severity: "warning",
        category: "protection",
        reference: reference(spec),
        message: `« ${deviceName} » : Victron conseille ${range} de batterie, le schéma en compte ${totalAh} Ah. Une batterie trop petite fait chuter la tension et couper l'appareil.`,
      });
    }
  }

  return issues;
}

export function computeManufacturerIssues(nodes: SchemaNode[], edges: SchemaEdge[], findProtections: FindProtections): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  for (const edge of edges) issues.push(...computeCableIssues(edge, nodes));
  for (const node of nodes) {
    const spec = getManufacturerSpec(node.data.brandModelId);
    if (spec) issues.push(...computeDeviceIssues(node, spec, nodes, edges, findProtections));
  }
  return issues;
}
