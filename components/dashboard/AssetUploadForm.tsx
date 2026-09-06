"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/epub+zip": "EPUB",
  "application/zip": "ZIP",
  "text/html": "HTML",
};

// Upload direct navigateur -> Vercel Blob (voir app/api/dashboard/asset-upload) :
// contourne la limite de taille de corps de requete des Server Actions,
// indispensable pour des ebooks PDF de plusieurs dizaines de Mo. Une fois
// l'upload termine cote client, seule l'URL du blob (payload minuscule) est
// envoyee au serveur pour creer la ligne DigitalAsset.
export function AssetUploadForm({
  createAssetAction,
}: {
  createAssetAction: (input: {
    path: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
  }) => Promise<{ assetId: string } | { error: string }>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    setProgress(`Envoi de ${file.name}…`);

    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/dashboard/asset-upload",
      });

      const result = await createAssetAction({
        path: blob.url,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });

      if ("error" in result) {
        setStatus("error");
        setError(result.error);
        return;
      }

      setProgress(null);
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
      router.push(`/dashboard/catalog/assets/${result.assetId}/edit?success=${encodeURIComponent("Fichier uploadé et asset créé.")}`);
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "L'upload a échoué.");
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5">
      <div>
        <h2 className="text-base font-semibold text-white">Uploader un fichier</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Envoi direct vers Vercel Blob (PDF, EPUB, ZIP, HTML) — pas de limite de taille pratique,
          contrairement au formulaire ci-dessous. L&apos;asset est créé automatiquement une fois
          l&apos;envoi terminé.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={Object.keys(CONTENT_TYPE_LABELS).join(",")}
        disabled={status === "uploading"}
        onChange={handleFileChange}
        className="block w-full text-sm text-neutral-300 file:mr-4 file:h-9 file:rounded-lg file:border-0 file:bg-brand-400 file:px-3.5 file:text-sm file:font-semibold file:text-neutral-950 hover:file:bg-brand-300 disabled:opacity-60"
      />

      {progress ? <p className="text-sm text-neutral-400">{progress}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
