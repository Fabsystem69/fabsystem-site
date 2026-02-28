import { badRequest, payloadTooLarge } from "@/lib/http-errors";

const PNG_PREFIX = "data:image/png;base64,";
const MAX_SIGNATURE_BYTES = 300 * 1024;
const MIN_SIGNATURE_WIDTH = 80;
const MIN_SIGNATURE_HEIGHT = 30;
const MAX_SIGNATURE_WIDTH = 2000;
const MAX_SIGNATURE_HEIGHT = 1000;

type SignatureImageMeta = {
  buffer: Buffer;
  width: number;
  height: number;
};

function readPngDimensions(buffer: Buffer) {
  if (buffer.length < 24) {
    throw badRequest("Signature PNG payload too small");
  }

  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw badRequest("Invalid PNG signature");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

export function validateSignatureDataUrl(signatureDataUrl: string): SignatureImageMeta {
  if (!signatureDataUrl.startsWith(PNG_PREFIX)) {
    throw badRequest("Invalid signature image format");
  }

  const base64 = signatureDataUrl.slice(PNG_PREFIX.length);
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0) {
    throw badRequest("Empty signature image");
  }

  if (buffer.length > MAX_SIGNATURE_BYTES) {
    throw payloadTooLarge("Signature image exceeds 300KB");
  }

  const { width, height } = readPngDimensions(buffer);
  if (
    width < MIN_SIGNATURE_WIDTH ||
    height < MIN_SIGNATURE_HEIGHT ||
    width > MAX_SIGNATURE_WIDTH ||
    height > MAX_SIGNATURE_HEIGHT
  ) {
    throw badRequest("Invalid signature image dimensions", {
      width,
      height,
    });
  }

  return {
    buffer,
    width,
    height,
  };
}
