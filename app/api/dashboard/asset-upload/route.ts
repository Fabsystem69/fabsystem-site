import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionFromCookies } from "@/lib/require-session";
import { logServerEvent } from "@/lib/server-log";

// Upload direct navigateur -> Vercel Blob pour les fichiers volumineux
// (ebooks PDF de plusieurs dizaines de Mo) : les Server Actions/Route
// Handlers Vercel plafonnent le corps de requete a quelques Mo, bien en
// deca de la taille de ces fichiers. Le token genere ici autorise le
// navigateur a uploader directement vers Vercel Blob, sans faire transiter
// les octets par une fonction serverless. Le formulaire (AssetUploadForm)
// cree ensuite la ligne DigitalAsset via une action serveur classique, une
// fois l'URL du blob connue (payload minuscule, pas de limite de taille en jeu).
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "application/pdf",
            "application/epub+zip",
            "application/zip",
            "text/html",
          ],
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    logServerEvent("error", "api.dashboard.asset-upload.post: failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
