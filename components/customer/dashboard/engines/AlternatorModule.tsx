"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type AlternatorOutput = {
  usableCurrentA: number;
  rechargeableEnergyWh: number;
  theoreticalRechargeTimeHours: number;
  rechargeMarginWh: number;
};

// Moteur réel : alternator.charging (lib/engines/alternator-engine.ts).
// Lit energy.dailyConsumption et battery.usefulCapacity déjà retenus.
export function AlternatorModule({ projectId }: { projectId: string }) {
  const [nominalCurrentA, setNominalCurrentA] = useState("100");
  const [availableCurrentA, setAvailableCurrentA] = useState("60");
  const [referenceRpm, setReferenceRpm] = useState("2000");
  const [rollingDurationHours, setRollingDurationHours] = useState("2");
  const { output, warnings, notices, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "alternator.charging"
  );
  const result = output as AlternatorOutput | null;

  function buildInput() {
    return {
      nominalCurrentA: Number(nominalCurrentA),
      availableCurrentA: Number(availableCurrentA),
      referenceRpm: Number(referenceRpm),
      rollingDurationHours: Number(rollingDurationHours),
    };
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-neutral-950">Alternateur</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Estime la recharge apportée par l&apos;alternateur pendant le roulage.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-neutral-700">
          Courant nominal alternateur (A)
          <input type="number" value={nominalCurrentA} onChange={(e) => setNominalCurrentA(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="text-sm text-neutral-700">
          Courant réellement disponible (A)
          <input type="number" value={availableCurrentA} onChange={(e) => setAvailableCurrentA(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="text-sm text-neutral-700">
          Régime moteur de référence (tr/min)
          <input type="number" value={referenceRpm} onChange={(e) => setReferenceRpm(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="text-sm text-neutral-700">
          Durée de roulage disponible (h)
          <input type="number" value={rollingDurationHours} onChange={(e) => setRollingDurationHours(e.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-brand-400" />
        </label>
      </div>

      {result ? (
        <div className="mt-4 grid gap-3 rounded-lg bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <p>Courant exploitable : <strong>{result.usableCurrentA.toFixed(1)} A</strong></p>
          <p>Énergie rechargeable : <strong>{result.rechargeableEnergyWh.toFixed(0)} Wh</strong></p>
          <p>Temps de recharge théorique : <strong>{result.theoreticalRechargeTimeHours.toFixed(1)} h</strong></p>
          <p>Marge : <strong>{result.rechargeMarginWh.toFixed(0)} Wh</strong> {result.rechargeMarginWh >= 0 ? "(surplus)" : "(déficit)"}</p>
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
