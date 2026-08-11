import type { ReactNode } from "react";

// Primitive Badge du site public/client (thème clair). Miroir clair de
// components/dashboard/ui/AdminBadge (thème sombre) : mêmes tons
// sémantiques (MASTER-12 §5, §35 — un badge affiche un état compact, jamais
// uniquement par la couleur : le libellé textuel reste toujours présent).

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-orange-50 text-orange-700 border-orange-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-brand-50 text-brand-700 border-brand-200",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
