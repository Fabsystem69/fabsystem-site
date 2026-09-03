"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function install() {
    if (!promptEvent) {
      setHelpVisible(true);
      return;
    }
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  return <div className="relative inline-flex flex-col items-start"><button type="button" onClick={() => void install()} className={className}>Installer l&apos;application</button>{helpVisible ? <p className="mt-2 max-w-sm text-xs font-medium text-neutral-600">Dans Chrome ou Edge, utilisez l&apos;icône d&apos;installation dans la barre d&apos;adresse. Sur Safari Mac: Fichier → Ajouter au Dock.</p> : null}</div>;
}
