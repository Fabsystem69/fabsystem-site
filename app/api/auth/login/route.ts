import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signSession,
} from "@/lib/session";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function readRawEnvValue(key: string) {
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), filename);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const line = fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.startsWith(`${key}=`));

    if (!line) {
      continue;
    }

    return stripWrappingQuotes(line.slice(key.length + 1));
  }

  return undefined;
}

function getAdminPasswordHash() {
  const loadedHash = process.env.AUTH_ADMIN_PASSWORD_HASH;
  if (loadedHash && BCRYPT_HASH_PATTERN.test(loadedHash)) {
    return loadedHash;
  }

  const rawHash = readRawEnvValue("AUTH_ADMIN_PASSWORD_HASH");
  if (rawHash && BCRYPT_HASH_PATTERN.test(rawHash)) {
    return rawHash;
  }

  return loadedHash;
}

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const adminEmail = process.env.AUTH_ADMIN_EMAIL?.trim().toLowerCase();
  const adminHash = getAdminPasswordHash();
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!adminEmail || !adminHash || !secret) {
    return NextResponse.json(
      { error: "Missing auth configuration" },
      { status: 500 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== adminEmail) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, adminHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const now = Math.floor(Date.now() / 1000);
  const token = signSession(
    { sub: adminEmail, iat: now, exp: now + SESSION_MAX_AGE_SECONDS },
    secret
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return res;
}
