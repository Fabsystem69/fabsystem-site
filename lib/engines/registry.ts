import { ConfigurationError } from "@/lib/engines/errors";
import type { BaseEngine } from "@/lib/engines/types";

// Couche 4.0 : registre générique des moteurs. Ne déclare et n'importe
// aucun moteur réel — c'est aux phases suivantes d'enregistrer leurs
// moteurs auprès d'une instance de ce registre.

export type EngineRegistry = {
  register(engine: BaseEngine<never, never>): void;
  get(id: string): BaseEngine<never, never> | undefined;
  has(id: string): boolean;
  list(): BaseEngine<never, never>[];
  unregister(id: string): boolean;
};

export function createEngineRegistry(): EngineRegistry {
  const engines = new Map<string, BaseEngine<never, never>>();

  return {
    register(engine) {
      const id = engine.id.trim();

      if (!id) {
        throw new ConfigurationError("Engine id is required to register an engine");
      }

      if (engines.has(id)) {
        throw new ConfigurationError(`Engine already registered: ${id}`, {
          code: "ENGINE_ALREADY_REGISTERED",
          details: { id },
        });
      }

      engines.set(id, engine);
    },

    get(id) {
      return engines.get(id);
    },

    has(id) {
      return engines.has(id);
    },

    list() {
      return Array.from(engines.values());
    },

    unregister(id) {
      return engines.delete(id);
    },
  };
}
