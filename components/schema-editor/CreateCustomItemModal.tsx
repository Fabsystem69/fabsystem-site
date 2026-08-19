"use client";

import { useMemo, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";
import { COMPONENT_DEFINITIONS, getComponentDefinition } from "@/lib/electrical-components/definitions";
import { compressImageForCustomItem } from "@/lib/schema-editor/image-compress";
import { createCustomCatalogItemApi, deleteCustomCatalogItemApi } from "@/features/schemas/customCatalogApi";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { InlineSignupForm } from "./InlineSignupForm";

const MAX_CUSTOM_ITEMS = 10;

// Widget de création d'item personnalisé (retour utilisateur : "widget qui
// fait la création d'item personnalisé si manquant") — reprend exactement
// la forme d'un `BrandModel` officiel (lib/electrical-components/
// brand-models.ts) : on choisit d'abord un type de composant existant (ce
// qui fixe les bornes/le comportement électrique, jamais inventé par
// l'utilisateur), puis on ne personnalise que la marque/le modèle/la photo
// et les valeurs des champs déjà définis pour ce type — jamais un nouveau
// type de composant à part entière.
const EXCLUDED_TYPES = new Set(["consumer"]); // le consommateur générique se personnalise déjà via ses préréglages, pas via ce widget.

export function CreateCustomItemModal({ onClose }: { onClose: () => void }) {
  const darkMode = useSchemaStore((s) => s.darkMode);
  const isLoggedIn = useSchemaStore((s) => s.isLoggedIn);
  const customCatalogItems = useSchemaStore((s) => s.customCatalogItems);
  const setCustomCatalogItems = useSchemaStore((s) => s.setCustomCatalogItems);
  useEscapeToClose(onClose);

  const [componentType, setComponentType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const def = componentType ? getComponentDefinition(componentType) : undefined;
  const customizableFields = useMemo(() => (def ? def.fields.filter((f) => f.key !== "label") : []), [def]);

  const typeOptions = useMemo(
    () =>
      COMPONENT_DEFINITIONS.filter((d) => !EXCLUDED_TYPES.has(d.type)).map((d) => ({ value: d.type, label: d.label })).sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [],
  );

  const inputClass = `w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
    darkMode ? "border-neutral-700 bg-neutral-800 text-neutral-100 focus:border-neutral-400" : "border-neutral-300 focus:border-neutral-900"
  }`;
  const labelClass = `mb-1 block text-xs font-medium ${darkMode ? "text-neutral-400" : "text-neutral-600"}`;

  function selectComponentType(type: string) {
    setComponentType(type);
    const nextDef = getComponentDefinition(type);
    const defaults: Record<string, unknown> = {};
    if (nextDef) {
      for (const field of nextDef.fields) {
        if (field.key === "label") continue;
        defaults[field.key] = nextDef.defaultData[field.key] ?? (field.type === "number" ? 0 : "");
      }
    }
    setFieldValues(defaults);
  }

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    setImageError(null);
    setCompressing(true);
    try {
      const dataUrl = await compressImageForCustomItem(file);
      setImageDataUrl(dataUrl);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Photo invalide");
    } finally {
      setCompressing(false);
    }
  }

  async function handleSubmit() {
    if (!def || !componentType) return;
    if (!brand.trim() || !model.trim()) {
      setSubmitError("Marque et modèle sont obligatoires.");
      return;
    }
    if (!imageDataUrl) {
      setSubmitError("Une photo est obligatoire.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const result = await createCustomCatalogItemApi({ componentType, brand: brand.trim(), model: model.trim(), defaults: fieldValues, imageDataUrl });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    setCustomCatalogItems([result.item, ...customCatalogItems]);
    setComponentType("");
    setBrand("");
    setModel("");
    setFieldValues({});
    setImageDataUrl(null);
  }

  async function handleDelete(id: string) {
    const ok = await deleteCustomCatalogItemApi(id);
    if (ok) setCustomCatalogItems(customCatalogItems.filter((item) => item.id !== id));
  }

  const atLimit = customCatalogItems.length >= MAX_CUSTOM_ITEMS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl ${
          darkMode ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"
        }`}
      >
        <div className={`flex items-start justify-between gap-2 border-b px-4 py-3 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
          <div>
            <h2 className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Catalogue personnalisé</h2>
            <p className={`text-sm ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>Ajoute un modèle qui manque, avec sa vraie photo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Fermer"
            className={`shrink-0 rounded-md border p-1.5 text-xs transition-base ${darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"}`}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {!isLoggedIn ? (
            <div className="space-y-3">
              <p className={`text-sm ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                Un compte est nécessaire pour créer et retrouver tes items personnalisés d'une session à l'autre.
              </p>
              <InlineSignupForm darkMode={darkMode} onSuccess={() => {}} />
            </div>
          ) : (
            <>
              {customCatalogItems.length > 0 ? (
                <div className="space-y-2">
                  <span className={labelClass}>
                    Tes items ({customCatalogItems.length}/{MAX_CUSTOM_ITEMS})
                  </span>
                  <ul className="space-y-1.5">
                    {customCatalogItems.map((item) => (
                      <li
                        key={item.id}
                        className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}
                      >
                        <img src={item.imageDataUrl} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className={`truncate font-medium ${darkMode ? "text-neutral-100" : "text-neutral-900"}`}>{item.brand} {item.model}</div>
                          <div className={`truncate text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{getComponentDefinition(item.componentType)?.label ?? item.componentType}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          title="Supprimer"
                          className={`shrink-0 rounded-md border px-2 py-1 text-xs transition-base ${darkMode ? "border-red-900 text-red-400 hover:bg-red-950" : "border-red-200 text-red-600 hover:bg-red-50"}`}
                        >
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {atLimit ? (
                <p className={`rounded-md px-2.5 py-2 text-xs ${darkMode ? "bg-amber-950 text-amber-300" : "bg-amber-50 text-amber-700"}`}>
                  Limite de {MAX_CUSTOM_ITEMS} items personnalisés atteinte — supprime-en un pour en créer un nouveau.
                </p>
              ) : (
                <div className={`space-y-3 border-t pt-4 ${darkMode ? "border-neutral-800" : "border-neutral-200"}`}>
                  <label className="block">
                    <span className={labelClass}>Type de composant</span>
                    <select value={componentType} onChange={(e) => selectComponentType(e.target.value)} className={inputClass}>
                      <option value="">Choisir un type…</option>
                      {typeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className={`mt-1 block text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                      Détermine les bornes et le comportement électrique — seule la marque, le modèle et les valeurs restent à personnaliser.
                    </span>
                  </label>

                  {def ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className={labelClass}>Marque</span>
                          <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Modèle</span>
                          <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} />
                        </label>
                      </div>

                      {customizableFields.map((field) => (
                        <label key={field.key} className="block">
                          <span className={labelClass}>{field.label}</span>
                          {field.type === "select" ? (
                            <select
                              value={String(fieldValues[field.key] ?? "")}
                              onChange={(e) => setFieldValues({ ...fieldValues, [field.key]: e.target.value })}
                              className={inputClass}
                            >
                              {field.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : field.type === "number" ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={Number(fieldValues[field.key] ?? 0)}
                                onChange={(e) => setFieldValues({ ...fieldValues, [field.key]: Number(e.target.value) })}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                className={inputClass}
                              />
                              {field.unit ? <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>{field.unit}</span> : null}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={String(fieldValues[field.key] ?? "")}
                              onChange={(e) => setFieldValues({ ...fieldValues, [field.key]: e.target.value })}
                              className={inputClass}
                            />
                          )}
                        </label>
                      ))}

                      <label className="block">
                        <span className={labelClass}>Photo (JPEG/PNG/WebP, compressée automatiquement sous 250 Ko)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                          className={`block w-full text-sm ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}
                        />
                        {compressing ? <span className={`mt-1 block text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>Compression en cours…</span> : null}
                        {imageError ? <span className="mt-1 block text-xs text-red-500">{imageError}</span> : null}
                        {imageDataUrl ? <img src={imageDataUrl} alt="Aperçu" className="mt-2 h-20 w-20 rounded object-cover" /> : null}
                      </label>

                      {submitError ? <p className="text-xs text-red-500">{submitError}</p> : null}

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || compressing}
                        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-base hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                      >
                        {submitting ? "Création…" : "Créer l'item"}
                      </button>
                    </>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
