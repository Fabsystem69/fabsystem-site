"use client";

import { useActionState, useId, useState } from "react";
import type { CoachingInvitationState } from "@/lib/coaching-invitation";

const initialState: CoachingInvitationState = { status: "idle" };
const buttonClass = "min-h-11 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:opacity-60";

export function CoachingInvitation({ projectId, action }: {
  projectId: string;
  action: (state: CoachingInvitationState, formData: FormData) => Promise<CoachingInvitationState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [copyMessage, setCopyMessage] = useState<{ link: string; text: string } | null>(null);
  const inputId = useId();

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopyMessage({ link, text: "Lien copié." });
    } catch {
      setCopyMessage({ link, text: "Sélectionnez le lien ci-dessous pour le copier manuellement." });
    }
  }

  return (
    <div className="mt-4 min-w-0 space-y-3">
      <form action={formAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <button type="submit" disabled={pending} className={`${buttonClass} w-full sm:w-auto`}>
          {pending ? "Création du lien…" : "Générer un lien d’invitation"}
        </button>
      </form>
      <p className="text-sm text-neutral-400">À transmettre vous-même au client. Un nouveau lien remplace les précédents liens de connexion.</p>
      <div aria-live="polite" aria-atomic="true">
        {state.status === "error" ? <p className="text-sm text-red-300">{state.message}</p> : null}
        {state.status === "created" && !pending ? (
          <div className="min-w-0 space-y-3 rounded-lg border border-neutral-700 bg-neutral-950 p-3">
            <label htmlFor={inputId} className="block text-sm text-neutral-200">Lien de connexion privé à copier</label>
            <input id={inputId} readOnly value={state.magicLink} onFocus={(event) => event.currentTarget.select()}
              className="min-h-11 w-full min-w-0 rounded-lg border border-neutral-600 bg-neutral-900 px-3 text-base text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400" />
            <p className="text-sm text-neutral-300">Valable jusqu’au {new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris",
            }).format(new Date(state.expiresAt))} (heure de Paris).</p>
            <button type="button" className={buttonClass} onClick={() => copyLink(state.magicLink)}>Copier le lien</button>
            {copyMessage?.link === state.magicLink ? <p className="text-sm text-neutral-300">{copyMessage.text}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
