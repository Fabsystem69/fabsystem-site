import { NextResponse } from "next/server";
import {
  findQuoteForSignature,
  invalidSignatureResponse,
  signedQuoteResponse,
  signatureDatabaseErrorResponse,
} from "@/lib/public-quote-signature";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return invalidSignatureResponse();
  }

  try {
    const quote = await findQuoteForSignature(id, token);

    if (quote === "signed") {
      return signedQuoteResponse();
    }

    if (quote === "expired" || !quote) {
      return invalidSignatureResponse();
    }

    return NextResponse.json({
      quote: {
        number: quote.number,
        issueDate: quote.issueDate,
        validUntil: quote.validUntil,
        customer: quote.customer,
        items: quote.items,
        total: quote.total,
      },
    });
  } catch (error) {
    return signatureDatabaseErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const json = (await request.json().catch(() => null)) as
    | {
        token?: string;
        signedName?: string;
        agreementChecked?: boolean;
        signatureDataUrl?: string;
      }
    | null;

  const token = json?.token?.trim();
  const signedName = json?.signedName?.trim();
  const agreementChecked = json?.agreementChecked === true;
  const signatureDataUrl = json?.signatureDataUrl?.trim();

  if (
    !token ||
    !signedName ||
    !agreementChecked ||
    !signatureDataUrl ||
    !signatureDataUrl.startsWith("data:image/png;base64,")
  ) {
    return NextResponse.json({ error: "Données de signature invalides" }, { status: 400 });
  }

  try {
    const quote = await findQuoteForSignature(id, token);

    if (quote === "signed") {
      return signedQuoteResponse();
    }

    if (quote === "expired" || !quote) {
      return invalidSignatureResponse();
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent");

    await prisma.quote.update({
      where: { id },
      data: {
        signedAt: new Date(),
        signedName,
        agreementChecked: true,
        signatureDataUrl,
        signatureIp: ip,
        signatureUserAgent: userAgent,
        signatureTokenHash: null,
        signatureTokenExpiresAt: null,
        status: "ACCEPTED",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return signatureDatabaseErrorResponse(error);
  }
}
