import { NextResponse } from "next/server";
import { badRequest } from "@/lib/http-errors";
import { requireApiSession } from "@/lib/internal-api";
import { remiseCreateSchema } from "@/lib/remise-payload";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { createRemise } from "@/lib/services/remises";

export async function POST(req: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const json = await req.json().catch(() => null);
  const parsed = remiseCreateSchema.safeParse(json);

  if (!parsed.success) {
    return databaseErrorResponse(badRequest("Invalid remise payload"));
  }

  try {
    const remise = await createRemise(parsed.data);
    return NextResponse.json({ ok: true, remise }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.remises.post");
  }
}
