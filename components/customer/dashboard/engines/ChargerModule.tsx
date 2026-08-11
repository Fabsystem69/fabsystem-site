"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type ChargerOutput = {
  availablePowerW: number;
  chargingCurrentA: number;
  rechargeableEnergyWh: number;
  theoreticalRechargeTimeHours: number;
  coverageRatio: number;
};

// Moteur réel : charger.recharging (lib/engines/charger-engine.ts). Lit
// energy.dailyConsumption et battery.usefulCapacity déjà retenus.
export function ChargerModule({ projectId }: { projectId: string }) {
  const [nominalPowerW, setNominalPowerW] = useState("300");
  const [maxCurrentA, setMaxCurrentA] = useState("25");
  const [outputVoltageV, setOutputVoltageV] = useState("12");
  const [systemEfficiencyRatio, setSystemEfficiencyRatio] = useState("90");
  const [chargingDurationHours, setChargingDurationHours] = useState("3");
  const { output, warnings, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "charger.recharging"
  );
  const result = output as ChargerOutput | null;

  function buildInput() {
    return {
      nominalPowerW: Number(nominalPowerW),
      maxCurrentA: Number(maxCurrentA),
      outputVoltageV: Number(outputVoltageV),
      systemEfficiencyRatio: Number(systemEfficiencyRatio) / 100,
      chargingDurationHours: Number(chargingDurationHours),
    };
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-neutral-950">Chargeur</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Estime la recharge apportée par un chargeur secteur/quai.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-neutral-700">
          Puissance nominale (W)
          <input type="number" value={nominalPowerW} onChange={(e) => setNominalPowerW(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="text-sm text-neutral-700">
          Courant maximal (A)
          <input type="number" value={maxCurrentA} onChange={(e) => setMaxCurrentA(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="text-sm text-neutral-700">
          Tension de sortie (V)
          <input type="number" value={outputVoltageV} onChange={(e) => setOutputVoltageV(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="text-sm text-neutral-700">
          Rendement global (%)
          <input type="number" value={systemEfficiencyRatio} onChange={(e) => setSystemEfficiencyRatio(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="text-sm text-neutral-700">
          Durée de charge disponible (h)
          <input type="number" value={chargingDurationHours} onChange={(e) => setChargingDurationHours(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
      </div>

      {result ? (
        <div className="mt-4 grid gap-3 rounded-lg bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <p>Puissance disponible : <strong>{result.availablePowerW.toFixed(0)} W</strong></p>
          <p>Courant de charge : <strong>{result.chargingCurrentA.toFixed(1)} A</strong></p>
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
