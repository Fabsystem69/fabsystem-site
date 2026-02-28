import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import {
  buildBaseUrl,
  createSignatureExpiry,
  generateSignatureToken,
  hashSignatureToken,
} from "@/lib/signature-link";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      select: { id: true, signedAt: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.signedAt) {
      return NextResponse.json({ error: "Quote already signed" }, { status: 409 });
    }

    const token = generateSignatureToken();
    const expiresAt = createSignatureExpiry();
    const baseUrl = buildBaseUrl(request);

    await prisma.quote.update({
      where: { id },
      data: {
        signatureTokenHash: hashSignatureToken(token),
        signatureTokenExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      ok: true,
      link: `${baseUrl}/sign/${id}?token=${token}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
