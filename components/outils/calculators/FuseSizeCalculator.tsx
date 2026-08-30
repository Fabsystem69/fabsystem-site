"use client";

import { useState } from "react";
import { computeFuseSize, FUSE_FORMAT_DESCRIPTIONS } from "@/lib/calc/fuse-size";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";
import { ToggleGroup } from "@/components/outils/calc-ui/ToggleGroup";
import { CalcSlider } from "@/components/outils/calc-ui/CalcSlider";
import { CalcSafetyNotice } from "@/components/outils/calc-ui/CalcSafetyNotice";
import { CalcGuidesLink } from "@/components/outils/calc-ui/CalcGuidesLink";

export default function FuseSizeCalculator() {
  const [mode, setMode] = useState<"amps" | "watts">("amps");
  const [amps, setAmps] = useState(0);
  const [watts, setWatts] = useState(0);
  const [tension, setTension] = useState<"12" | "24" | "48">("12");
  const [continuous, setContinuous] = useState(true);
  const [mainCircuit, setMainCircuit] = useState(false);

  const t = parseFloat(tension);
  const loadCurrentA = mode === "amps" ? amps : watts / t;
  const hasResult = loadCurrentA > 0;
  const result = hasResult ? computeFuseSize(loadCurrentA, continuous, mainCircuit) : null;

  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1.5";

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Inputs ── */}
        <div className="space-y-5">
          <div>
            <span className={labelClass}>Je connais…</span>
            <ToggleGroup
              value={mode}
              onChange={setMode}
              options={[
                { value: "amps", label: "Le courant (A)" },
                { value: "watts", label: "La puissance (W)" },
              ]}
            />
          </div>

          {mode === "amps" ? (
            <CalcSlider label="Courant du circuit" value={amps} onChange={setAmps} min={0} max={400} step={1} unit="A" />
          ) : (
            <CalcSlider label="Puissance de l'appareil" value={watts} onChange={setWatts} min={0} max={3000} step={10} unit="W" />
          )}

          <div>
            <span className={labelClass}>Tension du circuit</span>
            <ToggleGroup
              value={tension}
              onChange={setTension}
              options={[
                { value: "12", label: "12 V" },
                { value: "24", label: "24 V" },
                { value: "48", label: "48 V" },
              ]}
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} className="mt-0.5" />
            <span>
              Circuit continu (≥ 3h sans coupure) — solaire, frigo, chargeur…
              <span className="block text-xs text-neutral-400">Applique la marge réglementaire de 25 % au lieu des 10 % de base.</span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={mainCircuit} onChange={(e) => setMainCircuit(e.target.checked)} className="mt-0.5" />
            <span>
              Circuit batterie principale ou onduleur
              <span className="block text-xs text-neutral-400">Au-delà de 100 A, oriente vers un fusible Classe T (meilleur pouvoir de coupure qu&apos;un ANL/MEGA classique).</span>
            </span>
          </label>
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

              <p className="border-t border-brand-200 pt-4 text-sm text-neutral-700">
                Courant du circuit : {result.loadCurrentA.toFixed(1)} A × {result.marginFactor.toFixed(2).replace(".", ",")} ({continuous ? "continu" : "non continu"}) ={" "}
                <span className="font-semibold text-neutral-950">{result.designCurrentA.toFixed(1)} A</span> courant de dimensionnement
              </p>

              <p className="text-xs italic text-neutral-500">{FUSE_FORMAT_DESCRIPTIONS[result.recommendedFormat]}</p>

              {result.recommendedFormat === "mega" ? (
                <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
                  ℹ️ Le format ANL (ovale) est un équivalent électrique courant dans cette plage, au choix selon le porte-fusible déjà en place.
                </div>
              ) : null}

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

      <CalcGuidesLink
        examples={[
          { slug: "schema-voilier-autonome-12v-230v", title: "Schéma voilier autonome avec 12 V et 230 V" },
          { slug: "schema-solaire-12v-simple", title: "Schéma solaire 12V simple" },
          { slug: "schema-vito-280ah-van", title: "Schéma van lithium 280 Ah avec solaire et 230 V" },
        ]}
      />

      <CalcSafetyNotice
        standards={[
          "EN 1648-2 — Installations électriques 12V des véhicules de loisir",
          "NF C 15-100 — Installations électriques basse tension (partie fixe)",
          "Règle des 125% pour un circuit continu — pratique standard reprise de la NEC 210.19(A)(1)",
        ]}
      />
    </div>
  );
}
