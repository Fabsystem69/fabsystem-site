import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { searchItemTemplates } from "@/lib/item-templates";
import { databaseErrorResponse } from "@/lib/prisma-errors";

export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";

  try {
    const templates = await searchItemTemplates(query);
    return NextResponse.json({ templates });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
