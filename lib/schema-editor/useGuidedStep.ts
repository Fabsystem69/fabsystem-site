"use client";

import { useEffect, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";
import { GUIDED_BASIC_STEPS, type GuidedStep } from "./guided-tutorial";

type GNode = Node<ElectricalNodeData>;
type GEdge = Edge<CableEdgeData>;

export type GuidedStepInfo =
  | { active: false }
  | { active: true; step: GuidedStep; index: number; total: number; isLast: boolean };

// Lecture seule de l'étape courante — partagée par GuidedTutorial.tsx (le
// bandeau Volta) et ComponentLibrary.tsx (mise en évidence du composant à
// ajouter). Aucun effet de bord ici : voir `useGuidedAutoAdvance` pour
// l'avancement automatique, appelé une seule fois (dans GuidedTutorial.tsx)
// pour ne jamais avancer deux fois la même étape si ce hook est consommé
// par plusieurs composants montés en même temps.
export function useGuidedStep(): GuidedStepInfo {
  const guidedMode = useSchemaStore((s) => s.guidedMode);
  const stepIndex = useSchemaStore((s) => s.guidedStepIndex);

  const step: GuidedStep | undefined = guidedMode ? GUIDED_BASIC_STEPS[stepIndex] : undefined;
  if (!guidedMode || !step) return { active: false };

  return { active: true, step, index: stepIndex, total: GUIDED_BASIC_STEPS.length, isLast: stepIndex === GUIDED_BASIC_STEPS.length - 1 };
}

// Avancement automatique des étapes "task" : dès que `isComplete(nodes,
// edges)` devient vrai, on passe à l'étape suivante. À appeler une seule
// fois dans l'arbre (GuidedTutorial.tsx, toujours monté pendant le mode
// guidé) — jamais dans un composant qui pourrait être monté plusieurs fois
// ou démonté/remonté, sous peine de sauter des étapes.
export function useGuidedAutoAdvance(): void {
  const guidedMode = useSchemaStore((s) => s.guidedMode);
  const stepIndex = useSchemaStore((s) => s.guidedStepIndex);
  const nodes = useSchemaStore((s) => s.nodes);
  const edges = useSchemaStore((s) => s.edges);
  const advanceGuidedStep = useSchemaStore((s) => s.advanceGuidedStep);

  const step: GuidedStep | undefined = guidedMode ? GUIDED_BASIC_STEPS[stepIndex] : undefined;

  // Garde contre le double-appel d'effet de React StrictMode (dev) : sans
  // elle, un seul avancement légitime déclenche deux `advanceGuidedStep()`
  // coup sur coup (le second lit l'index déjà incrémenté via le setter
  // fonctionnel de zustand), sautant une étape. Clé composée (index +
  // référence nodes/edges) plutôt qu'un simple index : les deux appels de
  // StrictMode voient la même référence nodes/edges (rien n'a changé entre
  // les deux), donc le second est bloqué — mais un retour à un index déjà
  // "vu" plus tôt (bouton "← Précédente") avec un nouvel état réel (nodes
  // différents) n'est jamais bloqué à tort.
  const guardRef = useRef<{ index: number; nodes: GNode[]; edges: GEdge[] } | null>(null);
  useEffect(() => {
    if (!guidedMode || !step || step.type !== "task") return;
    const g = guardRef.current;
    if (g && g.index === stepIndex && g.nodes === nodes && g.edges === edges) return;
    if (step.isComplete(nodes, edges)) {
      guardRef.current = { index: stepIndex, nodes, edges };
      advanceGuidedStep();
    }
  }, [guidedMode, step, stepIndex, nodes, edges, advanceGuidedStep]);
}

// Message correctif (retour utilisateur : "un message de volta si on ne
// rajoute pas la bonne chose") : détecte qu'un composant vient d'être ajouté
// alors que l'étape en cours attendait un autre type précis, et propose un
// texte explicatif — jamais culpabilisant, toujours actionnable (doctrine
// Volta §44-45). À appeler une seule fois (GuidedTutorial.tsx), même
// raison que `useGuidedAutoAdvance`.
export function useGuidedMismatch(): string | null {
  const guidedMode = useSchemaStore((s) => s.guidedMode);
  const stepIndex = useSchemaStore((s) => s.guidedStepIndex);
  const nodes = useSchemaStore((s) => s.nodes);
  const [message, setMessage] = useState<string | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const prevStepIndexRef = useRef<number>(stepIndex);

  const step: GuidedStep | undefined = guidedMode ? GUIDED_BASIC_STEPS[stepIndex] : undefined;

  // Étape changée (avancée ou reculée) : un avertissement lié à l'étape
  // précédente n'a plus de sens.
  useEffect(() => {
    if (prevStepIndexRef.current !== stepIndex) {
      prevStepIndexRef.current = stepIndex;
      setMessage(null);
    }
  }, [stepIndex]);

  useEffect(() => {
    const currentIds = new Set(nodes.map((n) => n.id));
    const addedNodes = nodes.filter((n) => !prevIdsRef.current.has(n.id));
    prevIdsRef.current = currentIds;

    if (!guidedMode || !step || step.type !== "task" || !step.libraryType || addedNodes.length === 0) return;

    const matches = addedNodes.some((n) => n.data.componentType === step.libraryType && (!step.libraryPreset || n.data.presetType === step.libraryPreset));
    if (matches) {
      setMessage(null);
      return;
    }
    const wrong = addedNodes[addedNodes.length - 1];
    const wrongDef = getComponentDefinition(String(wrong.data.componentType));
    const wrongLabel = String(wrong.data.label ?? wrongDef?.label ?? wrong.data.componentType);
    setMessage(`« ${wrongLabel} » n'est pas ce qu'il faut à cette étape — regarde le composant surligné dans la bibliothèque à gauche. Tu peux supprimer celui-ci (sélectionne-le puis touche Suppr) et réessayer.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, guidedMode, step]);

  return guidedMode ? message : null;
}
