export function getBackgroundMimeType(assetPath: string) {
  if (assetPath.endsWith(".avif")) return "image/avif";
  if (assetPath.endsWith(".webp")) return "image/webp";
  if (assetPath.endsWith(".png")) return "image/png";
  if (assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  return "image/*";
}

export function resolveBackgroundImage(background: string) {
  if (background.startsWith("image-set(")) return background;

  if (!background.startsWith("/")) {
    return `url('${background}')`;
  }

  const match = background.match(/^(.+)\.(png|jpe?g)$/i);
  if (!match) {
    return `url('${background}')`;
  }

  const basePath = match[1];

  return `image-set(url('${basePath}.avif') type('image/avif'), url('${basePath}.webp') type('image/webp'), url('${background}') type('${getBackgroundMimeType(background)}'))`;
}
