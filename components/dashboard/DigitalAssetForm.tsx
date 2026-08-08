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
    <form action={action} className="space-y-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
      {initialValues?.assetId ? (
        <input type="hidden" name="assetId" value={initialValues.assetId} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-200">Provider</span>
          <select
            name="provider"
            defaultValue={initialValues?.provider ?? "SUPABASE"}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          >
            <option value="SUPABASE">SUPABASE</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-200">Statut</span>
          <select
            name="status"
            defaultValue={initialValues?.status ?? "DRAFT"}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-200">Bucket</span>
          <input
            name="bucket"
            required
            defaultValue={initialValues?.bucket ?? ""}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-200">Nom fichier</span>
          <input
            name="filename"
            required
            defaultValue={initialValues?.filename ?? ""}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-neutral-200">Path</span>
          <input
            name="path"
            required
            defaultValue={initialValues?.path ?? ""}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>
      </div>

      <button className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300">
        {submitLabel}
      </button>
    </form>
  );
}
