import "server-only";

export async function generateQrDataUrl(
  value: string,
  options?: {
    margin?: number;
    width?: number;
  }
) {
  const { toDataURL } = await import("qrcode");
  return toDataURL(value, {
    margin: options?.margin ?? 1,
    width: options?.width ?? 240,
  });
}
