"use client";

import { Card } from "@/components/ui/Card";
import { EngineActionBar } from "@/components/customer/dashboard/engines/EngineActionBar";
import { useEngineRun } from "@/components/customer/dashboard/engines/useEngineRun";

type BalanceOutput = {
  totalAvailableEnergyWh: number;
  totalRechargeableEnergyWh: number;
  globalCoverageRatio: number;
  globalBalanceWh: number;
  globalAutonomyDays: number | null;
};

// Moteur réel : energyBalance.global (lib/engines/global-energy-balance-engine.ts).
// N'a aucune entrée propre : il agrège les valeurs déjà retenues (énergie,
// batterie, alternateur, solaire, chargeur). État logiciel — pas une
// recommandation de Fabien, pas un score inventé.
export function EnergyBalanceModule({ projectId }: { projectId: string }) {
  const { output, warnings, notices, error, pending, justRetained, run } = useEngineRun(
    projectId,
    "energyBalance.global"
  );
  const result = output as BalanceOutput | null;

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-neutral-950">Bilan énergétique</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Compare vos besoins journaliers aux sources de recharge déjà retenues (énergie, batterie,
        alternateur, solaire, chargeur).
      </p>
      <p className="mt-2 text-sm font-medium text-neutral-700">
        Ce bilan utilise automatiquement les informations déjà retenues dans votre projet — aucune
        saisie n&apos;est nécessaire ici.
      </p>

      {result ? (
        <div className="mt-4 grid gap-3 rounded-lg bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <p>Énergie disponible : <strong>{result.totalAvailableEnergyWh.toFixed(0)} Wh</strong></p>
          <p>Énergie rechargeable totale : <strong>{result.totalRechargeableEnergyWh.toFixed(0)} Wh</strong></p>
          <p>Couverture globale : <strong>{(result.globalCoverageRatio * 100).toFixed(0)} %</strong></p>
          <p>
            Équilibre : <strong>{result.globalBalanceWh.toFixed(0)} Wh</strong>{" "}
            {result.globalBalanceWh >= 0 ? "(surplus)" : "(déficit)"}
          </p>
          {result.globalAutonomyDays !== null ? (
            <p>Autonomie avant épuisement au rythme actuel : <strong>{result.globalAutonomyDays.toFixed(1)} j</strong></p>
          ) : null}
        </div>
      ) : null}

      <EngineActionBar
        pending={pending}
        hasOutput={Boolean(output)}
        justRetained={justRetained}
        error={error}
        warnings={warnings}
        notices={notices}
        onCalculate={() => run({}, false)}
        onRetain={() => run({}, true)}
      />
    </Card>
  );
}
