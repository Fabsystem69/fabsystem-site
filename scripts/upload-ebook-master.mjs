// Script à lancer une seule fois (et à chaque mise à jour du contenu) pour
// déposer les fichiers HTML maîtres de l'ebook dans Vercel Blob (privé).
// Ces fichiers ne sont JAMAIS commités dans le dépôt ni servis depuis /public.
//
// Usage :
//   node --env-file=.env scripts/upload-ebook-master.mjs bureau /chemin/vers/FabSystem_Ebook_v11_bureau.html
//   node --env-file=.env scripts/upload-ebook-master.mjs poche /chemin/vers/FabSystem_Ebook_v11_poche.html
//
// Le fichier source doit contenir les marqueurs {{EBOOK_BUYER_NAME}} et
// {{EBOOK_BUYER_EMAIL}} aux emplacements du filigrane (pied de page + couverture).

import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const [, , format, filePath] = process.argv;

if (!["bureau", "poche"].includes(format) || !filePath) {
  console.error(
    "Usage: node --env-file=.env scripts/upload-ebook-master.mjs <bureau|poche> <chemin-vers-fichier.html>"
  );
  process.exit(1);
}

const content = await readFile(filePath, "utf8");

if (!content.includes("{{EBOOK_BUYER_NAME}}") || !content.includes("{{EBOOK_BUYER_EMAIL}}")) {
  console.error(
    "Attention : le fichier ne contient pas les marqueurs {{EBOOK_BUYER_NAME}} / {{EBOOK_BUYER_EMAIL}}."
  );
  process.exit(1);
}

const { pathname } = await put(`ebooks/_master/${format}.html`, content, {
  access: "private",
  contentType: "text/html; charset=utf-8",
  addRandomSuffix: false,
  allowOverwrite: true,
});

console.log(`Uploadé avec succès : ${pathname}`);
