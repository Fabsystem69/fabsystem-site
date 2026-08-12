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

// UI-12 — affichage compact "valeur + unité" pour la section "Informations
// retenues" (mission §10). Purement présentationnel : ne recalcule rien,
// se contente de lire la valeur déjà persistée par le moteur et de
// deviner une unité lisible à partir du nom du champ. Ne s'applique
// qu'aux valeurs à un seul champ numérique (le cas le plus courant) — les
// valeurs plus complexes (circuit/câble/protection/schéma, qui portent un
// nom) restent affichées via leur seul libellé, sans valeur chiffrée
// ajoutée ici.
function guessUnit(fieldName: string): string {
  const key = fieldName.toLowerCase();
  if (key.includes("wh")) return " Wh";
  if (key.includes("ah")) return " Ah";
  if (key.includes("current")) return " A";
  if (key.includes("power")) return " W";
  if (key.includes("ratio") || key.includes("coverage") || key.includes("margin")) return " %";
  if (key.includes("day")) return " j";
  if (key.includes("time")) return " h";
  return "";
}

// Quelques valeurs retenues portent plusieurs champs numériques (ex.
// energy.dailyConsumption : totalPowerW + dailyWh + dailyAh + complete).
// Champ à privilégier pour l'affichage compact, vérifié directement dans
// chaque moteur (lib/engines/*.ts) au moment d'écrire cette fonction —
// aucune valeur n'est recalculée, seul le champ le plus représentatif est
// choisi pour l'affichage.
const PREFERRED_FIELD: Record<string, string> = {
  "energy.dailyConsumption": "dailyWh",
  "battery.nominalCapacity": "nominalCapacityAh",
  "battery.autonomy": "autonomyDays",
};

export function formatRetainedValueDisplay(value: unknown, key?: string): string | null {
  if (!value || typeof value !== "object") return null;

  const numericEntries = Object.entries(value as Record<string, unknown>).filter(
    ([field, entry]) => field !== "name" && typeof entry === "number"
  );

  if (numericEntries.length === 0) return null;

  let field: string;
  let raw: number;

  const preferred = key ? PREFERRED_FIELD[key] : undefined;
  const preferredEntry = preferred ? numericEntries.find(([f]) => f === preferred) : undefined;

  if (preferredEntry) {
    [field, raw] = preferredEntry as [string, number];
  } else if (numericEntries.length === 1) {
    [field, raw] = numericEntries[0] as [string, number];
  } else {
    return null;
  }

  const isRatio = field.toLowerCase().includes("ratio") || field.toLowerCase().includes("coverage");
  const num = isRatio ? raw * 100 : raw;
  const rounded = Math.round(num * 10) / 10;

  return `${rounded}${guessUnit(field)}`;
}
