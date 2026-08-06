import { redactSensitive } from "@/lib/redact-sensitive";

type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

function normalizeMeta(meta: LogMeta) {
  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      if (value instanceof Error) {
        return [
          key,
          {
            name: value.name,
            message: redactSensitive(value.message),
            stack: process.env.NODE_ENV === "development" ? value.stack : undefined,
          },
        ];
      }

      return [key, redactSensitive(value)];
    })
  );
}

export function logServerEvent(level: LogLevel, message: string, meta: LogMeta = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...normalizeMeta(meta),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}
