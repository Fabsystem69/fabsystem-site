"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type ProtectionRow = {
  circuitId: string;
  minMarginRatio: string;
  maxMarginRatio: string;
  catalog: string;
};

type ProtectionComputation = { circuitId: string; protectionType: string; retainedRatingA: number };
type ProtectionOutput = { protections: ProtectionComputation[] };

function emptyRow(circuitId: string): ProtectionRow {
  return {
    circuitId,
    minMarginRatio: "1",
    maxMarginRatio: "1.5",
    catalog: "fusible:10, fusible:16, fusible:20, fusible:30, disjoncteur:40",
  };
}

function parseCatalog(raw: string) {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [type, rating] = entry.split(":").map((part) => part.trim());
      return { type: type || "fusible", ratingA: Number(rating) };
    })
    .filter((entry) => Number.isFinite(entry.ratingA) && entry.ratingA > 0);
}

// Moteur réel : protection.selection (lib/engines/protection-engine.ts).
// Lit circuit.<id> et cable.<id> déjà retenus.
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
  const { output, warnings, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "protection.selection"
  );
  const result = output as ProtectionOutput | null;

  function updateRow(index: number, patch: Partial<ProtectionRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function buildInput() {
    return {
      protections: rows
        .filter((row) => row.circuitId)
        .map((row) => ({
          circuitId: row.circuitId,
          minMarginRatio: Number(row.minMarginRatio),
          maxMarginRatio: Number(row.maxMarginRatio),
          catalog: parseCatalog(row.catalog),
        })),
    };
  }

  if (circuits.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-base font-semibold text-neutral-950">Protections</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Retenez d&apos;abord un circuit et son câble pour choisir sa protection.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-neutral-950">Protections</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Choisit la protection adaptée à chaque circuit déjà câblé.
      </p>

      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-4">
            <select value={row.circuitId} onChange={(e) => updateRow(index, { circuitId: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400">
              {circuits.map((circuit) => (
                <option key={circuit.id} value={circuit.id}>{circuit.name}</option>
              ))}
            </select>
            <input type="number" step="0.01" placeholder="Marge min" value={row.minMarginRatio} onChange={(e) => updateRow(index, { minMarginRatio: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
            <input type="number" step="0.01" placeholder="Marge max" value={row.maxMarginRatio} onChange={(e) => updateRow(index, { maxMarginRatio: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
            <input type="text" placeholder="Catalogue (type:calibre, ...)" value={row.catalog} onChange={(e) => updateRow(index, { catalog: e.target.value })} className="rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
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
        onCalculate={() => run(buildInput(), false)}
        onRetain={() => run(buildInput(), true)}
      />
    </Card>
  );
}
