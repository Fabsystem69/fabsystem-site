import Link from "next/link";

export type AttentionPriority = "high" | "medium";

export type AttentionItem = {
  id: string;
  title: string;
  context: string;
  priority: AttentionPriority;
  priorityLabel: string;
  actionLabel: string;
  actionHref: string;
};

const PRIORITY_STYLES: Record<AttentionPriority, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-8 text-center">
        <p className="text-sm font-medium text-neutral-300">Rien n&apos;attend votre attention.</p>
        <p className="mt-1 text-sm text-neutral-500">
          Aucun devis en attente ni paiement à vérifier pour le moment.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-800/80 overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/60">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[item.priority]}`}
              >
                {item.priorityLabel}
              </span>
              <p className="truncate text-sm font-semibold text-white">{item.title}</p>
            </div>
            <p className="mt-1 text-sm text-neutral-400">{item.context}</p>
          </div>

          <Link
            href={item.actionHref}
            className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300"
          >
            {item.actionLabel}
          </Link>
        </li>
      ))}
    </ul>
  );
}
