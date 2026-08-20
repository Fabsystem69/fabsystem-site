"use client";

import { useState } from "react";
import { computeFuseSize } from "@/lib/calc/fuse-size";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";

export default function FuseSizeCalculator() {
  const [mode, setMode] = useState<"amps" | "watts">("amps");
  const [amps, setAmps] = useState("");
  const [watts, setWatts] = useState("");
  const [tension, setTension] = useState<"12" | "24" | "48">("12");
  const [continuous, setContinuous] = useState(true);
  const [mainCircuit, setMainCircuit] = useState(false);

  const t = parseFloat(tension);
  const loadCurrentA = mode === "amps" ? parseFloat(amps) || 0 : (parseFloat(watts) || 0) / t;
  const hasResult = loadCurrentA > 0;
  const result = hasResult ? computeFuseSize(loadCurrentA, continuous, mainCircuit) : null;

  const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20";
  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className={labelClass}>Je connais…</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("amps")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${mode === "amps" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600"}`}
              >
                Le courant (A)
              </button>
              <button
                type="button"
                onClick={() => setMode("watts")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${mode === "watts" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-300 text-neutral-600"}`}
              >
                La puissance (W)
              </button>
            </div>
          </div>

          {mode === "amps" ? (
            <div className="sm:col-span-2">
              <label className={labelClass}>Courant du circuit (A)</label>
              <input type="number" min="0" placeholder="ex : 16,7" value={amps} onChange={(e) => setAmps(e.target.value)} className={inputClass} />
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass}>Puissance de l&apos;appareil (W)</label>
                <input type="number" min="0" placeholder="ex : 200" value={watts} onChange={(e) => setWatts(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tension du circuit</label>
                <select value={tension} onChange={(e) => setTension(e.target.value as "12" | "24" | "48")} className={inputClass}>
                  <option value="12">12 V</option>
                  <option value="24">24 V</option>
                  <option value="48">48 V</option>
                </select>
              </div>
            </>
          )}

          {mode === "amps" ? (
            <div className="sm:col-span-2">
              <label className={labelClass}>Tension du circuit</label>
              <select value={tension} onChange={(e) => setTension(e.target.value as "12" | "24" | "48")} className={inputClass}>
                <option value="12">12 V</option>
                <option value="24">24 V</option>
                <option value="48">48 V</option>
              </select>
            </div>
          ) : null}

          <label className="sm:col-span-2 flex items-start gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} className="mt-0.5" />
            <span>
              Circuit continu (≥ 3h sans coupure) — solaire, frigo, chargeur…
              <span className="block text-xs text-neutral-400">Applique la marge de sécurité standard de 25 % sur le calibre.</span>
            </span>
          </label>

          <label className="sm:col-span-2 flex items-start gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={mainCircuit} onChange={(e) => setMainCircuit(e.target.checked)} className="mt-0.5" />
            <span>
              Circuit batterie principale ou onduleur
              <span className="block text-xs text-neutral-400">Au-delà de 100 A, oriente vers un fusible Classe T (meilleur pouvoir de coupure qu&apos;un ANL/MEGA classique).</span>
            </span>
          </label>
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult && result ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            <div>
              <p className="text-xs text-neutral-500">Fusible recommandé</p>
              <p className="text-4xl font-bold text-neutral-950">
                {result.recommendedFuseA !== null ? `${result.recommendedFuseA} A` : "> 400 A"}
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-700">Format {result.formatLabel}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Courant réel du circuit</p>
                <p className="text-lg font-bold text-neutral-900">{result.loadCurrentA.toFixed(1)} A</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Courant de dimensionnement</p>
                <p className="text-lg font-bold text-neutral-900">{result.designCurrentA.toFixed(1)} A</p>
              </div>
            </div>

            <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
              ℹ️ Le fusible protège le câble, pas seulement l&apos;appareil — vérifiez avec le{" "}
              <a href="/outils/section-cable" className="font-semibold underline underline-offset-2">
                calculateur de section de câble
              </a>{" "}
              que le calibre choisi reste inférieur à l&apos;ampacité du câble utilisé.
            </div>

            <p className="text-xs text-neutral-500">
              Placez toujours la protection au plus près possible de la source (idéalement à moins de 20 cm de la borne + de la batterie).
            </p>
            <OpenProjectLink label="Continuer dans mon projet" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">Renseignez le courant ou la puissance du circuit pour obtenir un calibre de fusible.</p>
          </div>
        )}
      </div>
    </div>
  );
}
