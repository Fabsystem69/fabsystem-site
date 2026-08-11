import { createEngineRegistry, type EngineRegistry } from "@/lib/engines/registry";
import type { BaseEngine } from "@/lib/engines/types";
import { createEnergyEngine } from "@/lib/engines/energy-engine";
import { createBatteryEngine } from "@/lib/engines/battery-engine";
import { createAlternatorEngine } from "@/lib/engines/alternator-engine";
import { createSolarEngine } from "@/lib/engines/solar-engine";
import { createChargerEngine } from "@/lib/engines/charger-engine";
import { createGlobalEnergyBalanceEngine } from "@/lib/engines/global-energy-balance-engine";
import { createCircuitEngine } from "@/lib/engines/circuit-engine";
import { createCableEngine } from "@/lib/engines/cable-engine";
import { createProtectionEngine } from "@/lib/engines/protection-engine";
import { createDiagramEngine } from "@/lib/engines/diagram-engine";

// UI-8 FINAL : premier point du dépôt où une instance d'EngineRegistry est
// réellement peuplée avec les moteurs existants. Ne crée aucun nouveau
// moteur — enregistre exclusivement les moteurs déjà construits par les
// phases Engine (4.1 à 5.0). Sert de source de vérité unique pour toute
// route ou page ayant besoin de la liste réelle des moteurs (mission UI-8
// FINAL §5 : "ne pas coder la liste à la main à plusieurs endroits").
let registry: EngineRegistry | null = null;

export function getEngineRegistry(): EngineRegistry {
  if (registry) {
    return registry;
  }

  // BaseEngine<never, never> est la borne générique du registre (couche
  // 4.0, volontairement agnostique de tout moteur réel) : chaque moteur
  // concret garde son propre input/output fort partout ailleurs (route,
  // formulaires) — seule cette inscription générique nécessite ce cast.
  function register<TInput, TOutput>(engine: BaseEngine<TInput, TOutput>) {
    created.register(engine as unknown as BaseEngine<never, never>);
  }

  const created = createEngineRegistry();
  register(createEnergyEngine());
  register(createBatteryEngine());
  register(createAlternatorEngine());
  register(createSolarEngine());
  register(createChargerEngine());
  register(createGlobalEnergyBalanceEngine());
  register(createCircuitEngine());
  register(createCableEngine());
  register(createProtectionEngine());
  register(createDiagramEngine());

  registry = created;
  return registry;
}

export function listRegisteredEngineIds(): string[] {
  return getEngineRegistry()
    .list()
    .map((engine) => engine.id);
}
