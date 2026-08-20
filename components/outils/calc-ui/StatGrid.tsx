// Retour utilisateur (comparatif Wireframe) : grille de statistiques façon
// tableau de bord en résultat, plutôt qu'une seule valeur mise en avant —
// reste compatible avec le "gros chiffre + sous-titre" déjà utilisé
// ailleurs (voir les calculateurs existants) : ce composant couvre la
// grille de stats secondaires en dessous, pas la valeur principale.
type StatTone = "default" | "warning" | "danger" | "success";

export function StatGrid({ stats }: { stats: { label: string; value: string; tone?: StatTone }[] }) {
  const toneClass = (tone: StatTone = "default") => {
    if (tone === "danger") return "text-red-600";
    if (tone === "warning") return "text-orange-600";
    if (tone === "success") return "text-emerald-600";
    return "text-neutral-900";
  };

  return (
    <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label}>
          <p className="text-xs text-neutral-500">{s.label}</p>
          <p className={`text-lg font-bold ${toneClass(s.tone)}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
