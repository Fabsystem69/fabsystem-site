import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

// UI-13 §4 — habillage commun à chaque étape du mode guidé : objectif
// clair, une question principale, texte court. Le contenu réel (le
// formulaire) reste toujours un composant moteur existant (EnergyModule,
// BatteryModule...) — cette coquille n'ajoute que la présentation.
export function GuidedStepShell({
  icon,
  title,
  helper,
  children,
}: {
  icon: ReactNode;
  title: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
          {helper ? <p className="text-sm text-neutral-600">{helper}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
