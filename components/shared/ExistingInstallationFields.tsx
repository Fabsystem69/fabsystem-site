import {
  EXISTING_INSTALLATION_KEYS,
  EXISTING_INSTALLATION_LABELS,
  EXISTING_INSTALLATION_STATUSES,
  EXISTING_INSTALLATION_STATUS_LABELS,
  existingInstallationFieldNames,
  existingInstallationItemFor,
  type ExistingInstallation,
  type ExistingInstallationStatus,
} from "@/lib/crm/existing-installation";

type Variant = "customer" | "admin";

const STYLES: Record<Variant, { legend: string; row: string; radio: string; detail: string; hint: string }> = {
  customer: {
    legend: "text-sm font-medium text-neutral-900",
    row: "rounded-lg border border-neutral-200 p-3",
    radio: "flex min-h-11 items-center gap-2 text-sm text-neutral-900",
    detail:
      "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900",
    hint: "text-xs font-normal text-neutral-500",
  },
  admin: {
    legend: "text-xs font-semibold uppercase tracking-wide text-neutral-500",
    row: "rounded-lg border border-neutral-800 p-3",
    radio: "flex min-h-11 items-center gap-2 text-sm text-neutral-200",
    detail:
      "h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base text-white placeholder:text-neutral-500 outline-none focus:border-brand-400",
    hint: "text-xs font-normal text-neutral-500",
  },
};

type Props = {
  variant: Variant;
  current: ExistingInstallation | null;
  // Saisie renvoyée après une erreur (priorité sur la valeur enregistrée).
  draft?: Record<string, string> | null;
};

function isStatus(value: string | undefined): value is ExistingInstallationStatus {
  return EXISTING_INSTALLATION_STATUSES.some((status) => status === value);
}

// 5 lignes Présent / Absent / Je ne sais pas + détail. Fait partie du même
// formulaire (et du même jeton de concurrence) que l'implantation. Une ligne
// sans choix n'envoie rien : l'existant n'est jamais effacé.
export function ExistingInstallationFields({ variant, current, draft }: Props) {
  const styles = STYLES[variant];
  return (
    <fieldset className="grid gap-3 sm:col-span-2">
      <legend className={styles.legend}>Installation électrique déjà en place</legend>
      <p className={styles.hint}>Pour chaque élément, répondez Présent, Absent ou Je ne sais pas. Rien n&apos;est à calculer.</p>
      {EXISTING_INSTALLATION_KEYS.map((key) => {
        const names = existingInstallationFieldNames(key);
        const saved = existingInstallationItemFor(current, key);
        const draftStatus = draft?.[names.status];
        const status = isStatus(draftStatus) ? draftStatus : (saved?.status ?? null);
        const detail = draft?.[names.detail] ?? saved?.detail ?? "";
        return (
          <fieldset key={key} className={styles.row}>
            <legend className={`px-1 ${styles.legend}`}>{EXISTING_INSTALLATION_LABELS[key]}</legend>
            <div className="flex flex-wrap gap-x-6">
              {EXISTING_INSTALLATION_STATUSES.map((value) => (
                <label key={value} className={styles.radio}>
                  <input type="radio" name={names.status} value={value} defaultChecked={status === value} className="h-4 w-4" />
                  {EXISTING_INSTALLATION_STATUS_LABELS[value]}
                </label>
              ))}
            </div>
            <label className="mt-2 block">
              <span className="sr-only">Détail : {EXISTING_INSTALLATION_LABELS[key]}</span>
              <input
                name={names.detail}
                defaultValue={detail}
                maxLength={300}
                placeholder="Détail (marque, capacité, puissance...)"
                className={styles.detail}
              />
            </label>
          </fieldset>
        );
      })}
    </fieldset>
  );
}
