import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
} from "@simplewebauthn/server";
import { hasPasskey, getCredentials } from "@/lib/webauthn-store";

const CHALLENGE_COOKIE = "fabsystem_webauthn_challenge";

function rp() {
  const rpID = process.env.WEBAUTHN_RP_ID;
  const origin = process.env.WEBAUTHN_ORIGIN;
  if (!rpID || !origin) throw new Error("Missing WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN");
  return { rpID, origin };
}

export async function GET() {
  const { rpID } = rp();
  const cookieStore = await cookies();

  const already = hasPasskey();

  if (!already) {
    const options = await generateRegistrationOptions({
      rpID,
      rpName: "FabSystem",
      userID: new TextEncoder().encode("admin-fabien"),
      // AUTH_ADMIN_EMAIL est la variable canonique (voir MASTER-10 §14).
      // ADMIN_EMAIL est conservé en compatibilité temporaire uniquement.
      userName:
        process.env.AUTH_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@fabsystem.fr",
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    });

    cookieStore.set(CHALLENGE_COOKIE, options.challenge, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({ mode: "register", options });
  }

  const creds = getCredentials();

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: creds.map((c) => ({
      id: c.credentialID,
      transports: c.transports,
    })),
  });

  cookieStore.set(CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ mode: "login", options });
}
