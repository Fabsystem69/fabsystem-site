import type { Node, Edge } from "@xyflow/react";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

// Mode guidé pas à pas (retour utilisateur : "un schéma basique batterie,
// coupe circuit, distributeur, éclairage et prise USB en mode guidé étape
// par étape", puis "explique les fonctions principales... un vrai
// tutorial", puis "il manque... la platine de distribution avec fusible et
// des interrupteurs, même si c'est basique je veux un truc réalisable sans
// danger") — une suite fixe et déterministe d'étapes, chacune vérifiée sur
// l'état réel du schéma (jamais un texte généré à la volée, cohérent avec
// la doctrine Volta — voir docs/masters/MASTER-07-VOLTA-SUIVI.md §5).
//
// Chaîne de protection volontairement réaliste plutôt que simplifiée à
// l'extrême : Batterie → Fusible principal → Coupe-circuit → Platine de
// fusibles (chaque sortie déjà protégée) → Interrupteur dédié par appareil
// → Éclairage / Prise USB. C'est la structure minimale "sans danger" d'une
// installation 12V (protection au plus près de la source, coupure
// générale, protection individuelle par circuit), pas juste un exercice de
// glisser-déposer.
//
// Deux types d'étape :
// - "task" : une action attendue dans le schéma, vérifiée par `isComplete`
//   et qui fait avancer automatiquement dès qu'elle est faite ;
// - "explain" : un point d'explication sans action à détecter (intro,
//   conclusion) — avance uniquement via le bouton "Suivant" de
//   GuidedTutorial.tsx (voir `guidedStepIndex` dans useSchemaStore).

type GNode = Node<ElectricalNodeData>;
type GEdge = Edge<CableEdgeData>;

interface GuidedStepBase {
  id: string;
  instruction: string;
  pose?: "neutre" | "confiante" | "perplexe" | "action";
}

export interface GuidedTaskStep extends GuidedStepBase {
  type: "task";
  /** Type de composant à mettre en évidence dans la bibliothèque tant que
   * l'étape n'est pas complète (undefined pour une étape "relier deux
   * bornes", qui ne pointe vers aucun élément de la bibliothèque). */
  libraryType?: string;
  /** Préréglage à cibler pour un composant "consumer" (plusieurs entrées de
   * bibliothèque partagent le même `libraryType`). */
  libraryPreset?: string;
  isComplete: (nodes: GNode[], edges: GEdge[]) => boolean;
}

export interface GuidedExplainStep extends GuidedStepBase {
  type: "explain";
  cta: string;
}

export type GuidedStep = GuidedTaskStep | GuidedExplainStep;

function findNode(nodes: GNode[], componentType: string, presetType?: string): GNode | undefined {
  return nodes.find((n) => n.data.componentType === componentType && (!presetType || n.data.presetType === presetType));
}

function findNodes(nodes: GNode[], componentType: string): GNode[] {
  return nodes.filter((n) => n.data.componentType === componentType);
}

type HandleSpec = string | ((handle: string) => boolean);

function matchesHandle(spec: HandleSpec, h: string): boolean {
  return typeof spec === "function" ? spec(h) : h === spec;
}

function isConnected(edges: GEdge[], aId: string | undefined, aHandle: HandleSpec, bId: string | undefined, bHandle: HandleSpec): boolean {
  if (!aId || !bId) return false;
  return edges.some(
    (e) =>
      (e.source === aId && matchesHandle(aHandle, e.sourceHandle ?? "") && e.target === bId && matchesHandle(bHandle, e.targetHandle ?? "")) ||
      (e.target === aId && matchesHandle(aHandle, e.targetHandle ?? "") && e.source === bId && matchesHandle(bHandle, e.sourceHandle ?? "")),
  );
}

const isOutputHandle = (h: string) => h.startsWith("out-");

