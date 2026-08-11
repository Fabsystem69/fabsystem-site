import type { ReactNode } from "react";
import { TrendDownIcon, TrendUpIcon } from "@/components/dashboard/shell/icons";

export type KpiTrend = {
  direction: "up" | "down";
  label: string;
};

// Comparaison reelle mois courant / mois precedent, rendue comme deux
// barres muettes (pas de legende chiffree en plus du chiffre principal) —
// signature visuelle discrete, jamais une donnee inventee.
export type KpiComparison = {
  previous: number;
  current: number;
};

function ComparisonBars({ comparison }: { comparison: KpiComparison }) {
  const max = Math.max(comparison.previous, comparison.current, 1);
  const previousHeight = Math.max(4, Math.round((comparison.previous / max) * 20));
  const currentHeight = Math.max(4, Math.round((comparison.current / max) * 20));

  return (
    <div
      className="flex h-5 shrink-0 items-end gap-0.5"
      aria-hidden="true"
      title="Mois précédent vs mois en cours"
    >
      <span className="w-1.5 rounded-sm bg-neutral-700" style={{ height: previousHeight }} />
      <span className="w-1.5 rounded-sm bg-brand-400" style={{ height: currentHeight }} />
    </div>
  );
}

export function KpiTile({
  label,
  value,
  helper,
  trend,
  comparison,
  icon,
}: {
  label: string;
  value: string;
  helper?: string;
  trend?: KpiTrend;
  comparison?: KpiComparison;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-400">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800/70 text-neutral-400">
          {icon}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[1.75rem] font-semibold leading-none tracking-tight text-white">
          {value}
        </p>
        {/* Micro-indicateur couple a la tendance : sans tendance exploitable
            (ex. mois precedent a zero), l'afficher seul induirait une
            comparaison qui n'existe pas vraiment. */}
        {comparison && trend ? <ComparisonBars comparison={comparison} /> : null}
      </div>

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
