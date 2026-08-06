"use client";

type DigitalAssetFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initialValues?: {
    assetId?: string;
    provider?: "SUPABASE";
    filename?: string;
    bucket?: string;
    path?: string;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  };
};

export function DigitalAssetForm({
  action,
  submitLabel,
  initialValues,
}: DigitalAssetFormProps) {
  return (
    <form action={action} className="space-y-6 rounded-xl border border-neutral-200 bg-white p-5">
      {initialValues?.assetId ? (
        <input type="hidden" name="assetId" value={initialValues.assetId} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-900">Provider</span>
          <select
            name="provider"
            defaultValue={initialValues?.provider ?? "SUPABASE"}
            className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
          >
            <option value="SUPABASE">SUPABASE</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-900">Statut</span>
          <select
            name="status"
            defaultValue={initialValues?.status ?? "DRAFT"}
            className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-900">Bucket</span>
          <input
            name="bucket"
            required
            defaultValue={initialValues?.bucket ?? ""}
            className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-900">Nom fichier</span>
          <input
            name="filename"
            required
            defaultValue={initialValues?.filename ?? ""}
            className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
          />
        </label>

        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-neutral-900">Path</span>
          <input
            name="path"
            required
            defaultValue={initialValues?.path ?? ""}
            className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
          />
        </label>
      </div>

      <button className="rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800">
        {submitLabel}
      </button>
    </form>
  );
}
