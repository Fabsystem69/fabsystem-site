"use client";

import { useCallback, useEffect, useState } from "react";
import type { SheetReviewState } from "./sheet-review-state";

// Brouillon local (localStorage) par projet. Les photos ne sont JAMAIS
// stockees. Tout est protege par try/catch : sans stockage, la page marche.

export type SheetDraft = {
  exchangeDate: string;
  review: SheetReviewState | null;
  submissionKey: string | null;
  projectLabel: string;
};

const PREFIX = "fabsystem:sheet-draft:";

function read(key: string): SheetDraft | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as SheetDraft) : null;
  } catch {
    return null;
  }
}

function write(key: string, draft: SheetDraft) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(draft));
  } catch {
    // Stockage indisponible ou plein : on continue sans brouillon.
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Rien a faire.
  }
}

// `found` = brouillon retrouve en attente de decision : on n'ecrase rien tant
// qu'il est la.
export function useSheetDraft(projectId: string | null) {
  const [found, setFound] = useState<SheetDraft | null>(null);

  useEffect(() => {
    // Lecture du stockage externe a chaque changement de projet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFound(projectId ? read(projectId) : null);
  }, [projectId]);

  const save = useCallback(
    (draft: SheetDraft) => {
      if (projectId) write(projectId, draft);
    },
    [projectId]
  );

  const clear = useCallback(() => {
    if (projectId) remove(projectId);
    setFound(null);
  }, [projectId]);

  const dismissFound = useCallback(() => setFound(null), []);

  return { found, save, clear, dismissFound };
}
