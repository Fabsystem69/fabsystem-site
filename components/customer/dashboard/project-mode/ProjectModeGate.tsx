"use client";

import { useEffect, useState } from "react";
import type { ProjectRetainedValue, ProjectValueDependency, Project } from "@/lib/generated/prisma/client";
import type { RegisteredEngineId } from "@/lib/engine-payload";
import { readProjectMode, writeProjectMode, type ProjectMode } from "@/lib/client/project-mode-storage";
import { ModeChoiceScreen } from "./ModeChoiceScreen";
import { AdvancedProjectView } from "./AdvancedProjectView";
import { GuidedProjectFlow } from "../guided/GuidedProjectFlow";

export type ProjectModeGateProps = {
  project: Project;
  retainedValues: ProjectRetainedValue[];
  dependencies: ProjectValueDependency[];
  engineIds: RegisteredEngineId[];
  defaultVoltageV: number | null;
  consumerNames: string[];
  circuitsForChain: { id: string; name: string }[];
  isDeleteScheduled: boolean;
  isArchived: boolean;
  obsoleteCount: number;
  uncompletedCount: number;
  nextAction: string;
  schemaThumbnail: string | null;
  hasSchema: boolean;
};

// UI-13 §2-3 — bascule entre Mode Guidé (recommandé par défaut) et Mode
// Avancé, sur le même Project et les mêmes données (aucune duplication,
// aucune requête différente selon le mode — mission §2). Le choix est
// lu/écrit uniquement en localStorage
// (lib/client/project-mode-storage.ts) : composant client pour cette
// seule raison, toutes les données restent server-fetched en amont
// (page.tsx) et simplement transmises en props.
//
// Comme le mode dépend de localStorage (indisponible pendant le rendu
// serveur), l'état initial est `"unresolved"` et déterminé dans un effet
// — un flash d'un rendu neutre est attendu et acceptable (mission §3
// n'exige pas un rendu instantané, seulement un choix mémorisé et
// réversible). Une suppression programmée (isDeleteScheduled) force
// toujours le mode avancé : l'écran d'annulation de suppression n'a pas
// d'équivalent dans le parcours guidé.
export function ProjectModeGate(props: ProjectModeGateProps) {
  const [mode, setMode] = useState<ProjectMode | "unresolved" | null>("unresolved");

  useEffect(() => {
    setMode(readProjectMode(props.project.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.project.id]);

  function choose(next: ProjectMode) {
    writeProjectMode(props.project.id, next);
    setMode(next);
  }

  if (mode === "unresolved") {
    return null;
  }

  if (mode === null) {
    return <ModeChoiceScreen onChoose={choose} />;
  }

  if (mode === "guided" && !props.isDeleteScheduled) {
    return <GuidedProjectFlow {...props} onSwitchMode={choose} />;
  }

  return <AdvancedProjectView {...props} onSwitchMode={choose} />;
}
