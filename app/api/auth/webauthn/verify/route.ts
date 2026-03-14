import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "WebAuthn verify route not implemented yet." },
    { status: 501 }
  );
}
