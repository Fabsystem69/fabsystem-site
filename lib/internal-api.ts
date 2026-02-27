import { NextResponse } from "next/server";
import { isSessionRequiredError, requireSession } from "@/lib/require-session";

export async function requireApiSession() {
  try {
    await requireSession({ mode: "throw" });
    return null;
  } catch (error) {
    if (isSessionRequiredError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    throw error;
  }
}
