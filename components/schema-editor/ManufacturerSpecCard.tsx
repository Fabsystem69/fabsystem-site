"use client";

import { formatCableBand, getManufacturerSpec, type ManufacturerSpec } from "@/lib/electrical-components/manufacturer-specs";

// Fiche "Préconisations Victron" du modèle choisi (retour utilisateur,
// 10/2026) — valeurs lues dans le manuel officiel, affichées en gratuit
// (décision produit : données publiques, elles rendent l'onglet "Manuel"
// réellement utilisable ; le calcul automatique reste Éditeur Plus).

function formatLength(value: number): string {
  return `${value.toLocaleString("fr-FR")} m`;
}

function cableRows(spec: ManufacturerSpec): string[] {
  let previous = 0;
  return (spec.batteryCable ?? []).map((band) => {
    const range = previous === 0 ? `jusqu'à ${formatLength(band.maxLengthM)}` : `${formatLength(previous)} à ${formatLength(band.maxLengthM)}`;
    previous = band.maxLengthM;
    return `${range} : ${formatCableBand(band)}`;
  });
}

function fuseText(spec: ManufacturerSpec): string | null {
  if (spec.fuseRangeA) return `${spec.fuseRangeA.min} à ${spec.fuseRangeA.max} A`;
  if (spec.recommendedFuseA) return `${spec.recommendedFuseA} A`;
  return null;
}

export function ManufacturerSpecCard({ brandModelId, darkMode }: { brandModelId: unknown; darkMode: boolean }) {
  const spec = getManufacturerSpec(brandModelId);
  if (!spec) return null;

  const rows: { label: string; value: string }[] = [];
  const cables = cableRows(spec);
  if (cables.length > 0) rows.push({ label: "Câble batterie (+ et −)", value: cables.join(" · ") });
  const fuse = fuseText(spec);
  if (fuse) rows.push({ label: "Fusible", value: fuse });
  if (spec.internalFuse) rows.push({ label: "Fusible interne", value: spec.internalFuse });
  if (spec.batteryAh) {
    rows.push({ label: "Batterie conseillée", value: spec.batteryAh.max ? `${spec.batteryAh.min} à ${spec.batteryAh.max} Ah` : `≥ ${spec.batteryAh.min} Ah` });
  }
  if (spec.maxTerminalMm2) rows.push({ label: "Section max. de la borne", value: `${spec.maxTerminalMm2} mm²` });

  const muted = darkMode ? "text-neutral-400" : "text-slate-500";
  return (
    <section
      aria-label="Préconisations Victron"
      className={`rounded-xl border p-3 text-sm ${darkMode ? "border-sky-900 bg-sky-950/30 text-neutral-200" : "border-sky-100 bg-sky-50/60 text-slate-700"}`}
    >
      <h3 className={`text-[10px] font-bold uppercase tracking-[0.18em] ${darkMode ? "text-sky-300" : "text-sky-700"}`}>Préconisations Victron</h3>
      <dl className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className={`text-xs ${muted}`}>{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      {spec.notes?.length ? (
        <ul className={`mt-2 list-disc space-y-0.5 pl-4 text-xs ${muted}`}>
          {spec.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      <a href={spec.sourceUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-block text-xs underline underline-offset-2 ${darkMode ? "text-sky-300" : "text-sky-700"}`}>
        Source : {spec.source}
      </a>
    </section>
  );
}
