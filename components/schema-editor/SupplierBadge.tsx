// Identifie un modèle précis comme commandable chez un fournisseur donné
// (Solaris Store, Vancore...) — retour utilisateur (partenariat Solaris
// Store, 09/2026) : "comment on va pouvoir différentier... des composants
// commandables". Pastille texte plutôt qu'un logo en <img> — à la taille
// d'une ligne de liste (~12px), un logo (texte fin + pictogramme) devient un
// aplat de couleur illisible, pas un repère fiable. Générique dès le second
// fournisseur réel du catalogue (Vancore, tableaux Osculati) plutôt que
// figé sur "Solaris Store".
export function SupplierBadge({ name, darkMode }: { name: string; darkMode?: boolean }) {
  return (
    <span
      className={`shrink-0 text-[9px] font-medium ${darkMode ? "text-sky-400" : "text-sky-700"}`}
      title={`Modèle disponible chez ${name}`}
    >
      {name}
    </span>
  );
}
