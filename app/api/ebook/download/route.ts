import { getEbookSignedDownloadUrl } from "@/lib/ebook-blob";
import { verifyEbookToken } from "@/lib/ebook-token";
import { prisma } from "@/lib/prisma";
import { logServerEvent } from "@/lib/server-log";

export const runtime = "nodejs";

const MAX_EBOOK_DOWNLOADS = 10;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const variant = url.searchParams.get("variant");

  if (!token || (variant !== "desktop" && variant !== "pocket")) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const payload = verifyEbookToken(token);
  if (!payload) {
    return Response.json({ error: "Lien invalide ou expiré" }, { status: 401 });
  }

  const order = await prisma.ebookOrder.findUnique({ where: { id: payload.sub } });
  if (!order || order.email !== payload.email) {
    return Response.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.status !== "READY") {
    return Response.json({ error: "Fichier pas encore prêt" }, { status: 409 });
  }

  const blobPath = variant === "desktop" ? order.desktopBlobPath : order.pocketBlobPath;
  if (!blobPath) {
    return Response.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  // Incrément atomique et conditionnel : évite une course entre deux clics
  // simultanés qui dépasseraient la limite en lisant tous les deux l'ancien compteur.
  const { count } = await prisma.ebookOrder.updateMany({
    where: { id: order.id, downloadCount: { lt: MAX_EBOOK_DOWNLOADS } },
    data: { downloadCount: { increment: 1 } },
  });

  if (count === 0) {
    logServerEvent("warn", "ebook download limit reached", { orderId: order.id });
    return Response.json({ error: "Nombre maximum de téléchargements atteint" }, { status: 429 });
  }

  const signedUrl = await getEbookSignedDownloadUrl(blobPath);

  logServerEvent("info", "ebook download", { orderId: order.id, variant });

  return Response.redirect(signedUrl, 302);
}
