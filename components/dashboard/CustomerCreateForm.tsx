"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AssetType = "VEHICLE" | "BOAT" | "OTHER";

export type CustomerFormInitialData = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  assetType: AssetType;
  assetBrand: string | null;
  assetModel: string | null;
  registration: string | null;
  odometerKm: number | null;
  engineHours: number | null;
};

type CustomerCreateFormProps = {
  initialData?: CustomerFormInitialData;
};

export function CustomerCreateForm({ initialData }: CustomerCreateFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<AssetType>(initialData?.assetType ?? "OTHER");

  const defaultValues = useMemo(
    () => ({
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      address: initialData?.address ?? "",
      assetBrand: initialData?.assetBrand ?? "",
      assetModel: initialData?.assetModel ?? "",
      registration: initialData?.registration ?? "",
      odometerKm:
        initialData?.odometerKm !== null && initialData?.odometerKm !== undefined
          ? String(initialData.odometerKm)
          : "",
      engineHours:
        initialData?.engineHours !== null && initialData?.engineHours !== undefined
          ? String(initialData.engineHours)
          : "",
    }),
    [initialData]
  );

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      assetType: String(formData.get("assetType") || "OTHER"),
      assetBrand: String(formData.get("assetBrand") || "").trim(),
      assetModel: String(formData.get("assetModel") || "").trim(),
      registration: String(formData.get("registration") || "").trim(),
      odometerKm: String(formData.get("odometerKm") || "").trim(),
      engineHours: String(formData.get("engineHours") || "").trim(),
    };

    try {
      const res = await fetch(
        isEdit ? `/api/internal/customers/${initialData?.id}` : "/api/internal/customers",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        customer?: { id: string };
      };

      if (!res.ok) {
        throw new Error(json.error || "Impossible d'enregistrer le client.");
      }

      const nextId = initialData?.id ?? json.customer?.id;
      router.replace(nextId ? `/dashboard/customers/${nextId}` : "/dashboard/customers");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-neutral-500";

  return (
    <form
      action={handleSubmit}
      className="space-y-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5"
    >
      <section>
        <h2 className="text-base font-semibold text-white">
          {isEdit ? "Modifier le client" : "Nouveau client"}
        </h2>
        <div className="mt-4 grid gap-3">
          <input
            name="name"
            placeholder="Nom"
            required
            defaultValue={defaultValues.name}
            className={inputClass}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            defaultValue={defaultValues.email}
            className={inputClass}
          />
          <input
            name="phone"
            placeholder="Téléphone"
            defaultValue={defaultValues.phone}
            className={inputClass}
          />
          <textarea
            name="address"
            placeholder="Adresse"
            rows={3}
            defaultValue={defaultValues.address}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-3 text-base text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-neutral-500"
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-neutral-200">Véhicule / Bateau</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            name="assetType"
            value={assetType}
            onChange={(event) => setAssetType(event.target.value as AssetType)}
            className={inputClass}
          >
            <option value="VEHICLE">Véhicule</option>
            <option value="BOAT">Bateau</option>
            <option value="OTHER">Autre</option>
          </select>
          <input
            name="assetBrand"
            placeholder="Marque"
            defaultValue={defaultValues.assetBrand}
            className={inputClass}
          />
          <input
            name="assetModel"
            placeholder="Modèle"
            defaultValue={defaultValues.assetModel}
            className={inputClass}
          />
          <input
            name="registration"
            placeholder={assetType === "BOAT" ? "HIN" : "Immatriculation"}
            defaultValue={defaultValues.registration}
            className={inputClass}
          />
          <input
            name="odometerKm"
            type="number"
            min="0"
            placeholder="Kilométrage (km)"
            defaultValue={defaultValues.odometerKm}
            className={inputClass}
          />
          {assetType === "BOAT" ? (
            <input
              name="engineHours"
              type="number"
              min="0"
              placeholder="Heures moteur"
              defaultValue={defaultValues.engineHours}
              className={inputClass}
            />
          ) : (
            <input
              name="engineHours"
              type="hidden"
              defaultValue={defaultValues.engineHours}
            />
          )}
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? isEdit
            ? "Enregistrement..."
            : "Création..."
          : isEdit
            ? "Enregistrer les modifications"
            : "Créer le client"}
      </button>
    </form>
  );
}
