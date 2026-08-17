"use client";

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initialValues?: {
    productId?: string;
    name?: string;
    slug?: string;
    shortDescription?: string | null;
    description?: string | null;
    productType?: "EBOOK" | "DIGITAL_DOWNLOAD" | "BUNDLE" | "SCHEMA_UNLOCK";
    purchaseMode?: "BUY_NOW" | "REQUEST_ONLY";
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    activePriceEuros?: string;
  };
  showPriceField?: boolean;
};

export function ProductForm({
  action,
  submitLabel,
  initialValues,
  showPriceField = false,
}: ProductFormProps) {
  return (
    <form action={action} className="space-y-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
      {initialValues?.productId ? (
        <input type="hidden" name="productId" value={initialValues.productId} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-200">Nom produit</span>
          <input
            name="name"
            required
            defaultValue={initialValues?.name ?? ""}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-200">Slug</span>
          <input
            name="slug"
            required
            defaultValue={initialValues?.slug ?? ""}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-neutral-200">Description courte</span>
          <input
            name="shortDescription"
            defaultValue={initialValues?.shortDescription ?? ""}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-neutral-200">Description</span>
          <textarea
            name="description"
            rows={5}
            defaultValue={initialValues?.description ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-3 text-base"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-200">Type</span>
          <select
            name="productType"
            defaultValue={initialValues?.productType ?? "EBOOK"}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          >
            <option value="EBOOK">EBOOK</option>
            <option value="DIGITAL_DOWNLOAD">DIGITAL_DOWNLOAD</option>
            <option value="BUNDLE">BUNDLE</option>
            <option value="SCHEMA_UNLOCK">SCHEMA_UNLOCK</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-neutral-200">Mode d&apos;achat</span>
          <select
            name="purchaseMode"
            defaultValue={initialValues?.purchaseMode ?? "BUY_NOW"}
            className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
          >
            <option value="BUY_NOW">BUY_NOW</option>
            <option value="REQUEST_ONLY">REQUEST_ONLY</option>
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

        {showPriceField ? (
          <label className="space-y-2 text-sm">
            <span className="font-medium text-neutral-200">Prix TTC (EUR)</span>
            <input
              name="amountEuros"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={initialValues?.activePriceEuros ?? ""}
              className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-neutral-100 outline-none focus:border-neutral-500"
            />
          </label>
        ) : null}
      </div>

      <button className="h-11 rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-950 transition-colors duration-150 hover:bg-brand-300">
        {submitLabel}
      </button>
    </form>
  );
}
