"use client";

// Boutons/panneaux partagés par le ruban (Ribbon.tsx) et par les groupes
// d'actions par onglet (SaveMenu/ExportMenu/FeedbackMenu) — retour
// utilisateur : "Accueil est parfait mais les autres ouvrent un CTA qui
// ouvre un ruban ou autre, je veux un truc aussi épuré que Accueil" — chaque
// action doit être un bouton directement visible dans la rangée, pas caché
// derrière un unique bouton "Menu"/"Exporter" qui rouvre tout un second
// menu. Extrait dans un fichier à part (plutôt que dans Ribbon.tsx) pour
// éviter un cycle d'import : Ribbon.tsx importe SaveMenu/ExportMenu/
// FeedbackMenu, qui ont donc besoin de ces mêmes contrôles sans importer
// Ribbon.tsx en retour.
export function RibbonDivider({ darkMode }: { darkMode: boolean }) {
  return <div className={`mx-1 h-9 w-px shrink-0 ${darkMode ? "bg-neutral-800" : "bg-neutral-200"}`} />;
}

export function RibbonButton({
  darkMode,
  onClick,
  disabled,
  title,
  icon,
  label,
  active,
}: {
  darkMode: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  // Retour utilisateur : "j'ai chargé 7 icônes pour remplacer les +" —
  // React.ReactNode (pas seulement un emoji/caractère) pour accepter aussi
  // les icônes SVG de catégorie (voir icons/CategoryIcons.tsx), déjà
  // utilisées telles quelles dans le panneau gauche.
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-md px-1.5 py-1.5 text-center transition-base disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? darkMode
            ? "bg-brand-400/20 text-brand-300"
            : "bg-brand-50 text-brand-700"
          : darkMode
            ? "text-neutral-300 hover:bg-neutral-800"
            : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </button>
  );
}

// Regroupement visuel type Word (retour utilisateur : "crée des mini
// séparateurs de groupe comme sur Word") — une rangée de boutons avec une
// légende centrée en dessous (ex. "Presse-papiers", "Police" chez Word),
// séparée du groupe suivant par un trait vertical fin. Purement de la mise
// en page : ne change aucune logique des boutons qu'il contient.
export function RibbonGroup({ darkMode, label, children }: { darkMode: boolean; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-1">{children}</div>
      <span className={`text-[9px] font-medium uppercase tracking-wide ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>{label}</span>
    </div>
  );
}

// Petit panneau ponctuel qui s'ouvre sous UN bouton précis (gabarits,
// filtre, cloud…) — jamais un menu qui regroupe plusieurs actions
// différentes derrière une seule porte d'entrée.
export function RibbonPanel({
  darkMode,
  width = "w-64",
  children,
}: {
  darkMode: boolean;
  width?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute left-0 top-full z-10 mt-1 ${width} rounded-md border py-1 shadow-lg ${
        darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
      }`}
    >
      {children}
    </div>
  );
}

type MenubarIconName = "new" | "save" | "folder" | "export" | "image" | "grid" | "theme" | "components" | "layout" | "properties" | "help" | "calculator" | "chevron";

/** Icônes de ligne sobres, dessinées localement pour garder le bandeau net sans dépendance d'icônes. */
export function MenubarIcon({ name, className = "h-5 w-5" }: { name: MenubarIconName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<MenubarIconName, React.ReactNode> = {
    new: <><path {...common} d="M6 3h8l4 4v14H6z" /><path {...common} d="M14 3v5h5M12 11v6m-3-3h6" /></>,
    save: <><path {...common} d="M5 3h12l3 3v15H4V3z" /><path {...common} d="M7 3v6h9V3M8 21v-7h8v7" /></>,
    folder: <><path {...common} d="M3 7h7l2 2h9v10.5A1.5 1.5 0 0 1 19.5 21h-15A1.5 1.5 0 0 1 3 19.5z" /><path {...common} d="M3 7V5.5A1.5 1.5 0 0 1 4.5 4H9l2 3" /></>,
    export: <><path {...common} d="M12 3v11m-4-4 4 4 4-4M5 15v5h14v-5" /></>,
    image: <><rect {...common} x="3" y="4" width="18" height="16" rx="2" /><circle {...common} cx="8.5" cy="9" r="1.5" /><path {...common} d="m4 18 5-5 3 3 3-3 5 5" /></>,
    grid: <><rect {...common} x="4" y="4" width="16" height="16" rx="1" /><path {...common} d="M9.33 4v16M14.66 4v16M4 9.33h16M4 14.66h16" /></>,
    theme: <><path {...common} d="M12 3a9 9 0 1 0 9 9c0-.6-.5-1-1.1-.9A6 6 0 0 1 12.9 4c.1-.6-.3-1- .9-1z" /><path {...common} d="M17 5.5h.01M19 9h.01M7 7h.01" /></>,
    components: <><rect {...common} x="4" y="4" width="6" height="6" rx="1" /><rect {...common} x="14" y="4" width="6" height="6" rx="1" /><rect {...common} x="4" y="14" width="6" height="6" rx="1" /><path {...common} d="M17 14v6m-3-3h6" /></>,
    layout: <><path {...common} d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" /><path {...common} d="M10 7h4M7 10v4m10-4v4" /></>,
    properties: <><path {...common} d="M4 6h16M7 6v12m10-12v12M4 18h16" /><circle {...common} cx="7" cy="10" r="2" /><circle {...common} cx="17" cy="14" r="2" /></>,
    help: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M9.7 9a2.5 2.5 0 1 1 3.9 2.1c-1 .7-1.6 1.2-1.6 2.4M12 17h.01" /></>,
    calculator: <><rect {...common} x="5" y="3" width="14" height="18" rx="2" /><path {...common} d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2M8 18h2m4 0h2" /></>,
    chevron: <path {...common} d="m8 10 4 4 4-4" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>{paths[name]}</svg>;
}

/** Panneau de menu d'application: plus dense qu'un menu du ruban, mais lisible et stable. */
export function MenubarPanel({ darkMode, children, width = "w-80" }: { darkMode: boolean; children: React.ReactNode; width?: string }) {
  return (
    <div className={`absolute left-0 top-full z-40 mt-2 overflow-hidden rounded-xl border py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)] ${width} ${darkMode ? "border-neutral-700 bg-neutral-900" : "border-slate-200 bg-white"}`}>
      {children}
    </div>
  );
}

export function MenubarSection({ darkMode, children }: { darkMode: boolean; children?: React.ReactNode }) {
  return <div className={`mx-2 my-1 border-t pt-1 ${darkMode ? "border-neutral-800" : "border-slate-100"}`}>{children}</div>;
}

export function MenubarHeading({ darkMode, children }: { darkMode: boolean; children: React.ReactNode }) {
  return <div className={`px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${darkMode ? "text-neutral-500" : "text-slate-500"}`}>{children}</div>;
}

export function MenubarItem({ darkMode, icon, title, detail, shortcut, active, onClick }: { darkMode: boolean; icon: React.ReactNode; title: string; detail?: string; shortcut?: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-base ${darkMode ? "text-neutral-100 hover:bg-neutral-800" : "text-slate-800 hover:bg-slate-50"}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${active ? (darkMode ? "bg-brand-400/20 text-brand-300" : "bg-brand-50 text-brand-600") : (darkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-100 text-slate-600")}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-5">{title}</span>
        {detail ? <span className={`block truncate text-xs leading-4 ${darkMode ? "text-neutral-500" : "text-slate-500"}`}>{detail}</span> : null}
      </span>
      {shortcut ? <kbd className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{shortcut}</kbd> : null}
    </button>
  );
}
