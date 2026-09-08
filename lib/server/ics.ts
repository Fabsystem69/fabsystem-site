// Générateur ICS (RFC 5545) minimal, sans dépendance externe — le besoin
// (une poignée de VEVENT simples, tous en UTC, jamais récurrents) ne
// justifie pas une librairie. Pliage de ligne et échappement texte
// implémentés au strict nécessaire pour rester valide côté Calendrier
// (iOS/macOS) et Google Calendar.

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// RFC 5545 §3.1 : une ligne de contenu ne doit pas dépasser 75 octets ;
// au-delà, on la replie avec un CRLF suivi d'une espace.
function foldIcsLine(line: string) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const folded: string[] = [];
  let current = "";
  for (const char of line) {
    const candidate = current + char;
    if (encoder.encode(candidate).length > 75) {
      folded.push(current);
      current = ` ${char}`;
    } else {
      current = candidate;
    }
  }
  if (current) folded.push(current);
  return folded.join("\r\n");
}

function toIcsUtcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export type IcsEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  url?: string;
  lastModified?: Date;
};

export function buildIcsCalendar(input: { calendarName: string; events: IcsEvent[]; now?: Date }) {
  const now = input.now ?? new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FabSystem//Accompagnement//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(input.calendarName)}`,
  ];

  for (const event of input.events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${toIcsUtcStamp(now)}`,
      `DTSTART:${toIcsUtcStamp(event.start)}`,
      `DTEND:${toIcsUtcStamp(event.end)}`,
      `LAST-MODIFIED:${toIcsUtcStamp(event.lastModified ?? now)}`,
      `SUMMARY:${escapeIcsText(event.summary)}`
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    if (event.url) lines.push(`URL:${escapeIcsText(event.url)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}
