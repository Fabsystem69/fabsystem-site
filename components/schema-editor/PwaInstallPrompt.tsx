"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (dismissed || !promptEvent) return null;

  return <div className="fixed bottom-5 right-5 z-[70] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"><p className="text-sm font-semibold text-slate-950">Installer l&apos;éditeur sur cet ordinateur</p><p className="mt-1 text-sm text-slate-600">Ouvrez vos schémas depuis une icône dédiée, dans une fenêtre sans navigateur.</p><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setDismissed(true)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Plus tard</button><button type="button" onClick={() => void install()} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600">Installer</button></div></div>;
}
