import type { ReactNode } from "react";

export function AdminEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8 text-center">
      <p className="text-sm font-medium text-neutral-300">{title}</p>
      {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
    </div>
  );
}

export function AdminAlert({
  tone = "warning",
  children,
}: {
  tone?: "warning" | "danger" | "success";
  children: ReactNode;
}) {
  const styles = {
    warning: "border-orange-500/20 bg-orange-500/10 text-orange-300",
    danger: "border-red-500/20 bg-red-500/10 text-red-300",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  } as const;

  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}>{children}</div>;
}
