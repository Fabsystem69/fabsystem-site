import { NextResponse } from "next/server";
import { getSharedProjectSchema } from "@/lib/services/project-schema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{24,}$/.test(token)) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  const schema = await getSharedProjectSchema(token);
  if (!schema) return NextResponse.json({ error: "Lien introuvable ou révoqué" }, { status: 404 });
  return NextResponse.json({ schema }, { headers: { "Cache-Control": "public, max-age=60" } });
}
