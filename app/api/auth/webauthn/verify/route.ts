import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import {
  hasPasskey,
  getCredentials,
  upsertCredential,
  updateCounter,
} from "@/lib/webauthn-store";
import { setSession } from "@/lib/auth-session";

const CHALLENGE_COOKIE = "fabsystem_webauthn_challenge";

function rp() {
  const rpID = process.env.WEBAUTHN_RP_ID;
  const origin = process.env.WEBAUTHN_ORIGIN;
  if (!rpID || !origin) throw new Error("Missing WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN");
  return { rpID, origin };
}

export async function POST(req: Request) {
  try {
    const { rpID, origin } = rp();
    const cookieStore = await cookies();
    const challenge = cookieStore.get(CHALLENGE_COOKIE)?.value;

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge manquant. Recommencez le flow WebAuthn." },
        { status: 400 }
      );
    }

    // Consume challenge (one-time use)
    cookieStore.set(CHALLENGE_COOKIE, "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    const body = await req.json();

    if (!hasPasskey()) {
      // ── Registration ──────────────────────────────────────────────────────
      const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json(
          { error: "Échec de la vérification d'enregistrement." },
          { status: 400 }
        );
      }

      const { credential } = verification.registrationInfo;
      upsertCredential({
        credentialID: Buffer.from(credential.id).toString("base64url"),
        credentialPublicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        transports: body.response?.transports,
      });

      await setSession();
      return NextResponse.json({ ok: true, mode: "register" });
    }

    // ── Authentication ───────────────────────────────────────────────────────
    const creds = getCredentials();
    const cred = creds.find((c) => c.credentialID === body.id);

    if (!cred) {
      return NextResponse.json(
        { error: "Credential introuvable." },
        { status: 400 }
      );
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credentialID,
        publicKey: Buffer.from(cred.credentialPublicKey, "base64url"),
        counter: cred.counter,
        transports: cred.transports,
      },
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: "Échec de l'authentification WebAuthn." },
        { status: 401 }
      );
    }

    updateCounter(cred.credentialID, verification.authenticationInfo.newCounter);
    await setSession();
    return NextResponse.json({ ok: true, mode: "login" });
  } catch (err) {
    console.error("[webauthn/verify]", err);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
