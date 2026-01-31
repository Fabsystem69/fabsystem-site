"use client";

import { useState } from "react";

export default function PhoneReveal() {
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div className="mt-4">
      {!showPhone ? (
        <button
          type="button"
          onClick={() => setShowPhone(true)}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
        >
          Afficher le numéro de téléphone
        </button>
      ) : (
        <a
          href="tel:+33698247722"
          className="font-medium text-neutral-900 underline"
        >
          📞 06 98 24 77 22
        </a>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        Appel téléphonique après premier échange si nécessaire.
      </p>
    </div>
  );
}