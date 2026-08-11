import type { ReactNode } from "react";

// Primitive Alert du site public/client (thème clair). Conforme à
// MASTER-12 §237-238 (« sémantique avant couleur » : le type d'état
// détermine le libellé et la présentation, la couleur vient ensuite) et
// §91 (« couleur jamais seule » — chaque tonalité reste accompagnée d'un
// libellé explicite, jamais uniquement d'une pastille colorée).

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONE_STYLES: Record<AlertTone, string> = {
  info: "border-neutral-200 bg-neutral-50 text-neutral-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  danger: "border-red-200 bg-red-50 text-red-900",
};

const TONE_LABELS: Record<AlertTone, string> = {
  info: "Information",
  success: "Succès",
  warning: "Attention",
  danger: "Erreur",
};

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: AlertTone;
  /** Titre explicite de l'alerte. Si omis, le libellé du tone sert de
   * repère textuel minimal (jamais uniquement la couleur). */
  title?: string;
  children: ReactNode;
}) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${TONE_STYLES[tone]}`}>
      <p className="font-semibold">{title ?? TONE_LABELS[tone]}</p>
      <div className="mt-1 text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}
