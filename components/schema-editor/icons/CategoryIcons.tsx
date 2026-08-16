// Icônes des familles de composants (V2, retour utilisateur : des icônes
// plutôt que des abréviations à 2 lettres sur le rail réduit de la
// bibliothèque). Traits simples (formes de base — cercle, ligne, rect,
// polygone), pas de tracés complexes : plus sûr à obtenir juste du premier
// coup sans prévisualisation, et cohérent avec le style sobre du reste de
// l'éditeur. `currentColor` hérite la couleur du bouton (état survolé/actif
// géré en CSS par l'appelant).

import type { ReactElement } from "react";

type IconProps = { className?: string };

const strokeProps = {
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function BatteryIcon({ className }: IconProps) {
  // Batterie : corps + plot, symbole "+" à l'intérieur.
  return (
    <svg viewBox="0 0 20 20" className={className} {...strokeProps}>
      <rect x="2.5" y="6" width="13" height="8" rx="1.5" />
      <rect x="16" y="8.5" width="1.5" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <line x1="9" y1="8" x2="9" y2="12" />
      <line x1="7" y1="10" x2="11" y2="10" />
    </svg>
  );
}

function SolarIcon({ className }: IconProps) {
  // Soleil : disque + rayons — famille Solaire.
  return (
    <svg viewBox="0 0 20 20" className={className} {...strokeProps}>
      <circle cx="10" cy="10" r="4" />
      <line x1="10" y1="1.5" x2="10" y2="3.5" />
      <line x1="10" y1="16.5" x2="10" y2="18.5" />
      <line x1="1.5" y1="10" x2="3.5" y2="10" />
      <line x1="16.5" y1="10" x2="18.5" y2="10" />
      <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
      <line x1="14.4" y1="14.4" x2="15.8" y2="15.8" />
      <line x1="15.8" y1="4.2" x2="14.4" y2="5.6" />
      <line x1="5.6" y1="14.4" x2="4.2" y2="15.8" />
    </svg>
  );
}

function ChargeIcon({ className }: IconProps) {
  // Éclair plein — charge/alimentation.
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" stroke="none">
      <polygon points="12,1 4,12 10,12 8,19 17,7 11,7" />
    </svg>
  );
}

function ProtectionIcon({ className }: IconProps) {
  // Bouclier hexagonal + coche.
  return (
    <svg viewBox="0 0 20 20" className={className} {...strokeProps}>
      <polygon points="10,2 17,5 17,10 10,18 3,10 3,5" />
      <polyline points="7,10 9.2,12.2 13,7.5" />
    </svg>
  );
}

function MesureIcon({ className }: IconProps) {
  // Cadran + aiguille — shunt/écran de contrôle.
  return (
    <svg viewBox="0 0 20 20" className={className} {...strokeProps}>
      <circle cx="10" cy="11" r="7" />
      <line x1="10" y1="11" x2="13.2" y2="7" />
      <line x1="10" y1="2.7" x2="10" y2="4.2" />
      <circle cx="10" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ConversionIcon({ className }: IconProps) {
  // Deux flèches opposées — conversion DC/AC.
  return (
    <svg viewBox="0 0 20 20" className={className} {...strokeProps}>
      <line x1="3" y1="7" x2="14" y2="7" />
      <polyline points="10.5,3.5 14,7 10.5,10.5" />
      <line x1="17" y1="14" x2="6" y2="14" />
      <polyline points="9.5,17.5 6,14 9.5,10.5" />
    </svg>
  );
}

function ConsommateursIcon({ className }: IconProps) {
  // Prise électrique — appareils consommateurs.
  return (
    <svg viewBox="0 0 20 20" className={className} {...strokeProps}>
      <line x1="7" y1="2" x2="7" y2="7" />
      <line x1="13" y1="2" x2="13" y2="7" />
      <rect x="5" y="7" width="10" height="6" rx="2" />
      <line x1="10" y1="13" x2="10" y2="18" />
    </svg>
  );
}

const CATEGORY_ICON_COMPONENTS: Record<string, (props: IconProps) => ReactElement> = {
  solar: SolarIcon,
  battery: BatteryIcon,
  charger: ChargeIcon,
  converter: ConversionIcon,
  wiring: ProtectionIcon,
  measurement: MesureIcon,
  consumers: ConsommateursIcon,
};

export function CategoryIcon({ category, className = "h-4 w-4" }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICON_COMPONENTS[category];
  if (!Icon) return null;
  return <Icon className={className} />;
}
