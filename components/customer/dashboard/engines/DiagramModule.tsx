"use client";

import { useState } from "react";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type DiagramComputation = {
  circuitId: string;
  circuit: { name: string };
  cable: { retainedSectionMm2: number };
  protection: { protectionType: string; retainedRatingA: number };
};
type DiagramOutput = { circuits: DiagramComputation[] };

// Moteur réel : diagram.model (lib/engines/diagram-engine.ts). Assemble
// circuit.<id>, cable.<id> et protection.<id> déjà retenus — aucun calcul
// propre, aucun rendu graphique généré ici (Volta graphique hors périmètre).
export function DiagramModule({
  projectId,
  circuits,
}: {
  projectId: string;
  circuits: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState<string[]>(circuits.map((c) => c.id));
  const { output, warnings, notices, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "diagram.model"
  );
  const result = output as DiagramOutput | null;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((v) => v !== id) : [...current, id]
    );
  }

  function buildInput() {
    return { circuits: selected.map((circuitId) => ({ circuitId })) };
  }

  if (circuits.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Retenez d&apos;abord un circuit, son câble et sa protection pour assembler un schéma.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {circuits.map((circuit) => (
          <label
            key={circuit.id}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              selected.includes(circuit.id) ? "border-neutral-900 bg-neutral-50" : "border-neutral-300"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(circuit.id)}
              onChange={() => toggle(circuit.id)}
            />
            {circuit.name}
          </label>
        ))}
      </div>

      {result ? (
        <div className="mt-4 space-y-2 rounded-lg bg-neutral-50 p-4 text-sm">
          {result.circuits.map((item) => (
            <p key={item.circuitId}>
              {item.circuit.name} — câble {item.cable.retainedSectionMm2} mm², protection{" "}
              {item.protection.protectionType} {item.protection.retainedRatingA} A
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
