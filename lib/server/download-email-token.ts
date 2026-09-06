import "server-only";
import { signSession, verifySession } from "@/lib/session";

// Lien de telechargement envoye par email, sans connexion requise — retour
// utilisateur : deux clients payants n'ont pas reussi a retrouver leur ebook
// via /mon-compte et ont du etre depannes a la main par email. Le token
// remplace la session client comme preuve d'acces : sa simple possession
// (lien recu par email) vaut autorisation, avec les memes controles
// d'eligibilite que le telechargement authentifie (grant actif, non expire,
// quota non atteint) — voir getDownloadAccessForGrantViaEmailToken.
//
// Secret dedie (EBOOK_ACCESS_TOKEN_SECRET, distinct de AUTH_SESSION_SECRET/
// customer) : un token de telechargement qui fuite ne doit jamais pouvoir
// etre reutilise comme preuve de session admin ou client.
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 jours - le temps qu'un client retrouve l'email

type DownloadEmailTokenPayload = {
  grantId: string;
  iat: number;
  exp: number;
};

function getSecret() {
  const secret = process.env.EBOOK_ACCESS_TOKEN_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing EBOOK_ACCESS_TOKEN_SECRET");
  }
  return secret;
}

export function signDownloadEmailToken(grantId: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  return signSession<DownloadEmailTokenPayload>(
    { grantId, iat: now, exp: now + ttlSeconds },
    getSecret()
  );
}

export function verifyDownloadEmailToken(token: string): string | null {
  const payload = verifySession<DownloadEmailTokenPayload>(token, getSecret());
  return payload?.grantId ?? null;
}
