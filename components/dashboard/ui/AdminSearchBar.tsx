import type { InputHTMLAttributes } from "react";

export function AdminSearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 min-w-0 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-neutral-500 ${props.className ?? ""}`}
    />
  );
}
