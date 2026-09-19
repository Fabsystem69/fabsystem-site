"use client";

import { useState } from "react";
import Link from "next/link";
import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";
import { buildMaterialListText, type Bom } from "@/lib/electrical-components/bom";
import { downloadMaterialListCsv } from "@/features/schemas/export";
import { formatEuroFromCents } from "@/lib/format";

// Liste de matériel en texte brut, à copier-coller dans un email de demande
// de devis fournisseur (partenariat Solaris Store, retour utilisateur :
// "simplifier toute la démarche") — volontairement pas de nom de fournisseur
// dans l'UI, pour rester valable si d'autres partenariats du même genre
// s'ajoutent plus tard.
//
// Bascule réel/optimisé (retour utilisateur : "avoir les deux choix soit
// liste optimisée soit liste réelle du schéma") — l'optimisation ne modifie
// jamais le schéma tant que ce n'est qu'un toggle d'affichage ; seule
// l'action "Appliquer au schéma" (réservée Éditeur Plus, retour utilisateur)
// touche réellement les câbles, et toujours après un point de sauvegarde
// pré-optimisation créé par l'appelant (voir Ribbon.tsx).
export function MaterialListDialog({
  bomReal,
  bomOptimized,
  projectName,
  hasUnlimitedConsumers,
  onApplyHarmonization,
  onClose,
}: {
  bomReal: Bom;
  bomOptimized: Bom;
  projectName: string;
  hasUnlimitedConsumers: boolean;
  onApplyHarmonization: () => Promise<number>;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"real" | "optimized">("real");
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  useEscapeToClose(onClose);

  const hasSuggestions = bomReal.cableHarmonizationSuggestions.length > 0;
  const bom = mode === "optimized" ? bomOptimized : bomReal;
  const text = buildMaterialListText(bom, projectName);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function apply() {
    setApplying(true);
    try {
      const count = await onApplyHarmonization();
      setApplyResult(count > 0 ? `${count} câble${count > 1 ? "s" : ""} harmonisé${count > 1 ? "s" : ""} dans le schéma.` : "Rien à harmoniser.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Liste de matériel — demande de devis</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              À copier dans un email pour demander un devis à votre fournisseur.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-slate-500" aria-label="Fermer">
            ×
          </button>
        </div>

        {hasSuggestions ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1 rounded-lg bg-white p-1 text-sm shadow-sm">
              <button
                type="button"
                onClick={() => setMode("real")}
                className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-base ${mode === "real" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Liste réelle
              </button>
              <button
                type="button"
                onClick={() => setMode("optimized")}
                className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-base ${mode === "optimized" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Liste optimisée
              </button>
            </div>

            <div className="relative mt-3">
              <div className={hasUnlimitedConsumers ? undefined : "pointer-events-none select-none blur-sm"} aria-hidden={hasUnlimitedConsumers ? undefined : true}>
                <p className="text-xs leading-relaxed text-slate-600">
                  {bomReal.cableHarmonizationSuggestions.length} section{bomReal.cableHarmonizationSuggestions.length > 1 ? "s" : ""} avec un métrage trop faible pour justifier une bobine dédiée — la liste optimisée les regroupe vers une section supérieure.
                </p>
                <button
                  type="button"
                  onClick={apply}
                  disabled={applying}
                  className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                >
                  {applying ? "Application…" : "Appliquer l'harmonisation au schéma"}
                </button>
                {applyResult ? <p className="mt-1.5 text-xs text-emerald-700">{applyResult}</p> : null}
              </div>
              {!hasUnlimitedConsumers ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                  <p className="text-xs font-semibold text-slate-900">Réservé à Éditeur Plus</p>
                  <p className="text-xs text-slate-500">Modifier le schéma directement depuis cette liste</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <textarea
          readOnly
          value={text}
          rows={12}
          className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 outline-none"
        />

        {/* Retour utilisateur : "sortir un devis complet du schéma" — total
            déjà présent dans le texte copiable ci-dessus, repris ici en plus
            gros pour rester visible sans dérouler tout le texte. Jamais un
            nom de fournisseur en dur (même principe que le reste de ce
            fichier) : le détail vient de bom.totalPriceCentsByFournisseur,
            correct que 0, 1 ou N partenaires apparaissent dans ce schéma. */}
        {bom.totalPriceCents !== null ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            <p className="font-semibold text-slate-900">
              Total estimé{bom.hasUnpricedComponents ? " (partiel)" : ""} : {formatEuroFromCents(bom.totalPriceCents)}
            </p>
            {bom.totalPriceCentsByFournisseur.length > 1
              ? bom.totalPriceCentsByFournisseur.map((entry) => (
                  <p key={entry.name} className="text-xs text-slate-500">
                    dont {formatEuroFromCents(entry.priceCents)} chez {entry.name}
                  </p>
                ))
              : null}
            {bom.hasUnpricedComponents ? (
              <p className="mt-1 text-xs text-slate-500">Composants sans prix connu exclus de ce total.</p>
            ) : null}
          </div>
        ) : null}

        {/* Retour utilisateur : "on doit noter de manière claire avec un
            coaching ils ont droit à une remise particulière chez les
            fournisseurs partenaire" — jamais un pourcentage promis comme
            garanti (variable selon fournisseur/négociation), jamais un nom
            de fournisseur en dur. */}
        {bom.totalPriceCentsByFournisseur.length > 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            💡 L&apos;accompagnement FabSystem donne accès à une remise de 5 à 10 % chez nos fournisseurs partenaires —{" "}
            <Link href="/prestations/accompagnement" className="underline hover:text-slate-700">
              en savoir plus
            </Link>
            .
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700">
            Fermer
          </button>
          <button
            type="button"
            onClick={() => downloadMaterialListCsv(bom, projectName)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Exporter en Excel
          </button>
          <button type="button" onClick={copy} className="rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-white hover:bg-amber-600">
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
      </div>
    </div>
  );
}
