"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AssetType = "VEHICLE" | "BOAT" | "OTHER";

export type CustomerFormInitialData = {
  id: string;
  name: string;
  email: string | null;
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

  return (
    <form action={handleSubmit} className="space-y-6 rounded-lg border border-neutral-200 bg-white p-4">
      <section>
        <h2 className="text-lg font-semibold text-neutral-900">
          {isEdit ? "Modifier le client" : "Nouveau client"}
        </h2>
        <div className="mt-4 grid gap-3">
          <input
            name="name"
            placeholder="Nom"
            required
            defaultValue={defaultValues.name}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            defaultValue={defaultValues.email}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          />
          <input
            name="phone"
            placeholder="Téléphone"
            defaultValue={defaultValues.phone}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          />
          <textarea
            name="address"
            placeholder="Adresse"
            rows={3}
            defaultValue={defaultValues.address}
            className="rounded-md border border-neutral-300 px-3 py-3 text-base"
          />
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-neutral-900">Véhicule / Bateau</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            name="assetType"
            value={assetType}
            onChange={(event) => setAssetType(event.target.value as AssetType)}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          >
            <option value="VEHICLE">Véhicule</option>
            <option value="BOAT">Bateau</option>
            <option value="OTHER">Autre</option>
          </select>
          <input
            name="assetBrand"
            placeholder="Marque"
            defaultValue={defaultValues.assetBrand}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          />
          <input
            name="assetModel"
            placeholder="Modèle"
            defaultValue={defaultValues.assetModel}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          />
          <input
            name="registration"
            placeholder={assetType === "BOAT" ? "HIN" : "Immatriculation"}
            defaultValue={defaultValues.registration}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          />
          <input
            name="odometerKm"
            type="number"
            min="0"
            placeholder="Kilométrage (km)"
            defaultValue={defaultValues.odometerKm}
            className="h-11 rounded-md border border-neutral-300 px-3 text-base"
          />
          {assetType === "BOAT" ? (
            <input
              name="engineHours"
              type="number"
              min="0"
              placeholder="Heures moteur"
              defaultValue={defaultValues.engineHours}
              className="h-11 rounded-md border border-neutral-300 px-3 text-base"
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
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
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
