export type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  time: string;
  kind: "order" | "customer" | "download" | "testimonial";
};

const KIND_DOT_STYLES: Record<ActivityItem["kind"], string> = {
  order: "bg-emerald-400",
  customer: "bg-sky-400",
  download: "bg-neutral-500",
  testimonial: "bg-brand-400",
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-neutral-500">Aucune activité récente à afficher.</p>
    );
  }

  return (
    <ul className="space-y-0">
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3 pb-3.5 last:pb-0">
          {index !== items.length - 1 ? (
            <span className="absolute left-[5px] top-3 h-full w-px bg-neutral-800" aria-hidden="true" />
          ) : null}
          <span
            className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${KIND_DOT_STYLES[item.kind]}`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-neutral-100">{item.label}</p>
              <span className="shrink-0 text-xs text-neutral-500">{item.time}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-neutral-500">{item.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
