import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { toErrorResponse, unauthorized } from "@/lib/http-errors";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { logServerEvent } from "@/lib/server-log";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signSession,
} from "@/lib/session";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const isDevelopment = process.env.NODE_ENV !== "production";

  try {
    enforceRateLimit(req, {
      name: "login",
      limit: 5,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });

    const { email, password } = (await req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const adminEmail = process.env.AUTH_ADMIN_EMAIL?.trim().toLowerCase();
    const adminHash = process.env.AUTH_ADMIN_PASSWORD_HASH;
    const secret = process.env.AUTH_SESSION_SECRET;

    if (!adminEmail || !adminHash || !secret) {
      logServerEvent("error", "login config missing", {
        hasAdminEmail: Boolean(adminEmail),
        hasAdminHash: Boolean(adminHash),
        hasSecret: Boolean(secret),
      });
      return NextResponse.json(
        { error: "Missing auth configuration" },
        { status: 500 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailMatch = normalizedEmail === adminEmail;

    if (isDevelopment) {
      logServerEvent("info", "login debug", {
        nodeEnv: process.env.NODE_ENV ?? null,
        hasAdminEmail: Boolean(adminEmail),
        hasAdminHash: Boolean(adminHash),
        hasSecret: Boolean(secret),
        hashLength: adminHash?.length ?? 0,
        hashPrefix: adminHash ? adminHash.slice(0, 7) : null,
        normalizedEmail,
        expectedAdminEmail: adminEmail ?? null,
        emailMatch,
        passwordType: typeof password,
        passwordLength: typeof password === "string" ? password.length : null,
      });
    }

    if (!emailMatch) {
      logServerEvent("warn", "login failed: unknown email", {
        ip,
        email: normalizedEmail,
      });
      throw unauthorized("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, adminHash);

    if (isDevelopment) {
      logServerEvent("info", "login bcrypt result", {
        normalizedEmail,
        emailMatch,
        passwordType: typeof password,
        passwordLength: typeof password === "string" ? password.length : null,
        bcryptCompareOk: ok,
      });
    }

    if (!ok) {
      logServerEvent("warn", "login failed: bad password", {
        ip,
        email: normalizedEmail,
      });
      throw unauthorized("Invalid credentials");
    }

    const now = Math.floor(Date.now() / 1000);
    const token = signSession(
      { sub: adminEmail, role: "admin", iat: now, exp: now + SESSION_MAX_AGE_SECONDS },
      secret
    );

    logServerEvent("info", "login success", {
      ip,
      email: normalizedEmail,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    if (isDevelopment) {
      logServerEvent("info", "login cookie set", {
        cookieName: SESSION_COOKIE_NAME,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    }

    return res;
  } catch (error) {
    return toErrorResponse(error, "auth.login");
  }
}
