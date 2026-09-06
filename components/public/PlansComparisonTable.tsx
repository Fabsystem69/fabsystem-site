import { Card } from "@/components/ui/Card";

type FeatureValue = boolean | string;

// Reflète exactement ce qui est verrouillé dans le code (composants
// SizingPopup, ItemPropertiesPopup, SchemaIssuesWidget, VersionHistoryDialog,
// ShareSchemaDialog, features/schemas/export.ts) — jamais une promesse
// marketing en avance sur le produit réel. Partagé entre /mon-compte/editeur
// et la page publique /outils/schema.
const PLAN_FEATURES: { label: string; free: FeatureValue; plus: FeatureValue }[] = [
  { label: "Éditeur complet (composants, câblage, calculs manuels)", free: true, plus: true },
  { label: "Projets", free: "1 projet", plus: "Illimités" },
  { label: "Consommateurs par schéma", free: "3 max", plus: "Illimités" },
  { label: "Dimensionnement automatique câble & fusible", free: false, plus: true },
  { label: "Détail et correction des points de vérification", free: false, plus: true },
  { label: "Historique des versions", free: false, plus: true },
  { label: "Partage de schéma en lecture seule", free: false, plus: true },
  { label: "Export PNG / PDF", free: "Avec filigrane FabSystem", plus: "Sans filigrane" },
];

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-700">
        <span aria-hidden="true">✓</span>
        <span className="sr-only">Inclus</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-neutral-300" aria-label="Non inclus">
        <span aria-hidden="true">✕</span>
      </span>
    );
  }
  return <span className="text-neutral-800">{value}</span>;
}

export function PlansComparisonTable() {
  return (
    <Card className="overflow-hidden p-0">
      {/* En-tête à 3 colonnes : seulement à partir de sm (640px), largeur où
          les colonnes Gratuit/Éditeur Plus tiennent réellement à côté du
          libellé — voir la version mobile empilée ci-dessous. */}
      <div className="hidden border-b border-neutral-100 bg-neutral-50 px-5 py-3 sm:grid sm:grid-cols-[1fr_9rem_9rem] sm:items-center sm:gap-x-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Ce qui change</p>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Gratuit</p>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Éditeur Plus</p>
      </div>
      <div className="divide-y divide-neutral-100">
        {PLAN_FEATURES.map((feature) => (
          <div key={feature.label} className="px-5 py-3 text-sm sm:grid sm:grid-cols-[1fr_9rem_9rem] sm:items-center sm:gap-x-3">
            <p className="text-neutral-800">{feature.label}</p>
            {/* Mobile (<sm) : les 2 colonnes fixes (7rem chacune, + libellé)
                dépassaient la largeur de la carte sur téléphone — la colonne
                Éditeur Plus devenait invisible sans aucun indice de défilement
                (retour audit mobile). Remplacé par 2 lignes empilées avec
                étiquette inline, sans contrainte de largeur. */}
            <div className="mt-2 space-y-1 text-xs sm:hidden">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <span className="font-medium text-neutral-600">Gratuit :</span>
                <FeatureCell value={feature.free} />
              </div>
              <div className="flex items-center gap-1.5 font-medium text-amber-700">
                <span>Éditeur Plus :</span>
                <FeatureCell value={feature.plus} />
              </div>
            </div>
            <div className="hidden text-center sm:block"><FeatureCell value={feature.free} /></div>
            <div className="hidden text-center font-medium sm:block"><FeatureCell value={feature.plus} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}
