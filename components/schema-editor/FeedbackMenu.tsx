"use client";

import { useEffect, useRef, useState } from "react";
import { useSchemaStore } from "@/features/schemas/store/useSchemaStore";

// Boucle de retour produit (CDC §32-35 "Vous ne trouvez pas votre
// composant ?", étendue à tout manque/amélioration) — pas de backend
// dédié pour cette ébauche : ouvre le client mail de l'utilisateur, déjà
// utilisé ailleurs sur le site pour le contact.
const FEEDBACK_EMAIL = "contact@fabsystem.fr";

export function FeedbackMenu({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const projectName = useSchemaStore((s) => s.projectName);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSend() {
    if (!message.trim()) return;
    const subject = `FabSystem Schéma — suggestion ou composant manquant`;
    const body = `${message}\n\n—\nSchéma concerné : ${projectName}\nPage : /outils/schema`;
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpen(false);
    setMessage("");
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Signaler un composant manquant ou proposer une amélioration"
        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-base ${
          darkMode ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        Suggérer
      </button>
      {open ? (
        <div
          className={`absolute right-0 top-full z-10 mt-1 w-72 rounded-md border p-3 shadow-lg ${
            darkMode ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
          }`}
        >
          <p className={`text-xs font-semibold ${darkMode ? "text-neutral-200" : "text-neutral-700"}`}>Il manque quelque chose ?</p>
          <p className={`mt-0.5 text-[11px] leading-snug ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
            Composant absent, amélioration, bug — dites-le-nous. Ça ne l&apos;ajoute pas automatiquement, on étudie chaque demande.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Ex : il manque un composant Xnn, ou ce serait bien de pouvoir…"
            className={`mt-2 w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
              darkMode
                ? "border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400"
                : "border-neutral-300 focus:border-neutral-900"
            }`}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim()}
            className={`mt-2 w-full rounded-md px-2.5 py-1.5 text-xs font-semibold transition-base disabled:cursor-not-allowed disabled:opacity-40 ${
              darkMode ? "bg-white text-neutral-900 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            Envoyer par e-mail
          </button>
        </div>
      ) : null}
    </div>
  );
}
