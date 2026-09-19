import assert from "node:assert/strict";
import test from "node:test";
import type { Edge, Node } from "@xyflow/react";
import { recalculateFuseRatings } from "@/lib/electrical-components/auto-size";
import type { CableEdgeData, ElectricalNodeData } from "@/types/schema";

// Correctif sécurité (même retour client que checks.ts : "DC-DC 30A couvert
// par un fusible 35A") — le bouton "Recalculer tous les calibres de
// fusible" appliquait déjà la marge générique de 1,25x correctement, mais
// ignorait un calibre constructeur vérifié plus élevé (ex. Victron
// Orion-Tr Smart : 60A recommandé pour un modèle 30A) : il aurait proposé
// 40A (marge générique) au lieu du calibre officiel réel.

function node(id: string, componentType: string, data: Record<string, unknown> = {}): Node<ElectricalNodeData> {
  return { id, type: "electrical", position: { x: 0, y: 0 }, data: { componentType, label: componentType, ...data } };
}

function edge(id: string, source: string, sourceHandle: string, target: string, targetHandle: string, cableType = "power-positive"): Edge<CableEdgeData> {
  return { id, source, sourceHandle, target, targetHandle, data: { cableType } };
}

// recalculateFuseRatings dimensionne un fusible sur le courant du
// CONSOMMATEUR en aval (estimateConnectedAmps ne regarde jamais le courant
// nominal d'une source amont) — un consommateur réel en aval est donc
// nécessaire pour que la fonction calcule quoi que ce soit ; le calibre
// constructeur du DC-DC entre alors en jeu comme plancher supplémentaire.
function dcdcFuseFixture(dcdcExtra: Record<string, unknown> = {}) {
  const nodes = [
    node("battery", "battery", { voltage: 12 }),
    node("dcdc", "dcdc", { amperage: 30, ...dcdcExtra }),
    node("fuse", "fuse", { amperage: 5 }),
    // 300W / 12V = 25A de charge réelle en aval — nettement sous le calibre
    // constructeur Victron (60A), pour que le test prouve bien que c'est le
    // plancher constructeur qui l'emporte, pas simplement une charge plus
    // grosse recalculée normalement.
    node("load", "consumer", { powerW: 300 }),
  ];
  const edges = [
    edge("e1", "battery", "positive", "dcdc", "in-positive"),
    edge("e2", "battery", "negative", "dcdc", "in-negative", "power-negative"),
    edge("e3", "dcdc", "out-positive", "fuse", "input"),
    edge("e4", "fuse", "output", "load", "positive"),
    edge("e5", "dcdc", "out-negative", "load", "negative", "power-negative"),
  ];
  return { nodes, edges };
}

test("recalculateFuseRatings applies the generic 1.25x margin for a generic DC-DC", () => {
  const { nodes, edges } = dcdcFuseFixture();
  const { nodes: result, updatedCount } = recalculateFuseRatings(nodes, edges);

  assert.equal(updatedCount, 1);
  // 300W / 12V = 25A, x 1,25 = 31,25A -> 35A (calibre normalisé suivant).
  assert.equal(result.find((n) => n.id === "fuse")?.data.amperage, 35);
});

test("recalculateFuseRatings uses the manufacturer's recommended fuse rating when it exceeds the generic margin", () => {
  const { nodes, edges } = dcdcFuseFixture({ brandModelId: "victron-orion-tr-30a" });
  const { nodes: result, updatedCount } = recalculateFuseRatings(nodes, edges);

  assert.equal(updatedCount, 1);
  // 30A x 1,25 = 37,5A -> 40A generique, mais Victron impose 60A pour ce modele.
  assert.equal(result.find((n) => n.id === "fuse")?.data.amperage, 60);
});

test("recalculateFuseRatings leaves an already-correct manufacturer-rated fuse untouched", () => {
  const { nodes, edges } = dcdcFuseFixture({ brandModelId: "victron-orion-tr-30a" });
  const fuseNode = nodes.find((n) => n.id === "fuse")!;
  fuseNode.data.amperage = 60;

  const { updatedCount } = recalculateFuseRatings(nodes, edges);

  assert.equal(updatedCount, 0);
});
