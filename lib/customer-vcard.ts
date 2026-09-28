import { escapeVcardValue } from "@/lib/contact-vcard";

// Retour utilisateur : "rajoute automatique des contacts à mon téléphone
// si passe en client coaching" — aucune API web ne permet d'écrire
// silencieusement dans le carnet d'adresses d'un téléphone (iOS/Android
// bloquent volontairement ça côté navigateur). Le plus proche du besoin
// sans intégration OAuth lourde (Google/Apple Contacts) : générer un vCard
// et l'envoyer par e-mail au coach dès la conversion — un seul geste
// (ouvrir la pièce jointe) suffit alors à l'ajouter, au lieu de ressaisir
// à la main. Voir notifyCoachOfNewCoachingClient (coaching-project.ts).
export function buildCustomerVcard(customer: { name: string | null; email: string; phone: string | null }) {
  const fullName = customer.name?.trim() || customer.email;
  const [firstName, ...rest] = fullName.split(/\s+/);
  const lastName = rest.join(" ");

  const vcardLines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVcardValue(lastName)};${escapeVcardValue(firstName)};;;`,
    `FN:${escapeVcardValue(fullName)}`,
    "ORG:Client coaching FabSystem",
    `EMAIL;TYPE=INTERNET:${customer.email}`,
    ...(customer.phone ? [`TEL;TYPE=CELL:${escapeVcardValue(customer.phone)}`] : []),
    "END:VCARD",
  ];

  return `${vcardLines.join("\r\n")}\r\n`;
}

export function customerVcardFilename(customer: { name: string | null; email: string }) {
  const base = (customer.name?.trim() || customer.email).replace(/[^a-zA-Z0-9-]+/g, "-");
  return `${base}.vcf`;
}
