// Narrows a raw FormData string field to a Prisma enum literal, validating it
// server-side against the enum's actual runtime values instead of casting
// blindly. Throws on anything that isn't a known member.
export function getEnumFormValue<T extends Record<string, string>>(
  enumObject: T,
  formData: FormData,
  key: string
): T[keyof T] {
  const raw = formData.get(key);
  const value = typeof raw === "string" ? raw : "";
  const allowed = Object.values(enumObject);

  if (!allowed.includes(value)) {
    throw new Error(`Invalid value for ${key}: ${value || "(empty)"}`);
  }

  return value as T[keyof T];
}
