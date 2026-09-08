// Aucune librairie de fuseau horaire dans le projet (date-fns-tz, luxon...) —
// un seul besoin ponctuel ne le justifie pas : convertir un
// <input type="datetime-local"> (heure murale, sans fuseau) saisi par
// Fabien en France vers un instant UTC correct, DST inclus. S'appuie
// uniquement sur Intl.DateTimeFormat (natif, gère les changements
// d'heure automatiquement).
const DEFAULT_TIME_ZONE = "Europe/Paris";

export function parseLocalDateTimeInTimeZone(value: string, timeZone: string = DEFAULT_TIME_ZONE): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) throw new Error("Invalid datetime-local value");

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  // Instant "naïf" : les mêmes chiffres, interprétés (à tort) comme UTC.
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);

  // Ce que cet instant affiche réellement dans le fuseau cible — l'écart
  // avec les chiffres saisis donne le décalage (DST inclus) à appliquer.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(new Date(naiveUtc));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));

  const offset = asIfUtc - naiveUtc;
  return new Date(naiveUtc - offset);
}
