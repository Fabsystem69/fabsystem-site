"use client";

import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { getComponentDefinition } from "@/lib/electrical-components/definitions";
import { getBrandModelsForType, getBrandModel } from "@/lib/electrical-components/brand-models";

// Popup de choix de marque/modèle à l'ajout (V2, retour utilisateur : "à
// chaque ajout d'élément comme batterie, MPPT, DC-DC, Multiplus... ouvrir un
// pop up pour choisir le modèle avec puissance") — se déclenche seul juste
// après `addComponent` (voir useSchemaStore `pendingModelPickerNodeId`), sans
// bloquer : "Générique" ferme la popup sans rien changer, le composant reste
// utilisable normalement. Rejoue le même choix que le sélecteur du panneau
// propriétés (PropertiesPanel), juste proposé tout de suite plutôt qu'à
// découvrir en sélectionnant le nœud.
export function ModelPickerModal() {
  const nodeId = useSchemaStore((s) => s.pendingModelPickerNodeId);
  const nodes = useSchemaStore((s) => s.nodes);
  const darkMode = useSchemaStore((s) => s.darkMode);
  const updateNodeData = useSchemaStore((s) => s.updateNodeData);
  const dismissModelPicker = useSchemaStore((s) => s.dismissModelPicker);

  const node = nodeId ? nodes.find((n) => n.id === nodeId) : undefined;
  if (!node) return null;
  const def = getComponentDefinition(node.data.componentType);
  if (!def) return null;
  const brandModels = getBrandModelsForType(node.data.componentType);
  if (brandModels.length === 0) return null;

  const brandModelsByBrand = new Map<string, typeof brandModels>();
  for (const m of brandModels) {
    const list = brandModelsByBrand.get(m.brand) ?? [];
    list.push(m);
    brandModelsByBrand.set(m.brand, list);
  }

  function handlePick(id: string) {
    if (!node) return;
    const brandModel = getBrandModel(id);
    if (!brandModel) return;
    updateNodeData(node.id, {
      brandModelId: brandModel.id,
      brand: brandModel.brand,
      model: brandModel.model,
      ...brandModel.defaults,
    });
    dismissModelPicker();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={dismissModelPicker}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[80vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
          darkMode ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{def.label} ajouté</p>
        <h2 className={`mt-1 text-xl font-bold ${darkMode ? "text-neutral-50" : "text-neutral-950"}`}>Choisir un modèle ?</h2>
        <p className={`mt-1 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
          Pré-remplit la puissance/le courant réels du modèle. Reste modifiable ensuite, ou passez en générique.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {Array.from(brandModelsByBrand.entries()).map(([brand, models]) => (
            <div key={brand}>
              <p className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{brand}</p>
              <div className="flex flex-col gap-1.5">
                {models.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handlePick(m.id)}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-base ${
                      darkMode
                        ? "border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-800"
                        : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"
                    }`}
                  >
                    <span className="font-medium">{m.model}</span>
                    <span className={`shrink-0 text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                      {Object.entries(m.defaults)
                        .filter(([k]) => k.toLowerCase().includes("power") || k.toLowerCase().includes("amperage"))
                        .map(([, v]) => v)
                        .join(" · ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={dismissModelPicker}
          className={`mt-5 w-full rounded-lg border border-dashed px-4 py-2.5 text-center text-sm font-semibold transition-base ${
            darkMode
              ? "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              : "border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
          }`}
        >
          Rester en générique
        </button>
      </div>
    </div>
  );
}
