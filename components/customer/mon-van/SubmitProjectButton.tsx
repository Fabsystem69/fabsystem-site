"use client";

import { useFormStatus } from "react-dom";

// Desactive le bouton pendant l'envoi pour eviter le double clic.
export function SubmitProjectButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-400 px-5 text-base font-semibold text-neutral-900 transition-colors hover:bg-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Transmission en cours…" : "Transmettre mon projet à Fabien"}
    </button>
  );
}
