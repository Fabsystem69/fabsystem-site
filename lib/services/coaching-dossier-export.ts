import { prisma } from "@/lib/prisma";
import { computeDeviceEnergyWh } from "@/lib/calc/coaching-consumption";
import { getCoachingCalcMethodLabel, getCoachingDataOriginLabel, getCoachingPowerSupplyLabel } from "@/lib/dashboard-status-labels";

// Même convention CSV que lib/electrical-components/bom.ts (point-virgule,
// cellules entre guillemets — Excel-safe) : dupliquée ici volontairement,
// deux domaines différents (BOM schéma électrique vs dossier van), pas une
// dépendance croisée pour deux fonctions de 3 lignes.
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function csvLine(cells: string[]): string {
  return cells.map(csvCell).join(";");
}

// Export CSV du bilan (retour utilisateur, espace admin : "appareils,
// unités, valeurs saisies, méthodes, sources, scénarios, résultats et
// hypothèses. Les données inconnues restent signalées.") — toujours le
// bilan EN COURS (version de travail), jamais une révision figée : une
// révision passée s'exporte depuis son propre instantané si besoin plus
// tard (hors périmètre actuel).
export async function buildVanBilanCsv(projectId: string): Promise<string> {
  const project = await prisma.coachingProject.findUniqueOrThrow({ where: { id: projectId }, select: { title: true } });
  const scenarios = await prisma.coachingScenario.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });

  const lines: string[] = [csvLine([`Bilan de consommation — ${project.title}`]), ""];

  for (const scenario of scenarios) {
    const usages = await prisma.coachingDeviceUsage.findMany({ where: { scenarioId: scenario.id }, include: { device: true } });
    lines.push(csvLine([`Scénario : ${scenario.name}`]));
    lines.push(
      csvLine([
        "Appareil",
        "Catégorie",
        "Quantité",
        "Alimentation",
        "Méthode",
        "Puissance (W)",
        "Durée effective (h/j)",
        "Énergie/j (Wh)",
        "Wh/cycle",
        "Cycles/j",
        "Origine donnée",
        "Résultat (Wh/j)",
      ])
    );
    let total = 0;
    let hasIncomplete = false;
    for (const usage of usages) {
      const result = computeDeviceEnergyWh(
        {
          calcMethod: usage.calcMethod,
          continuousPowerW: usage.continuousPowerW,
          effectiveHoursPerDay: usage.effectiveHoursPerDay,
          availabilityHoursPerDay: usage.availabilityHoursPerDay,
          dutyCycleRatio: usage.dutyCycleRatio,
          dailyEnergyWhPerUnit: usage.dailyEnergyWhPerUnit,
          dailyEnergyIsGroupTotal: usage.dailyEnergyIsGroupTotal,
          energyPerCycleWh: usage.energyPerCycleWh,
          cyclesPerDay: usage.cyclesPerDay,
        },
        usage.device.quantity
      );
      if (result.incomplete) hasIncomplete = true;
      else total += result.energyWh;

      lines.push(
        csvLine([
          usage.device.name,
          usage.device.category,
          String(usage.device.quantity),
          getCoachingPowerSupplyLabel(usage.device.powerSupply),
          getCoachingCalcMethodLabel(usage.calcMethod),
          usage.continuousPowerW?.toString() ?? "",
          usage.effectiveHoursPerDay?.toString() ?? "",
          usage.dailyEnergyWhPerUnit?.toString() ?? "",
          usage.energyPerCycleWh?.toString() ?? "",
          usage.cyclesPerDay?.toString() ?? "",
          usage.device.dataOrigin ? getCoachingDataOriginLabel(usage.device.dataOrigin) : "",
          result.incomplete ? "Inconnu" : String(Math.round(result.energyWh)),
        ])
      );
    }
    lines.push(csvLine([hasIncomplete ? "Total connu (bilan incomplet)" : "Total", String(Math.round(total))]));
    lines.push("");
  }

  return lines.join("\n");
}
