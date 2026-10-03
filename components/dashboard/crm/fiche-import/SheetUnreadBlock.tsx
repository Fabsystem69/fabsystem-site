import type { UnreadField } from "@/lib/crm/sheet-import-contract";

const REASONS: Record<UnreadField["reason"], string> = {
  ILLEGIBLE: "écriture illisible",
  EMPTY: "non rempli sur la fiche",
  INVALID_CHOICE: "choix non reconnu",
  UNKNOWN_KEY: "champ inconnu",
};

export function SheetUnreadBlock({ unread, sameCount }: { unread: readonly UnreadField[]; sameCount: number }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm text-neutral-400">{sameCount} réponse(s) identique(s), rien à faire.</p>
      {unread.length > 0 ? (
        <details className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-3">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-neutral-200 focus-visible:ring-2 focus-visible:ring-brand-400">
            Non lus ou illisibles — rien ne sera modifié ({unread.length})
          </summary>
          <ul className="mt-2 grid gap-2">
            {unread.map((field) => (
              <li key={field.fieldKey} className="text-sm text-neutral-300">
                <span className="font-semibold text-white">{field.label}</span> — {REASONS[field.reason]}
                <span className="block text-xs text-neutral-400">Valeur conservée : {field.current ? field.current : "vide"}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
