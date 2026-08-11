"use client";

import { useEffect, useState } from "react";
import { readBilanSnapshot, type BilanSnapshot } from "@/lib/calc/bilan-storage";

// Extrait de components/CalcSection.tsx (UI-7.1). Comportement de calcul
// inchangé. Le bilan importé (auparavant reçu en props d'un composant
// parent monté sur la même page) est désormais lu depuis le stockage
// local du navigateur au montage — voir lib/calc/bilan-storage.ts et
// docs/audits/UI-7.1-PAGES-OUTILS.md, "Bilan vers Autonomie".
export default function AutonomieBatterieCalculator() {
  const [capacite, setCapacite] = useState("");
  const [etat, setEtat] = useState("100");
  const [conso, setConso] = useState("");
  const [dod, setDod] = useState("50");
  const [tension, setTension] = useState("12");
  // Solaire
  const [withSolar, setWithSolar] = useState(false);
  const [panneauxWc, setPanneauxWc] = useState("");
  const [psh, setPsh] = useState("4");

  const [importedConsoWh, setImportedConsoWh] = useState(0);
  const [bilanSnapshot, setBilanSnapshot] = useState<BilanSnapshot | null>(null);

  useEffect(() => {
    const stored = readBilanSnapshot();
    if (stored) {
      setBilanSnapshot(stored);
      setImportedConsoWh(stored.totalWh);
    }
  }, []);

  const cap = parseFloat(capacite) || 0;
  const consoWh = parseFloat(conso) || 0;   // Wh/j saisis par l'utilisateur
  const consoW = consoWh / 24;              // équivalent puissance moyenne sur 24h
  const dodPct = parseFloat(dod) / 100;
  const etatPct = parseFloat(etat) / 100;
  const t = parseFloat(tension);

  // Énergie batterie disponible (Wh)
  const energieDisponibleWh = cap * t * dodPct * etatPct;

  // Production solaire journalière (Wh/j) avec rendement système 0.75
  const productionWh = withSolar
    ? (parseFloat(panneauxWc) || 0) * parseFloat(psh) * 0.75
    : 0;
  // Puissance solaire moyenne équivalente sur 24h
  const productionMoyenneW = productionWh / 24;

  // Consommation nette après solaire
  const consoNetteW = Math.max(0, consoW - productionMoyenneW);
  const solarCoversAll = withSolar && productionMoyenneW >= consoW && consoW > 0;

  // Autonomie sans solaire / avec solaire
  const heuresSansSolaire = consoW > 0 ? energieDisponibleWh / consoW : 0;
  const heuresAvecSolaire = consoNetteW > 0 ? energieDisponibleWh / consoNetteW : 0;
  const heures = withSolar ? heuresAvecSolaire : heuresSansSolaire;

  const formatDuree = (h: number) => {
    if (h <= 0) return "—";
    const j = Math.floor(h / 24);
    const hReste = Math.floor(h % 24);
    const m = Math.round((h - Math.floor(h)) * 60);
    if (j > 0) return `${j}j ${hReste}h`;
    if (hReste > 0) return `${hReste}h${m > 0 ? ` ${m}min` : ""}`;
    return `${m} min`;
  };

  const niveau = (h: number, infini: boolean) => {
    if (infini) return { color: "text-green-600", label: "☀️ Autonomie illimitée" };
    if (h <= 0) return null;
    if (h < 12) return { color: "text-red-600", label: "Autonomie faible" };
    if (h < 48) return { color: "text-yellow-600", label: "Autonomie correcte" };
    if (h < 120) return { color: "text-green-600", label: "Bonne autonomie" };
    return { color: "text-green-600", label: "Très bonne autonomie" };
  };

  const niv = niveau(heures, solarCoversAll);
  const hasResult = cap > 0 && consoWh > 0;

  const exportCompletPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const date = new Date().toLocaleDateString('fr-FR');
    const logoSrc = `${window.location.origin}/FabSystem-Logo.svg`;

    // Section bilan
    let bilanHTML = '';
    if (bilanSnapshot && bilanSnapshot.totalWh > 0) {
      const rows = bilanSnapshot.appareils
        .filter(a => a.nom || a.puissance)
        .map(a => {
          const wh = (parseFloat(a.puissance) || 0) * (parseFloat(a.heures) || 0);
          return `<tr><td>${a.nom || '—'}</td><td>${a.puissance || 0} W</td><td>${a.heures || 0} h</td><td><strong>${wh} Wh</strong></td></tr>`;
        }).join('');
      const capRecoWh = ((bilanSnapshot.totalWh / parseFloat(bilanSnapshot.tension)) * parseFloat(bilanSnapshot.autonomie)) / 0.5;
      bilanHTML = `
        <div class="section-title">Bilan de consommation</div>
        <p class="subtitle">Tension : ${bilanSnapshot.tension}V · Autonomie souhaitée : ${bilanSnapshot.autonomie} jour(s)</p>
        <table>
          <thead><tr><th>Appareil</th><th>Puissance (W)</th><th>Durée (h/j)</th><th>Consommation (Wh/j)</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="3">Total journalier</td><td>${bilanSnapshot.totalWh.toFixed(0)} Wh/j</td></tr></tfoot>
        </table>
        <div class="results">
          <div class="card"><div class="label">Consommation / jour</div><div class="value">${bilanSnapshot.totalWh.toFixed(0)} Wh</div><div class="sub">${(bilanSnapshot.totalWh / parseFloat(bilanSnapshot.tension)).toFixed(1)} Ah à ${bilanSnapshot.tension}V</div></div>
          <div class="card"><div class="label">Pour ${bilanSnapshot.autonomie}j d'autonomie</div><div class="value">${((bilanSnapshot.totalWh / parseFloat(bilanSnapshot.tension)) * parseFloat(bilanSnapshot.autonomie)).toFixed(0)} Ah</div><div class="sub">consommation brute</div></div>
          <div class="card highlight"><div class="label">Capacité batterie recommandée</div><div class="value">${capRecoWh.toFixed(0)} Ah</div><div class="sub">DOD 50% — AGM/GEL</div></div>
        </div>`;
    }

    // Section autonomie
    const autonomieVal = solarCoversAll ? '∞' : formatDuree(heures);
    const nivLabel = solarCoversAll ? '☀️ Autonomie illimitée' : (niv ? niv.label : '');
    const consoNetteAff = solarCoversAll ? '0 Wh/j' : `${(consoNetteW * 24).toFixed(0)} Wh/j`;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport électrique complet — FabSystem</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Helvetica Neue',Arial,sans-serif; color:#111; padding:40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid #111; }
    .meta { text-align:right; font-size:11px; color:#666; }
    .meta strong { display:block; font-size:14px; color:#111; margin-bottom:2px; }
    .section-title { font-size:16px; font-weight:800; margin:28px 0 6px; padding-bottom:6px; border-bottom:2px solid #e5e7eb; }
    .subtitle { font-size:12px; color:#666; margin-bottom:16px; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px; }
    thead tr { background:#111; color:white; }
    thead th { padding:8px 12px; text-align:left; font-size:11px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; }
    tbody tr:nth-child(even) { background:#f9f9f9; }
    tbody td { padding:8px 12px; border-bottom:1px solid #eee; }
    tfoot tr { background:#fef3c7; }
    tfoot td { padding:8px 12px; font-weight:700; font-size:13px; }
    .results { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
    .card { border:2px solid #e5e7eb; border-radius:8px; padding:12px; }
    .card.highlight { border-color:#f59e0b; background:#fffbeb; }
    .card .label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
    .card .value { font-size:20px; font-weight:900; color:#111; }
    .card .sub { font-size:9px; color:#aaa; margin-top:3px; }
    .autonomie-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:16px; }
    .aut-main { grid-column:1/-1; border:2px solid #f59e0b; border-radius:8px; padding:16px; background:#fffbeb; }
    .aut-main .big { font-size:40px; font-weight:900; color:#111; }
    .aut-main .niv { font-size:13px; font-weight:700; margin-top:4px; }
    .aut-card { border:1px solid #e5e7eb; border-radius:8px; padding:12px; }
    .aut-card .label { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
    .aut-card .value { font-size:16px; font-weight:700; color:#111; }
    .note { background:#f3f4f6; border-radius:8px; padding:10px 14px; font-size:11px; color:#555; margin-bottom:16px; }
    .footer { margin-top:24px; padding-top:12px; border-top:1px solid #eee; font-size:10px; color:#aaa; display:flex; justify-content:space-between; }
    @media print { body { padding:20px; } @page { margin:1cm; size:A4; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoSrc}" alt="FabSystem" style="height:36px;width:auto;" />
    <div class="meta">
      <strong>Rapport électrique complet</strong>
      Généré le ${date}
    </div>
  </div>
  ${bilanHTML}
  <div class="section-title">Autonomie batterie${withSolar ? ' (avec solaire)' : ''}</div>
  <p class="subtitle">Batterie ${capacite} Ah · ${tension}V · DOD ${dod}% · État ${etat}%${withSolar && panneauxWc ? ` · Solaire ${panneauxWc} Wc` : ''}</p>
  <div class="autonomie-grid">
    <div class="aut-main">
      <div class="label">Autonomie estimée${withSolar ? ' avec solaire' : ''}</div>
      <div class="big">${autonomieVal}</div>
      <div class="niv">${nivLabel}</div>
    </div>
    <div class="aut-card"><div class="label">Énergie batterie dispo.</div><div class="value">${energieDisponibleWh.toFixed(0)} Wh</div></div>
    <div class="aut-card"><div class="label">Consommation journalière</div><div class="value">${consoWh.toFixed(0)} Wh/j</div></div>
    ${withSolar && productionWh > 0 ? `
    <div class="aut-card"><div class="label">Production solaire/j</div><div class="value">${productionWh.toFixed(0)} Wh</div></div>
    <div class="aut-card"><div class="label">Conso nette/j</div><div class="value">${consoNetteAff}</div></div>
    ${!solarCoversAll ? `<div class="aut-card" style="grid-column:1/-1"><div class="label">Autonomie sans solaire (réf)</div><div class="value">${formatDuree(heuresSansSolaire)}</div></div>` : ''}
    ` : ''}
  </div>
  <div class="note">Ces valeurs sont indicatives. Résultats réels variables selon température, âge de la batterie, profil de consommation réel et ensoleillement effectif.</div>
  <div class="footer">
    <span>FabSystem — Électricité marine &amp; camping-car</span>
    <span>Document généré automatiquement · Non contractuel</span>
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Capacité batterie (Ah)</label>
            <input
              type="number" min="0" placeholder="ex : 200"
              value={capacite} onChange={(e) => setCapacite(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tension (V)</label>
            <select value={tension} onChange={(e) => setTension(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
              <option value="12">12 V</option>
              <option value="24">24 V</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">État de charge (%)</label>
            <select value={etat} onChange={(e) => setEtat(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
              {[100, 90, 80, 70, 60, 50].map((n) => (
                <option key={n} value={String(n)}>{n} %</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Profondeur de décharge max</label>
            <select value={dod} onChange={(e) => setDod(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
              <option value="50">50 % — AGM / GEL</option>
              <option value="80">80 % — Lithium LiFePO₄</option>
              <option value="100">100 % — Lithium (max absolu)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Consommation journalière (Wh/j)
            </label>
            <input
              type="number" min="0" placeholder="ex : 500"
              value={conso} onChange={(e) => setConso(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            {importedConsoWh > 0 && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2">
                <span className="text-xs font-semibold text-brand-700">
                  📊 Bilan calculé : <strong>{importedConsoWh.toFixed(0)} Wh/j</strong>
                </span>
                <button
                  onClick={() => setConso(String(Math.round(importedConsoWh)))}
                  className="rounded-lg bg-brand-400 px-3 py-1 text-xs font-bold text-neutral-900 transition-colors hover:bg-brand-300"
                >
                  Utiliser ↗
                </button>
              </div>
            )}
            <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">
              Total d&apos;énergie consommée sur une journée complète (24 h).{" "}
              <span className="font-medium text-neutral-500">
                Exemples : frigo 12V seul ≈ 600 Wh/j · éclairage + instruments ≈ 200 Wh/j · installation complète ≈ 800–1 500 Wh/j.
              </span>
            </p>
          </div>
        </div>

        {/* Toggle solaire */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => setWithSolar((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${withSolar ? "bg-brand-400" : "bg-neutral-300"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${withSolar ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-sm font-semibold text-neutral-800">
              ☀️ Ajouter la production solaire
            </span>
          </label>

          {withSolar && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Puissance panneaux (Wc)
                </label>
                <input
                  type="number" min="0" placeholder="ex : 400"
                  value={panneauxWc} onChange={(e) => setPanneauxWc(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
                <p className="mt-1 text-xs text-neutral-400">Total Wc-crête installés</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Ensoleillement (h/j)
                </label>
                <select value={psh} onChange={(e) => setPsh(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20">
                  <option value="2.5">2,5 h — Hiver / nord France</option>
                  <option value="3.5">3,5 h — Printemps / automne</option>
                  <option value="4">4 h — Été / façade atlantique</option>
                  <option value="5">5 h — Été / Méditerranée</option>
                  <option value="6">6 h — Été / plein soleil tropical</option>
                </select>
                <p className="mt-1 text-xs text-neutral-400">Heures de pic solaire (PSH)</p>
              </div>
              {panneauxWc && (
                <div className="sm:col-span-2 rounded-lg bg-white border border-brand-200 px-4 py-3 text-sm">
                  <span className="font-semibold text-neutral-700">Production estimée : </span>
                  <span className="font-bold text-brand-600">
                    {productionWh.toFixed(0)} Wh/j
                  </span>
                  <span className="text-neutral-400 text-xs ml-2">
                    (rendement système 75 % appliqué)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Résultat ── */}
      <div>
        {hasResult ? (
          <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Résultat</p>

            {solarCoversAll ? (
              <div>
                <p className="text-xs text-neutral-500">Autonomie estimée</p>
                <p className="text-4xl font-bold text-green-700">∞</p>
                <p className="mt-1 text-sm font-semibold text-green-600">
                  ☀️ Le solaire couvre toute la consommation
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-neutral-500">
                  Autonomie estimée{withSolar ? " (avec solaire)" : ""}
                </p>
                <p className="text-4xl font-bold text-neutral-950">{formatDuree(heures)}</p>
                {niv && <p className={`mt-1 text-sm font-semibold ${niv.color}`}>{niv.label}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Énergie batterie dispo.</p>
                <p className="text-lg font-bold text-neutral-900">{energieDisponibleWh.toFixed(0)} Wh</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Conso moy. (24 h)</p>
                <p className="text-lg font-bold text-neutral-900">{consoW.toFixed(1)} W moy.</p>
              </div>
              {withSolar && productionWh > 0 && (
                <>
                  <div>
                    <p className="text-xs text-neutral-500">Production solaire/j</p>
                    <p className="text-lg font-bold text-green-700">{productionWh.toFixed(0)} Wh</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Conso nette/j</p>
                    <p className={`text-lg font-bold ${solarCoversAll ? "text-green-700" : "text-neutral-900"}`}>
                      {solarCoversAll ? "0 Wh/j" : `${(consoNetteW * 24).toFixed(0)} Wh/j`}
                    </p>
                  </div>
                  {!solarCoversAll && (
                    <div className="col-span-2 rounded-lg bg-white border border-neutral-200 px-3 py-2">
                      <p className="text-xs text-neutral-500">Autonomie sans solaire (ref)</p>
                      <p className="text-base font-bold text-neutral-500">{formatDuree(heuresSansSolaire)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              {withSolar
                ? "Rendement système 75 % appliqué sur la production solaire. Résultat indicatif — varie selon météo, orientation et ombrage."
                : "Estimation sans recharge. Activez le solaire pour simuler avec panneaux."}
            </p>
            <button
              onClick={exportCompletPDF}
              className="flex items-center gap-2 rounded-xl border-2 border-neutral-900 bg-neutral-900 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
            >
              📄 Exporter le rapport complet
            </button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <p className="text-center text-sm text-neutral-400">
              Renseignez la capacité et la consommation pour obtenir l&apos;autonomie estimée.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
