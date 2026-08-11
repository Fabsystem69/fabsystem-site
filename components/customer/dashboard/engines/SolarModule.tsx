"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type SolarOutput = {
  dailySolarEnergyWh: number;
  averageChargingCurrentA: number;
  theoreticalRechargeTimeHours: number;
  coverageRatio: number;
};

// Moteur réel : solar.production (lib/engines/solar-engine.ts). Lit
// energy.dailyConsumption et battery.usefulCapacity déjà retenus.
export function SolarModule({ projectId }: { projectId: string }) {
  const [panelPowerWp, setPanelPowerWp] = useState("200");
  const [equivalentSunHours, setEquivalentSunHours] = useState("4");
  const [systemEfficiencyRatio, setSystemEfficiencyRatio] = useState("80");
  const { output, warnings, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "solar.production"
  );
  const result = output as SolarOutput | null;

  function buildInput() {
    return {
      panelPowerWp: Number(panelPowerWp),
      equivalentSunHours: Number(equivalentSunHours),
      systemEfficiencyRatio: Number(systemEfficiencyRatio) / 100,
    };
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-neutral-950">Solaire</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Estime la production et la couverture apportées par les panneaux solaires.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-neutral-700">
          Puissance crête (Wc)
          <input type="number" value={panelPowerWp} onChange={(e) => setPanelPowerWp(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="text-sm text-neutral-700">
          Heures d&apos;ensoleillement équivalent
          <input type="number" value={equivalentSunHours} onChange={(e) => setEquivalentSunHours(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="text-sm text-neutral-700">
          Rendement global (%)
          <input type="number" value={systemEfficiencyRatio} onChange={(e) => setSystemEfficiencyRatio(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
      </div>

      {result ? (
        <div className="mt-4 grid gap-3 rounded-lg bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <p>Énergie solaire quotidienne : <strong>{result.dailySolarEnergyWh.toFixed(0)} Wh</strong></p>
          <p>Courant moyen de charge : <strong>{result.averageChargingCurrentA.toFixed(1)} A</strong></p>
          <p>Temps de recharge théorique : <strong>{result.theoreticalRechargeTimeHours.toFixed(1)} h</strong></p>
          <p>Couverture des besoins : <strong>{(result.coverageRatio * 100).toFixed(0)} %</strong></p>
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
