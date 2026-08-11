"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";
import type { BatteryChemistry } from "@/lib/engines/battery-engine";

type BatteryOutput = {
  usefulEnergyWh: number;
  usefulCapacityAh: number;
  nominalCapacityAh: number;
  autonomyDays: number;
};

const TECHNOLOGIES: { value: BatteryChemistry; label: string }[] = [
  { value: "LEAD_ACID", label: "Plomb ouvert" },
  { value: "AGM", label: "AGM" },
  { value: "GEL", label: "Gel" },
  { value: "LIFEPO4", label: "LiFePO4" },
];

// Moteur réel : battery.sizing (lib/engines/battery-engine.ts). Lit
// energy.dailyConsumption et energy.maxCurrent déjà retenus par le projet —
// le moteur signale lui-même une dépendance manquante (voir l'erreur
// affichée) si l'énergie n'a pas encore été calculée et retenue.
export function BatteryModule({
  projectId,
  defaultVoltageV,
}: {
  projectId: string;
  defaultVoltageV: number | null;
}) {
  const [technology, setTechnology] = useState<BatteryChemistry>("AGM");
  const [maxDepthOfDischarge, setMaxDepthOfDischarge] = useState("50");
  const [desiredAutonomyDays, setDesiredAutonomyDays] = useState("2");
  const [systemVoltageV, setSystemVoltageV] = useState(defaultVoltageV ? String(defaultVoltageV) : "12");
  const { output, warnings, notices, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "battery.sizing"
  );
  const result = output as BatteryOutput | null;

  function buildInput() {
    return {
      technology,
      maxDepthOfDischarge: Number(maxDepthOfDischarge) / 100,
      desiredAutonomyDays: Number(desiredAutonomyDays),
      systemVoltageV: Number(systemVoltageV),
    };
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-neutral-950">Batterie</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Dimensionne la batterie à partir de votre consommation déjà retenue.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-neutral-700">
          Technologie
          <select
            value={technology}
            onChange={(e) => setTechnology(e.target.value as BatteryChemistry)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
          >
            {TECHNOLOGIES.map((tech) => (
              <option key={tech.value} value={tech.value}>
                {tech.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-neutral-700">
          Profondeur de décharge max (%)
          <input
            type="number"
            value={maxDepthOfDischarge}
            onChange={(e) => setMaxDepthOfDischarge(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>
        <label className="text-sm text-neutral-700">
          Autonomie souhaitée (jours)
          <input
            type="number"
            value={desiredAutonomyDays}
            onChange={(e) => setDesiredAutonomyDays(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>
        <label className="text-sm text-neutral-700">
          Tension système (V)
          <input
            type="number"
            value={systemVoltageV}
            onChange={(e) => setSystemVoltageV(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>
      </div>

      {result ? (
        <div className="mt-4 grid gap-3 rounded-lg bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <p>Capacité nominale à acquérir : <strong>{result.nominalCapacityAh.toFixed(0)} Ah</strong></p>
          <p>Capacité utile nécessaire : <strong>{result.usefulCapacityAh.toFixed(0)} Ah</strong></p>
          <p>Énergie utile : <strong>{result.usefulEnergyWh.toFixed(0)} Wh</strong></p>
          <p>Autonomie théorique recalculée : <strong>{result.autonomyDays.toFixed(1)} j</strong></p>
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
    </Card>
  );
}
