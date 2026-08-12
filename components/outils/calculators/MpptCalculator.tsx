"use client";

import { useState } from "react";
import { calcSection } from "@/lib/calc/section-cable";
import { OpenProjectLink } from "@/components/outils/project-bridge/OpenProjectLink";

// Extrait tel quel de components/CalcSection.tsx (UI-7.1) — aucun
// changement de comportement.
export default function MpptCalculator() {
  const [tensionBat, setTensionBat] = useState("12");
  const [puissanceWc, setPuissanceWc] = useState("");
  const [voc, setVoc] = useState("");
  const [vmp, setVmp] = useState("");
  const [nbSerie, setNbSerie] = useState("1");
  const [nbParallele, setNbParallele] = useState("1");
  const [longueurMPPT, setLongueurMPPT] = useState("2");

  const wc = parseFloat(puissanceWc) || 0;
  const vocN = parseFloat(voc) || 0;
  const vmpN = parseFloat(vmp) || 0;
  const serie = parseInt(nbSerie) || 1;
  const parallele = parseInt(nbParallele) || 1;
  const t = parseFloat(tensionBat);

  const vocString = vocN * serie;
  const vmpString = vmpN * serie;
  const iscTotal = vmpN > 0 ? (wc / vmpN) * parallele : 0;
  const iSortieMPPT = t > 0 ? wc / t : 0;
  const puissanceMPPT = wc * 1.25;

  const sectionPanneaux = wc > 0 && vmpString > 0
    ? calcSection(iscTotal, 3, 3, vmpString)
    : null;
  const sectionMPPTBat = wc > 0
    ? calcSection(iSortieMPPT, parseFloat(longueurMPPT) || 2, 3, t)
    : null;

  const hasResult = wc > 0 && vocN > 0 && vmpN > 0;

  type Alert = { color: "red" | "orange" | "yellow"; msg: string };
  const alerts: Alert[] = [];
  if (vocString > 150) alerts.push({ color: "red", msg: "Tension Voc trop élevée pour un MPPT standard — vérifiez la fiche technique de votre régulateur" });
  else if (vocString > 100) alerts.push({ color: "orange", msg: "Tension élevée — vérifiez la limite Voc max de votre MPPT" });
  if (iSortieMPPT > 60) alerts.push({ color: "orange", msg: "Courant de sortie élevé — envisagez deux régulateurs MPPT en parallèle" });
  if (serie > 1 && tensionBat === "12") alerts.push({ color: "orange", msg: "Panneaux en série sur batterie 12V — assurez-vous que Vmp_string reste compatible avec votre MPPT" });

  const alertClass = (color: Alert["color"]) => {
    if (color === "red") return "bg-red-50 border border-red-200 text-red-700";
    return "bg-orange-50 border border-orange-200 text-orange-700";
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension batterie (V)</label>
            <select value={tensionBat} onChange={(e) => setTensionBat(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
              <option value="12">12 V</option>
              <option value="24">24 V</option>
              <option value="48">48 V</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Puissance totale panneaux (Wc)</label>
            <input type="number" min="0" placeholder="ex : 400"
              value={puissanceWc} onChange={(e) => setPuissanceWc(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension Voc panneau (V)</label>
            <input type="number" min="0" placeholder="ex : 44"
              value={voc} onChange={(e) => setVoc(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
            <p className="mt-1 text-xs text-neutral-400">Tension circuit ouvert — fiche technique panneau</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension Vmp panneau (V)</label>
            <input type="number" min="0" placeholder="ex : 36"
              value={vmp} onChange={(e) => setVmp(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
            <p className="mt-1 text-xs text-neutral-400">Tension point de puissance max</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Panneaux en série</label>
            <input type="number" min="1" placeholder="ex : 1"
              value={nbSerie} onChange={(e) => setNbSerie(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Strings en parallèle</label>
            <input type="number" min="1" placeholder="ex : 2"
              value={nbParallele} onChange={(e) => setNbParallele(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Longueur câble MPPT → batterie (m)</label>
            <input type="number" min="0" placeholder="ex : 2"
              value={longueurMPPT} onChange={(e) => setLongueurMPPT(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20" />
          </div>
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            {/* Puissance MPPT — card principale */}
            <div>
              <p className="text-xs text-neutral-500">Puissance MPPT recommandée</p>
              <p className="text-4xl font-bold text-neutral-950">{puissanceMPPT.toFixed(0)} W</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">
                Choisissez un MPPT ≥ {Math.ceil(iSortieMPPT)} A / {puissanceMPPT.toFixed(0)} W
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Voc string</p>
                <p className={`text-lg font-bold ${vocString > 150 ? "text-red-600" : vocString > 100 ? "text-orange-600" : "text-neutral-900"}`}>
                  {vocString.toFixed(1)} V
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Vmp string</p>
                <p className="text-lg font-bold text-neutral-900">{vmpString.toFixed(1)} V</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Courant sortie MPPT</p>
                <p className={`text-lg font-bold ${iSortieMPPT > 60 ? "text-orange-600" : "text-neutral-900"}`}>
                  {Math.ceil(iSortieMPPT)} A
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Courant Isc total</p>
                <p className="text-lg font-bold text-neutral-900">{iscTotal.toFixed(1)} A</p>
              </div>
              {sectionPanneaux && (
                <div>
                  <p className="text-xs text-neutral-500">Câble panneaux → MPPT</p>
                  <p className="text-lg font-bold text-neutral-900">{sectionPanneaux.section} mm²</p>
                </div>
              )}
              {sectionMPPTBat && (
                <div>
                  <p className="text-xs text-neutral-500">Câble MPPT → batterie</p>
                  <p className="text-lg font-bold text-neutral-900">{sectionMPPTBat.section} mm²</p>
                </div>
              )}
            </div>

            {alerts.length > 0 && (
              <div className="space-y-2 border-t border-brand-200 pt-4">
                {alerts.map((a, i) => (
                  <div key={i} className={`rounded-lg px-3 py-2 text-xs font-semibold ${alertClass(a.color)}`}>
                    {a.color === "red" ? "🔴" : "🟡"} {a.msg}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-neutral-500">
              Marge sécurité 25% appliquée sur la puissance MPPT. Sections câbles calculées avec chute de tension 3%.
            </p>
            <OpenProjectLink label="Continuer dans mon projet" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">
              Renseignez la puissance, Voc et Vmp pour dimensionner votre régulateur MPPT.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
