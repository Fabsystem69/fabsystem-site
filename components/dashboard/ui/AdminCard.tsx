import type { ReactNode } from "react";

export function AdminCard({
  title,
  description,
  actions,
  padded = true,
  className = "",
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-neutral-800/80 bg-neutral-900/60 ${className}`}>
      {title ? (
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800/80 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm text-neutral-400">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
