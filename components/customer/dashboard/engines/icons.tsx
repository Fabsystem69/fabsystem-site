import type { SVGProps } from "react";

// UI-12 — repères visuels sobres pour la fiche Project (mission §6).
// SVG inline uniquement (aucune image générée), traits fins cohérents avec
// le langage déjà validé sur /outils : pas de remplissage plein, pas de
// couleur autre que currentColor (la couleur est pilotée par le parent).
type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function EnergyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function BatteryIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="7" width="16" height="10" rx="1.5" />
      <path d="M21 10v4" />
      <path d="M7 10v4M11 10v4" />
    </svg>
  );
}

export function AlternatorIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 12a3 3 0 1 1 6 0c0 1.5-1.5 2-1.5 3.5" />
      <path d="M13.5 15.5h.01" />
    </svg>
  );
}

export function SolarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <path d="M3 8h18M3 12h18M9 4v12M15 4v12" />
      <path d="M8 20h8" />
    </svg>
  );
}

export function ChargerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M10 8h4M10 12h4M12 16v2" />
    </svg>
  );
}

export function BalanceIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v18M5 8h14M5 8 3 13a3 3 0 0 0 4 0zM19 8l-2 5a3 3 0 0 0 4 0z" />
    </svg>
  );
}

export function CircuitIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="5" cy="6" r="1.6" />
      <circle cx="5" cy="18" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
      <path d="M6.4 6H12a2 2 0 0 1 2 2v.5M6.4 18H12a2 2 0 0 0 2-2v-.5M15.5 12h2" />
    </svg>
  );
}

export function CableIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8c0 4 4 4 4 8" />
      <path d="M20 8c0 4-4 4-4 8" />
      <path d="M4 8h4M16 8h4M6 16h2M16 16h2" />
    </svg>
  );
}

export function ProtectionIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="7" width="6" height="10" rx="2" />
      <path d="M12 2v5M12 17v5" />
    </svg>
  );
}

export function DiagramIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M6 9v3a3 3 0 0 0 3 3M18 9v3a3 3 0 0 1-3 3" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function DistributionIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="4" r="1.8" />
      <circle cx="5" cy="20" r="1.8" />
      <circle cx="19" cy="20" r="1.8" />
      <path d="M12 5.8V12M12 12 6 18M12 12l6 6" />
    </svg>
  );
}
