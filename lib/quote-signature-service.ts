import {
  buildBaseUrl,
  createSignatureExpiry,
  generateSignatureToken,
  hashSignatureToken,
} from "@/lib/signature-link";
import { prisma } from "@/lib/prisma";

export async function createQuoteSignatureLink(
  quoteId: string,
  options: {
    request?: Request;
    baseUrl?: string;
  } = {}
) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, signedAt: true },
  });

  if (!quote) {
    throw new Error("Quote not found");
  }

  if (quote.signedAt) {
    throw new Error("Quote already signed");
  }

  const token = generateSignatureToken();
  const expiresAt = createSignatureExpiry();
  const baseUrl =
    options.baseUrl?.replace(/\/+$/, "") ??
    (options.request ? buildBaseUrl(options.request) : "http://localhost:3000");

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      signatureTokenHash: hashSignatureToken(token),
      signatureTokenExpiresAt: expiresAt,
    },
  });

  return {
    url: `${baseUrl}/sign/${quoteId}?token=${token}`,
    expiresAt,
  };
}