// Trouve un Interrupteur qui relie déjà la Platine de fusibles à `targetId`
// (borne `targetHandle`), en excluant éventuellement celui déjà utilisé pour
// un autre appareil — plusieurs "switch" existent dans ce gabarit (un par
// appareil), il faut identifier LEQUEL dessert quel appareil plutôt que de
// supposer une instance unique.
function circuitSwitchId(nodes: GNode[], edges: GEdge[], fuseBlockId: string | undefined, targetId: string | undefined, targetHandle: string, excludeId?: string): string | undefined {
  if (!fuseBlockId || !targetId) return undefined;
  return findNodes(nodes, "switch").find(
    (sw) => sw.id !== excludeId && isConnected(edges, fuseBlockId, isOutputHandle, sw.id, "input") && isConnected(edges, sw.id, "output", targetId, targetHandle),
  )?.id;
}

export const GUIDED_BASIC_STEPS: GuidedStep[] = [
  {
    id: "intro",
    type: "explain",
    pose: "confiante",
    instruction:
      "Bienvenue ! On va construire ensemble un premier schéma simple mais réaliste, avec une vraie chaîne de protection. Pour ajouter un composant : fais-le glisser depuis la bibliothèque à gauche (ou clique dessus, il arrive au centre). Pour le relier à un autre : clique-glisse d'une borne vers une autre borne. Prêt ?",
    cta: "Commencer →",
  },
  {
    id: "add-battery",
    type: "task",
    pose: "action",
    instruction: "Ajoute une Batterie (famille Batterie) : la source d'énergie de toute l'installation — tout part d'elle, et tout doit y revenir.",
    libraryType: "battery",
    isComplete: (nodes) => !!findNode(nodes, "battery"),
  },
  {
    id: "add-fuse",
    type: "task",
    pose: "action",
    instruction: "Ajoute un Fusible (famille Protection & câblage) : il doit toujours être au plus près du + de la batterie — c'est lui qui protège le câble en cas de court-circuit.",
    libraryType: "fuse",
    isComplete: (nodes) => !!findNode(nodes, "fuse"),
  },
  {
    id: "connect-battery-fuse",
    type: "task",
    pose: "neutre",
    instruction: "Relie la borne + de la Batterie à l'entrée (IN) du Fusible. Une fenêtre va te proposer automatiquement une section de câble calculée à partir du courant et de la distance : regarde-la, ajuste si besoin, puis clique « Appliquer ».",
    isComplete: (nodes, edges) => isConnected(edges, findNode(nodes, "battery")?.id, "positive", findNode(nodes, "fuse")?.id, "input"),
  },
  {
    id: "add-switch",
    type: "task",
    pose: "action",
    instruction: "Ajoute un Coupe-circuit (même famille) : l'interrupteur principal, juste après le fusible — il coupe toute l'installation d'un geste.",
    libraryType: "battery-switch",
    isComplete: (nodes) => !!findNode(nodes, "battery-switch"),
  },
  {
    id: "connect-fuse-switch",
    type: "task",
    pose: "neutre",
    instruction: "Relie la sortie (OUT) du Fusible à l'entrée (IN) du Coupe-circuit.",
    isComplete: (nodes, edges) => isConnected(edges, findNode(nodes, "fuse")?.id, "output", findNode(nodes, "battery-switch")?.id, "input"),
  },
  {
    id: "add-fuseblock",
    type: "task",
    pose: "action",
    instruction: "Ajoute une Platine de fusibles (même famille) : chaque sortie a déjà son propre fusible intégré, pour protéger individuellement chaque appareil branché dessus.",
    libraryType: "fuse-block",
    isComplete: (nodes) => !!findNode(nodes, "fuse-block"),
  },
  {
    id: "connect-switch-fuseblock",
    type: "task",
    pose: "neutre",
    instruction: "Relie la sortie (OUT) du Coupe-circuit à l'entrée (IN) de la Platine de fusibles.",
    isComplete: (nodes, edges) => isConnected(edges, findNode(nodes, "battery-switch")?.id, "output", findNode(nodes, "fuse-block")?.id, "input"),
  },
  {
    id: "add-light",
    type: "task",
    pose: "action",
    instruction: "Ajoute un Éclairage LED (famille Appareils) : notre premier consommateur.",
    libraryType: "consumer",
    libraryPreset: "eclairage-led",
    isComplete: (nodes) => !!findNode(nodes, "consumer", "eclairage-led"),
  },
  {
    id: "add-switch-light",
    type: "task",
    pose: "action",
    instruction: "Ajoute un Interrupteur (famille Protection & câblage) : il permettra d'allumer/éteindre l'éclairage indépendamment du reste.",
    libraryType: "switch",
    isComplete: (nodes) => findNodes(nodes, "switch").length >= 1,
  },
  {
    id: "connect-light-branch",
    type: "task",
    pose: "neutre",
    instruction: "Relie une sortie de la Platine à l'Interrupteur, puis l'Interrupteur à la borne + de l'Éclairage.",
    isComplete: (nodes, edges) => !!circuitSwitchId(nodes, edges, findNode(nodes, "fuse-block")?.id, findNode(nodes, "consumer", "eclairage-led")?.id, "positive"),
  },
  {
    id: "connect-light-ground",
    type: "task",
    pose: "perplexe",
    instruction: "Relie la borne − de la Batterie à la borne − de l'Éclairage : c'est le retour de masse, indispensable pour fermer le circuit — sans lui, le courant n'a nulle part où revenir.",
    isComplete: (nodes, edges) => isConnected(edges, findNode(nodes, "battery")?.id, "negative", findNode(nodes, "consumer", "eclairage-led")?.id, "negative"),
  },
  {
    id: "add-usb",
    type: "task",
    pose: "action",
    instruction: "Ajoute une Prise USB / 12V (famille Appareils) : un deuxième appareil, branché sur la même Platine que l'éclairage.",
    libraryType: "consumer",
    libraryPreset: "prise-usb-12v",
    isComplete: (nodes) => !!findNode(nodes, "consumer", "prise-usb-12v"),
  },
  {
    id: "add-switch-usb",
    type: "task",
    pose: "action",
    instruction: "Ajoute un deuxième Interrupteur, dédié à la Prise USB — chaque appareil a le sien, pour pouvoir le couper sans toucher aux autres.",
    libraryType: "switch",
    isComplete: (nodes) => findNodes(nodes, "switch").length >= 2,
  },
  {
    id: "connect-usb-branch",
    type: "task",
    pose: "neutre",
    instruction: "Relie une autre sortie de la Platine à ce nouvel Interrupteur, puis l'Interrupteur à la borne + de la Prise USB.",
    isComplete: (nodes, edges) => {
      const fuseBlockId = findNode(nodes, "fuse-block")?.id;
      const lightId = findNode(nodes, "consumer", "eclairage-led")?.id;
      const usbId = findNode(nodes, "consumer", "prise-usb-12v")?.id;
      const lightSwitchId = circuitSwitchId(nodes, edges, fuseBlockId, lightId, "positive");
      return !!circuitSwitchId(nodes, edges, fuseBlockId, usbId, "positive", lightSwitchId);
    },
  },
  {
    id: "connect-usb-ground",
    type: "task",
    pose: "neutre",
    instruction: "Dernière étape : relie la borne − de la Batterie à la borne − de la Prise USB, comme pour l'éclairage.",
    isComplete: (nodes, edges) => isConnected(edges, findNode(nodes, "battery")?.id, "negative", findNode(nodes, "consumer", "prise-usb-12v")?.id, "negative"),
  },
  {
    id: "outro",
    type: "explain",
    pose: "confiante",
    instruction:
      "Ton schéma est terminé, avec une vraie chaîne de protection : fusible principal, coupe-circuit, et un fusible par appareil. Quelques fonctions utiles : clique sur un composant pour modifier son nom, sa puissance ou son calibre dans le panneau de droite ; Cmd+Z (ou Ctrl+Z) annule une action ; ton travail est sauvegardé automatiquement ; le petit curseur en haut à gauche bascule entre mode jour et mode nuit (pratique de nuit sur un bateau ou un van) ; le bouton « Imprimer / Exporter » en haut génère une image ou un PDF de ton schéma à garder ou imprimer. Tu peux continuer à ajouter des appareils librement.",
    cta: "Terminer",
  },
];
