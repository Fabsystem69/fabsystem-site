"use client";

import { useState } from "react";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type ProtectionType = "fusible" | "disjoncteur";

const PROTECTION_TYPE_LABELS: Record<ProtectionType, string> = {
  fusible: "Fusible",
  disjoncteur: "Disjoncteur",
};

type CatalogEntry = { type: ProtectionType; ratingA: string };

type ProtectionRow = {
  circuitId: string;
  minMarginRatio: string;
  maxMarginRatio: string;
  catalog: CatalogEntry[];
};

type ProtectionComputation = { circuitId: string; protectionType: string; retainedRatingA: number };
type ProtectionOutput = { protections: ProtectionComputation[] };

function emptyCatalogEntry(): CatalogEntry {
  return { type: "fusible", ratingA: "" };
}

function emptyRow(circuitId: string): ProtectionRow {
  return {
    circuitId,
    minMarginRatio: "1",
    maxMarginRatio: "1.5",
    catalog: [
      { type: "fusible", ratingA: "10" },
      { type: "fusible", ratingA: "16" },
      { type: "fusible", ratingA: "20" },
      { type: "fusible", ratingA: "30" },
      { type: "disjoncteur", ratingA: "40" },
    ],
  };
}

// Moteur réel : protection.selection (lib/engines/protection-engine.ts).
// Lit circuit.<id> et cable.<id> déjà retenus. Le catalogue de calibres
// disponibles est saisi via des lignes structurées (type + calibre) —
// plus de syntaxe texte "fusible:10, disjoncteur:40" (UI-9 FINAL §3). Le
// moteur reçoit toujours exactement `{type, ratingA}[]`.
export function ProtectionModule({
  projectId,
  circuits,
}: {
  projectId: string;
  circuits: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState<ProtectionRow[]>(
    circuits.length > 0 ? [emptyRow(circuits[0].id)] : []
  );
  const { output, warnings, notices, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "protection.selection"
  );
  const result = output as ProtectionOutput | null;

  function updateRow(index: number, patch: Partial<ProtectionRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updateCatalogEntry(rowIndex: number, entryIndex: number, patch: Partial<CatalogEntry>) {
    setRows((current) =>
      current.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              catalog: row.catalog.map((entry, j) => (j === entryIndex ? { ...entry, ...patch } : entry)),
            }
          : row
      )
    );
  }

  function addCatalogEntry(rowIndex: number) {
    setRows((current) =>
      current.map((row, i) => (i === rowIndex ? { ...row, catalog: [...row.catalog, emptyCatalogEntry()] } : row))
    );
  }

  function removeCatalogEntry(rowIndex: number, entryIndex: number) {
    setRows((current) =>
      current.map((row, i) =>
        i === rowIndex ? { ...row, catalog: row.catalog.filter((_, j) => j !== entryIndex) } : row
      )
    );
  }

  function buildInput() {
    return {
      protections: rows
        .filter((row) => row.circuitId)
        .map((row) => ({
          circuitId: row.circuitId,
          minMarginRatio: Number(row.minMarginRatio),
          maxMarginRatio: Number(row.maxMarginRatio),
          catalog: row.catalog
            .filter((entry) => entry.ratingA)
            .map((entry) => ({ type: PROTECTION_TYPE_LABELS[entry.type].toLowerCase(), ratingA: Number(entry.ratingA) })),
        })),
    };
  }

  if (circuits.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Retenez d&apos;abord un circuit et son câble pour choisir sa protection.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="space-y-3 rounded-lg border border-neutral-200 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <select value={row.circuitId} onChange={(e) => updateRow(rowIndex, { circuitId: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400">
                {circuits.map((circuit) => (
                  <option key={circuit.id} value={circuit.id}>{circuit.name}</option>
                ))}
              </select>
              <input type="number" step="0.01" placeholder="Marge min" value={row.minMarginRatio} onChange={(e) => updateRow(rowIndex, { minMarginRatio: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
              <input type="number" step="0.01" placeholder="Marge max" value={row.maxMarginRatio} onChange={(e) => updateRow(rowIndex, { maxMarginRatio: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
            </div>

            <div>
              <p className="text-xs font-medium text-neutral-600">Calibres disponibles pour ce circuit</p>
              <div className="mt-1.5 space-y-1.5">
                {row.catalog.map((entry, entryIndex) => (
                  <div key={entryIndex} className="flex items-center gap-2">
                    <select
                      value={entry.type}
                      onChange={(e) => updateCatalogEntry(rowIndex, entryIndex, { type: e.target.value as ProtectionType })}
                      className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
                    >
                      {(Object.keys(PROTECTION_TYPE_LABELS) as ProtectionType[]).map((type) => (
                        <option key={type} value={type}>{PROTECTION_TYPE_LABELS[type]}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Calibre"
                      value={entry.ratingA}
                      onChange={(e) => updateCatalogEntry(rowIndex, entryIndex, { ratingA: e.target.value })}
                      className="w-24 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
                    />
                    <span className="text-sm text-neutral-500">A</span>
                    {row.catalog.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeCatalogEntry(rowIndex, entryIndex)}
                        aria-label="Retirer ce calibre"
                        className="text-sm text-neutral-400 hover:text-neutral-700"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addCatalogEntry(rowIndex)}
                  className="text-xs font-medium text-brand-700 underline underline-offset-4"
                >
                  + Ajouter un calibre
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="flex gap-3">
          <button type="button" onClick={() => setRows((current) => [...current, emptyRow(circuits[0].id)])} className="text-sm font-medium text-brand-700 underline underline-offset-4">
            + Ajouter une protection
          </button>
          {rows.length > 1 ? (
            <button type="button" onClick={() => setRows((current) => current.slice(0, -1))} className="text-sm font-medium text-neutral-500 underline underline-offset-4">
              Retirer la dernière
            </button>
          ) : null}
        </div>
      </div>

      {result ? (
        <div className="mt-4 space-y-2 rounded-lg bg-neutral-50 p-4 text-sm">
          {result.protections.map((protection) => (
            <p key={protection.circuitId}>
              {circuits.find((c) => c.id === protection.circuitId)?.name ?? protection.circuitId} —{" "}
              <strong>{protection.protectionType} {protection.retainedRatingA} A</strong>
            </p>
          ))}
        </div>
      ) : null}

      <EngineActionBar
        pending={pending}
        hasOutput={Boolean(output)}
        justRetained={justRetained}
        error={error}
        warnings={warnings}
        notices={notices}
        onCalculate={() => run(buildInput(), false)}
        onRetain={() => run(buildInput(), true)}
      />
    </>
  );
}
