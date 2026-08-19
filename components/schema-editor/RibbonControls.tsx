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
