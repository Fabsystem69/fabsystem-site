import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  type SessionPayload,
  verifySession,
} from "@/lib/session";

export class SessionRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "SessionRequiredError";
  }
}

export function isSessionRequiredError(error: unknown): error is SessionRequiredError {
  return error instanceof SessionRequiredError;
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!token || !secret) {
    return null;
  }

  return verifySession<SessionPayload>(token, secret);
}

export async function requireSession(options?: {
  mode?: "redirect" | "throw";
  redirectTo?: string;
}) {
  const session = await getSessionFromCookies();

  if (session) {
    return session;
  }

  if (options?.mode === "throw") {
    throw new SessionRequiredError();
  }

  redirect(options?.redirectTo ?? "/login?next=/dashboard");
}
