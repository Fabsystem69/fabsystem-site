import "server-only";
import { get, issueSignedToken, presignUrl, put } from "@vercel/blob";

const DOWNLOAD_URL_TTL_MS = 5 * 60 * 1000;

export async function uploadEbookFile(pathname: string, body: string, contentType: string) {
  const blob = await put(pathname, body, {
    access: "private",
    contentType,
    addRandomSuffix: false,
  });
  return blob.pathname;
}

export async function getEbookMasterHtml(pathname: string) {
  const result = await get(pathname, { access: "private" });
  if (!result) {
    throw new Error(`Ebook master file not found in Blob: ${pathname}`);
  }
  return new Response(result.stream).text();
}

export async function getEbookSignedDownloadUrl(pathname: string) {
  const signedToken = await issueSignedToken({
    pathname,
    operations: ["get"],
    validUntil: Date.now() + DOWNLOAD_URL_TTL_MS,
  });

  const { presignedUrl } = await presignUrl(signedToken, {
    operation: "get",
    pathname,
    access: "private",
  });

  return presignedUrl;
}
