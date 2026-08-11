import crypto from "crypto";

// UI-8.1 : autorise les requêtes envoyées par Vercel Cron Jobs (voir
// vercel.json "crons") vers les routes internes planifiées. Vercel envoie
// automatiquement "Authorization: Bearer <CRON_SECRET>" sur les requêtes
// qu'il déclenche lui-même, à condition que la variable d'environnement
// CRON_SECRET soit définie sur le projet Vercel — jamais un secret en dur
// dans le code source.
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}
