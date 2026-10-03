export const fieldClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900";
export const labelClass = "block space-y-1.5 text-sm font-medium text-neutral-900";
export const hintClass = "text-xs font-normal text-neutral-500";

export type Draft = Record<string, string> | null;

export function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  type,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        inputMode={type === "number" ? "decimal" : undefined}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder ?? "À définir avec Fabsystem"}
        className={fieldClass}
      />
    </label>
  );
}

export function TextAreaField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string | null }) {
  return (
    <label className={`${labelClass} sm:col-span-2`}>
      <span>{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={2} placeholder="À définir avec Fabsystem" className={fieldClass} />
    </label>
  );
}
