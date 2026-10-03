"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReviewState } from "./meeting-review-state";

// Brouillon local (localStorage) par dossier cible. Les photos ne sont jamais
// stockees. Tout est protege par try/catch : sans stockage, la page marche.

export type MeetingDraft = {
  text: string;
  exchangeDate: string;
  review: ReviewState | null;
  submissionKey: string | null;
  targetLabel: string;
  warnings: string[];
};

const PREFIX = "fabsystem:meeting-draft:";

function read(key: string): MeetingDraft | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as MeetingDraft) : null;
  } catch {
    return null;
  }
}

function write(key: string, draft: MeetingDraft) {
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

// `storageKey` null = aucun dossier choisi. `found` = brouillon retrouve en
// attente de decision (reprendre / supprimer) : tant qu'il est la, on
// n'ecrase rien.
export function useMeetingDraft(storageKey: string | null) {
  const [found, setFound] = useState<MeetingDraft | null>(null);

  useEffect(() => {
    // Lecture du stockage externe a chaque changement de dossier.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFound(storageKey ? read(storageKey) : null);
  }, [storageKey]);

  const save = useCallback(
    (draft: MeetingDraft) => {
      if (storageKey) write(storageKey, draft);
    },
    [storageKey]
  );

  const clear = useCallback(() => {
    if (storageKey) remove(storageKey);
    setFound(null);
  }, [storageKey]);

  const dismissFound = useCallback(() => setFound(null), []);

  return { found, save, clear, dismissFound };
}
