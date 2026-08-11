// Icones SVG maison, meme procede que components/Navbar.tsx (le projet
// n'a pas de librairie d'icones dans package.json — on reste coherent avec
// l'existant plutot que d'introduire une nouvelle dependance).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    ...props,
  } as const;
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="4" width="7" height="4.5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="11" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4" y="13.5" width="7" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function OrdersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M4 6h2l1.4 10.2a2 2 0 0 0 2 1.8h7.2a2 2 0 0 0 2-1.7L20 9H6.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function QuotesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M7 4h8l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 12h6M9 16h6M9 9h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function InvoicesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CustomersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.5 20c1.1-3.3 3.6-5 5.5-5s4.4 1.7 5.5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="17" cy="7.5" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15.5 12.3c1.9.4 3.4 1.8 4.3 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ProductsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M4 8.2 12 4l8 4.2v7.6L12 20l-8-4.2V8.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M4 8.2 12 12l8-3.8M12 12v8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function FilesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M13 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M13 3v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function DiscountIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="16" r="1.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M17 7 7 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function TestimonialsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H10l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AccountingIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14.5 5.5 8 12l6.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M9 6h9v9M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendUpIcon(props: IconProps) {
  return (
    <svg {...base(props)} width={14} height={14}>
      <path d="M4 16 10 10l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrendDownIcon(props: IconProps) {
  return (
    <svg {...base(props)} width={14} height={14}>
      <path d="M4 8 10 14l4-4 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 16h5v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M9 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3M15 16l4-4-4-4M19 12H9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
