import type { PublicContactRequest } from "@/lib/contact-request";

const CONTACT_FIELDS = [
  "name", "email", "phone", "bookingDate", "supportType", "requestType", "urgency", "context",
  "supportModel", "goal", "currentProblems", "batteryCount", "batteryType", "batteryCapacity",
  "chargingSources", "shorePower", "inverterPresent", "solarPresent", "equipmentList", "deadline",
  "budgetRange", "priorityQ1", "priorityQ2", "priorityQ3", "photosLink", "source",
] as const;

export function buildContactMessage(data: PublicContactRequest) {
  const payload = data as unknown as Record<string, unknown>;
  const lines = [`Source: ${data.source}`, ""];
  for (const key of CONTACT_FIELDS) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) lines.push(`${key}: ${value}`);
  }
  lines.push("", "Message:", data.message);
  return {
    subject: data.source === "visio"
      ? `FabSystem — Demande VISIO (${data.name})`
      : `FabSystem — Contact (${data.name})`,
    text: lines.join("\n"),
  };
}

// Miroir de la demande vers le suivi prospect (Prospect, source SITE_WEB) —
// scenario explicite du plan : "Contact web, panne de notification ->
// Demande retrouvable et alerte retentable". Reutilise buildContactMessage
// pour le texte plutot que de dupliquer le formatage des champs.
// nextActionAt = maintenant : la demande apparait immediatement dans
// "Prospects a relancer" sur le tableau de bord, sans nouvelle carte dediee.
export function buildProspectIntakeFromContactRequest(data: PublicContactRequest) {
  const { text } = buildContactMessage(data);
  return {
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    besoinElectricite: text,
    nextAction:
      data.source === "visio"
        ? "Répondre à la demande de visio reçue via le site"
        : "Répondre à la demande reçue via le site",
    nextActionAt: new Date(),
  };
}
