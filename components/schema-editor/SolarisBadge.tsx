// Partenariat Solaris Store (09/2026) : identifie un modèle précis comme
// commandable chez eux. Un pastille texte plutôt que le logo en <img> —
// retour utilisateur : à la taille d'une ligne de liste (~12px), le logo
// (texte fin + pictogramme soleil) devient un aplat de couleur illisible,
// pas un repère fiable. Le texte reste net à n'importe quelle taille.
export function SolarisBadge({ darkMode }: { darkMode?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
        darkMode ? "bg-sky-400/15 text-sky-300" : "bg-sky-600/10 text-sky-700"
      }`}
      title="Modèle disponible chez Solaris Store"
    >
      Solaris
    </span>
  );
}
