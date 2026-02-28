import { NextResponse } from "next/server";
import { hashSignatureToken, isSignatureTokenExpired } from "@/lib/signature-link";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export async function findQuoteForSignature(id: string, token: string) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          name: true,
        },
      },
      items: {
        orderBy: { position: "asc" },
        select: {
          description: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },
    },
  });

  if (!quote || !quote.signatureTokenHash || !quote.signatureTokenExpiresAt) {
    return null;
  }

  if (quote.signedAt) {
    return "signed" as const;
  }

  if (isSignatureTokenExpired(quote.signatureTokenExpiresAt)) {
    return "expired" as const;
  }

  if (quote.signatureTokenHash !== hashSignatureToken(token)) {
    return null;
  }

  return quote;
}

export function invalidSignatureResponse(message = "Token invalide ou expiré") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function signedQuoteResponse() {
  return NextResponse.json({ error: "Ce devis est déjà signé" }, { status: 409 });
}

export function signatureDatabaseErrorResponse(error: unknown) {
  return databaseErrorResponse(error);
}
