const SENSITIVE_KEY_PATTERN = /(token|secret|password|cookie|authorization|api[-_]?key|session)/i;
const SENSITIVE_QUERY_PARAMS = [
  "token",
  "access_token",
  "refresh_token",
  "session",
  "session_token",
  "signature",
];

function redactQueryParams(value: string) {
  return value.replace(
    /([?&](?:token|access_token|refresh_token|session|session_token|signature)=)([^&#]+)/gi,
    "$1[REDACTED]"
  );
}

function redactBearerToken(value: string) {
  return value.replace(/\b(Bearer)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 [REDACTED]");
}

function redactCookieLikeValue(value: string) {
  return value
    .replace(/(set-cookie:?\s*)(.+)/gi, "$1[REDACTED]")
    .replace(/(cookie:?\s*)(.+)/gi, "$1[REDACTED]");
}

export function redactSensitiveString(value: string) {
  return redactCookieLikeValue(redactBearerToken(redactQueryParams(value)));
}

export function redactSensitive<T>(value: T): T {
  if (typeof value === "string") {
    return redactSensitiveString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
          return [key, "[REDACTED]"];
        }

        if (
          typeof entryValue === "string" &&
          SENSITIVE_QUERY_PARAMS.some((param) =>
            entryValue.toLowerCase().includes(`${param}=`)
          )
        ) {
          return [key, redactSensitiveString(entryValue)];
        }

        return [key, redactSensitive(entryValue)];
      })
    ) as T;
  }

  return value;
}
