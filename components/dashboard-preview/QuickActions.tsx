import Link from "next/link";
import type { ReactNode } from "react";

export type QuickAction = {
  label: string;
  href: string;
  icon: ReactNode;
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex items-center gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900/60 px-4 py-3 text-sm font-medium text-neutral-200 transition-colors duration-150 hover:border-neutral-700 hover:bg-neutral-800/60"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-400/10 text-brand-400">
            {action.icon}
          </span>
          {action.label}
        </Link>
      ))}
    </div>
  );
}
