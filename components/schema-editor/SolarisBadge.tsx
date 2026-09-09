// Partenariat Solaris Store (09/2026) : identifie un modèle précis comme
// commandable chez eux. Un pastille texte plutôt que le logo en <img> —
// retour utilisateur : à la taille d'une ligne de liste (~12px), le logo
// (texte fin + pictogramme soleil) devient un aplat de couleur illisible,
// pas un repère fiable. Le texte reste net à n'importe quelle taille.
export function SolarisBadge({ darkMode }: { darkMode?: boolean }) {
  return (
    <span
      className={`shrink-0 text-[9px] font-medium ${darkMode ? "text-sky-400" : "text-sky-700"}`}
      title="Modèle disponible chez Solaris Store"
    >
      Solaris Store
    </span>
  );
}
