// Retour utilisateur (comparatif Wireframe) : leur bandeau "Standards &
// References" (BS 7671, NEC, EN 1648-2…) légitime beaucoup l'outil.
// Équivalent France — NF C 15-100 pour l'installation fixe, EN 1648-2 pour
// les véhicules de loisir (déjà une vraie norme européenne, pas anglo-
// saxonne, pertinente aussi côté France) — plus le disclaimer prudence déjà
// dans l'esprit du reste du site (jamais présenté comme une certification,
// CDC §31/§37). Un seul composant, wording identique partout : un
// avertissement qui change de formulation d'un outil à l'autre perd en
// crédibilité.
export function CalcSafetyNotice({ standards }: { standards: string[] }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Normes & références</p>
        <ul className="mt-2 space-y-1 text-xs text-neutral-600">
          {standards.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">⚠️ Ce calculateur donne une estimation, pas une validation</p>
        <p className="mt-1.5 leading-relaxed">
          Les résultats sont des ordres de grandeur basés sur des règles usuelles — ils ne remplacent ni la fiche technique de votre matériel, ni une
          vérification par un professionnel qualifié. Une installation électrique mal dimensionnée peut provoquer un incendie ou un choc électrique.
        </p>
      </div>
    </div>
  );
}
