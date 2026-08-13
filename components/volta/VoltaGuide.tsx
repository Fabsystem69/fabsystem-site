import type { ReactNode } from "react";
import { VoltaAvatar, type VoltaPose } from "./VoltaAvatar";

// UI-14 §22 — composant partagé unique pour toute apparition de Volta.
// 4 variantes (§5) : info (expliquer), tip (astuce pratique), warning
// (point à vérifier), next (suite logique). Le fond/accent change avec la
// variante pour rester lisible sans dépendre de la pose. Format compact
// (§6) : petit buste, texte court, jamais une bulle géante.
const VARIANT_STYLES: Record<VoltaGuideVariant, string> = {
  info: "border-neutral-200 bg-neutral-50",
  tip: "border-brand-200 bg-brand-50/70",
  warning: "border-orange-200 bg-orange-50",
  next: "border-emerald-200 bg-emerald-50",
};

export type VoltaGuideVariant = "info" | "tip" | "warning" | "next";

export function VoltaGuide({
  variant = "info",
  pose = "neutre",
  title,
  cta,
  children,
  className = "",
}: {
  variant?: VoltaGuideVariant;
  pose?: VoltaPose;
  title?: string;
  cta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3.5 ${VARIANT_STYLES[variant]} ${className}`}>
      <VoltaAvatar pose={pose} size={56} />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-sm font-semibold text-neutral-950">{title}</p> : null}
        <p className={`text-sm leading-relaxed text-neutral-800 ${title ? "mt-1" : ""}`}>{children}</p>
        {cta ? <div className="mt-2">{cta}</div> : null}
      </div>
    </div>
  );
}
