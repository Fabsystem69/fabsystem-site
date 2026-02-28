import { NextResponse } from "next/server";
import { isHttpError, toErrorResponse } from "@/lib/http-errors";
import {
  findQuoteForSignature,
  invalidSignatureResponse,
  signedQuoteResponse,
  signatureDatabaseErrorResponse,
} from "@/lib/public-quote-signature";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateSignatureDataUrl } from "@/lib/signature-image";
import { logServerEvent } from "@/lib/server-log";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    enforceRateLimit(request, {
      name: "signature-read",
      limit: 30,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 10 * 60 * 1000,
    });
  } catch (error) {
    return toErrorResponse(error, "public-signature.get");
  }

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
  const ip = getClientIp(request);

  try {
    enforceRateLimit(request, {
      name: "signature-write",
      limit: 10,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 20 * 60 * 1000,
    });
  } catch (error) {
    return toErrorResponse(error, "public-signature.post");
  }

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
    validateSignatureDataUrl(signatureDataUrl);
    const quote = await findQuoteForSignature(id, token);

    if (quote === "signed") {
      return signedQuoteResponse();
    }

    if (quote === "expired" || !quote) {
      return invalidSignatureResponse();
    }

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

    logServerEvent("info", "quote signed", {
      quoteId: id,
      signedName,
      ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isHttpError(error)) {
      return toErrorResponse(error, "public-signature.post");
    }

    return signatureDatabaseErrorResponse(error);
  }
}
