const contactPhotoUrl = "https://www.fabsystem.fr/logo.png";
const contactWebsiteUrl = "https://www.fabsystem.fr";
const contactCity = "Neuville-sur-Saône";
const contactCountry = "France";

export const contactVcardFilename = "Fabien-Lages-FabSystem.vcf";

function escapeVcardValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function buildContactVcard() {
  const vcardLines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Lages;Fabien;;;",
    "FN:Fabien Lages",
    "ORG:FabSystem",
    "TITLE:Électricité embarquée • Audit • Formation",
    "TEL;TYPE=CELL:+33698247722",
    "EMAIL;TYPE=INTERNET:contact@fabsystem.fr",
    `ADR;TYPE=WORK:;;;${escapeVcardValue(contactCity)};;;${contactCountry}`,
    `URL:${contactWebsiteUrl}`,
    `PHOTO;VALUE=URI:${contactPhotoUrl}`,
    `NOTE:${escapeVcardValue(
      "Électricité embarquée • Audit • Formation\nÉlectricité et systèmes embarqués pour bateaux, vans et camping-cars. Diagnostic clair et conseils adaptés."
    )}`,
    `CATEGORIES:${escapeVcardValue(
      "Électricité embarquée,Audit,Formation,Nautisme,Vanlife"
    )}`,
    "END:VCARD",
  ];

  return `${vcardLines.join("\r\n")}\r\n`;
}

export function createContactVcardResponse() {
  return new Response(buildContactVcard(), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${contactVcardFilename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
