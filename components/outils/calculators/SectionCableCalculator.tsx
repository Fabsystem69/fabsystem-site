"use client";

import { useState } from "react";
import { calcSection, fusibleRecommande } from "@/lib/calc/section-cable";
import { AddCableToProjectButton } from "@/components/outils/project-bridge/AddCableToProjectButton";

// Extrait tel quel de components/CalcSection.tsx (UI-7.1) — aucun
// changement de comportement, uniquement déplacé vers sa propre page
// /outils/section-cable.
export default function SectionCableCalculator() {
  const [intensite, setIntensite] = useState("");
  const [longueur, setLongueur] = useState("");
  const [chute, setChute] = useState("3");
  const [tension, setTension] = useState("12");
  const [result, setResult] = useState<{ sMin: string; section: number; fusible: string; intensite: number } | null>(null);

  const calculate = () => {
    const i = parseFloat(intensite);
    const l = parseFloat(longueur);
    const c = parseFloat(chute);
    const t = parseFloat(tension);
    if (!i || !l || !c || !t || i <= 0 || l <= 0) return;
    const { sMin, section } = calcSection(i, l, c, t);
    setResult({ sMin, section, fusible: fusibleRecommande(i), intensite: i });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Intensité (A)
            </label>
            <input
              type="number"
              min="0"
              placeholder="ex : 20"
              value={intensite}
              onChange={(e) => setIntensite(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Longueur simple aller (m)
            </label>
            <input
              type="number"
              min="0"
              placeholder="ex : 6"
              value={longueur}
              onChange={(e) => setLongueur(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            <p className="mt-1 text-xs text-neutral-400">Le calcul applique automatiquement le facteur ×2 (aller-retour).</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Chute de tension max (%)
            </label>
            <select
              value={chute}
              onChange={(e) => setChute(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="2">2 % — Précision (instruments)</option>
              <option value="3">3 % — Standard recommandé</option>
              <option value="5">5 % — Tolérance max</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Tension du circuit (V)
            </label>
            <select
              value={tension}
              onChange={(e) => setTension(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            >
              <option value="12">12 V</option>
              <option value="24">24 V</option>
              <option value="48">48 V</option>
            </select>
          </div>
        </div>
        <button
          onClick={calculate}
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800 sm:w-auto sm:px-8"
        >
          Calculer →
        </button>
      </div>

      <div>
        {result ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-neutral-500">Section calculée minimale</p>
                <p className="text-2xl font-bold text-neutral-900">{result.sMin} mm²</p>
              </div>
              <div className="border-t border-brand-200 pt-4">
                <p className="text-xs text-neutral-500">Section normalisée à utiliser</p>
                <p className="text-3xl font-bold text-neutral-950">{result.section} mm²</p>
              </div>
              <div className="border-t border-brand-200 pt-4">
                <p className="text-xs text-neutral-500">Fusible recommandé</p>
                <p className="text-xl font-bold text-neutral-900">{result.fusible}</p>
              </div>
            </div>
            {/* Avertissements section */}
            {(() => {
              const sMinNum = parseFloat(result.sMin);
              if (result.section < 1.5) return (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                  Section inférieure à 1,5 mm² — minimum recommandé en marine (norme ABYC E-11)
                </div>
              );
              if (result.section < sMinNum * 1.5) return (
                <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700">
                  ⚡ Section juste — majorez d&apos;un calibre si câble en conduit ou température &gt; 40°C
                </div>
              );
              return (
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold text-green-700">
                  ✅ Section confortable pour cette application
                </div>
              );
            })()}
            {result.intensite > 100 && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                Intensité &gt; 100 A — prévoyez un câble direct sur batterie avec fusible ANL.
              </div>
            )}
            <p className="mt-4 text-xs text-neutral-500">
              Calcul basé sur la résistivité du cuivre (ρ = 0,0175 Ω·mm²/m).
              Majorez d&apos;une section si câble en conduit ou forte chaleur.
            </p>
            <div className="mt-4">
              <AddCableToProjectButton
                form={{ intensite, longueur, chute, tension }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">
              Renseignez les paramètres et cliquez sur <strong>Calculer</strong> pour obtenir le résultat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
