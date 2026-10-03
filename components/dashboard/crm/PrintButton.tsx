"use client";

export function PrintButton({ label = "Imprimer" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-11 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-700 print:hidden"
    >
      {label}
    </button>
  );
}
