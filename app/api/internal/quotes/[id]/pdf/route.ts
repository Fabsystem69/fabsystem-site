import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { renderQuotePdfBuffer } from "@/lib/server/pdf";
import { generateQrDataUrl } from "@/lib/server/qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  try {
    const qrDataUrl = await generateQrDataUrl("https://www.fabsystem.fr/contact", {
      margin: 0,
      width: 256,
    });

    const { buffer, filename } = await renderQuotePdfBuffer(id, qrDataUrl);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Quote not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return databaseErrorResponse(error);
  }
}
