import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { prisma } from "@/lib/prisma";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() ?? "";

    const quotes = await prisma.quote.findMany({
      where: {
        sourceInvoice: null,
        ...(query
          ? {
              OR: [
                {
                  number: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  customer: {
                    name: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        number: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      quotes: quotes.map((quote) => ({
        id: quote.id,
        number: quote.number,
        customerName: quote.customer.name,
      })),
    });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
