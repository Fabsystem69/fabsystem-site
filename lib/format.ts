export function formatEuroFromCents(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value / 100);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Non renseignée";
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateForInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

// Heure "murale" en France, pas la conversion brute .toISOString() (qui
// donnerait l'heure UTC, décalée d'1-2h de ce que Fabien attend de voir).
export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Non renseignée";
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Valeur pour <input type="datetime-local"> : même fuseau que la saisie
// (lib/timezone.ts convertit dans l'autre sens à l'enregistrement).
export function formatDateTimeForInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Customer.name est nullable (espace client e-commerce). En affichage, on
// retombe sur l'email (toujours renseigné en base, NOT NULL + unique) plutôt
// que de laisser un nom vide — jamais un nom inventé.
export function formatCustomerDisplayName(customer: { name: string | null; email: string }) {
  return customer.name ?? customer.email;
}

export function formatAddressLines(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
