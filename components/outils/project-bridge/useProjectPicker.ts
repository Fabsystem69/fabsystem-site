"use client";

import { useState } from "react";
import type { ProjectAssetType, ProjectVoltage } from "@/lib/generated/prisma/client";

// UI-13 — logique partagée par les ponts Outils→Project (mission §14) :
// vérifier la session, lister les Projects du client, ou en créer un si
// aucun n'existe. Ne fait aucune hypothèse sur le moteur/l'import
// lui-même — uniquement le choix du Project cible.
export type ProjectSummary = {
  id: string;
  name: string;
  assetType: ProjectAssetType;
  voltage: ProjectVoltage;
};

export type PickerState =
  | { step: "idle" }
  | { step: "loading" }
  | { step: "unauthenticated" }
  | { step: "quota-reached" }
  | { step: "error"; message: string }
  | { step: "pick"; projects: ProjectSummary[] }
  | { step: "create" }
  | { step: "selected"; projectId: string; projectName: string };

export function useProjectPicker() {
  const [state, setState] = useState<PickerState>({ step: "idle" });

  async function loadProjects() {
    setState({ step: "loading" });
    try {
      const response = await fetch("/api/projects");
      if (response.status === 401) {
        setState({ step: "unauthenticated" });
        return;
      }
      const body = (await response.json().catch(() => null)) as { projects?: ProjectSummary[] } | null;
      if (!response.ok || !body?.projects) {
        setState({ step: "error", message: "Impossible de récupérer vos projets." });
        return;
      }
      if (body.projects.length === 0) {
        setState({ step: "create" });
        return;
      }
      if (body.projects.length === 1) {
        setState({ step: "selected", projectId: body.projects[0].id, projectName: body.projects[0].name });
        return;
      }
      setState({ step: "pick", projects: body.projects });
    } catch {
      setState({ step: "error", message: "Erreur réseau." });
    }
  }

  function selectProject(project: ProjectSummary) {
    setState({ step: "selected", projectId: project.id, projectName: project.name });
  }

  async function createProject(input: { name: string; assetType: ProjectAssetType; voltage: ProjectVoltage }) {
    setState({ step: "loading" });
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (response.status === 409) {
        setState({ step: "quota-reached" });
        return;
      }
      const body = (await response.json().catch(() => null)) as { project?: { id: string; name: string } } | null;
      if (!response.ok || !body?.project) {
        setState({ step: "error", message: "Impossible de créer ce projet." });
        return;
      }
      setState({ step: "selected", projectId: body.project.id, projectName: body.project.name });
    } catch {
      setState({ step: "error", message: "Erreur réseau." });
    }
  }

  return { state, setState, loadProjects, selectProject, createProject };
}
