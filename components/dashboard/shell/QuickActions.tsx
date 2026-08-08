import Link from "next/link";
import type { ReactNode } from "react";

export type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: ReactNode;
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex items-center gap-3.5 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 px-4 py-3.5 transition-colors duration-150 hover:border-neutral-700 hover:bg-neutral-800/60"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-400/10 text-brand-400">
            {action.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">{action.label}</span>
            <span className="block truncate text-xs text-neutral-500">{action.description}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
