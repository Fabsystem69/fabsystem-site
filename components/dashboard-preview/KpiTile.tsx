import type { ReactNode } from "react";
import { TrendDownIcon, TrendUpIcon } from "@/components/dashboard-preview/icons";

export type KpiTrend = {
  direction: "up" | "down";
  label: string;
};

export function KpiTile({
  label,
  value,
  helper,
  trend,
  icon,
}: {
  label: string;
  value: string;
  helper?: string;
  trend?: KpiTrend;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-400">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800/70 text-neutral-400">
          {icon}
        </span>
      </div>

      <p className="mt-3 text-[1.75rem] font-semibold leading-none tracking-tight text-white">
        {value}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
              trend.direction === "up"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {trend.direction === "up" ? <TrendUpIcon /> : <TrendDownIcon />}
            {trend.label}
          </span>
        ) : null}
        {helper ? <p className="text-xs text-neutral-500">{helper}</p> : null}
      </div>
    </div>
  );
}
