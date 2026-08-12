import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ChevronIcon } from "@/components/customer/dashboard/engines/icons";

// UI-12 — coquille visuelle partagée par les 10 modules moteur de la Vue
// Project (mission §5-6). Ne porte aucune logique métier : icône, titre,
// description, statut et aperçu de résultat sont fournis par la page
// (server component, déjà en possession des valeurs retenues) ; le
// contenu réel (formulaire, résultat, EngineActionBar) reste entièrement
// dans chaque module moteur, inchangé. `<details>` natif : accessible au
// clavier et aux lecteurs d'écran sans JS supplémentaire.
const STATUS_TONE: Record<string, BadgeTone> = {
  "À compléter": "neutral",
  "Retenu": "success",
  "À recalculer": "warning",
};

export function EngineModuleShell({
  icon,
  title,
  description,
  status,
  resultPreview,
  defaultOpen,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status: string;
  resultPreview?: string | null;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card"
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden sm:items-center sm:p-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 sm:mt-0">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-neutral-950">{title}</span>
            <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>
          </span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            {resultPreview || description}
          </span>
        </span>
        <ChevronIcon className="mt-1 shrink-0 text-neutral-400 transition-transform duration-150 group-open:rotate-180 sm:mt-0" />
      </summary>
      <div className="border-t border-neutral-200 p-4 sm:p-5">
        <p className="text-sm text-neutral-600">{description}</p>
        <div className="mt-4">{children}</div>
      </div>
    </details>
  );
}
