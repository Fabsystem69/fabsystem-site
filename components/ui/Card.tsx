import type { HTMLAttributes, ReactNode } from "react";

// Primitive Card du site public/client (thème clair). Reprend le motif déjà
// répété manuellement dans plusieurs pages/composants (ex.
// CustomerAccountShell) : rounded-2xl border border-neutral-200 bg-white.
// Conforme à MASTER-12 §21-23 (« une carte est utilisée lorsqu'elle
// améliore compréhension, regroupement, sélection, action »).

export function Card({
  className = "",
  children,
  ...props
}: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-neutral-200 bg-white shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
