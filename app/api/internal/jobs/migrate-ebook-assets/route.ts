import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { logServerEvent } from "@/lib/server-log";
import { migrateEbookAssetsToVercelBlob } from "@/lib/services/ebook-migration";

// Migration ponctuelle Supabase -> Vercel Blob, declenchee a la main par un
// admin (pas de cron : contrairement a dossier-notifications, ce n'est pas
// une tache recurrente). Idempotente (ne traite que provider=SUPABASE) donc
// peut etre rappelee sans risque si un asset a echoue ou si un nouvel ebook
// est ajoute par erreur sur Supabase plus tard.
export const dynamic = "force-dynamic";

export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    logServerEvent("info", "api.internal.jobs.migrate-ebook-assets.post[admin]: job started");
    const results = await migrateEbookAssetsToVercelBlob();
    logServerEvent("info", "api.internal.jobs.migrate-ebook-assets.post[admin]: job finished", {
      total: results.length,
      migrated: results.filter((r) => r.status === "migrated").length,
      failed: results.filter((r) => r.status !== "migrated").length,
    });
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.migrate-ebook-assets.post");
  }
}
