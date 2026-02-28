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

export async function GET() {
  const body = `${vcardLines.join("\r\n")}\r\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="FabSystem-Fabien-Lages.vcf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
