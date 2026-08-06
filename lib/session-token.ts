const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function hasAtob() {
  return typeof globalThis.atob === "function";
}

function hasBtoa() {
  return typeof globalThis.btoa === "function";
}

export function normalizeBase64Url(value: string) {
  let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  return normalized;
}

export function bytesToBase64Url(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  if (!hasBtoa()) {
    throw new Error("Missing base64 encoder");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return globalThis
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function base64UrlToBytes(value: string) {
  const normalized = normalizeBase64Url(value);

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(normalized, "base64"));
  }

  if (!hasAtob()) {
    throw new Error("Missing base64 decoder");
  }

  const binary = globalThis.atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function encodeUtf8Base64Url(value: string) {
  return bytesToBase64Url(textEncoder.encode(value));
}

export function decodeUtf8Base64Url(value: string) {
  return textDecoder.decode(base64UrlToBytes(value));
}

export function splitSignedToken(token: string) {
  const [body, signature, ...rest] = token.split(".");

  if (!body || !signature || rest.length > 0) {
    return null;
  }

  return { body, signature };
}
