// UI-9 FINAL §2 : traduction d'affichage des clés de valeurs retenues.
// Ne modifie jamais les clés internes utilisées par les moteurs ou la DB
// (ProjectRetainedValue.key) — sert uniquement à choisir un libellé humain
// pour l'UI cliente. Les clés fixes (une par moteur à input plat) sont
// listées explicitement ; les clés dynamiques (circuit.<id>, cable.<id>,
// protection.<id>, diagram.<id>) sont résolues par préfixe + nom réel du
// circuit quand il est disponible dans la valeur elle-même.

const FIXED_KEY_LABELS: Record<string, string> = {
  "energy.consumers": "Appareils déclarés",
  "energy.dailyConsumption": "Consommation quotidienne",
  "energy.maxCurrent": "Courant maximal",
  "battery.usefulEnergy": "Énergie utile batterie",
  "battery.usefulCapacity": "Capacité utile batterie",
  "battery.nominalCapacity": "Capacité nominale batterie",
  "battery.autonomy": "Autonomie batterie",
  "alternator.usableCurrent": "Courant exploitable alternateur",
  "alternator.rechargeableEnergy": "Énergie rechargeable (alternateur)",
  "alternator.rechargeTime": "Temps de recharge (alternateur)",
  "alternator.rechargeMargin": "Marge de recharge (alternateur)",
  "solar.dailyEnergy": "Énergie solaire quotidienne",
  "solar.averageChargingCurrent": "Courant moyen de charge (solaire)",
  "solar.rechargeTime": "Temps de recharge (solaire)",
  "solar.coverage": "Couverture des besoins (solaire)",
  "charger.availablePower": "Puissance disponible (chargeur)",
  "charger.chargingCurrent": "Courant de charge (chargeur)",
  "charger.rechargeableEnergy": "Énergie rechargeable (chargeur)",
  "charger.rechargeTime": "Temps de recharge (chargeur)",
  "charger.coverage": "Couverture des besoins (chargeur)",
  "energyBalance.totalAvailableEnergy": "Énergie disponible",
  "energyBalance.totalRechargeableEnergy": "Énergie rechargeable totale",
  "energyBalance.coverage": "Couverture énergétique globale",
  "energyBalance.balance": "Équilibre énergétique",
  "energyBalance.autonomy": "Autonomie globale",
};

const DYNAMIC_PREFIX_LABELS: Record<string, string> = {
  circuit: "Circuit",
  cable: "Câble",
  protection: "Protection",
  diagram: "Schéma",
};

function extractName(value: unknown): string | null {
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" && name.trim() ? name.trim() : null;
  }
  return null;
}

/** Libellé humain pour une clé de valeur retenue. Ne jamais afficher la
 * clé brute en fallback : un libellé neutre générique est toujours
 * préférable à un identifiant technique visible côté client. */
export function getRetainedValueLabel(key: string, value?: unknown): string {
  const fixed = FIXED_KEY_LABELS[key];
  if (fixed) {
    return fixed;
  }

  const [prefix] = key.split(".");
  const prefixLabel = DYNAMIC_PREFIX_LABELS[prefix];
  if (prefixLabel) {
    const name = extractName(value);
    return name ? `${prefixLabel} — ${name}` : prefixLabel;
  }

  return "Donnée technique du projet";
}
