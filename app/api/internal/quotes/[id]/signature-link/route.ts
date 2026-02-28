import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { createQuoteSignatureLink } from "@/lib/quote-signature-service";
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
    const { url, expiresAt } = await createQuoteSignatureLink(id, { request });

    return NextResponse.json({
      ok: true,
      url,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Quote not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.message === "Quote already signed") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return databaseErrorResponse(error);
  }
}
