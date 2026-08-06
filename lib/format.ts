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
