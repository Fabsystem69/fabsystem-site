export const contactVcardFilename = "FabSystem-Fabien-Lages.vcf";

export function buildContactVcard() {
  const vcardLines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Lages;Fabien;;;",
    "FN:Fabien Lages",
    "ORG:FabSystem",
    "TITLE:Électricité embarquée • Audit • Formation",
    "TEL;TYPE=CELL:+33698247722",
    "EMAIL;TYPE=WORK:fabien.lages@fabsystem.fr",
    "URL:https://fabsystem.fr",
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
