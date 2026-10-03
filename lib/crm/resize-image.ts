// Les photos de telephone font plusieurs Mo : on les reduit cote navigateur
// (JPEG, 1600 px max) avant l'envoi, pour rester sous la limite de la route
// tout en gardant l'ecriture manuscrite lisible.
const MAX_SIDE = 1600;

export async function resizeImageToBase64(file: File): Promise<{ mediaType: "image/jpeg"; data: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossible de traiter cette image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { mediaType: "image/jpeg", data: dataUrl.slice(dataUrl.indexOf(",") + 1) };
}
