"use client";

import { useState } from "react";
import { track } from "@/lib/client/track";

const PHONE_DISPLAY = "06 98 24 77 22";
const PHONE_HREF = "tel:+33698247722";

type RevealPhoneProps = {
  className?: string;
  hiddenLabel?: string;
};

// Le téléphone reste masqué par défaut (l'email est le canal de contact
// privilégié) : un clic affiche le numéro, un second clic déclenche l'appel.
export default function RevealPhone({
  className,
  hiddenLabel = "Afficher le numéro de téléphone",
}: RevealPhoneProps) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => {
          setRevealed(true);
          track("reveal_phone");
        }}
        className={className}
      >
        {hiddenLabel}
      </button>
    );
  }

  return (
    <a
      href={PHONE_HREF}
      onClick={() => track("click_phone")}
      className={className}
    >
      {PHONE_DISPLAY}
    </a>
  );
}
