import type { ReactNode } from "react";

export type AdminBadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_STYLES: Record<AdminBadgeTone, string> = {
  neutral: "bg-neutral-800/70 text-neutral-300 border-neutral-700",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-brand-400/10 text-brand-300 border-brand-400/20",
};

export function AdminBadge({ tone = "neutral", children }: { tone?: AdminBadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
